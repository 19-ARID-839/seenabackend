// src/tasks/task.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TaskDocument = Task & Document;

export enum TaskStatus {
  IN_PROGRESS = 'In Progress',
  DELAYED = 'Delayed',
  COMPLETED = 'Completed',
  SUBMITTED = 'Submitted',
  AWAITING_APPROVAL = 'Awaiting Approval',
}

export enum Priority {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
}

@Schema({ timestamps: true })
export class Attachment {
  @Prop({ type: String, required: true }) url!: string;
  @Prop({ type: String }) filename?: string;
  @Prop({ type: String }) mimeType?: string;
  @Prop({ type: Number }) size?: number;
  @Prop({ type: Types.ObjectId, ref: 'User' }) uploadedBy?: Types.ObjectId;
  @Prop({ type: Date, default: Date.now }) uploadedAt?: Date;
}
export const AttachmentSchema = SchemaFactory.createForClass(Attachment);

@Schema()
export class Submission {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  submittedBy!: Types.ObjectId;

  @Prop({ type: [AttachmentSchema], default: [] })
  attachments?: Attachment[];

  @Prop({ type: String }) comment?: string;
  @Prop({ type: Date, default: Date.now }) submittedAt?: Date;
  @Prop({ type: Boolean, default: false }) approved?: boolean;
}
export const SubmissionSchema = SchemaFactory.createForClass(Submission);

@Schema()
export class Task {
  @Prop({ type: String, required: true }) title!: string;
  @Prop({ type: String, default: '' }) description?: string;

  // who created/assigned the task
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  assignedBy!: Types.ObjectId;

  // list of users (students/teachers/admins) that this task is assigned to
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  assignedTo?: Types.ObjectId[];

  @Prop({ type: String, enum: Object.values(Priority), default: Priority.MEDIUM })
  priority?: Priority;

  @Prop({ type: String, enum: Object.values(TaskStatus), default: TaskStatus.IN_PROGRESS })
  status?: TaskStatus;

  @Prop({ type: Number, default: 0 }) // 0 - 100
  progress?: number;

  @Prop({ type: Date, default: Date.now })
  startDate?: Date;

  @Prop({ type: Date })
  dueDate?: Date;

  @Prop({ type: [AttachmentSchema], default: [] })
  attachments?: Attachment[];

  @Prop({ type: [SubmissionSchema], default: [] })
  submissions?: Submission[];

  @Prop({ type: Boolean, default: false })
  approved?: boolean;

  // scope: school / institute id (so tasks are scoped to institute)
  @Prop({ type: Types.ObjectId, ref: 'Institute' })
  institute?: Types.ObjectId;

  // optional: visible only for assigned users
  @Prop({ type: Boolean, default: true })
  visibleToAssignedOnly?: boolean;

  @Prop({ type: Date, default: Date.now })
  createdAt?: Date;
}
export const TaskSchema = SchemaFactory.createForClass(Task);
