import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { FinanceSettings } from "../finance-settings.schema";
import { StaffFinance } from "./staff-finance.schema";
import { User } from "src/users/user.schema";
import { CreateSalaryChallanDto } from "./dto/create-salary-challan.dto";
import { StaffSalaryChallan } from "./staff-salary-challan.schema";

@Injectable()
export class StaffFinanceService {
  constructor(
    @InjectModel(FinanceSettings.name)
    private financeSettingsModel: Model<FinanceSettings>,

    @InjectModel(StaffFinance.name)
    private staffFinanceModel: Model<StaffFinance>,

    @InjectModel(User.name)
    private userModel: Model<User>,

     @InjectModel(StaffSalaryChallan.name)
    private challanModel: Model<StaffSalaryChallan>
  ) {}

  async applyPayrollByRole(instituteId: string, role: string) {
    const settings = await this.financeSettingsModel.findOne({
      institute: instituteId,
    });

    if (!settings) {
      throw new BadRequestException("Finance settings not found");
    }

    const rule = settings.staffPayrollRules.find((r) => r.role === role);

    if (!rule) {
      throw new BadRequestException(`No payroll rule found for role: ${role}`);
    }
    console.log("Instutute Id", instituteId);
    const staffList = await this.userModel.find({
      institute: new Types.ObjectId(instituteId),
      role,
      isActive: true, // optional but recommended
    });

    console.log(instituteId);

    if (!staffList.length) {
      throw new BadRequestException(`No staff found for role: ${role}`);
    }

    const academicYear = "2025-26";

    const payrollSnapshot = {
      salaryType: rule.salaryType,
      baseSalary: rule.baseSalary,
      attendanceImpact: rule.attendanceImpact,
      leavePolicy: rule.leavePolicy,
      overtimePolicy: rule.overtimePolicy,
    };

    await this.staffFinanceModel.bulkWrite(
      staffList.map((staff) => ({
        updateOne: {
          filter: {
            institute: new Types.ObjectId(instituteId),
            staff: staff._id,
            academicYear,
            customized: false, // 🔥 DO NOT override manual payroll
          },
          update: {
            $setOnInsert: {
              institute: new Types.ObjectId(instituteId),
              staff: staff._id,
              role,
              academicYear,
            },
            $set: {
              payroll: payrollSnapshot,
              customized: false,
              source: {
                appliedFrom: "role-rule",
                // ruleId: rule._id?.toString(),
              },
            },
          },
          upsert: true,
        },
      }))
    );

    return {
      message: `Payroll applied to ${staffList.length} ${role}(s)`,
    };
  }

  async getAll(instituteId: string) {
    return this.staffFinanceModel
      .find({
        institute: new Types.ObjectId(instituteId), // 🔥 FIX
      })
      .populate("staff", "name role")
      .lean();
  }

  async updateById(instituteId: string, id: string, payload: any) {
    const updated = await this.staffFinanceModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        institute: new Types.ObjectId(instituteId),
      },
      {
        $set: {
          payroll: payload.payroll,
          customized: true,
        },
      },
      { new: true }
    );

    if (!updated) {
      throw new BadRequestException("Staff payroll not found");
    }

    return {
      message: "Staff payroll updated",
      data: updated,
    };
  }


    async create(instituteId: string, dto: CreateSalaryChallanDto) {
    const sf = await this.staffFinanceModel.findOne({
      _id: new Types.ObjectId(dto.staffFinanceId),
      institute: new Types.ObjectId(instituteId),
    });

    if (!sf) {
      throw new BadRequestException("Staff finance not found");
    }

    // ❌ Duplicate challan guard (monthly)
    const exists = await this.challanModel.findOne({
      institute: new Types.ObjectId(instituteId),
      staff: sf.staff,
      academicYear: sf.academicYear,
      month: dto.month,
    });

    if (exists) {
      throw new BadRequestException(
        "Salary challan already exists for this month",
      );
    }

    const baseSalary = sf.payroll.baseSalary;

    return this.challanModel.create({
      institute: new Types.ObjectId(instituteId),
      staff: sf.staff,
      staffFinance: sf._id,
      academicYear: sf.academicYear,
      month: dto.month,
      salarySnapshot: {
        salaryType: sf.payroll.salaryType,
        baseSalary,
      },
      grossSalary: baseSalary,
      deduction: 0,
      netPayable: baseSalary,
    });
  }

  async getAllChallan(instituteId: string) {
    return this.challanModel
      .find({ institute: new Types.ObjectId(instituteId) })
      .populate("staff", "name role")
      .sort({ createdAt: -1 })
      .lean();
  }


    async payChallan(
    instituteId: string,
    challanId: string,
    method: "cash" | "bank" = "cash",
    extraAmount: number = 0
  ) {
    const challan = await this.challanModel.findOne({
      _id: new Types.ObjectId(challanId),
      institute: new Types.ObjectId(instituteId),
    });

    if (!challan) {
      throw new BadRequestException("Salary challan not found");
    }

    if (challan.status === "paid") {
      throw new BadRequestException("Salary already paid");
    }

    // Update ledger in staff finance
    const staffFinance = await this.staffFinanceModel.findById(
      challan.staffFinance
    );

    if (!staffFinance) {
      throw new BadRequestException("Staff finance not found");
    }

    const totalPaid = challan.netPayable + extraAmount;

    // Update challan
    const updatedChallan = await this.challanModel.findOneAndUpdate(
      { _id: challan._id },
      {
        $set: {
          status: "paid",
          netPayable: challan.netPayable + extraAmount,
        },
      },
      { new: true }
    );

    // Update staff ledger
    staffFinance.ledger.totalPaid += totalPaid;
    staffFinance.ledger.outstanding =
      staffFinance.ledger.totalPayable - staffFinance.ledger.totalPaid;
    staffFinance.ledger.payments.push({
      amount: totalPaid,
      method,
      date: new Date(),
      challan: challan._id,
    });

    await staffFinance.save();

    return {
      message: `Salary paid successfully: Rs. ${totalPaid}`,
      data: updatedChallan,
    };
  }

}
