// src/classes/schema/class.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";


@Schema({ timestamps: true })
export class Class extends Document {
  @Prop({ type: Types.ObjectId, ref: "Institute", required: true })
  institute!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop({
    type: [
      {
        name: { type: String, required: true },

        teachers: [
          {
            teacher: { type: Types.ObjectId, ref: "User" },
            subject: String,
            isIncharge: { type: Boolean, default: false },
          },
        ],

        students: [
          {
            student: { type: Types.ObjectId, ref: "User" },
            roles: [{ type: String }], // monitor, CR, prefect, etc.
          },
        ],
      },
    ],
    default: [],
  })
  sections!: {
    name: string;
    teachers: {
      teacher: Types.ObjectId;
      subject: string;
      isIncharge: boolean;
    }[];
    students: {
      student: Types.ObjectId;
      roles: string[];
    }[];
  }[];
}

export const ClassSchema = SchemaFactory.createForClass(Class);



// @Schema({ timestamps: true })
// export class Class extends Document {
//   @Prop({ type: Types.ObjectId, ref: "Institute", required: true })
//   institute!: Types.ObjectId;

//   @Prop({ required: true })
//   name!: string; // e.g. "Grade 6" or "10th"
// @Prop({
//   type: [
//     {
//       name: { type: String, required: true },
//       teacher: { type: Types.ObjectId, ref: "User" },
//       students: [{ type: Types.ObjectId, ref: "User" }], // 👈 tell Mongoose about it
//     },
//   ],
//   default: [],
// })
// sections!: {
//   name: string;
//   teacher?: Types.ObjectId;
//   students: Types.ObjectId[];
// }[];

// }

// export const ClassSchema = SchemaFactory.createForClass(Class);
