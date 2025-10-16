import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LeaveRequestDocument = LeaveRequest & Document;

@Schema({ timestamps: true })
export class LeaveRequest {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Institute', required: true })
  institute!: Types.ObjectId;

  @Prop({ type: Date, required: true })
  from!: Date;

  @Prop({ type: Date, required: true })
  to!: Date;

  @Prop()
  reason?: string;

  @Prop({ required: true, enum: ['pending','approved','rejected'], default: 'pending' })
  status!: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approver?: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  meta?: any;
}

export const LeaveRequestSchema = SchemaFactory.createForClass(LeaveRequest);
