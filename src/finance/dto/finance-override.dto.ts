import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsObject } from 'class-validator';

export class CreateFinanceOverrideDto {
  @IsNotEmpty()
  @IsString()
  user!: string; // user ID

  @IsNotEmpty()
  @IsString()
  role!: string;

  @IsOptional()
  @IsBoolean()
  isSpecial?: boolean;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsObject()
  meta?: Record<string, any>; // dynamic fees or salary
}
