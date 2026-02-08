import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { FinanceRule, FinanceRuleSchema } from "./schemas/finance-rule.schema";
import {
  FinanceOverride,
  FinanceOverrideSchema,
} from "./schemas/finance-override.schema";
import { Payment, PaymentSchema } from "./schemas/payment.schema";
import { Salary, SalarySchema } from "./schemas/salary.schema";

import { FinanceController } from "./finance.controller";
import { FinanceService } from "./finance.service";
import { NotificationModule } from "src/notification/notification.module";
import { User, UserSchema } from "src/users/user.schema";
import { FinanceSettingsController } from "./finance-settings/finance-settings.controller";
import { FinanceSettingsService } from "./finance-settings/finance-settings.service";
import {
  FinanceSettings,
  FinanceSettingsSchema,
} from "./finance-settings/finance-settings.schema";
import {
  StudentFinance,
  StudentFinanceSchema,
} from "./finance-settings/student-finance/student-finance.schema";
import { StudentFinanceSeeting } from "./finance-settings/student-finance/student-finance.service";
import { Class, ClassSchema } from "src/classes/schema/class.schema";
import {
  StaffFinance,
  StaffFinanceSchema,
} from "./finance-settings/staff-finance/staff-finance.schema";
import { StaffFinanceService } from "./finance-settings/staff-finance/staff-finance.service";
import { StudentFinanceController } from "./finance-settings/student-finance/student-finance.controller";
import { StaffFinanceController } from "./finance-settings/staff-finance/staff-finance.controller";
import { FeeChallanService } from "./finance-settings/student-finance/fee-challan.service";
import {
  FeeChallan,
  FeeChallanSchema,
} from "./finance-settings/student-finance/Other-Schema/fee-challan.schema";
import { FeeChallanController } from "./finance-settings/student-finance/fee-challan.controller";
import {
  StudentFineLedger,
  StudentFineLedgerSchema,
} from "./finance-settings/student-finance/student-fine-ledger/student-fine-ledger.schema";
import { FineLedgerListener } from "./finance-settings/student-finance/student-fine-ledger/fine-ledger.listener";
import { FeePayment, FeePaymentSchema } from "./finance-settings/student-finance/Other-Schema/fee-payment.schema";
import { StaffSalaryChallan, StaffSalaryChallanSchema } from "./finance-settings/staff-finance/staff-salary-challan.schema";
console.log("FinanceSettings:", FinanceSettings);
console.log("FinanceSettings.name:", FinanceSettings?.name);

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FinanceRule.name, schema: FinanceRuleSchema },
      { name: FinanceOverride.name, schema: FinanceOverrideSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Salary.name, schema: SalarySchema },
      { name: User.name, schema: UserSchema }, // Placeholder for User schema
      { name: FinanceSettings.name, schema: FinanceSettingsSchema },
      { name: StudentFinance.name, schema: StudentFinanceSchema },
      { name: Class.name, schema: ClassSchema },
      { name: StaffFinance.name, schema: StaffFinanceSchema },
      { name: FeeChallan.name, schema: FeeChallanSchema },
      { name: StudentFineLedger.name, schema: StudentFineLedgerSchema },
      { name: FeePayment.name, schema: FeePaymentSchema},
      { name: StaffSalaryChallan.name, schema: StaffSalaryChallanSchema},
    ]),
    NotificationModule,
  ],
  controllers: [
    FinanceController,
    FinanceSettingsController,
    StudentFinanceController,
    StaffFinanceController,
    FeeChallanController,
    
  ],
  providers: [
    FinanceService,
    FinanceSettingsService,
    StudentFinanceSeeting,
    StaffFinanceService,
    FeeChallanService,
    FineLedgerListener,
  ],
})
export class FinanceModule {}
