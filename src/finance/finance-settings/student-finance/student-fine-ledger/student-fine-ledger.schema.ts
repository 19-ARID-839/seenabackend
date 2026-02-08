import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

@Schema({ timestamps: true })
export class StudentFineLedger {
  @Prop({ type: Types.ObjectId, ref: "Institute", required: true })
  institute!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  user!: Types.ObjectId;

  @Prop({ required: true })
  academicYear!: string;

  @Prop({ enum: ["monthly", "semester"], required: true })
  periodType!: "monthly" | "semester";

  @Prop() month?: number;
  @Prop() term?: string;

  @Prop({ default: 0 }) absentCount!: number;
  @Prop({ default: 0 }) lateCount!: number;

  @Prop({ default: 0 }) totalFine!: number;

  @Prop({ default: false }) consumedInChallan!: boolean;
}

export const StudentFineLedgerSchema =
  SchemaFactory.createForClass(StudentFineLedger);
