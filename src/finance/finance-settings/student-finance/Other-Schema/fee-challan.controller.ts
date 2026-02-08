import { UseGuards, Controller, Post, Req, Body } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { CreateFeeChallanDto } from "../dto/create-fee-challan.dto";
import { FeeChallanService } from "../fee-challan.service";

@UseGuards(JwtAuthGuard)
@Controller("finance/fee-challans")
export class FeeChallanController {
  constructor(private readonly service: FeeChallanService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateFeeChallanDto) {
    return this.service.createForStudent(
      req.user.institute,
      dto
    );
  }
}
