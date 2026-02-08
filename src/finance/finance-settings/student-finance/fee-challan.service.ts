import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { CreateFeeChallanDto } from "./dto/create-fee-challan.dto";
import { StudentFinance } from "./student-finance.schema";
import { FeeChallan } from "./Other-Schema/fee-challan.schema";
import { StudentFineLedger } from "./student-fine-ledger/student-fine-ledger.schema";
import dayjs from "dayjs";
import { Attendance } from "src/attendance/attendance.schema";
import { GetFeeChallanQueryDto } from "./dto/get-fee-challan-query.dto";
import { DummyBank } from "./Other-Schema/dummy-bank.store";
import { PayFeeChallanDto } from "./dto/pay-challan.dto";
import { FeePayment } from "./Other-Schema/fee-payment.schema";

@Injectable()
export class FeeChallanService {
  constructor(
    @InjectModel(StudentFinance.name)
    private studentFinanceModel: Model<StudentFinance>,

    @InjectModel(FeeChallan.name)
    private feeChallanModel: Model<FeeChallan>,

    @InjectModel(StudentFineLedger.name)
    private fineLedgerModel: Model<StudentFineLedger>,

    //     @InjectModel(FeeChallan.name)
    // private challanModel: Model<FeeChallan>,

    @InjectModel(FeePayment.name)
    private paymentModel: Model<FeePayment>,
  ) {}

  async processAttendance(att: Attendance) {
    if (!["absent", "late"].includes(att.status)) return;

    const sf = await this.studentFinanceModel.findOne({
      student: att.user,
      institute: att.institute,
    });

    if (!sf || !sf.fees?.lateFee?.amount) return;

    const month = dayjs(att.date).month() + 1;

    const ledger = await this.fineLedgerModel.findOneAndUpdate(
      {
        user: att.user,
        institute: att.institute,
        academicYear: sf.academicYear,
        periodType: "monthly",
        month,
        consumedInChallan: false,
      },
      {},
      { upsert: true, new: true },
    );

    const perIncidentFine = Number(sf.fees.lateFee.amount) || 0;
    const maxCap = Number(sf.fees.lateFee.maxCap) || Infinity;

    let increment = 0;

    if (att.status === "absent") {
      ledger.absentCount += 1;
      increment = perIncidentFine;
    }

    if (att.status === "late") {
      ledger.lateCount += 1;
      increment = perIncidentFine;
    }

    ledger.totalFine = Math.min((ledger.totalFine || 0) + increment, maxCap);

    await ledger.save();

    console.log("✅ Fine updated:", {
      user: att.user,
      month,
      increment,
      totalFine: ledger.totalFine,
    });
  }

