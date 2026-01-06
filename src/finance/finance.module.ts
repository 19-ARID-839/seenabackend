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
import { StudentFinance, StudentFinanceSchema } from "./finance-settings/student-finance/student-finance.schema";
import { StudentFinanceSeeting } from "./finance-settings/student-finance/student-finance.service";
import { Class, ClassSchema } from "src/classes/schema/class.schema";
console.log('FinanceSettings:', FinanceSettings);
console.log('FinanceSettings.name:', FinanceSettings?.name);

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FinanceRule.name, schema: FinanceRuleSchema },
      { name: FinanceOverride.name, schema: FinanceOverrideSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Salary.name, schema: SalarySchema },
      { name: User.name, schema: UserSchema }, // Placeholder for User schema
      { name: FinanceSettings.name, schema: FinanceSettingsSchema },
      { name: StudentFinance.name, schema: StudentFinanceSchema},
      { name: Class.name, schema: ClassSchema}
    ]),
    NotificationModule,
  ],
  controllers: [FinanceController, FinanceSettingsController],
  providers: [FinanceService, FinanceSettingsService, StudentFinanceSeeting],
})
export class FinanceModule {}
