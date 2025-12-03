// src/club/schemas/club.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ClubDocument = Club & Document;

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  FILE = 'file',
  PDF = 'pdf',
  SYSTEM = 'system',
}

@Schema({ timestamps: true })
export class Attachment {
  @Prop({ type: String, required: true }) // stored file id or external URL
  url!: string;

  @Prop({ type: String }) // original filename
  filename?: string;

  @Prop({ type: String }) // mime type
  mimeType?: string;

  @Prop({ type: Number }) // bytes
  size?: number;

  @Prop({ type: Types.ObjectId, ref: 'User' }) // who uploaded
  uploadedBy?: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  uploadedAt?: Date;
}

export const AttachmentSchema = SchemaFactory.createForClass(Attachment);

@Schema()
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender!: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(MessageType), default: MessageType.TEXT })
  type!: MessageType;

  @Prop({ type: String, default: '' })
  text?: string;

  @Prop({ type: [AttachmentSchema], default: [] })
  attachments?: Attachment[];

  // read receipts: user ids who have read the message
  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  readBy?: Types.ObjectId[];

  // reactions: { userId, emoji }
  @Prop({ type: [{ user: { type: Types.ObjectId, ref: 'User' }, emoji: String }], default: [] })
  reactions?: { user: Types.ObjectId; emoji: string }[];

  @Prop({ type: Boolean, default: false })
  pinned?: boolean;

  @Prop({ type: Date, default: Date.now })
  createdAt?: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

@Schema({ timestamps: true })
export class Club {
  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: String, default: '' })
  description?: string;

  // owner/creator
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner!: Types.ObjectId;

  // members (user ids)
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  members?: Types.ObjectId[];

  // allow public join or invite-only
  @Prop({ type: Boolean, default: true })
  isPublic?: boolean;

  // optional tags/categories
  @Prop({ type: [String], default: [] })
  tags?: string[];

  // messages (embedded for faster retrieval). If you expect millions of messages, move to separate collection.
  @Prop({ type: [MessageSchema], default: [] })
  messages?: Message[];

  // group type: club, class, private, announcement
  @Prop({ type: String, default: 'club' })
  kind?: string;

  @Prop({ type: Date, default: Date.now })
  createdAt?: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt?: Date;
}

export const ClubSchema = SchemaFactory.createForClass(Club);