  async createForStudent(instituteId: string, dto: CreateFeeChallanDto) {
    const sf = await this.studentFinanceModel.findOne({
      _id: new Types.ObjectId(dto.studentFinanceId),
      institute: new Types.ObjectId(instituteId),
    });

    if (!sf) throw new BadRequestException("Student finance not found");

    /* ---------------------------------- */
    /* 🚫 Duplicate guard (month based)   */
    /* ---------------------------------- */

    const start = dayjs(dto.dueDate).startOf("month").toDate();
    const end = dayjs(dto.dueDate).endOf("month").toDate();

    const existing = await this.feeChallanModel.findOne({
      institute: new Types.ObjectId(instituteId),
      student: sf.student,
      academicYear: sf.academicYear,
      createdAt: { $gte: start, $lte: end },
    });

    if (existing) {
      throw new BadRequestException(
        "Fee challan already exists for this month",
      );
    }

    /* ---------------------------------- */
    /* 💰 Base fees                       */
    /* ---------------------------------- */

    let total = 0;
    const snapshot: Record<string, any> = {};
    const fees = sf.fees;

    // Tuition (always)
    snapshot.tuitionFee = fees.tuitionFee;
    total += fees.tuitionFee;

    // Exam fee (temporary auto logic — checkbox later)
    if (
      sf.globalRulesSnapshot?.examSystem === "quarterly" &&
      (dto.type === "quarterly" || dto.type === "manual")
    ) {
      snapshot.examFeePerTerm = fees.examFeePerTerm;
      total += fees.examFeePerTerm;
    }

    // Transport
    if (fees.transportFee?.enabled) {
      snapshot.transportFee = fees.transportFee;
      total += fees.transportFee.amount;
    }

    /* ---------------------------------- */
    /* 🔥 Attendance fine (ABSENT)        */
    /* ---------------------------------- */

    const month = dayjs(dto.dueDate).month() + 1;

    const fineLedger = await this.fineLedgerModel.findOne({
      user: sf.student,
      institute: new Types.ObjectId(instituteId),
      academicYear: sf.academicYear,
      periodType: "monthly",
      month,
      consumedInChallan: false,
    });

    const attendanceFine = fineLedger?.totalFine ?? 0;

    /* ---------------------------------- */
    /* 📜 Rule based fine                 */
    /* ---------------------------------- */

    let ruleFineTotal = 0;
    for (const rule of sf.fineRules ?? []) {
      if (rule.appliesTo !== "student") continue;
      ruleFineTotal += Math.min(rule.amount, rule.maxCap ?? rule.amount);
    }

    /* ---------------------------------- */
    /* ⏰ Late fee                        */
    /* ---------------------------------- */

    let lateFeeAmount = 0;

    if (fees?.lateFee) {
      const today = dayjs();
      const due = dayjs(dto.dueDate);

      if (today.isAfter(due, "day")) {
        const daysLate = today.diff(due, "day");
        lateFeeAmount = Math.min(
          daysLate * fees.lateFee.amount,
          fees.lateFee.maxCap ?? Infinity,
        );
      }
    }

    /* ---------------------------------- */
    /* ➕ ADD FINES ONCE                  */
    /* ---------------------------------- */

    const totalFine = attendanceFine + ruleFineTotal + lateFeeAmount;

    total += totalFine;

    /* ---------------------------------- */
    /* 🧾 Create challan                  */
    /* ---------------------------------- */

    const challan = await this.feeChallanModel.create({
      institute: new Types.ObjectId(instituteId),
      student: sf.student,
      studentFinance: sf._id,
      academicYear: sf.academicYear,
      period: {
        type: { type: dto.type },
        month,
        label: dto.label,
      },
      feeSnapshot: snapshot,
      fine: {
        attendanceFine,
        ruleBasedFine: ruleFineTotal,
        lateFee: lateFeeAmount,
        totalFine,
        currentAmount: totalFine,
      },
      totalPayable: total,
      outstanding: total,
      dueDate: dto.dueDate,
    });

    /* ---------------------------------- */
    /* 🔒 Consume ledger                 */
    /* ---------------------------------- */

    if (fineLedger) {
      fineLedger.consumedInChallan = true;
      await fineLedger.save();
    }

    return challan;
  }

  // 🔹 ALL challans of institute
  async findAll(instituteId: string) {
    return this.feeChallanModel
      .find({ institute: new Types.ObjectId(instituteId) })
      .populate({
        path: "student",
        match: { role: "student" },
        select: "name rollNo profile.className profile.section",
      })
      .sort({ createdAt: -1 })
      .lean();
  }

  // 🔹 Single challan by ID
  async findOne(instituteId: string, id: string) {
    const challan = await this.feeChallanModel
      .findOne({
        _id: new Types.ObjectId(id),
        institute: new Types.ObjectId(instituteId),
      })
      .populate({
        path: "student",
        select: "name rollNo profile.className profile.section",
      });

    if (!challan) {
      throw new NotFoundException("Fee challan not found");
    }

    return challan;
  }

