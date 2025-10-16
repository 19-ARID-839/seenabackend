import { IsOptional, IsString, IsArray, IsNumber } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional() @IsString() fatherName?: string;
  @IsOptional() @IsString() class?: string;
  @IsOptional() @IsArray() subjects?: string[];
  @IsOptional() @IsString() rollNumber?: string;
  @IsOptional() @IsString() studentId?: string;
  @IsOptional() @IsString() childId?: string;
  @IsOptional() @IsString() relation?: string;
  @IsOptional() @IsString() qualification?: string;
  @IsOptional() @IsString() department?: string;
  @IsOptional() @IsNumber() experience?: number;
  @IsOptional() @IsString() specialization?: string;
}
