import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import dayjs from "dayjs";
import { Model } from "mongoose";
import { Attendance } from "src/attendance/attendance.schema";
import { FeeChallan } from "../Other-Schema/fee-challan.schema";
import { StudentFinance } from "../student-finance.schema";
import { StudentFineLedger } from "./student-fine-ledger.schema";

@Injectable()
export class FeeChallanService {
  constructor(
    @InjectModel(StudentFinance.name)
    private studentFinanceModel: Model<StudentFinance>,

    @InjectModel(StudentFineLedger.name)
    private fineLedgerModel: Model<StudentFineLedger>
  ) {}

  async processAttendance(att: Attendance) {
    if (!["absent", "late"].includes(att.status)) return;

    const sf = await this.studentFinanceModel.findOne({
      student: att.user,
      institute: att.institute,
    });

    if (!sf) return;

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
      { $setOnInsert: {} },
      { upsert: true, new: true }
    );

    let increment = 0;

    // ❌ ABSENT FINE
    if (att.status === "absent") {
      ledger.absentCount += 1;
      increment = sf.fees.lateFee.absentPerDay;
    }

    // ⏰ LATE FINE
    if (att.status === "late") {
      ledger.lateCount += 1;
      increment = sf.fees.lateFee.lateArrival;
    }

    ledger.totalFine += increment;

    // 🧢 Apply cap
    if (ledger.totalFine > sf.fees.lateFee.maxCap) {
      ledger.totalFine = sf.fees.lateFee.maxCap;
    }

    await ledger.save();
  }
}
