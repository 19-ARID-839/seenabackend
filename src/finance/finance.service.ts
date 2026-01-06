import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FinanceOverride } from "./schemas/finance-override.schema";
import { FinanceRule } from "./schemas/finance-rule.schema";
import { Model, Types } from "mongoose";
import { CreateFinanceOverrideDto } from "./dto/finance-override.dto";
import { CreateFinanceRuleDto } from "./dto/finance-rule.dto";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { Payment } from "./schemas/payment.schema";
import { Salary } from "./schemas/salary.schema";
import { CreateSalaryDto } from "./dto/create-salary.dto";
import { NotificationService } from "../notification/notification.service";
import { UsersModule } from "src/users/users.module";

@Injectable()
export class FinanceService {
  constructor(
    @InjectModel(FinanceRule.name) private ruleModel: Model<FinanceRule>,
    @InjectModel(FinanceOverride.name)
    private overrideModel: Model<FinanceOverride>,
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    @InjectModel(Salary.name) private salaryModel: Model<Salary>,
    private notificationService: NotificationService,
    @InjectModel("User") private userModel: Model<UsersModule>,
  ) {}

  // ---------- NOTIFICATIONS ----------

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

  // ---------- RULES ----------
  // ---------- CREATE RULE ----------
  async createRule(dto: CreateFinanceRuleDto) {
    // You can optionally validate required fields per type
    return this.ruleModel.create(dto);
  }

  async getRules(type?: string) {
    const query: any = { active: true };
    if (type) query.type = type;
    return this.ruleModel.find(query).lean();
  }

