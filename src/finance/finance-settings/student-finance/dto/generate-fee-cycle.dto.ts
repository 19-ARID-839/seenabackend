import { IsEnum, IsNumber, IsOptional } from "class-validator";

export class GenerateFeeCycleDto {
  @IsEnum(["monthly", "quarterly"])
  type!: "monthly" | "quarterly";

  @IsOptional()
  @IsNumber()
  month?: number; // 1–12

  @IsOptional()
  @IsNumber()
  quarter?: number; // 1–4
}
