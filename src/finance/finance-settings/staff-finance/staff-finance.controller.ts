import {
  Controller,
  Get,
  Req,
  Patch,
  Param,
  Body,
  UseGuards,
  Post,
} from "@nestjs/common";

import { StaffFinanceService } from "./staff-finance.service";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { CreateSalaryChallanDto } from "./dto/create-salary-challan.dto";

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
    @Req() req: any,
  ) {
    return this.service.updateById(req.user.institute, id, body);
  }

  @Post("challans")
  create(@Req() req: any, @Body() dto: CreateSalaryChallanDto) {
    return this.service.create(req.user.institute, dto);
  }

  @Get("challans")
  getAllChallan(@Req() req: any) {
    return this.service.getAllChallan(req.user.institute);
  }

    @Post("pay/:challanId")
  async paySalary(
    @Req() req: any,
    @Param("challanId") challanId: string,
    @Body() body: { method?: "cash" | "bank"; extraAmount?: number }
  ) {
    return this.service.payChallan(
      req.user.institute,
      challanId,
      body.method || "cash",
      body.extraAmount || 0
    );
  }
}
