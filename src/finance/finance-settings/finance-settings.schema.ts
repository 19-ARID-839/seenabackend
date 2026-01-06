import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import {
  ClassFeeRuleSchema,
  ClassFeeRule,
  StaffPayrollRuleSchema,
  StaffPayrollRule,
  FineRuleSchema,
  FineRule,
  PaymentSettingsSchema,
  PaymentSettings,
  GlobalRulesSchema,
  GlobalRules,
} from "./sub-schema/sub-schema.schema";

/** ---------- Main FinanceSettings Schema ---------- **/

@Schema({ timestamps: true })
export class FinanceSettings extends Document {
  @Prop({ type: Types.ObjectId, ref: "Institute", unique: true })
  institute!: Types.ObjectId;

  @Prop({required:true})
  feeDeadline!: number

  @Prop({
    enum: [
      "monthly",
      "bi-monthly",
      "quarterly",
      "term-wise",
      "yearly",
      "installments",
      "mixed",
    ],
    required: true,
  })
  feeCollectionType!: string;

  @Prop({ default: false }) sameFeeForWholeInstitute!: boolean;

  @Prop({
    enum: [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ],
    default: "march",
  })
  academicYearStartMonth!: string;

  @Prop({ enum: ["annual", "semester", "quarter", "custom"], required: true })
  examSystem!: string;



  @Prop({ type: [ClassFeeRuleSchema], default: [] })
  classFeeRules!: ClassFeeRule[];

  @Prop({ type: [StaffPayrollRuleSchema], default: [] })
  staffPayrollRules!: StaffPayrollRule[];

  @Prop({ type: [FineRuleSchema], default: [] })
  fines!: FineRule[];

  @Prop({ type: PaymentSettingsSchema })
  paymentSettings!: PaymentSettings;

  @Prop({ type: GlobalRulesSchema })
  globalRules!: GlobalRules;
}

export const FinanceSettingsSchema =
  SchemaFactory.createForClass(FinanceSettings);

// @Schema({ timestamps: true })
// export class FinanceSettings extends Document {
//   @Prop({ type: Types.ObjectId, ref: "Institute", unique: true })
//   institute!: Types.ObjectId;

//   /** HOW FEES ARE COLLECTED */
//   @Prop({
//     enum: [
//       "monthly",
//       "bi-monthly",
//       "quarterly",
//       "term-wise",
//       "yearly",
//       "installments",
//       "mixed",
//     ],
//     required: true,
//   })
//   feeCollectionType!: string;

//   /** Fee strategy */
//   @Prop({ default: false })
//   sameFeeForWholeInstitute!: boolean;

//   /** Academic year start */
//   @Prop({
//     enum: [
//       "january",
//       "fabruary",
//       "march",
//       "april",
//       "may",
//       "june",
//       "july",
//       "august",
//       "september",
//       "october",
//       "november",
//       "december",
//     ],
//     default: "march",
//   })
//   academicYearStartMonth!: string;

//   /** EXAM SYSTEM */
//   @Prop({
//     enum: ["annual", "semester", "quarter", "custom"],
//     required: true,
//   })
//   examSystem!: string;

//   /** CLASS BASED FEES */
//   @Prop([
//     {
//       className: String,
//       admissionFee: Number,
//       tuitionFee: Number,
//       billingFrequencyOverride: String,
//       examFeePerTerm: Number,
//       annualCharges: {
//         libraryFee: Number,
//         labFee: Number,
//         activityFee: Number,
//         sportsFee: Number,
//       },
//       transportFee: {
//         enabled: Boolean,
//         amount: Number,
//       },
//       lateFee: {
//         type: String,
//         amount: Number,
//         maxCap: Number,
//       },
//     },
//   ])
//   classFeeRules!: [
//     {
//       className: string;

//       admissionFee: number;
//       tuitionFee: number;

//       billingFrequencyOverride?: "monthly" | "term-wise" | "yearly";

//       examFeePerTerm?: number;
//       annualCharges?: {
//         libraryFee?: number;
//         labFee?: number;
//         activityFee?: number;
//         sportsFee?: number;
//       };

//       transportFee?: {
//         enabled: boolean;
//         amount?: number;
//       };

