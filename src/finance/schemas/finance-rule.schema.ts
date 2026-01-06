import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class FinanceRule extends Document {
  @Prop({ required: true })
  type!: "class_fee" | "role_salary" | "fine" | "transport" ;

  @Prop()
  className?: string;

  @Prop()
  role?: string;

  @Prop({ required: true })
  baseAmount!: number;

  @Prop()
  maxAmount?: number;

  @Prop()
  minAmount?: number;

  @Prop({ type: Object, default: {} })
  meta?: Record<string, any>;

  @Prop({ default: true })
  active!: boolean;
}

export const FinanceRuleSchema = SchemaFactory.createForClass(FinanceRule);
