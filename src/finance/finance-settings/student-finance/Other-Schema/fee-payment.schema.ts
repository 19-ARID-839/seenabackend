import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

@Schema({ timestamps: true })
export class FeePayment {
  _id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Institute", required: true })
  institute!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "FeeChallan", required: true })
  challan!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  student!: Types.ObjectId;

  // who paid
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  payer!: Types.ObjectId;

  @Prop({ enum: ["admin", "parent"], required: true })
  payerRole!: "admin" | "parent";

  @Prop({ enum: ["cash", "bank", "online"], required: true })
  method!: string;

  // amount breakup
  @Prop({ required: true })
  baseAmount!: number;

  @Prop({ default: 0 })
  additionalFine!: number;

  @Prop({ required: true })
  totalPaid!: number;

  // dummy transaction ref (for parent)
  @Prop()
  transactionRef?: string;

  @Prop({
    enum: ["success", "failed"],
    default: "success",
  })
  status!: string;
}

export const FeePaymentSchema =
  SchemaFactory.createForClass(FeePayment);