  async payChallan(instituteId: string, payer: any, dto: PayFeeChallanDto) {
    const challan = await this.feeChallanModel.findOne({
      _id: new Types.ObjectId(dto.challanId),
      institute: new Types.ObjectId(instituteId),
      locked: false,
    });

    if (!challan) {
      throw new BadRequestException("Challan not found or locked");
    }

    if (challan.status === "paid") {
      throw new BadRequestException("Challan already paid");
    }

    /* ---------------------------------- */
    /* ➕ Additional fine at payment time */
    /* ---------------------------------- */

    const extraFine = dto.additionalFine ?? 0;

    const payable = challan.outstanding + extraFine;

    /* ---------------------------------- */
    /* 💳 PAYMENT HANDLING                */
    /* ---------------------------------- */

    let transactionRef: string | undefined;

    if (payer.role === "parent") {
      const parentAccount = DummyBank.parents["parent-1"];

      if (parentAccount.balance < payable) {
        throw new BadRequestException("Insufficient balance in parent account");
      }

      parentAccount.balance -= payable;
      DummyBank.school.balance += payable;

      transactionRef = "TXN-" + Date.now();
    }

    /* ---------------------------------- */
    /* 🧾 SAVE PAYMENT                    */
    /* ---------------------------------- */

    await this.paymentModel.create({
      institute: instituteId,
      challan: challan._id,
      student: challan.student,
      payer: payer.sub,
      payerRole: payer.role,
      method: dto.method,
      baseAmount: challan.outstanding,
      additionalFine: extraFine,
      totalPaid: payable,
      transactionRef,
    });

    /* ---------------------------------- */
    /* 🔄 UPDATE CHALLAN                  */
    /* ---------------------------------- */

    challan.totalPaid += payable;
    challan.outstanding = 0;
    challan.status = "paid";
    challan.locked = true;

    // store extra fine snapshot
    challan.fine = {
      ...challan.fine,
      additionalFine: extraFine,
      currentAmount: (challan.fine?.currentAmount ?? 0) + extraFine,
    };

    await challan.save();

    return {
      success: true,
      challanId: challan._id,
      paid: payable,
      status: challan.status,
    };
  }

  // async findAll(instituteId: string, query: GetFeeChallanQueryDto) {
  //   const page = Math.max(Number(query.page) || 1, 1);
  //   const limit = Math.min(Number(query.limit) || 10, 50);
  //   const skip = (page - 1) * limit;

  //   /* ---------------------------- */
  //   /* Base match (challan level)   */
  //   /* ---------------------------- */
  //   const match: any = {
  //     institute: new Types.ObjectId(instituteId),
  //   };

  //   if (query.academicYear) {
  //     match.academicYear = query.academicYear;
  //   }

  //   if (query.status) {
  //     match.status = query.status;
  //   }

  //   /* ---------------------------- */
  //   /* Student-level filters        */
  //   /* ---------------------------- */
  //   const studentMatch: any = {};

  //   if (query.classId) {
  //     studentMatch["student.classId"] = new Types.ObjectId(query.classId);
  //   }

  //   if (query.sectionId) {
  //     studentMatch["student.sectionId"] = new Types.ObjectId(query.sectionId);
  //   }

  //   if (query.search) {
  //     studentMatch.$or = [
  //       { "student.name": { $regex: query.search, $options: "i" } },
  //       { "student.rollNo": { $regex: query.search, $options: "i" } },
  //     ];
  //   }

  //   /* ---------------------------- */
  //   /* Aggregation pipeline         */
  //   /* ---------------------------- */
  //   const pipeline: any[] = [
  //     { $match: match },

  //     /* student */
  //     {
  //       $lookup: {
  //         from: "students",
  //         localField: "student",
  //         foreignField: "_id",
  //         as: "student",
  //       },
  //     },
  //     { $unwind: "$student" },

  //     ...(Object.keys(studentMatch).length
  //       ? [{ $match: studentMatch }]
  //       : []),

  //     /* class */
  //     {
  //       $lookup: {
  //         from: "classes",
  //         localField: "student.classId",
  //         foreignField: "_id",
  //         as: "class",
  //       },
  //     },
  //     { $unwind: "$class" },

