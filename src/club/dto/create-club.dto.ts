import { IsBoolean, IsOptional, IsString, IsArray, ArrayUnique } from 'class-validator';

export class CreateClubDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean = true;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  tags?: string[];
}
