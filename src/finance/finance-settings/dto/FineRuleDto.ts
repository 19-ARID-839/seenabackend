import { IsString, IsNumber, IsEnum, IsBoolean, IsOptional } from "class-validator";

export class FineRuleDto {
  @IsString()
  code!: string;

  @IsString()
  title!: string;

  @IsNumber()
  amount!: number;

  @IsEnum(["student", "staff"])
  appliesTo!: "student" | "staff";

  @IsEnum([
    "lateFee",
    "absence",
    "discipline",
    "library",
    "custom",
  ])
  trigger!: "lateFee" | "absence" | "discipline" | "library" | "custom";

  @IsEnum(["once", "daily", "monthly"])
  frequency!: "once" | "daily" | "monthly";

  @IsBoolean()
  autoApply!: boolean;

  @IsOptional()
  @IsNumber()
  maxCap?: number;
}
