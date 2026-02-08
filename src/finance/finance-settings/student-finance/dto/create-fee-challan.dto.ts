export class CreateFeeChallanDto {
  studentId!: string;

  studentFinanceId!: string;

  type!: string;

  month?: number;

  label?: string;

  dueDate!: Date;

  include!: {
    admissionFee?: boolean;
    tuitionFee?: boolean;
    examFee?: boolean;
    transportFee?: boolean;
  };
}
