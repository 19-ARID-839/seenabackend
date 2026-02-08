import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";


@Schema({ timestamps: true })
export class StaffAttendanceLedger {

  @Prop({ type: Types.ObjectId, ref: "Institute", required: true })
  institute!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  staff!: Types.ObjectId;

  @Prop({ required: true })
  academicYear !: string;

  @Prop({ enum: ["monthly"], default: "monthly" })
  periodType!: "monthly";

  @Prop({ required: true })
  month!: number;

  @Prop({ default: 0 })
  absentDays!: number;

  @Prop({ default: 0 })
  overtimeHours!: number;

  @Prop({ default: 0 })
  totalDeduction!: number;

  @Prop({ default: 0 })
  overtimePay!: number;

  @Prop({ default: false })
  consumedInChallan!: boolean;
}

export type StaffAttendanceLedgerDocument =
  StaffAttendanceLedger & Document;

export const StaffAttendanceLedgerSchema =
  SchemaFactory.createForClass(StaffAttendanceLedger);
