export class RegisterDto {
  name!: string;
  email?: string;
  phone?: string;
  password!: string;
  role?: string;
  instituteCode?: string;
  instituteName?: string;
}

export class LoginDto {
  emailOrPhone!: string;
  password!: string;
}
