import { IsOptional, IsString, IsEnum, IsArray } from 'class-validator';
import { MessageType } from '../club.schema';

export class SendMessageDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsArray()
  attachments?: any[]; // array of attachment metadata — server can accept multipart too

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;
}
