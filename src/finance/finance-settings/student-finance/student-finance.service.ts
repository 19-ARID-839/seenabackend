import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import dayjs from "dayjs";
import { Class } from "src/classes/schema/class.schema";
import { FinanceSettings } from "../finance-settings.schema";
import { StudentFinance } from "./student-finance.schema";
import { GenerateFeeCycleDto } from "./dto/generate-fee-cycle.dto";
import { StudentFeeCycle } from "./Other-Schema/student-fee-cycle.schema";

@Injectable()
export class StudentFinanceSeeting {
  constructor(
    @InjectModel(FinanceSettings.name)
    private financeSettingsModel: Model<FinanceSettings>,

    @InjectModel(StudentFinance.name)
    private studentFinanceModel: Model<StudentFinance>,

    @InjectModel(Class.name)
    private classModel: Model<Class>,

    @InjectModel(Class.name)
    private feeCycleModel: Model<StudentFeeCycle>
  ) {}

  async applyClassFinance(
    instituteId: string,
    classId: string,
    sectionId: string
  ) {
    // 1️⃣ Fetch class + section
    const classDoc = await this.classModel.findOne(
      {
        _id: classId,
        institute: instituteId,
        "sections._id": sectionId,
      },
      {
        name: 1, // ✅ REQUIRED
        "sections.$": 1,
      }
    );

    if (!classDoc) {
      throw new BadRequestException("Invalid class or section");
    }

    const section = classDoc.sections[0];

    // 2️⃣ Load finance settings
    const settings = await this.financeSettingsModel.findOne({
      institute: instituteId,
    });

    if (!settings) {
      throw new BadRequestException("No finance settings found");
    }

    // 3️⃣ Resolve rule
    const classKey = `${classDoc.name}|${section.name}`;
    let rule = settings.classFeeRules.find((r) => r.className === classKey);

    console.log("RULES: ", rule);

    if (!rule && settings.sameFeeForWholeInstitute) {
      rule = settings.classFeeRules[0]; // or global default
    }

    if (!rule) {
      throw new BadRequestException("No fee rule found");
    }

    // 4️⃣ Assign to students (bulk)
    const academicYear = (settings as any)?.academicYear || "2025-26";
    const feesSnapshot = {
      admissionFee: rule.admissionFee ?? 0,
      tuitionFee: rule.tuitionFee ?? 0,
      examFeePerTerm: rule.examFeePerTerm ?? 0,

      transportFee: rule.transportFee
        ? {
            enabled: rule.transportFee.enabled,
            amount: rule.transportFee.amount,
          }
        : undefined,

      lateFee: rule.lateFee
        ? {
            amount: rule.lateFee.amount,
            maxCap: rule.lateFee.maxCap,
          }
        : undefined,
    };

    const globalRulesSnapshot = {
      currency: settings.globalRules?.currency ?? "PKR",
      roundingStrategy: settings.globalRules?.roundingStrategy ?? "up",
      feeCollectionType: settings.feeCollectionType,
      examSystem: settings.examSystem,
      feeDeadline: settings.feeDeadline,
    };

    console.log("Class name:", classDoc.name);
    console.log("Section name:", section.name);
    console.log("Generated classKey:", classKey);

    console.log(
      "Available rules:",
      settings.classFeeRules.map((r) => r.className)
    );

    await this.studentFinanceModel.bulkWrite(
      section.students.map((s) => {
        const instituteObjId = new Types.ObjectId(instituteId);
        const studentObjId = new Types.ObjectId(s.student);
        const classObjId = new Types.ObjectId(classId);
        const sectionObjId = new Types.ObjectId(sectionId);

        return {
          updateOne: {
            filter: {
              institute: instituteObjId,
              student: studentObjId,
              academicYear,
              customized: false, // 🔥 PROTECTION
            },
            update: {
              $setOnInsert: {
                institute: instituteObjId,
                student: studentObjId,
                classId: classObjId,
                sectionId: sectionObjId,
                academicYear,
              },
              $set: {
                fees: feesSnapshot,
                globalRulesSnapshot,
                fineRules: settings.fines ?? [],
                customized: false,
                locked: false,
                source: {
                  appliedFrom: "class-rule",
                  // ruleId: rule._id?.toString(),
                },
              },
            },
            upsert: true,
          },
        };
      })
    );

    return { message: "Finance rules applied to class successfully" };
  }

  async getAll(instituteId: string) {
    return (
      this.studentFinanceModel
        .find({
          institute: new Types.ObjectId(instituteId), // 🔥 FIX
        })
        .populate(
          "student",
          "name rollNumber profile.className profile.section"
        )
        // .populate("classId", "name")
        // .populate("sectionId", "name")
        .lean()
    );
  }

