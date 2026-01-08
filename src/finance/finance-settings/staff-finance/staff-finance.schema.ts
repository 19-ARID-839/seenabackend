import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true })
export class StaffFinance extends Document {
  @Prop({ type: Types.ObjectId, ref: "Institute", required: true })
  institute!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  staff!: Types.ObjectId;

  @Prop({ required: true })
  role!: string; // teacher | admin | principal | vc

  @Prop({ required: true })
  academicYear!: string;

  /** SNAPSHOT of payroll rule */
  @Prop({ type: Object, required: true })
  payroll!: {
    salaryType: string;
    baseSalary: number;
    attendanceImpact?: any;
    leavePolicy?: any;
    overtimePolicy?: any;
  };

  /** Ledger */
  @Prop({
    type: {
      totalPayable: Number,
      totalPaid: Number,
      outstanding: Number,
      payments: [Object],
    },
    default: {
      totalPayable: 0,
      totalPaid: 0,
      outstanding: 0,
      payments: [],
    },
  })
  ledger: any;

  @Prop({ default: false })
  customized!: boolean;

  @Prop({ default: false })
  locked!: boolean;

  @Prop({
    type: {
      appliedFrom: String, // role-rule
      ruleId: String,
    },
  })
  source: any;
}

export const StaffFinanceSchema =
  SchemaFactory.createForClass(StaffFinance);
