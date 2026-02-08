import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true })
export class StaffFinance {

  @Prop({ type: Types.ObjectId, ref: "Institute", required: true })
  institute!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  staff!: Types.ObjectId;

  @Prop({ required: true })
  academicYear!: string;

  @Prop({ default: false })
  customized!: boolean;

  @Prop({ default: false })
  locked!: boolean;

  @Prop({
    type: {
      salaryType: { type: String, enum: ["fixed", "hourly"], default: "fixed" },
      baseSalary: { type: Number, required: true },

      attendanceImpact: {
        deductOnAbsence: { type: Boolean, default: true },
        perDayDeduction: { type: Number, default: 0 },
      },

      leavePolicy: {
        unpaidLeaveAfter: { type: Number, default: 0 },
      },

      overtimePolicy: {
        enabled: { type: Boolean, default: false },
        ratePerHour: { type: Number, default: 0 },
      },
    },
    required: true,
  })
  payroll!: {
    salaryType: "fixed" | "hourly";
    baseSalary: number;
    attendanceImpact: {
      deductOnAbsence: boolean;
      perDayDeduction: number;
    };
    leavePolicy: {
      unpaidLeaveAfter: number;
    };
    overtimePolicy: {
      enabled: boolean;
      ratePerHour: number;
    };
  };

  @Prop({
    type: {
      totalPayable: { type: Number, default: 0 },
      totalPaid: { type: Number, default: 0 },
      outstanding: { type: Number, default: 0 },
      payments: [
        {
          amount: Number,
          date: Date,
          method: String,
          ref: String,
        },
      ],
    },
    default: () => ({}),
  })
  ledger!: {
    totalPayable: number;
    totalPaid: number;
    outstanding: number;
    payments: any[];
  };

  @Prop({
    type: {
      appliedFrom: { type: String, enum: ["role-rule", "manual"], default: "manual" },
    },
  })
  source!: {
    appliedFrom: "role-rule" | "manual";
  };
}

export type StaffFinanceDocument = StaffFinance & Document;
export const StaffFinanceSchema = SchemaFactory.createForClass(StaffFinance);