  //     /* section */
  //     {
  //       $lookup: {
  //         from: "sections",
  //         localField: "student.sectionId",
  //         foreignField: "_id",
  //         as: "section",
  //       },
  //     },
  //     { $unwind: "$section" },

  //     /* latest first */
  //     { $sort: { createdAt: -1 } },

  //     /* pagination + count */
  //     {
  //       $facet: {
  //         data: [
  //           { $skip: skip },
  //           { $limit: limit },
  //           {
  //             $project: {
  //               _id: 1,

  //               studentId: "$student._id",
  //               studentName: "$student.name",
  //               rollNo: "$student.rollNo",

  //               classId: "$class._id",
  //               className: "$class.name",

  //               sectionId: "$section._id",
  //               sectionName: "$section.name",

  //               totalPayable: 1,
  //               totalPaid: 1,
  //               outstanding: 1,
  //               status: 1,

  //               dueDate: 1,
  //               createdAt: 1,
  //             },
  //           },
  //         ],
  //         total: [{ $count: "count" }],
  //       },
  //     },
  //   ];

  //   const result = await this.feeChallanModel.aggregate(pipeline);

  //   return {
  //     data: result[0]?.data || [],
  //     meta: {
  //       page,
  //       limit,
  //       total: result[0]?.total[0]?.count || 0,
  //     },
  //   };
  // }

  // async createForStudent(instituteId: string, dto: CreateFeeChallanDto) {
  //   const sf = await this.studentFinanceModel.findOne({
  //     _id: new Types.ObjectId(dto.studentFinanceId),
  //     institute: new Types.ObjectId(instituteId),
  //   });

  //   if (!sf) throw new BadRequestException("Student finance not found");

  //   if (dto.type === "monthly") {
  //     const exists = await this.feeChallanModel.findOne({
  //       student: sf.student,
  //       academicYear: sf.academicYear,
  //       "period.month": dto.month,
  //     });
  //     if (exists)
  //       throw new BadRequestException("Monthly challan already exists");
  //   }

  //   /* ---------------------------------- */
  //   /* 💰 Base fee (AUTO)                  */
  //   /* ---------------------------------- */
  //   let total = 0;
  //   const snapshot: Record<string, any> = {};

  //   const fees = sf.fees;

  //   // Tuition is always included
  //   snapshot.tuitionFee = fees.tuitionFee;
  //   total += fees.tuitionFee;

  //   // Admission fee ❌ NEVER in challan
  //   // Paid at admission only

  //   // Exam fee → based on exam system
  //   if (
  //     sf.globalRulesSnapshot?.examSystem === "quarterly" &&
  //     (dto.type === "quarterly" || dto.type === "manual")
  //   ) {
  //     snapshot.examFeePerTerm = fees.examFeePerTerm;
  //     total += fees.examFeePerTerm;
  //   }

  //   // Transport fee → only if enabled
  //   if (fees.transportFee?.enabled) {
  //     snapshot.transportFee = fees.transportFee;
  //     total += fees.transportFee.amount;
  //   }

  //   /* ---------------------------------- */
  //   /* 🔥 Attendance fine ledger           */
  //   /* ---------------------------------- */
  //   const month = dto.month ?? dayjs().month() + 1;

  //   const fineLedger = await this.fineLedgerModel.findOne({
  //     user: sf.student,
  //     institute: new Types.ObjectId(instituteId), // ✅ FIX
  //     academicYear: sf.academicYear,
  //     periodType: "monthly",
  //     month: Number(month), // ✅ FORCE NUMBER
  //     consumedInChallan: false,
  //   });

  //   const attendanceFine = fineLedger?.totalFine ?? 0;
  //   total += attendanceFine;

  //   /* ---------------------------------- */
  //   /* 📜 Rule-based fines                 */
  //   /* ---------------------------------- */
  //   let ruleFineTotal = 0;

  //   for (const rule of sf.fineRules ?? []) {
  //     if (rule.appliesTo !== "student") continue;
  //     ruleFineTotal += Math.min(rule.amount, rule.maxCap ?? rule.amount);
  //   }

