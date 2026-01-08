import { Controller, Get, Req, Patch, Param, Body, UseGuards } from "@nestjs/common";
import { StudentFinanceSeeting } from "./student-finance.service";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
@UseGuards(JwtAuthGuard) // 🔥 THIS WAS MISSING
@Controller("finance/student")
export class StudentFinanceController {
  constructor(private readonly service: StudentFinanceSeeting) {}

  @Get()
  async getAll(@Req() req: any) {
    return this.service.getAll(req.user.institute);
  }

  @Patch(":id")
  async updateStudentFinance(
    @Param("id") id: string,
    @Body() body: any,
    @Req() req: any
  ) {
    return this.service.updateById(
      req.user.institute,
      id,
      body
    );
  }
}
