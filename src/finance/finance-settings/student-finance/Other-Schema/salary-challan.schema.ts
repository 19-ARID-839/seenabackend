import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true })
export class SalaryChallan {

  @Prop({ type: Types.ObjectId, ref: "Institute", required: true })
  institute!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  staff!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "StaffFinance", required: true })
  staffFinance!: Types.ObjectId;

  @Prop({ required: true })
  academicYear!: string;

  @Prop({
    type: {
      type: { type: String, enum: ["monthly"], default: "monthly" },
      month: Number,
      label: String,
    },
  })
  period!: {
    type: "monthly";
    month: number;
    label?: string;
  };

  @Prop({
    type: Object,
    required: true,
  })
  salarySnapshot: any;

  @Prop({
    type: {
      baseSalary: Number,
      overtimePay: Number,
      grossSalary: Number,
    },
  })
  earning!: {
    baseSalary: number;
    overtimePay: number;
    grossSalary: number;
  };

  @Prop({
    type: {
      attendanceDeduction: Number,
      totalDeduction: Number,
    },
  })
  deduction!: {
    attendanceDeduction: number;
    totalDeduction: number;
  };

  @Prop({ required: true })
  netPayable!: number;

  @Prop({ required: true })
  month!: string;
}

export type SalaryChallanDocument = SalaryChallan & Document;
export const SalaryChallanSchema = SchemaFactory.createForClass(SalaryChallan);
