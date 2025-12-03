// src/classes/schema/class.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true })
export class Class extends Document {
  @Prop({ type: Types.ObjectId, ref: "Institute", required: true })
  institute!: Types.ObjectId;

  @Prop({ required: true })
  name!: string; // e.g. "Grade 6" or "10th"
@Prop({
  type: [
    {
      name: { type: String, required: true },
      teacher: { type: Types.ObjectId, ref: "User" },
      students: [{ type: Types.ObjectId, ref: "User" }], // 👈 tell Mongoose about it
    },
  ],
  default: [],
})
sections!: {
  name: string;
  teacher?: Types.ObjectId;
  students: Types.ObjectId[];
}[];

}

export const ClassSchema = SchemaFactory.createForClass(Class);
