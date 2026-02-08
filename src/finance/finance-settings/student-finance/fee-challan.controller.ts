import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { FeeChallanService } from "./fee-challan.service";
import { CreateFeeChallanDto } from "./dto/create-fee-challan.dto";
import { GetFeeChallanQueryDto } from "./dto/get-fee-challan-query.dto";
import { PayFeeChallanDto } from "./dto/pay-challan.dto";

@UseGuards(JwtAuthGuard)
@Controller("finance/fee-challans")
export class FeeChallanController {
  constructor(private readonly service: FeeChallanService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateFeeChallanDto) {
    console.log("📥 Fee Challan Payload:", {
      institute: req.user.institute,
      user: req.user.sub,
      dto,
    });

    return this.service.createForStudent(
      req.user.institute,
      dto
    );
  }

    // ✅ NEW: get fee challans with filters
  // @Get()
  // findAll(
  //   @Req() req: any,
  //   @Query() query: GetFeeChallanQueryDto,
  // ) {
  //   return this.service.findAll(
  //     req.user.institute,
  //     query,
  //   );
  // }

    // 🔹 GET ALL challans (institute scoped)
  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.user.institute);
  }

  // 🔹 GET ONE challan by ID
  @Get(":id")
  findOne(@Req() req: any, @Param("id") id: string) {
    return this.service.findOne(req.user.institute, id);
  }

    @Post("pay")
  pay(
    @Req() req: any,
    @Body() dto: PayFeeChallanDto,
  ) {
    return this.service.payChallan(
      req.user.institute,
      req.user,
      dto,
    );
  }

  
}
