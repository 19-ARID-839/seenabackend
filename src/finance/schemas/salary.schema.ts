import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true })
export class Salary extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: "User",
    required: true,
  })
  staff!: Types.ObjectId;

  @Prop({ required: true })
  month!: string; // "2025-12"

  @Prop({ required: true })
  baseSalary!: number;

  @Prop({ default: 0 })
  deductions!: number;

  @Prop({ default: 0 })
  allowance!: number;

  @Prop({ required: true })
  netSalary!: number;

  @Prop({ default: "pending" })
  status!: "paid" | "pending";

  @Prop({ required:true})
  administeredBy!: Types.ObjectId;

  @Prop({ required: true })
  institute!: Types.ObjectId;
}

export const SalarySchema = SchemaFactory.createForClass(Salary);
