// staff-salary-challan.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

@Schema({ timestamps: true })
export class StaffSalaryChallan {
  @Prop({ type: Types.ObjectId, ref: "Institute", required: true })
  institute!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  staff!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "StaffFinance", required: true })
  staffFinance!: Types.ObjectId;

  @Prop({ required: true })
  academicYear!: string;

  @Prop({ required: true }) // YYYY-MM
  month!: string;

  @Prop({ type: Object, required: true })
  salarySnapshot!: {
    salaryType: string;
    baseSalary: number;
  };

  @Prop({ required: true })
  grossSalary!: number;

  @Prop({ default: 0 })
  deduction!: number;

  @Prop({ required: true })
  netPayable!: number;

  @Prop({ default: "unpaid" })
  status!: "unpaid" | "paid";
}

export const StaffSalaryChallanSchema =
  SchemaFactory.createForClass(StaffSalaryChallan);
