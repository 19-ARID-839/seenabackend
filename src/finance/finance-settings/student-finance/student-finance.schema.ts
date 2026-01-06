import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class StudentFinance extends Document {
  @Prop({ required: true })
  institute!: string;

  @Prop({ required: true })
  student!: string;

  @Prop({ required: true })
  classId!: string;

  @Prop({ required: true })
  sectionId!: string;

  @Prop({ required: true })
  academicYear!: string;

  @Prop({
    type: {
      tuitionFee: Number,
      admissionFee: Number,
      examFeePerTerm: Number,
      transportFee: Object,
      lateFee: Object,
      annualCharges: Object,
    },
  })
  fees!: any;

  @Prop({ default: false })
  customized!: boolean; // true if manually edited later
}

export const StudentFinanceSchema =
  SchemaFactory.createForClass(StudentFinance);
