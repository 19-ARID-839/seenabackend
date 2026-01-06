// dto/create-payment.dto.ts
import { IsMongoId, IsString, IsNumber, IsOptional } from "class-validator";

export class CreatePaymentDto {
  @IsMongoId()
  student!: string;

  @IsString()
  month!: string; // "2025-01"

  @IsNumber()
  totalAmount!: number;

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsOptional()
  @IsNumber()
  fine?: number;

  @IsNumber()
  paidAmount!: number;

  @IsOptional()
  @IsString()
  paymentMethod?: "cash" | "bank";

  @IsMongoId()
  administeredBy!: string;

  @IsMongoId()
  institute!: string;
}
