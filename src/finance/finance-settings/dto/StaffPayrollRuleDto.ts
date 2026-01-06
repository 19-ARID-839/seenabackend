import { Type } from "class-transformer";
import { IsBoolean, IsOptional, IsNumber, IsString, IsEnum, ValidateNested } from "class-validator";

export class AttendanceImpactDto {
  @IsBoolean()
  deductOnAbsence!: boolean;

  @IsOptional()
  @IsNumber()
  perDayDeduction?: number;

  @IsOptional()
  @IsNumber()
  lateArrivalPenalty?: number;
}

export class LeavePolicyDto {
  @IsNumber()
  paidLeavesPerMonth!: number;

  @IsNumber()
  unpaidLeaveAfter!: number;
}

export class OvertimePolicyDto {
  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @IsNumber()
  ratePerHour?: number;
}

export class StaffPayrollRuleDto {
  @IsString()
  role!: string;

  @IsEnum(["fixed", "hourly"])
  salaryType!: "fixed" | "hourly";

  @IsOptional()
  @IsNumber()
  baseSalary?: number;

  @IsOptional()
  @IsNumber()
  hourlyRate?: number;

  @ValidateNested()
  @Type(() => AttendanceImpactDto)
  attendanceImpact!: AttendanceImpactDto;

  @ValidateNested()
  @Type(() => LeavePolicyDto)
  leavePolicy!: LeavePolicyDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => OvertimePolicyDto)
  overtimePolicy?: OvertimePolicyDto;
}
