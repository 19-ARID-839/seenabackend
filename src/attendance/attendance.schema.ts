import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AttendanceDocument = Attendance & Document;

@Schema({ timestamps: true })
export class Attendance extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Institute', required: true })
  institute!: Types.ObjectId;

  @Prop({ type: Date, required: true })
  date!: Date;

  @Prop({ type: String, enum: ['present', 'absent', 'pending', 'onleave'], default: 'pending' })
  status!: string;

  @Prop({ type: Boolean, default: false })
  approved!: boolean;

  @Prop({ type: Object, default: {} })
  meta: any;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;
}


export const AttendanceSchema = SchemaFactory.createForClass(Attendance);

// Ensure each user has only one record per day
AttendanceSchema.index({ user: 1, date: 1 }, { unique: true });

// Optional: Add compound index for analytics queries
AttendanceSchema.index({ institute: 1, date: -1 });
