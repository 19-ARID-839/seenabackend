import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

@Schema({ timestamps: true })
export class FeeChallan {
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Institute", required: true })
  institute!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  student!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "StudentFinance", required: true })
  studentFinance!: Types.ObjectId;

  @Prop({ required: true })
  academicYear!: string;

  @Prop({
    type: {
      type: { type: String, enum: ["monthly", "manual"], required: true },
      month: Number,
      label: String, // "Jan 2026", "Admission Fee"
    },
  })
  period!: {
    type: "monthly" | "manual";
    month?: number;
    label?: string;
  };

  @Prop({
    type: {
      admissionFee: Number,
      tuitionFee: Number,
      examFeePerTerm: Number,
      transportFee: {
        enabled: Boolean,
        amount: Number,
      },
    },
  })
  feeSnapshot: any;

  @Prop({
    type: {
      perDay: Number,
      maxCap: Number,
      currentAmount: { type: Number, default: 0 },
    },
  })
  fine: any;

  @Prop({ required: true })
  totalPayable!: number;

  @Prop({ default: 0 })
  totalPaid!: number;

  @Prop({ required: true })
  outstanding!: number;

  @Prop({
    enum: ["pending", "partial", "paid", "overdue"],
    default: "pending",
  })
  status!: string;

  @Prop({ type: Date })
  dueDate!: Date;

  @Prop({ default: false })
  locked!: boolean;
}

export const FeeChallanSchema = SchemaFactory.createForClass(FeeChallan);