  //   total += ruleFineTotal;

  //   /* ---------------------------------- */
  //   /* 🧾 Create challan                   */
  //   /* ---------------------------------- */

  //   console.log("FineLedger found:", fineLedger);
  //   console.log("Attendance fine:", attendanceFine);

  //   const challan = await this.feeChallanModel.create({
  //     institute: new Types.ObjectId(instituteId),
  //     student: sf.student,
  //     studentFinance: sf._id,
  //     academicYear: sf.academicYear,
  //     period: {
  //       type: { type: dto.type },
  //       month,
  //       label: dto.label,
  //     },
  //     feeSnapshot: snapshot,
  //     fine: {
  //       attendanceFine,
  //       totalFine: attendanceFine,
  //       currentAmount: attendanceFine,
  //     },
  //     totalPayable: total,
  //     outstanding: total,
  //     dueDate: dto.dueDate,
  //   });

  //   /* ---------------------------------- */
  //   /* 🔒 Consume ledger                  */
  //   /* ---------------------------------- */
  //   if (fineLedger) {
  //     fineLedger.consumedInChallan = true;
  //     await fineLedger.save();
  //   }

  //   return challan;
  // }
}

// async createForStudent(instituteId: string, dto: CreateFeeChallanDto) {
//     const sf = await this.studentFinanceModel.findOne({
//       _id: new Types.ObjectId(dto.studentFinanceId),
//       institute: new Types.ObjectId(instituteId),
//     });

//     if (!sf) throw new BadRequestException("Student finance not found");

//     if (dto.type === "monthly") {
//       const exists = await this.feeChallanModel.findOne({
//         student: sf.student,
//         academicYear: sf.academicYear,
//         "period.month": dto.month,
//       });
//       if (exists)
//         throw new BadRequestException("Monthly challan already exists");
//     }

//     /* ---------------------------------- */
//     /* 💰 Base fee (AUTO)                  */
//     /* ---------------------------------- */
//     let total = 0;
//     const snapshot: Record<string, any> = {};
//     const fees = sf.fees;

//     /* ---------------------------------- */
//     /* 💰 Base Fees                       */
//     /* ---------------------------------- */

//     // Tuition
//     snapshot.tuitionFee = fees.tuitionFee;
//     total += fees.tuitionFee;

//     // Exam fee (quarterly only)
//     if (
//       sf.globalRulesSnapshot?.examSystem === "quarterly" &&
//       dto.type === "quarterly"
//     ) {
//       snapshot.examFeePerTerm = fees.examFeePerTerm;
//       total += fees.examFeePerTerm;
//     }

//     // Transport
//     if (fees.transportFee?.enabled) {
//       snapshot.transportFee = fees.transportFee;
//       total += fees.transportFee.amount;
//     }

//     // import dayjs from "dayjs";

//     /* ---------------------------------- */
//     /* 🚫 Simple duplicate guard          */
//     /* ---------------------------------- */

//     const dueMonth = dayjs(dto.dueDate).month(); // 0–11
//     const dueYear = dayjs(dto.dueDate).year();

//     const existing = await this.feeChallanModel.findOne({
//       institute: new Types.ObjectId(instituteId),
//       student: sf.student,
//       academicYear: sf.academicYear,
//       createdAt: {
//         $gte: dayjs(dto.dueDate).startOf("month").toDate(),
//         $lte: dayjs(dto.dueDate).endOf("month").toDate(),
//       },
//     });

//     if (existing) {
//       throw new BadRequestException(
//         "Fee challan already exists for this month"
//       );
//     }

//     /* ---------------------------------- */
//     /* 🔥 Attendance fine ledger           */
//     /* ---------------------------------- */
//     const month = dto.month ?? dayjs().month() + 1;

//     const fineLedger = await this.fineLedgerModel.findOne({
//       user: sf.student,
//       institute: new Types.ObjectId(instituteId), // ✅ FIX
//       academicYear: sf.academicYear,
//       periodType: "monthly",
//       month: Number(month), // ✅ FORCE NUMBER
//       consumedInChallan: false,
//     });

