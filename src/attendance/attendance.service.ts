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
import {
  DecideLeaveDto,
  ResubmitLeaveDto,
  UpdateLeaveDto,
} from "./dto/leave.dto";
import { NotificationService } from "src/notification/notification.service";

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
    private institutesService: InstitutesService,
    private notificationService: NotificationService
  ) {}

  private normalizeDate(d: string | Date) {
    const date = d ? new Date(d) : new Date();
    date.setUTCHours(0, 0, 0, 0);
    return date;
  }

  private async notify(payload: {
    sender: string;
    receiver: string;
    receiverRole?: string;
    institute: string;
    message: string;
    messageType: string;
    meta?: any;
  }) {
    return this.notificationService.sendNotification({
      sender: payload.sender,
      receiver: payload.receiver,
      institute: payload.institute,
      messageType: payload.messageType,
      medium: "in-app",
      message: payload.message,
      meta: payload.meta,
    });
  }

  private async notifyRole(payload: {
    sender: string;
    receiverRole: string;
    institute: string;
    message: string;
    messageType: string;
    meta?: any;
  }) {
    return this.notificationService.sendRoleNotification({
      sender: payload.sender,
      receiverRole: payload.receiverRole,
      institute: payload.institute,
      messageType: payload.messageType,
      medium: "in-app",
      message: payload.message,
      meta: payload.meta,
    });
  }

  // async markAttendance(payload: {
  //   user: string;
  //   institute: string;
  //   date?: string;
  //   status: string;
  //   checkIn?: string;
  //   checkOut?: string;
  //   meta?: any;
  //   createdBy?: string;
  // }) {
  //   const {
  //     user,
  //     institute,
  //     date,
  //     status,
  //     checkIn,
  //     checkOut,
  //     meta,
  //     createdBy,
  //   } = payload;
  //   if (!user || !institute)
  //     throw new BadRequestException("user and institute are required");

  //   await this.usersService.findById(user);
  //   await this.institutesService.findById(institute);

  //   const d = this.normalizeDate(date || new Date());

  //   const update: any = {
  //     user: new Types.ObjectId(user),
  //     institute: new Types.ObjectId(institute),
  //     date: d,
  //     status,
  //     meta: meta || {},
  //     createdBy,
  //   };
  //   if (checkIn) update.checkIn = new Date(checkIn);
  //   if (checkOut) update.checkOut = new Date(checkOut);

  //   const doc = await this.attendanceModel
  //     .findOneAndUpdate(
  //       { user: user, date: d },
  //       { $set: update },
  //       { upsert: true, new: true, setDefaultsOnInsert: true }
  //     )
  //     .exec();

  //   return doc;
  // }
  async markAttendance(payload: {
    user: string;
    institute: string;
    date?: string;
    status: string;
    checkIn?: string;
    checkOut?: string;
    meta?: any;
    createdBy?: string;
    updatedBy?: string;
  }) {
    try {
      const {
        user,
        institute,
        date,
        status,
        checkIn,
        checkOut,
        meta,
        createdBy,
        updatedBy,
      } = payload;

      console.log("🟡 Attendance Payload:", payload);

      // --- 1️⃣ Validation ---
      if (!user || !institute) {
        throw new BadRequestException("user and institute are required");
      }

      if (!Types.ObjectId.isValid(user) || !Types.ObjectId.isValid(institute)) {
        throw new BadRequestException("Invalid user or institute ID");
      }

      // --- 2️⃣ Ensure references exist ---
      const [userDoc, instDoc] = await Promise.all([
        this.usersService.findById(user),
        this.institutesService.findById(institute),
      ]);

      if (!userDoc) throw new NotFoundException(`User not found: ${user}`);
      if (!instDoc)
        throw new NotFoundException(`Institute not found: ${institute}`);

      // --- 3️⃣ Normalize date to day-start (avoid timezone mismatches) ---
      const d = this.normalizeDate(date || new Date());

      // --- 4️⃣ Build update document ---
      const update: any = {
        user: new Types.ObjectId(user),
        institute: new Types.ObjectId(institute),
        date: d,
        status,
        meta: meta || {},
        updatedBy: updatedBy ? new Types.ObjectId(updatedBy) : createdBy,
        createdBy,
      };

      if (checkIn) update.checkIn = new Date(checkIn);
      if (checkOut) update.checkOut = new Date(checkOut);

      // --- 5️⃣ Upsert by (user + date) ---
      const doc = await this.attendanceModel
        .findOneAndUpdate(
          { user: new Types.ObjectId(user), date: d }, // ✅ FIXED: both as ObjectId
          { $set: update },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
        .exec();

      console.log("✅ Attendance saved:", doc);
      return doc;
    } catch (error) {
      const errMsg =
        error instanceof Error
          ? error.message
          : typeof error === "string"
          ? error
          : JSON.stringify(error);

      console.error("🔴 Attendance Error:", errMsg);
      throw new BadRequestException(errMsg || "Failed to mark attendance");
    }
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
    // 🧑‍🏫 TEACHER / ADMIN: get all students from same institute
    else if (
      ["teacher", "admin", "principal", "director"].includes(user.role)
    ) {
      const students = await this.userModel
        .find({ institute: user.institute, role: "student" })
        .select("_id")
        .lean();
      filter.user = { $in: students.map((s) => s._id) };
    } else {
      throw new ForbiddenException("This role cannot view attendance");
    }

    // 🗂️ Fetch attendance with user details
    const records = await this.attendanceModel
      .find(filter)
      .populate("user")
      .sort({ date: -1 })
      .lean();

    // ✅ Ensure today's pending for student/parent
    if (["student", "parent"].includes(user.role)) {
      await this.ensureTodayPending(user, records);
    }

    // 🧩 Add fatherName by manually fetching it from DB
    for (const rec of records) {
      const u: any = rec.user;
      if (!u) continue;

      const parent = u?.profile?.parents?.[0]?.parentId;
      if (parent) {
        const parentDoc = await this.userModel
          .findById(parent)
          .select("name")
          .lean();
        u.fatherName = parentDoc?.name || "";
      } else {
        u.fatherName = "";
      }
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

  // async updateAttendanceStatus(
  //   studentId: string,
  //   instituteId: string,
  //   date: string,
  //   status: string,
  //   updatedBy?: string
  // ) {
  //   if (!studentId || !instituteId || !status) {
  //     throw new BadRequestException("Missing required fields");
  //   }

  //   const normalizedDate = this.normalizeDate(date || new Date());

  //   const updated = await this.attendanceModel.findOneAndUpdate(
  //     { user: new Types.ObjectId(studentId), date: normalizedDate },
  //     {
  //       $set: {
  //         status,
  //         institute: new Types.ObjectId(instituteId),
  //         updatedBy: updatedBy ? new Types.ObjectId(updatedBy) : null,
  //       },
  //     },
  //     { new: true, upsert: true }
  //   );

  //   if (!updated) throw new NotFoundException("Attendance record not found");

  //   return updated;
  // }

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
    applicationText?: string;
    className?: string;
    sectionName?: string;
    createdBy?: string;
    createdByRole?: string;
  }) {
    const {
      user,
      institute,
      from,
      to,
      reason,
      meta,
      applicationText,
      className,
      sectionName,
    } = data;
    await this.usersService.findById(user);
    await this.institutesService.findById(institute);
    if (new Date(from) > new Date(to))
      throw new BadRequestException("From date cannot be after To date");

    const leave = new this.leaveModel({
      user: new Types.ObjectId(user),
      institute: new Types.ObjectId(institute),
      from: new Date(from),
      to: new Date(to),
      reason,
      meta: meta || {},
      status: "pending",
      applicationText: applicationText || "",
      className: data.className || "",
      sectionName: data.sectionName || "",
      createdBy: data.createdBy
        ? new Types.ObjectId(data.createdBy)
        : new Types.ObjectId(user),
      createdByRole: data.createdByRole || "student",
      allowedApproverRoles: ["teacher", "principal", "admin"],
      currentApproverRole: "teacher",
    });

    const deadline = new Date();
    deadline.setHours(deadline.getHours() + 3); // 2–3 hours

    leave.teacherDeadline = deadline;
    leave.currentApproverRole = "teacher";

    await leave.save();

    await this.notifyRole({
      sender: user,
      receiverRole: "teacher",
      institute,
      message: `New leave request from Class: ${className} Section: ${sectionName}`,
      messageType: "leave_request",
      meta: { leaveId: leave._id.toString() },
    });

    return leave;
  }

  async updateLeaveRequest(leaveId: string, dto: UpdateLeaveDto) {
    const leave = await this.leaveModel.findById(leaveId);
    if (!leave) throw new NotFoundException();

    if (!leave.user.equals(new Types.ObjectId(dto.user))) {
      throw new ForbiddenException("You cannot edit this request");
    }

    if (!["pending", "rejected"].includes(leave.status)) {
      throw new BadRequestException("Cannot edit approved leave");
    }

    if (dto.from) leave.from = new Date(dto.from);
    if (dto.to) leave.to = new Date(dto.to);
    if (dto.reason) leave.reason = dto.reason;
    if (dto.applicationText) leave.applicationText = dto.applicationText;

    leave.status = "pending";
    leave.currentApproverRole = "teacher";

    const deadline = new Date();
    deadline.setHours(deadline.getHours() + 3);
    // 🚧 TEMP DEMO MODE — REMOVE AFTER TESTING
    // const deadline = new Date(Date.now() + 2 * 60 * 1000); // +2 minutes

    leave.teacherDeadline = deadline;

    leave.timeline.push({
      action: "updated",
      by: leave.user,
      role: "student",
      at: new Date(),
    });

    return leave.save();
  }

  async listLeaves(
    filter: {
      institute?: string;
      user?: string;
      status?: string;
      approverRole?: string;
    } = {}
  ) {
    const q: any = {};
    if (filter.institute) q.institute = new Types.ObjectId(filter.institute);
    if (filter.user) q.user = new Types.ObjectId(filter.user);
    if (filter.status) q.status = filter.status;

    // role-based visibility
    if (filter.approverRole) {
      if (filter.approverRole) {
        q.currentApproverRole = filter.approverRole;
        q.status = { $in: ["pending", "resubmitted"] };
      }
    }

    return this.leaveModel
      .find(q)
      .sort({ createdAt: -1 })
      .populate("user approver")
      .lean()
      .exec();
  }

  async decideLeave(leaveId: string, dto: DecideLeaveDto) {
    const { approverId, approve, rejectionReason } = dto;

    const leave = await this.leaveModel.findById(leaveId);
    if (!leave) throw new NotFoundException("Leave not found");

    const user = await this.usersService.findById(approverId);
    if (!user) throw new NotFoundException("Approver not found");

    if (!approve && !rejectionReason) {
      throw new BadRequestException("Rejection reason required");
    }
    if (!leave.allowedApproverRoles?.includes(user.role)) {
      throw new ForbiddenException("You are not allowed to act on this leave");
    }
    if (leave.status === "approved" || leave.status === "rejected") {
      throw new BadRequestException("Leave already decided");
    }

    if (user.role === "teacher") {
      const isIncharge = user.profile?.assignedClasses?.some(
        (c) =>
          String(c.className).trim() === String(leave.className).trim() &&
          String(c.sectionName).trim() === String(leave.sectionName).trim() &&
          c.isIncharge === true
      );

      if (!isIncharge) {
        throw new ForbiddenException(
          "Only class incharge can decide this leave"
        );
      }
    }

    if (user.role === "teacher" && leave.currentApproverRole !== "teacher") {
      throw new ForbiddenException(
        "Teacher can no longer act after escalation"
      );
    }

    leave.status = approve ? "approved" : "rejected";
    leave.approver = new Types.ObjectId(approverId);
    leave.rejectionReason = rejectionReason;

    leave.timeline.push({
      action: approve ? "approved" : "rejected",
      by: leave.approver,
      role: user.role,
      note: rejectionReason,
      at: new Date(),
    });

      await leave.save();


  // ✅ Send notification to the leave creator
  const message = approve
    ? `Congratulations! Your leave request has been approved by ${user.name || user.email}.`
    : `Your leave request has been rejected by ${user.name || user.email}. Reason: ${rejectionReason || "Not specified"}. You may resubmit if needed.`;

  await this.notify({
    sender: approverId,
    receiver: leave.user.toString(),
    institute: leave.institute.toString(),
    message,
    messageType: "leave", // must match your Notification enum
  });
    return leave;
  }

  async resubmitLeave(id: string, dto: ResubmitLeaveDto) {
    const leave = await this.leaveModel.findById(id);
    if (!leave) throw new NotFoundException();

    if (!leave.user.equals(dto.userId)) throw new ForbiddenException();

    if (leave.status !== "rejected")
      throw new BadRequestException("Only rejected leaves can be resubmitted");

    leave.status = "resubmitted";
    leave.studentResubmissionText = dto.text;
    leave.currentApproverRole = "teacher";

    const deadline = new Date();
    deadline.setHours(deadline.getHours() + 3);

    leave.teacherDeadline = deadline;

    leave.timeline.push({
      action: "resubmitted",
      by: leave.user,
      role: "student",
      note: dto.text,
      at: new Date(),
    });

  await leave.save();

  // ✅ Notify all teachers / class incharge
  await this.notifyRole({
    sender: leave.user.toString(),
    receiverRole: "teacher",
    institute: leave.institute.toString(),
    message: `Leave request has been resubmitted by the student. Please review.`,
    messageType: "general",
    meta: { leaveId: leave._id.toString() },
  });

  return leave;

  }


async deleteLeave(leaveId: string, userId: string) {
  const leave = await this.leaveModel.findById(leaveId);
  if (!leave) throw new NotFoundException("Leave not found");

  // Only creator can delete
  if (!leave.user.equals(userId)) {
    throw new ForbiddenException("You can only delete your own leave requests");
  }

  // Check leave status
  if (leave.status === "approved" || leave.status === "resubmitted") {
    throw new BadRequestException(
      `Cannot delete a leave that is ${leave.status}`
    );
  }

  await leave.deleteOne();

  return { message: "Leave request deleted successfully" };
}


  @Cron("0 0 * * *", { timeZone: "Asia/Karachi" }) // ⏰ runs daily at 12:00 AM PKT
  async createPendingAttendanceDaily() {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    console.log(
      `[Cron] ⏰ Running pending attendance job for ${today.toISOString()}`
    );

    const students = await this.userModel
      .find({ isActive: true, role: "student" })
      .select("_id institute")
      .lean();

    if (!students.length) {
      console.log("[Cron] ⚠️ No active students found");
      return;
    }

    const ops = students.map((student) => ({
      updateOne: {
        filter: { user: student._id, date: today },
        update: {
          $setOnInsert: {
            user: student._id,
            institute: student.institute,
            date: today,
            status: "pending",
          },
        },
        upsert: true,
      },
    }));

    try {
      const res = await this.attendanceModel.bulkWrite(ops, { ordered: false });
      console.log(
        `[Cron] ✅ Created or skipped ${res.upsertedCount ?? 0} records for ${
          today.toISOString().split("T")[0]
        }`
      );
    } catch (err) {
      console.error("🔴 [Cron] BulkWrite Error:", err);
    }
  }

  @Cron("5 0 * * *", { timeZone: "Asia/Karachi" }) // 12:05 AM PKT
  async markApprovedLeavesAttendance() {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    console.log(
      `[Cron] 🌙 Marking leave attendance for ${today.toISOString()}`
    );

    // 1️⃣ Find approved leaves active today
    const activeLeaves = await this.leaveModel.find({
      status: "approved",
      from: { $lte: today },
      to: { $gte: today },
    });

    if (!activeLeaves.length) {
      console.log("[Cron] ℹ️ No active leaves today");
      return;
    }

    const ops = activeLeaves.map((leave) => ({
      updateOne: {
        filter: {
          user: leave.user,
          date: today,
        },
        update: {
          $set: {
            user: leave.user,
            institute: leave.institute,
            date: today,
            status: "leave",
            meta: {
              leaveId: leave._id,
              reason: leave.reason,
            },
          },
        },
        upsert: true,
      },
    }));

    try {
      const res = await this.attendanceModel.bulkWrite(ops, {
        ordered: false,
      });

      console.log(
        `[Cron] ✅ Leave attendance processed: ${res.upsertedCount ?? 0}`
      );
    } catch (err) {
      console.error("[Cron] 🔴 Leave attendance error:", err);
    }
  }

  @Cron("*/2 * * * *")
  async escalateLeaves() {
    const now = new Date();

    await this.leaveModel.updateMany(
      {
        status: { $in: ["pending", "resubmitted"] },
        currentApproverRole: "teacher",
        teacherDeadline: { $lt: now },
      },
      {
        $set: {
          currentApproverRole: "principal",
          allowedApproverRoles: ["principal", "admin", "viceprincipal"],
        },
        $push: {
          timeline: {
            action: "auto-escalated",
            role: "system",
            at: new Date(),
          },
        },
      }
    );
  }
}