//       lateFee?: {
//         type: "fixed" | "perDay";
//         amount: number;
//         maxCap?: number;
//       };
//     }
//   ];

//   @Prop([
//     {
//       role: String,

//       salaryType: {
//         type: String,
//         enum: ["fixed", "hourly"],
//       },
//       baseSalary: Number,
//       hourlyRate: Number,

//       attendanceImpact: {
//         deductOnAbsence: Boolean,
//         perDayDeduction: Number,
//         lateArrivalPenalty: Number,
//       },

//       leavePolicy: {
//         paidLeavesPerMonth: Number,
//         unpaidLeaveAfter: Number,
//       },

//       overtimePolicy: {
//         enabled: Boolean,
//         ratePerHour: Number,
//       },
//     },
//   ])
//   staffPayrollRules!: [
//     {
//       role: string;

//       salaryType: "fixed" | "hourly";
//       baseSalary?: number;
//       hourlyRate?: number;

//       attendanceImpact: {
//         deductOnAbsence: boolean;
//         perDayDeduction?: number;
//         lateArrivalPenalty?: number;
//       };

//       leavePolicy: {
//         paidLeavesPerMonth: number;
//         unpaidLeaveAfter: number;
//       };

//       overtimePolicy?: {
//         enabled: boolean;
//         ratePerHour: number;
//       };
//     }
//   ];

//   /** FINES & PENALTIES */
//   @Prop([
//     {
//       code: String,
//       title: String,
//       amount: Number,
//       appliesTo: ["student", "staff"],
//       frequency: ["once", "daily", "monthly"],
//       autoApply: Boolean,
//       maxCap: Number,
//       trigger: ["lateFee", "absence", "discipline", "library", "custom"],
//     },
//   ])
//   fines!: [
//     {
//       code: string;
//       title: string;
//       amount: number;

//       appliesTo: "student" | "staff";

//       trigger: "lateFee" | "absence" | "discipline" | "library" | "custom";

//       frequency: "once" | "daily" | "monthly";

//       autoApply: boolean;
//       maxCap?: number;
//     }
//   ];

//   /** PAYMENT SETTINGS */
//   @Prop({
//     allowedMethods: [String],
//     bankAccounts: [
//       {
//         title: String,
//         accountNumber: String,
//         bankName: String,
//       },
//     ],
//     receiptNumbering: {
//       prefix: String,
//       startFrom: Number,
//     },
//   })
//   paymentSettings!: {
//     allowedMethods: ("cash" | "bank" | "online" | "mobile_wallet" | "cheque")[];

//     bankAccounts?: {
//       title: string;
//       accountNumber: string;
//       bankName: string;
//     }[];

//     receiptNumbering: {
//       prefix: string;
//       startFrom: number;
//     };
//   };

//   /** OPTIONAL EXTRAS */
//   @Prop({
//     currency: String, // PKR, USD
//     roundingStrategy: {
//       type: String,
//       enum: ["up", "down", "nearest"],
//     },
//     admissionFeeMandatory: Boolean,
//     transportOptional: Boolean,
//     allowFeeEditAfterGeneration: Boolean,
//   })
//   globalRules!: {
//     currency: string; // PKR, USD
//     roundingStrategy: "up" | "down" | "nearest";
//     admissionFeeMandatory: boolean;
//     transportOptional: boolean;
//     allowFeeEditAfterGeneration: boolean;
//   };
// }

// export const FinanceSettingsSchema =
//   SchemaFactory.createForClass(FinanceSettings);

/** STAFF SALARY RULES */
//   @Prop([
//     {
//       role: String,
//       baseSalary: Number,
//       perDayDeduction: Number,
//       overtimeRate: Number,
//       maxLeavesAllowed: Number,
//     },
//   ])
//   staffSalaryRules!: any[];

//   /** CLASS BASED FEES */
//   @Prop([
//     {
//       className: String,
//       admissionFee: Number,
//       tuitionFee: Number,
//       examFee: Number,
//       transportFee: Number,
//       libraryFee: Number,
//       labFee: Number,
//       lateFeePerDay: Number,
//       maxDiscountPercent: Number,
//     },
//   ])
//   classFeeRules!: any[];
