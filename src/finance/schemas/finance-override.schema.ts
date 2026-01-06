import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true })
export class FinanceOverride extends Document {


@Prop({ type: Types.ObjectId, ref: "User", required: true })
user!: Types.ObjectId;

@Prop({ required: true })
role!: string;

@Prop({ default: false })
isSpecial!: boolean;

@Prop()
reason?: string;

@Prop({ type: Types.ObjectId, ref: "User" })
approvedBy?: Types.ObjectId;

@Prop({ type: Types.ObjectId, ref: "FinanceRule" })
ruleRef?: Types.ObjectId;

@Prop({ type: Object, default: {} })
meta?: Record<string, any>;

}

export const FinanceOverrideSchema =
  SchemaFactory.createForClass(FinanceOverride);
