import { Type } from "class-transformer";
import { IsString, IsNumber, IsEnum, IsOptional, ValidateNested } from "class-validator";

export class BankAccountDto {
  @IsString() title!: string;
  @IsString() accountNumber!: string;
  @IsString() bankName!: string;
}

export class ReceiptNumberingDto {
  @IsString() prefix!: string;
  @IsNumber() startFrom!: number;
}

export class PaymentSettingsDto {
  @IsEnum(["cash", "bank", "online", "mobile_wallet", "cheque"], {
    each: true,
  })
  allowedMethods!: (
    | "cash"
    | "bank"
    | "online"
    | "mobile_wallet"
    | "cheque"
  )[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BankAccountDto)
  bankAccounts?: BankAccountDto[];

  @ValidateNested()
  @Type(() => ReceiptNumberingDto)
  receiptNumbering!: ReceiptNumberingDto;
}
