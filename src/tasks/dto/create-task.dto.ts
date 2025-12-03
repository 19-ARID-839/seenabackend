// src/tasks/dto/create-task.dto.ts
import { IsString, IsOptional, IsArray, ArrayNotEmpty, IsEnum, IsDateString } from 'class-validator';
import { Priority } from '../task.schema';

export class CreateTaskDto {
  @IsString() title!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsArray() assignedTo?: string[]; // array of user ids
  @IsOptional() @IsEnum(Priority) priority?: Priority;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() visibleToAssignedOnly?: boolean;
  // attachments handled by multipart endpoint - client can first upload files and pass urls here
  @IsOptional() @IsArray() attachments?: any[];
}

