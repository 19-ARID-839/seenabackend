import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true })
export class Payment extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: "User",
    required: true,
  })
  student!: Types.ObjectId;

  @Prop({ required: true })
  month!: string;

  @Prop({ required: true })
  totalAmount!: number;

  @Prop({ default: 0 })
  discount!: number;

  @Prop({ default: 0 })
  fine!: number;

  @Prop({ required: true })
  paidAmount!: number;

  @Prop({ default: "paid" })
  status!: "paid" | "pending";

  @Prop()
  receiptUrl?: string;
  
    @Prop({ required:true})
  administeredBy!: Types.ObjectId;

    @Prop({ required: true })
  institute!: Types.ObjectId;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
