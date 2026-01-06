import { Controller, Post, Body, Req, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto, LoginDto, CreateInstituteDto } from "./dto/auth.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { Request } from "express";


@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('registerdirector')
  async registerFullInstitute(@Body() data: CreateInstituteDto) {
    return this.authService.registerFullInstitute(data);
  }


// @Post('registerdirector')
// async registerFullInstitute(@Body() data: CreateInstituteDto) {
//   return this.authService.registerFullInstitute(data);
// }


  // @Post("register")
  // async registerFullInstitute(@Body() data: CreateInstituteDto) {
  //   return this.authService.registerFullInstitute(data);
  // }

  @Post("register-user")
  async registerUser(@Body() data: CreateInstituteDto) {
    return this.authService.userRegister(data);
  }

  @Post("login")
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.emailOrPhone, body.password);
  }
  

  @Post("refresh")
  async refresh(@Body() body: { userId: string; refreshToken: string }) {
    return this.authService.refresh(body.userId, body.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post("me")
  me(@Req() req: Request) {
    return (req as any).user;
  }

  
}
