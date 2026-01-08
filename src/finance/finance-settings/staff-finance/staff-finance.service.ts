import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { FinanceSettings } from "../finance-settings.schema";
import { StaffFinance } from "./staff-finance.schema";
import { User } from "src/users/user.schema";

@Injectable()
export class StaffFinanceService {
  constructor(
    @InjectModel(FinanceSettings.name)
    private financeSettingsModel: Model<FinanceSettings>,

    @InjectModel(StaffFinance.name)
    private staffFinanceModel: Model<StaffFinance>,

    @InjectModel(User.name)
    private userModel: Model<User>
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


  async updateById(
    instituteId: string,
    id: string,
    payload: any
  ) {
    const updated = await this.staffFinanceModel.findOneAndUpdate(
      { _id: id, institute: instituteId },
      {
        $set: {
          payroll: payload.payroll,
          customized: true,
        },
      },
      { new: true }
    );

    if (!updated) {
      throw new BadRequestException("Staff finance not found");
    }

    return {
      message: "Staff payroll updated",
      data: updated,
    };
  }
}
