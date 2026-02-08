import { IsMongoId, IsOptional, IsString, IsNumber, IsDateString } from "class-validator";
export class CreateSalaryChallanDto {
  @IsMongoId()
  staffFinanceId!: string;

  @IsString()
  month!: string;
}
