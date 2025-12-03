// src/tasks/dto/submit-task.dto.ts
import { IsOptional, IsString, IsArray } from 'class-validator';
export class SubmitTaskDto {
  @IsOptional() @IsString() comment?: string;
  @IsOptional() @IsArray() attachments?: any[]; // list of uploaded file metadata
}
