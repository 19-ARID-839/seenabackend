import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, PipelineStage, Types } from "mongoose";
import { Attendance, AttendanceDocument } from "./attendance.schema";
import { LeaveRequest, LeaveRequestDocument } from "./leave.schema";
import { UsersService } from "../users/users.service";
import { InstitutesService } from "../institutes/institutes.service";
import { Cron } from "@nestjs/schedule";
import { User } from "../users/user.schema";

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(Attendance.name)
    private attendanceModel: Model<AttendanceDocument>,
    @InjectModel(LeaveRequest.name)
    private leaveModel: Model<LeaveRequestDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private usersService: UsersService,
    private institutesService: InstitutesService
  ) {}

  private normalizeDate(d: string | Date) {
    const date = d ? new Date(d) : new Date();
    date.setUTCHours(0, 0, 0, 0);
    return date;
  }

  async markAttendance(payload: {
    user: string;
    institute: string;
    date?: string;
    status: string;
    checkIn?: string;
    checkOut?: string;
    meta?: any;
    createdBy?: string;
  }) {
    const {
      user,
      institute,
      date,
      status,
      checkIn,
      checkOut,
      meta,
      createdBy,
    } = payload;
    if (!user || !institute)
      throw new BadRequestException("user and institute are required");

    await this.usersService.findById(user);
    await this.institutesService.findById(institute);

    const d = this.normalizeDate(date || new Date());

    const update: any = {
      user: new Types.ObjectId(user),
      institute: new Types.ObjectId(institute),
      date: d,
      status,
      meta: meta || {},
      createdBy,
    };
    if (checkIn) update.checkIn = new Date(checkIn);
    if (checkOut) update.checkOut = new Date(checkOut);

    const doc = await this.attendanceModel
      .findOneAndUpdate(
        { user: user, date: d },
        { $set: update },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
      .exec();

    return doc;
  }

  async bulkMark(institute: string, items: Array<any>) {
    if (!Array.isArray(items) || items.length === 0)
      return { ok: 0, inserted: 0 };

    const ops = items.map((it) => {
      const date = this.normalizeDate(it.date);
      const filter = { user: it.user, date };
      const updateDoc: any = {
        $set: {
          user: new Types.ObjectId(it.user),
          institute: new Types.ObjectId(institute),
          date,
          status: it.status,
          meta: it.meta || {},
        },
      };
      if (it.checkIn) updateDoc.$set.checkIn = new Date(it.checkIn);
      if (it.checkOut) updateDoc.$set.checkOut = new Date(it.checkOut);
      return {
        updateOne: {
          filter,
          update: updateDoc,
          upsert: true,
        },
      };
    });

    const res = await this.attendanceModel.bulkWrite(ops, { ordered: false });
    return res;
  }

  // async getAttendanceForUser(userId: string, from?: string, to?: string) {
  //   console.log("🧠 Fetching attendance for user:", userId);

  //   const filter: any = { user: new Types.ObjectId(userId) };
  //   if (from && to) {
  //     filter.date = { $gte: new Date(from), $lte: new Date(to) };
  //   }

  //   let records = await this.attendanceModel.find(filter).lean();
  //   console.log("🗂️ Records found:", records.length);

  //   // ✅ Auto-create today's record if not found
  //   const today = new Date();
  //   today.setUTCHours(0, 0, 0, 0);

  //   const hasToday = records.some(
  //     (r) => new Date(r.date).toISOString() === today.toISOString()
  //   );

  //   if (!hasToday) {
  //     const user = await this.userModel.findById(userId).lean();
  //     if (user) {
  //       const newRec = await this.attendanceModel.create({
  //         user: user._id,
  //         institute: user.institute,
  //         date: today,
  //         status: "pending",
  //       });
  //       console.log("🌱 Created today's pending record for user:", userId);
  //       records.push(newRec.toObject());
  //     }
  //   }

  //   return records;
  // }

  async getAttendanceByRole(userId: string, from?: string, to?: string) {
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException("User not found");

    const filter: any = {};
    const dateFilter: any = {};

    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);
    if (Object.keys(dateFilter).length > 0) filter.date = dateFilter;

    // 🎓 STUDENT: get only their own attendance
    if (user.role === "student") {
      filter.user = user._id;
    }

    // 👨‍👩‍👧 PARENT: get attendance for all linked children
    // else if (user.role === "parent") {
    //   if (Array.isArray(user.children) && user.children.length > 0) {
    //     filter.user = {
    //       $in: user.children.map((id) => new Types.ObjectId(id)),
    //     };
    //   } else {
    //     // no linked children → return empty
    //     return [];
    //   }
    // }

    // 🧑‍🏫 TEACHER / ADMIN / PRINCIPAL / DIRECTOR: get all students of same institute
    else if (
      ["teacher", "admin", "principal", "director"].includes(user.role)
    ) {
      // find all student IDs under same institute
      const students = await this.userModel
        .find({ institute: user.institute, role: "student" })
        .select("_id")
        .lean();

      if (students.length === 0) return [];
      filter.user = { $in: students.map((s) => s._id) };
    }

    // 🚫 Unsupported roles (like driver, etc.)
    else {
      throw new ForbiddenException("This role cannot view attendance");
    }

    // 🗂️ Fetch attendance records
    const records = await this.attendanceModel
      .find(filter)
      .populate("user")
      .sort({ date: -1 })
      .lean();

    // ✅ Ensure today’s pending attendance record exists (only for self or children)
    if (["student", "parent"].includes(user.role)) {
      await this.ensureTodayPending(user, records);
    }

    return records;
  }

  private async ensureTodayPending(user: any, records: any[]) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const hasToday = records.some(
      (r) => new Date(r.date).toISOString() === today.toISOString()
    );

    if (!hasToday) {
      const newRec = await this.attendanceModel.create({
        user: user._id,
        institute: user.institute,
        date: today,
        status: "pending",
      });
      records.push(newRec);
    }
  }

  async updateAttendanceStatus(
    studentId: string,
    instituteId: string,
    date: string,
    status: string,
    updatedBy?: string
  ) {
    if (!studentId || !instituteId || !status) {
      throw new BadRequestException("Missing required fields");
    }

    const normalizedDate = this.normalizeDate(date || new Date());

    const updated = await this.attendanceModel.findOneAndUpdate(
      { user: new Types.ObjectId(studentId), date: normalizedDate },
      {
        $set: {
          status,
          institute: new Types.ObjectId(instituteId),
          updatedBy: updatedBy ? new Types.ObjectId(updatedBy) : null,
        },
      },
      { new: true, upsert: true }
    );

    if (!updated) throw new NotFoundException("Attendance record not found");

    return updated;
  }

  async getAttendanceSummary(
    instituteId: string,
    from?: string,
    to?: string,
    role?: string
  ) {
    const match: any = { institute: new Types.ObjectId(instituteId) };
    if (from || to) {
      match.date = {};
      if (from) match.date.$gte = this.normalizeDate(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setUTCDate(toDate.getUTCDate() + 1);
        toDate.setUTCHours(0, 0, 0, 0);
        match.date.$lt = toDate;
      }
    }

    const pipeline: any[] = [{ $match: match }];
    if (role) {
      pipeline.push({
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      });
      pipeline.push({ $unwind: "$user" });
      pipeline.push({ $match: { "user.role": role } });
    }

    pipeline.push({
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    });

    const res = await this.attendanceModel.aggregate(pipeline).exec();
    const summary: any = {};
    res.forEach((r: any) => (summary[r._id] = r.count));
    return summary;
  }

  async monthlyChart(
    instituteId: string,
    year: number,
    month: number,
    userId?: string
  ) {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month - 1 + 1, 1));
    const match: any = {
      institute: new Types.ObjectId(instituteId),
      date: { $gte: start, $lt: end },
    };
    if (userId) match.user = new Types.ObjectId(userId);

    // explicitly type pipeline to PipelineStage[]
    const pipeline: PipelineStage[] = [
      { $match: match },
      {
        $group: {
          _id: { day: { $dayOfMonth: "$date" }, status: "$status" },
          count: { $sum: 1 },
        } as any, // $group typed as any to avoid TS inference issues inside the stage
      },
      {
        $group: {
          _id: "$_id.day",
          statuses: {
            $push: {
              status: "$_id.status",
              count: "$count",
            },
          },
        } as any,
      },
      // sort by the day number which is now the _id of the document
      { $sort: { _id: 1 } as any },
    ];

    const rows = await this.attendanceModel
      .aggregate(pipeline as PipelineStage[])
      .exec();
    return rows;
  }

  async requestLeave(data: {
    user: string;
    institute: string;
    from: string;
    to: string;
    reason?: string;
    meta?: any;
  }) {
    const { user, institute, from, to, reason, meta } = data;
    await this.usersService.findById(user);
    await this.institutesService.findById(institute);

    const leave = new this.leaveModel({
      user: new Types.ObjectId(user),
      institute: new Types.ObjectId(institute),
      from: new Date(from),
      to: new Date(to),
      reason,
      meta: meta || {},
      status: "pending",
    });

    return leave.save();
  }

  async listLeaves(
    filter: { institute?: string; user?: string; status?: string } = {}
  ) {
    const q: any = {};
    if (filter.institute) q.institute = new Types.ObjectId(filter.institute);
    if (filter.user) q.user = new Types.ObjectId(filter.user);
    if (filter.status) q.status = filter.status;
    return this.leaveModel.find(q).sort({ createdAt: -1 }).lean().exec();
  }

  async approveLeave(
    leaveId: string,
    approverId: string,
    approve: boolean,
    notes?: string
  ) {
    const leave = await this.leaveModel.findById(leaveId).exec();
    if (!leave) throw new NotFoundException("Leave not found");

    leave.status = approve ? "approved" : "rejected";
    leave.approver = new Types.ObjectId(approverId);
    if (!leave.meta) leave.meta = {};
    leave.meta.approverNotes = notes;
    await leave.save();

    if (approve) {
      const days: Date[] = [];
      const cur = new Date(leave.from);
      cur.setUTCHours(0, 0, 0, 0);
      const to = new Date(leave.to);
      to.setUTCHours(0, 0, 0, 0);
      while (cur <= to) {
        days.push(new Date(cur));
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
      const ops = days.map((d) => ({
        updateOne: {
          filter: { user: leave.user, date: d },
          update: {
            $set: {
              user: leave.user,
              institute: leave.institute,
              date: d,
              status: "onleave",
            },
          },
          upsert: true,
        },
      }));
      if (ops.length)
        await this.attendanceModel.bulkWrite(ops, { ordered: false });
    }

    return leave;
  }

  @Cron("0 19 * * *") // 19 UTC = 12 AM PKT
  async createPendingAttendanceDaily() {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const users = await this.userModel
      .find({ isActive: true })
      .select("_id institute");
    if (!users.length) return;

    const ops = users.map((user) => ({
      updateOne: {
        filter: { user: user._id, date: today },
        update: {
          $setOnInsert: {
            user: user._id,
            institute: user.institute,
            date: today,
            status: "pending",
          },
        },
        upsert: true,
      },
    }));

    if (ops.length) {
      await this.attendanceModel.bulkWrite(ops, { ordered: false });
      console.log(
        `[Cron] Created ${ops.length} pending attendance entries for ${
          today.toISOString().split("T")[0]
        }`
      );
    }
  }
}
