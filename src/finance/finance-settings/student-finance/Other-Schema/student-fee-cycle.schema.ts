import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

@Schema({ timestamps: true })
export class StudentFeeCycle {
  @Prop({ type: Types.ObjectId, ref: "Institute", required: true })
  institute!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  student!: Types.ObjectId;

  @Prop({ required: true })
  academicYear!: string;

  @Prop({
    type: {
      type: { type: String, enum: ["monthly", "quarterly"], required: true },
      month: { type: Number },     // 1–12
      quarter: { type: Number },   // 1–4
    },
    required: true,
  })
  period!: {
    type: "monthly" | "quarterly";
    month?: number;
    quarter?: number;
  };

  @Prop({ required: true })
  dueDate!: Date;

  @Prop({ required: true })
  baseAmount!: number;

  @Prop({
    type: {
      perDay: Number,
      maxCap: Number,
      currentAmount: { type: Number, default: 0 },
    },
  })
  fine!: {
    perDay: number;
    maxCap: number;
    currentAmount: number;
  };

  @Prop({ required: true })
  totalPayable!: number;

  @Prop({ default: 0 })
  totalPaid!: number;

  @Prop({ required: true })
  outstanding!: number;

  @Prop({
    type: String,
    enum: ["pending", "partial", "paid", "overdue"],
    default: "pending",
  })
  status!: string;

  @Prop({ default: false })
  locked!: boolean;

  @Prop({
    type: {
      remindersSent: [{ type: Number }],
      lastNotifiedAt: Date,
    },
    default: { remindersSent: [] },
  })
  notifications!: {
    remindersSent: number[];
    lastNotifiedAt?: Date;
  };
}

export const StudentFeeCycleSchema =
  SchemaFactory.createForClass(StudentFeeCycle);

// 🔥 Prevent duplicate challans
StudentFeeCycleSchema.index(
  {
    student: 1,
    academicYear: 1,
    "period.type": 1,
    "period.month": 1,
  },
  { unique: true }
);
