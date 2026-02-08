// import { Injectable } from "@nestjs/common";
// import { InjectModel } from "@nestjs/mongoose";
// import { Cron } from "@nestjs/schedule";
// import { Model } from "mongoose";
// import { StudentFinance } from "./student-finance.schema";

// @Injectable()
// export class FeeCycleService {
//   constructor(
//     @InjectModel(StudentFinance.name)
//     private studentFinanceModel: Model<StudentFinance>,

//     @InjectModel(StudentFeeCycle.name)
//     private feeCycleModel: Model<StudentFeeCycle>
//   ) {}

//   @Cron("0 5 0 * * *")
//   async generateMonthlyFeeCycles() {
//     const month = dayjs().month() + 1;

//     const students = await this.studentFinanceModel.find({ locked: false });

//     for (const sf of students) {
//       const exists = await this.feeCycleModel.findOne({
//         student: sf.student,
//         academicYear: sf.academicYear,
//         "period.month": month,
//       });

//       if (exists) continue;

//       const dueDate = dayjs()
//         .date(sf.globalRulesSnapshot.feeDeadline)
//         .toDate();

//       const baseAmount =
//         sf.fees.tuitionFee +
//         sf.fees.examFeePerTerm +
//         (sf.fees.transportFee?.enabled
//           ? sf.fees.transportFee.amount
//           : 0);

//       await this.feeCycleModel.create({
//         institute: sf.institute,
//         student: sf.student,
//         academicYear: sf.academicYear,
//         period: { type: "monthly", month },
//         dueDate,
//         baseAmount,
//         fine: {
//           perDay: sf.fees.lateFee?.amount ?? 0,
//           maxCap: sf.fees.lateFee?.maxCap ?? 0,
//           currentAmount: 0,
//         },
//         totalPayable: baseAmount,
//         outstanding: baseAmount,
//         status: "pending",
//         notifications: { remindersSent: [] },
//       });
//     }
//   }
// }