//   async approveLeave(
//   leaveId: string,
//   approverId: string,
//   approve: boolean,
//   notes?: string,
//   approverRole?: 'admin' | 'principal' | 'teacher'

// ) {
//   const leave = await this.leaveModel.findById(leaveId);
//   if (!leave) throw new NotFoundException("Leave not found");

//   // Only allow roles assigned
//   const user = await this.usersService.findById(approverId);
//   if (!user) throw new NotFoundException("Approver not found");

//   const allowedRoles = ['admin', 'director', 'principal', 'teacher'];
//   if (!allowedRoles.includes(user.role)) {
//     throw new ForbiddenException("You do not have permission to approve this leave");
//   }

//   leave.status = approve ? 'approved' : 'rejected';
//   leave.approver = new Types.ObjectId(approverId);
//   leave.meta = leave.meta || {};
//   leave.meta.approverNotes = notes;

//   // track boolean by role
//   if (user.role === 'admin') leave.isApprovedByAdmin = approve;
//   if (user.role === 'principal') leave.isApprovedByPrincipal = approve;
//   if (user.role === 'teacher') leave.isApprovedByIncharge = approve;

//   await leave.save();

//   if (approve) {
//     const days: Date[] = [];
//     const cur = new Date(leave.from);
//     const to = new Date(leave.to);
//     cur.setUTCHours(0, 0, 0, 0);
//     to.setUTCHours(0, 0, 0, 0);
//     while (cur <= to) {
//       days.push(new Date(cur));
//       cur.setUTCDate(cur.getUTCDate() + 1);
//     }

