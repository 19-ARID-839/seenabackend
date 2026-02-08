// import { Injectable, BadRequestException } from "@nestjs/common";
// import { InjectModel } from "@nestjs/mongoose";
// import dayjs from "dayjs";
// import { Model, Types } from "mongoose";
// import { StaffFinance } from "../staff-finance/staff-finance.schema";

// @Injectable()
// export class SalaryChallanService {
//   constructor(
//     @InjectModel(StaffFinance.name)
//     private readonly staffFinanceModel: Model<StaffFinanceDocument>,

//     @InjectModel(SalaryChallan.name)
//     private readonly salaryChallanModel: Model<SalaryChallanDocument>,

//     @InjectModel(StaffAttendanceLedger.name)
//     private readonly attendanceLedgerModel: Model<StaffAttendanceLedgerDocument>,
//   ) {}

//   async createForTeacher(
//     instituteId: string,
//     dto: CreateSalaryChallanDto,
//   ) {
//     /* ---------------------------------- */
//     /* 🧑‍🏫 Fetch staff finance           */
//     /* ---------------------------------- */

//     const sf = await this.staffFinanceModel.findOne({
//       _id: new Types.ObjectId(dto.staffFinanceId),
//       institute: new Types.ObjectId(instituteId),
//     });

//     if (!sf) {
//       throw new BadRequestException("Staff finance not found");
//     }

//     if (sf.locked) {
//       throw new BadRequestException("Salary configuration is locked");
//     }

//     /* ---------------------------------- */
//     /* 🚫 Duplicate guard (monthly)       */
//     /* ---------------------------------- */

//     const start = dayjs(dto.month).startOf("month").toDate();
//     const end = dayjs(dto.month).endOf("month").toDate();

//     const exists = await this.salaryChallanModel.findOne({
//       institute: new Types.ObjectId(instituteId),
//       staff: sf.staff,
//       academicYear: sf.academicYear,
//       createdAt: { $gte: start, $lte: end },
//     });

//     if (exists) {
//       throw new BadRequestException(
//         "Salary challan already exists for this month",
//       );
//     }

//     /* ---------------------------------- */
//     /* 💰 Base salary                     */
//     /* ---------------------------------- */

//     let grossSalary = sf.payroll.baseSalary;

//     const snapshot = {
//       salaryType: sf.payroll.salaryType,
//       baseSalary: sf.payroll.baseSalary,
//       attendanceImpact: sf.payroll.attendanceImpact,
//       leavePolicy: sf.payroll.leavePolicy,
//       overtimePolicy: sf.payroll.overtimePolicy,
//     };

//     /* ---------------------------------- */
//     /* ⏱️ Overtime earning                */
//     /* ---------------------------------- */

//     let overtimePay = 0;

//     if (sf.payroll.overtimePolicy?.enabled && dto.overtimeHours) {
//       overtimePay =
//         dto.overtimeHours * sf.payroll.overtimePolicy.ratePerHour;
//       grossSalary += overtimePay;
//     }

//     /* ---------------------------------- */
//     /* 🔥 Attendance deduction            */
//     /* ---------------------------------- */

//     const month = dayjs(dto.month).month() + 1;

//     let attendanceDeduction = 0;

//     if (sf.payroll.attendanceImpact?.deductOnAbsence) {
//       const ledger = await this.attendanceLedgerModel.findOne({
//         staff: sf.staff,
//         institute: new Types.ObjectId(instituteId),
//         academicYear: sf.academicYear,
//         periodType: "monthly",
//         month,
//         consumedInChallan: false,
//       });

//       attendanceDeduction = ledger?.totalDeduction ?? 0;

//       if (ledger) {
//         ledger.consumedInChallan = true;
//         await ledger.save();
//       }
//     }

//     /* ---------------------------------- */
//     /* ➖ Final salary calculation        */
//     /* ---------------------------------- */

//     const totalDeduction = attendanceDeduction;
//     const netSalary = Math.max(0, grossSalary - totalDeduction);

//     /* ---------------------------------- */
//     /* 🧾 Create challan                  */
//     /* ---------------------------------- */

//     const challan = await this.salaryChallanModel.create({
//       institute: new Types.ObjectId(instituteId),
//       staff: sf.staff,
//       staffFinance: sf._id,
//       academicYear: sf.academicYear,
//       period: {
//         type: "monthly",
//         month,
//         label: dto.label,
//       },
//       salarySnapshot: snapshot,
//       earning: {
//         baseSalary: sf.payroll.baseSalary,
//         overtimePay,
//         grossSalary,
//       },
//       deduction: {
//         attendanceDeduction,
//         totalDeduction,
//       },
//       netPayable: netSalary,
//       month: dto.month,
//     });

//     return challan;
//   }
// }
