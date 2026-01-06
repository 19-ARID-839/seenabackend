import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class AnnualChargesDto {
  @IsOptional() @IsNumber() libraryFee?: number;
  @IsOptional() @IsNumber() labFee?: number;
  @IsOptional() @IsNumber() activityFee?: number;
  @IsOptional() @IsNumber() sportsFee?: number;
}

export class TransportFeeDto {
  @IsBoolean() enabled!: boolean;
  @IsOptional() @IsNumber() amount?: number;
}

export class LateFeeDto {
  @IsEnum(["fixed", "perDay"])
  type!: "fixed" | "perDay";

  @IsNumber()
  amount!: number;

  @IsOptional()
  @IsNumber()
  maxCap?: number;
}

export class ClassFeeRuleDto {
  @IsString()
  className!: string;

  @IsNumber()
  admissionFee!: number;

  @IsNumber()
  tuitionFee!: number;

  @IsOptional()
  @IsEnum(["monthly", "term-wise", "yearly"])
  billingFrequencyOverride?: "monthly" | "term-wise" | "yearly";

  @IsOptional()
  @IsNumber()
  examFeePerTerm?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => AnnualChargesDto)
  annualCharges?: AnnualChargesDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TransportFeeDto)
  transportFee?: TransportFeeDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LateFeeDto)
  lateFee?: LateFeeDto;
}
