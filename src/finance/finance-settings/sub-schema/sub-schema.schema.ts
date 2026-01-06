

/** ---------- Sub-Schemas ---------- **/

import { Prop, SchemaFactory, Schema } from "@nestjs/mongoose";


@Schema()
export class AnnualCharges {
  @Prop() libraryFee?: number;
  @Prop() labFee?: number;
  @Prop() activityFee?: number;
  @Prop() sportsFee?: number;
}
export const AnnualChargesSchema = SchemaFactory.createForClass(AnnualCharges);

@Schema()
export class TransportFee {
  @Prop() enabled!: boolean;
  @Prop() amount?: number;
}
export const TransportFeeSchema = SchemaFactory.createForClass(TransportFee);

@Schema()
export class LateFee {
  @Prop({ enum: ["fixed", "perDay"] }) type!: "fixed" | "perDay";
  @Prop() amount!: number;
  @Prop() maxCap?: number;
}
export const LateFeeSchema = SchemaFactory.createForClass(LateFee);

@Schema()
export class ClassFeeRule {
  @Prop() className!: string;
  @Prop() admissionFee!: number;
  @Prop() tuitionFee!: number;
  @Prop({ enum: ["monthly", "term-wise", "yearly"] }) billingFrequencyOverride?: string;
  @Prop() examFeePerTerm?: number;
  @Prop({ type: AnnualChargesSchema }) annualCharges?: AnnualCharges;
  @Prop({ type: TransportFeeSchema }) transportFee?: TransportFee;
  @Prop({ type: LateFeeSchema }) lateFee?: LateFee;
}
export const ClassFeeRuleSchema = SchemaFactory.createForClass(ClassFeeRule);

@Schema()
export class AttendanceImpact {
  @Prop() deductOnAbsence!: boolean;
  @Prop() perDayDeduction?: number;
  @Prop() lateArrivalPenalty?: number;
}
export const AttendanceImpactSchema = SchemaFactory.createForClass(AttendanceImpact);

@Schema()
export class LeavePolicy {
  @Prop() paidLeavesPerMonth!: number;
  @Prop() unpaidLeaveAfter!: number;
}
export const LeavePolicySchema = SchemaFactory.createForClass(LeavePolicy);

@Schema()
export class OvertimePolicy {
  @Prop() enabled!: boolean;
  @Prop() ratePerHour!: number;
}
export const OvertimePolicySchema = SchemaFactory.createForClass(OvertimePolicy);

@Schema()
export class StaffPayrollRule {
  @Prop() role!: string;
  @Prop({ enum: ["fixed", "hourly"] }) salaryType!: "fixed" | "hourly";
  @Prop() baseSalary?: number;
  @Prop() hourlyRate?: number;
  @Prop({ type: AttendanceImpactSchema }) attendanceImpact!: AttendanceImpact;
  @Prop({ type: LeavePolicySchema }) leavePolicy!: LeavePolicy;
  @Prop({ type: OvertimePolicySchema }) overtimePolicy?: OvertimePolicy;
}
export const StaffPayrollRuleSchema = SchemaFactory.createForClass(StaffPayrollRule);

@Schema()
export class FineRule {
  @Prop() code!: string;
  @Prop() title!: string;
  @Prop() amount!: number;
  @Prop({ enum: ["student", "staff"] }) appliesTo!: "student" | "staff";
  @Prop({ enum: ["once", "daily", "monthly"] }) frequency!: "once" | "daily" | "monthly";
  @Prop() autoApply!: boolean;
  @Prop() maxCap?: number;
  @Prop({ enum: ["lateFee", "absence", "discipline", "library", "custom"] }) trigger!: string;
}
export const FineRuleSchema = SchemaFactory.createForClass(FineRule);

@Schema()
export class BankAccount {
  @Prop() title!: string;
  @Prop() accountNumber!: string;
  @Prop() bankName!: string;
}
export const BankAccountSchema = SchemaFactory.createForClass(BankAccount);

@Schema()
export class ReceiptNumbering {
  @Prop() prefix!: string;
  @Prop() startFrom!: number;
}
export const ReceiptNumberingSchema = SchemaFactory.createForClass(ReceiptNumbering);

@Schema()
export class PaymentSettings {
  @Prop({ type: [String] }) allowedMethods!: ("cash" | "bank" | "online" | "mobile_wallet" | "cheque")[];
  @Prop({ type: [BankAccountSchema], default: [] }) bankAccounts?: BankAccount[];
  @Prop({ type: ReceiptNumberingSchema }) receiptNumbering!: ReceiptNumbering;
}
export const PaymentSettingsSchema = SchemaFactory.createForClass(PaymentSettings);

@Schema()
export class GlobalRules {
  @Prop() currency!: string;
  @Prop({ enum: ["up", "down", "nearest"] }) roundingStrategy!: "up" | "down" | "nearest";
  @Prop() admissionFeeMandatory!: boolean;
  @Prop() transportOptional!: boolean;
  @Prop() allowFeeEditAfterGeneration!: boolean;
}
export const GlobalRulesSchema = SchemaFactory.createForClass(GlobalRules);