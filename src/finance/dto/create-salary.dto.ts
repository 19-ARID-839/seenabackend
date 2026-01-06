// dto/create-salary.dto.ts
import { IsMongoId, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateSalaryDto {
  @IsMongoId()
  staff!: string;

  @IsString()
  month!: string; // "2025-12"

  @IsNumber()
  baseSalary!: number;

  @IsOptional()
  @IsNumber()
  allowance?: number;

  @IsOptional()
  @IsNumber()
  deductions?: number;

  @IsMongoId()
  administeredBy!: string;

  @IsMongoId()
  institute!: string;
}