  async updateById(instituteId: string, id: string, payload: any) {
    const updated = await this.studentFinanceModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        institute: new Types.ObjectId(instituteId),
      },
      {
        $set: {
          fees: payload.fees,
          ...(payload.fineRules && { fineRules: payload.fineRules }),
          customized: true,
        },
      },
      { new: true }
    );

    if (!updated) {
      throw new BadRequestException("Student finance not found");
    }

    return {
      message: "Student finance updated",
      data: updated,
    };
  }

  async generateFeeCycles(instituteId: string, dto: GenerateFeeCycleDto) {
    const students = await this.studentFinanceModel.find({
      institute: new Types.ObjectId(instituteId),
      locked: false,
    });

    let created = 0;

    for (const sf of students) {
      const exists = await this.feeCycleModel.findOne({
        student: sf.student,
        academicYear: sf.academicYear,
        "period.type": dto.type,
        ...(dto.month && { "period.month": dto.month }),
        ...(dto.quarter && { "period.quarter": dto.quarter }),
      });

      if (exists) continue;

      const baseAmount =
        (sf.fees?.tuitionFee ?? 0) +
        (sf.fees?.examFeePerTerm ?? 0) +
        (sf.fees?.transportFee?.enabled ? sf.fees.transportFee.amount : 0);

      const dueDate = dayjs().date(sf.globalRulesSnapshot.feeDeadline).toDate();

      await this.feeCycleModel.create({
        institute: sf.institute,
        student: sf.student,
        academicYear: sf.academicYear,
        period: {
          type: dto.type,
          month: dto.month,
          quarter: dto.quarter,
        },
        dueDate,
        baseAmount,
        fine: {
          perDay: sf.fees?.lateFee?.amount ?? 0,
          maxCap: sf.fees?.lateFee?.maxCap ?? 0,
          currentAmount: 0,
        },
        totalPayable: baseAmount,
        totalPaid: 0,
        outstanding: baseAmount,
        status: "pending",
        locked: false,
        notifications: { remindersSent: [] },
      });

      created++;
    }

    return {
      message: `Fee cycles generated`,
      created,
    };
  }

  //   @Cron("0 5 0 * * *")
  // async generateMonthlyFeeCycles() {
  //   const students = await this.studentFinanceModel.find({
  //     locked: false,
  //   });

  //   for (const sf of students) {
  //     const exists = await this.feeCycleModel.findOne({
  //       student: sf.student,
  //       academicYear: sf.academicYear,
  //       "period.month": currentMonth,
  //     });

  //     if (exists) continue;

  //     const dueDate = dayjs()
  //       .date(settings.feeDeadline)
  //       .toDate();

  //     await this.feeCycleModel.create({
  //       institute: sf.institute,
  //       student: sf.student,
  //       academicYear: sf.academicYear,
  //       period: { type: "monthly", month: currentMonth },
  //       dueDate,
  //       baseAmount: calculateBase(sf.fees),
  //       fine: {
  //         perDay: sf.fees.lateFee?.amount ?? 0,
  //         maxCap: sf.fees.lateFee?.maxCap ?? 0,
  //         currentAmount: 0,
  //       },
  //       totalPayable,
  //       outstanding: totalPayable,
  //       status: "pending",
  //     });
  //   }
  // }

  // @Cron("0 10 0 * * *")
  // async sendFeeReminders() {
  //   const today = dayjs().date();

  //   const cycles = await this.feeCycleModel.find({
  //     status: { $in: ["pending", "partial"] },
  //     locked: false,
  //   });

  //   for (const cycle of cycles) {
  //     const dueDay = dayjs(cycle.dueDate).date();

  //     const daysBefore = dueDay - today;

  //     if (!reminderDays.includes(daysBefore)) continue;

  //     if (cycle.notifications.remindersSent.includes(daysBefore)) continue;

  //     await notifyStudentAndParents(cycle);

  //     await this.feeCycleModel.updateOne(
  //       { _id: cycle._id },
  //       {
  //         $push: {
  //           "notifications.remindersSent": daysBefore,
  //         },
  //         $set: { "notifications.lastNotifiedAt": new Date() },
  //       }
  //     );
  //   }
  // }

  // @Cron("0 15 0 * * *")
  // async applyLateFees() {
  //   const today = dayjs();

  //   const overdueCycles = await this.feeCycleModel.find({
  //     status: { $in: ["pending", "partial"] },
  //     dueDate: { $lt: today.toDate() },
  //     locked: false,
  //   });

  //   for (const cycle of overdueCycles) {
  //     const daysLate = today.diff(dayjs(cycle.dueDate), "day");

  //     const fine = Math.min(
  //       daysLate * cycle.fine.perDay,
  //       cycle.fine.maxCap
  //     );

  //     if (fine === cycle.fine.currentAmount) continue;

  //     await this.feeCycleModel.updateOne(
  //       { _id: cycle._id },
  //       {
  //         $set: {
  //           "fine.currentAmount": fine,
  //           outstanding: cycle.baseAmount + fine - cycle.totalPaid,
  //           status: "overdue",
  //         },
  //       }
  //     );

  //     await notifyLateFee(cycle, fine);
  //   }
  // }

  // async recordPayment(dto) {
  //   await paymentModel.create(...);

  //   await feeCycleModel.updateOne(
  //     { _id: dto.feeCycleId },
  //     {
  //       $inc: {
  //         totalPaid: dto.amount,
  //         outstanding: -dto.amount,
  //       },
  //     }
  //   );

  //   if (outstanding <= 0) {
  //     status = "paid";
  //     locked = true;
  //   }
  // }
}
