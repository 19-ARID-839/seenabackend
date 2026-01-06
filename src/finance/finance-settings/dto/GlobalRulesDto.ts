import { IsString, IsEnum, IsBoolean } from "class-validator";

export class GlobalRulesDto {
  @IsString()
  currency!: string;

  @IsEnum(["up", "down", "nearest"])
  roundingStrategy!: "up" | "down" | "nearest";

  @IsBoolean()
  admissionFeeMandatory!: boolean;

  @IsBoolean()
  transportOptional!: boolean;

  @IsBoolean()
  allowFeeEditAfterGeneration!: boolean;
}
