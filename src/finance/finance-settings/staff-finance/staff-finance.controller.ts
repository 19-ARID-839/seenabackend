import { Controller, Get, Req, Patch, Param, Body, UseGuards } from "@nestjs/common";

import { StaffFinanceService } from "./staff-finance.service";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";

@UseGuards(JwtAuthGuard) // 🔥 THIS WAS MISSING
@Controller("finance/staff")
export class StaffFinanceController {
  constructor(private readonly service: StaffFinanceService) {}

  @Get()
  async getAll(@Req() req: any) {
    return this.service.getAll(req.user.institute);
  }

  @Patch(":id")
  async updateStaffFinance(
    @Param("id") id: string,
    @Body() body: any,
    @Req() req: any
  ) {
    return this.service.updateById(req.user.institute, id, body);
  }
}
