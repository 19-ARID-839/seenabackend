import { IsEnum, IsNumber, IsString, isString, ValidateNested } from "class-validator";
import { ClassFeeRuleDto } from "./ClassFeeRuleDto";
import { FineRuleDto } from "./FineRuleDto";
import { GlobalRulesDto } from "./GlobalRulesDto";
import { StaffPayrollRuleDto } from "./StaffPayrollRuleDto";
import { PaymentSettingsDto } from "./PaymentSettingsDto";
import { Type } from "class-transformer";

export class CreateFinanceSettingsDto {
  @IsEnum([
    "monthly",
    "bi-monthly",
    "quarterly",
    "term-wise",
    "yearly",
    "installments",
    "mixed",
  ])
  feeCollectionType!: string;

  @IsEnum(["annual", "semester", "quarter", "custom"])
  examSystem!: string;

  @IsNumber()
  feeDeadline!: number;

  @ValidateNested({ each: true })
  @Type(() => ClassFeeRuleDto)
  classFeeRules!: ClassFeeRuleDto[];

  @ValidateNested({ each: true })
  @Type(() => StaffPayrollRuleDto)
  staffPayrollRules!: StaffPayrollRuleDto[];

  @ValidateNested({ each: true })
  @Type(() => FineRuleDto)
  fines!: FineRuleDto[];

  @ValidateNested()
  @Type(() => PaymentSettingsDto)
  paymentSettings!: PaymentSettingsDto;

  @ValidateNested()
  @Type(() => GlobalRulesDto)
  globalRules!: GlobalRulesDto;
}
