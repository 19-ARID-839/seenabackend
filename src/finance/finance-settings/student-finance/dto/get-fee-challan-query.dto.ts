// dto/get-fee-challan-query.dto.ts
import { IsOptional, IsString, IsNumberString } from "class-validator";

export class GetFeeChallanQueryDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsString()
  sectionId?: string;

  @IsOptional()
  @IsString()
  status?: "pending" | "paid" | "partial";

  @IsOptional()
  @IsString()
  academicYear?: string;
}