//     /* ---------------------------------- */
//     /* 🔥 Attendance fine                 */
//     /* ---------------------------------- */

//     const attendanceFine = fineLedger?.totalFine ?? 0;

//     /* ---------------------------------- */
//     /* 📜 Rule-based fines                */
//     /* ---------------------------------- */

//     let ruleFineTotal = 0;

//     for (const rule of sf.fineRules ?? []) {
//       if (rule.appliesTo !== "student") continue;
//       ruleFineTotal += Math.min(rule.amount, rule.maxCap ?? rule.amount);
//     }

//     /* ---------------------------------- */
//     /* ⏰ Late fee                        */
//     /* ---------------------------------- */

//     let lateFeeAmount = 0;

//     if (sf.fees?.lateFee && dto.dueDate) {
//       const today = dayjs();
//       const due = dayjs(dto.dueDate);

//       if (today.isAfter(due, "day")) {
//         const lateDays = today.diff(due, "day");
//         lateFeeAmount = Math.min(
//           lateDays * sf.fees.lateFee.amount,
//           sf.fees.lateFee.maxCap ?? Infinity
//         );
//       }
//     }

//     /* ---------------------------------- */
//     /* ➕ Add fines ONCE                  */
//     /* ---------------------------------- */

//     const totalFine = attendanceFine + ruleFineTotal + lateFeeAmount;

//     total += totalFine;

//     /* ---------------------------------- */
//     /* 🧾 Create challan                   */
//     /* ---------------------------------- */

//     console.log("FineLedger found:", fineLedger);
//     console.log("Attendance fine:", attendanceFine);

//     const challan = await this.feeChallanModel.create({
//       institute: new Types.ObjectId(instituteId),
//       student: sf.student,
//       studentFinance: sf._id,
//       academicYear: sf.academicYear,
//       period: {
//         type: { type: dto.type },
//         month,
//         label: dto.label,
//       },
//       feeSnapshot: snapshot,
//       // fine: {
//       //   attendanceFine,
//       //   totalFine: attendanceFine,
//       //   currentAmount: attendanceFine,
//       // },
//       fine: {
//         attendanceFine,
//         lateFee: lateFeeAmount,
//         ruleBasedFine: ruleFineTotal,
//         totalFine,
//         currentAmount: totalFine,
//       },
//       totalPayable: total,
//       outstanding: total,
//       dueDate: dto.dueDate,
//     });

//     /* ---------------------------------- */
//     /* 🔒 Consume ledger                  */
//     /* ---------------------------------- */
//     if (fineLedger) {
//       fineLedger.consumedInChallan = true;
//       await fineLedger.save();
//     }

//     return challan;
//   }

// async processAttendance(att: Attendance) {
//   if (!["absent", "late"].includes(att.status)) {
//     console.log("ℹ️ No fine for status:", att.status);
//     return;
//   }

//   console.log("💰 Processing fine for:", att.status);

//   const sf = await this.studentFinanceModel.findOne({
//     student: att.user,
//     institute: att.institute,
//   });

//   if (!sf) {
//     console.log("⚠️ No StudentFinance found");
//     return;
//   }

//   const month = dayjs(att.date).month() + 1;

//   const ledger = await this.fineLedgerModel.findOneAndUpdate(
//     {
//       user: att.user,
//       institute: att.institute,
//       academicYear: sf.academicYear,
//       periodType: "monthly",
//       month,
//       consumedInChallan: false,
//     },
//     {
//       $setOnInsert: {
//         institute: att.institute,
//         user: att.user,
//         academicYear: sf.academicYear,
//         periodType: "monthly",
//         month,
//         absentCount: 0,
//         lateCount: 0,
//         totalFine: 0,
//         consumedInChallan: false,
//       },
//     },
//     { upsert: true, new: true }
//   );

//   let increment = 0;