//     const ops = days.map((d) => ({
//       updateOne: {
//         filter: { user: leave.user, date: d },
//         update: {
//           $set: { user: leave.user, institute: leave.institute, date: d, status: 'onleave' },
//         },
//         upsert: true,
//       },
//     }));

//     if (ops.length) await this.attendanceModel.bulkWrite(ops, { ordered: false });
//   }

//   return leave;
// }

// async listLeaves(
//   filter: { institute?: string; user?: string; status?: string } = {}
// ) {
//   const q: any = {};
//   if (filter.institute) q.institute = new Types.ObjectId(filter.institute);
//   if (filter.user) q.user = new Types.ObjectId(filter.user);
//   if (filter.status) q.status = filter.status;
//   return this.leaveModel.find(q).sort({ createdAt: -1 }).lean().exec();
// }

// async approveLeave(
//   leaveId: string,
//   approverId: string,
//   approve: boolean,
//   notes?: string
// ) {
//   const leave = await this.leaveModel.findById(leaveId).exec();
//   if (!leave) throw new NotFoundException("Leave not found");

//   leave.status = approve ? "approved" : "rejected";
//   leave.approver = new Types.ObjectId(approverId);
//   if (!leave.meta) leave.meta = {};
//   leave.meta.approverNotes = notes;
//   await leave.save();

//   if (approve) {
//     const days: Date[] = [];
//     const cur = new Date(leave.from);
//     cur.setUTCHours(0, 0, 0, 0);
//     const to = new Date(leave.to);
//     to.setUTCHours(0, 0, 0, 0);
//     while (cur <= to) {
//       days.push(new Date(cur));
//       cur.setUTCDate(cur.getUTCDate() + 1);
//     }
//     const ops = days.map((d) => ({
//       updateOne: {
//         filter: { user: leave.user, date: d },
//         update: {
//           $set: {
//             user: leave.user,
//             institute: leave.institute,
//             date: d,
//             status: "onleave",
//           },
//         },
//         upsert: true,
//       },
//     }));
//     if (ops.length)
//       await this.attendanceModel.bulkWrite(ops, { ordered: false });
//   }

//   return leave;
// }
