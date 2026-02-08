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
import { StudentFinanceSeeting } from "./student-finance.service";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { GenerateFeeCycleDto } from "./dto/generate-fee-cycle.dto";
@UseGuards(JwtAuthGuard) // 🔥 THIS WAS MISSING
@Controller("finance/student")
export class StudentFinanceController {
  constructor(private readonly service: StudentFinanceSeeting) {}

  @Get()
  async getAll(@Req() req: any) {
    return this.service.getAll(req.user.institute);
  }
  @Post("apply-class")
  applyClassFinance(
    @Body() body: { classId: string; sectionId: string },
    @Req() req: any
  ) {
    return this.service.applyClassFinance(
      req.user.institute,
      body.classId,
      body.sectionId
    );
  }
  @Patch(":id")
  async updateStudentFinance(
    @Param("id") id: string,
    @Body() body: any,
    @Req() req: any
  ) {
    return this.service.updateById(req.user.institute, id, body);
  }

  @Post("generate")
  async generate(@Req() req: any, @Body() dto: GenerateFeeCycleDto) {
    return this.service.generateFeeCycles(req.user.institute, dto);
  }
}
