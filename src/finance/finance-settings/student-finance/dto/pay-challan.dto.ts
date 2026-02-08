export class PayFeeChallanDto {
  challanId!: string;

  method!: "cash" | "bank" | "online";

  additionalFine?: number;
}
