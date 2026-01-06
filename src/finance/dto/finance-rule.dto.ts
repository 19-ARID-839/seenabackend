// finance-rule.dto.ts
export class CreateFinanceRuleDto {
  type!: "class_fee" | "role_salary" | "fine" | "transport";
  className?: string; // only for class_fee
  role?: string;      // only for role_salary or staff
  baseAmount?: number; // main amount
  meta?: Record<string, any>; // extra fields like examFee, transportFee, etc.
}
