// src/tasks/dto/update-progress.dto.ts
import { IsNumber, Min, Max } from 'class-validator';
export class UpdateProgressDto {
  @IsNumber() @Min(0) @Max(100) progress!: number;
}