//   if (att.status === "absent") {
//     ledger.absentCount += 1;
//     increment = sf.fees.lateFee.absentPerDay;
//     console.log("❌ Absent fine added:", increment);
//   }

//   if (att.status === "late") {
//     ledger.lateCount += 1;
//     increment = sf.fees.lateFee.lateArrival;
//     console.log("⏰ Late arrival fine added:", increment);
//   }

//   ledger.totalFine += increment;

//   if (ledger.totalFine > sf.fees.lateFee.maxCap) {
//     ledger.totalFine = sf.fees.lateFee.maxCap;
//     console.log("🧢 Fine capped at:", ledger.totalFine);
//   }

//   await ledger.save();

//   console.log("✅ Fine ledger updated:", {
//     absentCount: ledger.absentCount,
//     lateCount: ledger.lateCount,
//     totalFine: ledger.totalFine,
//   });
// }

// async createForStudent(instituteId: string, dto: CreateFeeChallanDto) {
//   const sf = await this.studentFinanceModel.findOne({
//     _id: new Types.ObjectId(dto.studentFinanceId),
//     institute: new Types.ObjectId(instituteId),
//   });

//   if (!sf) throw new BadRequestException("Student finance not found");

//   // 🚫 Prevent duplicate monthly challan
//   if (dto.type === "monthly") {
//     const exists = await this.feeChallanModel.findOne({
//       student: sf.student,
//       academicYear: sf.academicYear,
//       "period.month": dto.month,
//     });

//     if (exists)
//       throw new BadRequestException("Monthly challan already exists");
//   }

//   /* ---------------------------------- */
//   /* 💰 Base fee calculation             */
//   /* ---------------------------------- */
//   let total = 0;
//   const fees = sf.fees;
//   const snapshot: Record<string, any> = {};

//   if (dto.include.admissionFee) {
//     snapshot.admissionFee = fees.admissionFee;
//     total += fees.admissionFee;
//   }

//   if (dto.include.tuitionFee) {
//     snapshot.tuitionFee = fees.tuitionFee;
//     total += fees.tuitionFee;
//   }

//   if (dto.include.examFee) {
//     snapshot.examFeePerTerm = fees.examFeePerTerm;
//     total += fees.examFeePerTerm;
//   }

//   if (dto.include.transportFee && fees.transportFee?.enabled) {
//     snapshot.transportFee = fees.transportFee;
//     total += fees.transportFee.amount;
//   }

//   /* ---------------------------------- */
//   /* 🔥 Fetch accumulated fine ledger    */
//   /* ---------------------------------- */
//   const month = dto.month ?? dayjs().month() + 1;

//   const fineLedger = await this.fineLedgerModel.findOne({
//     user: sf.student,
//     institute: instituteId,
//     academicYear: sf.academicYear,
//     periodType: "monthly",
//     month,
//     consumedInChallan: false,
//   });

//   const fineAmount = fineLedger?.totalFine ?? 0;
//   total += fineAmount;

//   /* ---------------------------------- */
//   /* 🧾 Create challan                   */
//   /* ---------------------------------- */
//   const challan = await this.feeChallanModel.create({
//     institute: new Types.ObjectId(instituteId),
//     student: sf.student,
//     studentFinance: sf._id,
//     academicYear: sf.academicYear,
//     period: {
//       type: { type: dto.type },
//       month,
//       label: dto.label,
//     },
//     feeSnapshot: snapshot,
//     fine: {
//       perDay: fees.lateFee?.amount ?? 0,
//       maxCap: fees.lateFee?.maxCap ?? 0,
//       currentAmount: fineAmount, // 🔥 APPLIED HERE
//     },
//     totalPayable: total,
//     outstanding: total,
//     dueDate: dto.dueDate,
//   });

//   /* ---------------------------------- */
//   /* 🔒 Mark ledger as consumed          */
//   /* ---------------------------------- */
//   if (fineLedger) {
//     fineLedger.consumedInChallan = true;
//     await fineLedger.save();
//   }

//   return challan;
// }
