import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  sender!: Types.ObjectId; // ✅ added "!" to tell TS this will always be set

  @Prop({ type: Types.ObjectId, ref: "User" })
  receiver?: Types.ObjectId; // optional

  @Prop({ type: Types.ObjectId, ref: "Institute", required: true })
  institute!: Types.ObjectId;

  @Prop({
    type: String,
    enum: [
      "absence",
      "late",
      "general",
      "feereminder",
      "announcement",
      "complaint",
      "leave_request",
      "leave",
      "salary",
      "fee",
      "event",
      "exam",
      "other",
    ],

    default: "general",
  })
  messageType!: string;

  @Prop({
    type: String,
    enum: ["Mail", "SMS", "App", "in-app"],
    default: "App",
  })
  medium!: string;

  @Prop({ type: String, required: true })
  message!: string;

  @Prop({
    type: String,
    enum: ["sent", "failed", "pending"],
    default: "sent",
  })
  status!: string;

  @Prop({ type: Object })
  meta?: Record<string, any>;

  @Prop({ type: Boolean, default: false })
  isAnonymous?: boolean; // boolean

  @Prop({ type: String })
  receiverRole?: string; // e.g. "Admin", "Teacher"
}

export type NotificationDocument = Notification & Document;
export const NotificationSchema = SchemaFactory.createForClass(Notification);