  // ---------- OVERRIDES ----------
  async createOverride(dto: CreateFinanceOverrideDto, adminId: string) {
    if (dto.isSpecial && !dto.reason) {
      throw new BadRequestException("Reason required for special override");
    }

    const ruleType = dto.role === "student" ? "class_fee" : "role_salary";

    const rule = await this.ruleModel.findOne({
      active: true,
      type: ruleType,
      role: dto.role,
    });

    if (!rule) {
      throw new BadRequestException("Finance rule not defined for this role");
    }

    const ruleBase = Number(rule.baseAmount);

    // 🔐 Business validation
    if (!dto.isSpecial && dto.meta) {
      if (
        (dto.role === "teacher" || dto.role === "staff") &&
        dto.meta.baseSalary !== undefined &&
        Number(dto.meta.baseSalary) > ruleBase
      ) {
        throw new BadRequestException(
          `Base salary exceeds allowed limit (${ruleBase}). Special approval required.`
        );
      }

      if (
        dto.role === "student" &&
        dto.meta.tuitionFee !== undefined &&
        Number(dto.meta.tuitionFee) < ruleBase
      ) {
        throw new BadRequestException(
          `Fee below base amount (${ruleBase}). Special approval required.`
        );
      }
    }

    const override = await this.overrideModel.findOneAndUpdate(
      { user: new Types.ObjectId(dto.user) }, // 🔑 unique per user
      {
        $setOnInsert: {
          user: new Types.ObjectId(dto.user),
          role: dto.role,
          approvedBy: new Types.ObjectId(adminId),
          ruleRef: rule._id,
        },
        $set: {
          meta: dto.meta || {},
          isSpecial: dto.isSpecial || false,
          reason: dto.isSpecial ? dto.reason : undefined,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    return override;
  }

  async getOverridesByUser(userId: string) {
    if (!Types.ObjectId.isValid(userId)) return [];
    return this.overrideModel
      .find({ user: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 }) // latest first
      .lean();
  }
  async getAllOverrides() {
    return this.overrideModel.find().lean();
  }

  // ---------------- PAYMENTS -------------

  async create(dto: CreatePaymentDto) {
    const exists = await this.salaryModel.findOne({
      staff: new Types.ObjectId(dto.student),
      month: dto.month,
    });
    
    console.log("Body DTO:", dto);
    if (exists) {
      throw new BadRequestException(
        "Fee Recipt already generated for this month"
      );
    }

    const discount = dto.discount || 0;
    const fine = dto.fine || 0;

    const expectedAmount = dto.totalAmount - discount + fine;
    if (dto.paidAmount !== expectedAmount) {
      throw new BadRequestException(`Paid amount must be ${expectedAmount}`);
    }

    const createdPayment = await this.paymentModel.create({
      student: new Types.ObjectId(dto.student), // ✅ FORCE CAST
      month: dto.month,
      totalAmount: dto.totalAmount,
      discount,
      fine,
      paidAmount: dto.paidAmount,
      paymentMethod: dto.paymentMethod,
      status: "paid",
      administeredBy: new Types.ObjectId(dto.administeredBy),
      institute: new Types.ObjectId(dto.institute),
    });

    // Send notification to student about payment

    const message = `Payment of amount ${dto.paidAmount} for month ${dto.month} has been received. Thank you!`;

    await this.notify({
      sender: dto.administeredBy,
      receiver: dto.student.toString(),
      institute: dto.institute, // Replace with actual institute ID if available
      message,
      messageType: "fee", // must match your Notification enum
    });
    // return leave;

    return createdPayment;
  }

  async getByStudent(studentId: string) {
    return this.paymentModel
      .find({ student: studentId })
      .sort({ createdAt: -1 });
  }

  async getAllPayments() {
    return this.paymentModel
      .find()
      .populate(
        "student",
        "name role institute profile.className profile.section"
      )
      .sort({ createdAt: -1 })
      .lean();
  }

  // ------------ SALARY ------------------

  async createSalary(dto: CreateSalaryDto) {
    const exists = await this.salaryModel.findOne({
      staff: new Types.ObjectId(dto.staff),
      month: dto.month,
    });

    if (exists) {
      throw new BadRequestException("Salary already generated for this month");
    }

    const allowance = dto.allowance || 0;
    const deductions = dto.deductions || 0;

    const netSalary = dto.baseSalary + allowance - deductions;
    if (netSalary < 0) {
      throw new BadRequestException("Net salary cannot be negative");
    }

    const salary = await this.salaryModel.create({
      staff: new Types.ObjectId(dto.staff), // ✅ FORCE CAST
      baseSalary: dto.baseSalary,
      month: dto.month,
      allowance,
      deductions,
      netSalary,
      status: "pending",
      administeredBy: new Types.ObjectId(dto.administeredBy),
      institute: new Types.ObjectId(dto.institute),
    });


    await this.notify({
      sender: dto.administeredBy,
      receiver: dto.staff.toString(),
      institute: dto.institute,
      message: `Salary of amount ${netSalary} for month ${dto.month} has been generated.`,
      messageType: "salary",
    });

    return salary;
  }

  async markPaid(id: string) {
    return this.salaryModel.findByIdAndUpdate(
      id,
      { status: "paid" },
      { new: true }
    );
  }

  async getAllSalaries() {
    return this.salaryModel
      .find()
      .populate("staff", "name role")
      .sort({ createdAt: -1 })
      .lean();
  }


  
async getMyFinance(user: { sub: string; role: string }) {

  console.log("USER ID:", user.sub);
console.log("ROLE:", user.role);

 const userId = new Types.ObjectId(user.sub);

  if (user.role === "teacher") {
    const salaries = await this.salaryModel
      .find({ staff: userId }) // ✅ FIXED
      .sort({ month: -1 })
      .lean();

    return {
      role: user.role,
      payments: [],
      salaries,
    };
  }

  if (user.role === "student") {
    const payments = await this.paymentModel
      .find({ student: userId }) // ✅ FIXED
      .sort({ month: -1 })
      .lean();

    return {
      role: user.role,
      payments,
      salaries: [],
    };
  }

  // if (user.role === "parent") {
  //   const childIds = user.profile.childIds.map(
  //     (id) => new Types.ObjectId(id)
  //   );

  //   const payments = await this.paymentModel
  //     .find({ student: { $in: childIds } })
  //     .sort({ month: -1 })
  //     .lean();

  //   return {
  //     role: user.role,
  //     payments,
  //     salaries: [],
  //   };
  // }

  return { role: user.role, payments: [], salaries: [] };
}

}
