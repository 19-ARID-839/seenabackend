import {
  Controller,
  UseGuards,
  Post,
  Body,
  Get,
  Param,
  Req,
  Patch,
} from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { FinanceService } from "./finance.service";
import { CreateFinanceOverrideDto } from "./dto/finance-override.dto";
import { CreateFinanceRuleDto } from "./dto/finance-rule.dto";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { CreateSalaryDto } from "./dto/create-salary.dto";

@Controller("finance")
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}
  

  // ---------- RULES ----------
  // ---------- CREATE RULE ----------
  @Post("rules/class-fee")
  createClassFeeRule(@Body() body: CreateFinanceRuleDto) {
    body.type = "class_fee";
    return this.financeService.createRule(body);
  }

  @Post("rules/staff-salary")
  createStaffSalaryRule(@Body() body: CreateFinanceRuleDto) {
    body.type = "role_salary";
    return this.financeService.createRule(body);
  }

  @Post("rules/fines")
  createFineRule(@Body() body: CreateFinanceRuleDto) {
    body.type = "fine";
    return this.financeService.createRule(body);
  }

  // ---------- GET RULES ----------
  @Get("rules")
  getAllRules() {
    return this.financeService.getRules();
  }

  @Get("rules/:type")
  getRulesByType(@Param("type") type: string) {
    return this.financeService.getRules(type);
  }

  // ---------- OVERRIDES ----------
  // POST /finance/override
  @Post("override")
  async createOverride(@Body() dto: CreateFinanceOverrideDto, @Req() req: any) {
    const adminId = req.user.id;
    console.log("request ==== ", req.body);
    return this.financeService.createOverride(dto, adminId);
  }

  // GET /finance/override/:userId
  @Get("override/:userId")
  async getOverridesByUser(@Param("userId") userId: string) {
    return this.financeService.getOverridesByUser(userId);
  }

  // GET /finance/override
  @Get("override")
  async getAllOverrides() {
    return this.financeService.getAllOverrides();
  }

  // ---------- PAYMENTS --------------

  @Post("payments")
  create(@Body() dto: CreatePaymentDto) {
    return this.financeService.create(dto);
  }

  // @Get("payments/student/:id")
  // getStudentPayments(@Param("id") id: string) {
  //   return this.financeService.getByStudent(id);
  // }

  @Get("payments")
getAllPayments() {
  return this.financeService.getAllPayments();
}

@Get("payments/student/:id")
getStudentPayments(@Param("id") id: string) {
  return this.financeService.getByStudent(id);
}

  // ------------ SALARY ------------------

  @Post("salaries")
  createSalary(@Body() dto: CreateSalaryDto) {
    return this.financeService.createSalary(dto);
  }

  @Patch("salaries/:id/pay")
  markPaid(@Param("id") id: string) {
    return this.financeService.markPaid(id);
  }

  @Get("salaries")
getAllSalaries() {
  return this.financeService.getAllSalaries();
}


  @UseGuards(JwtAuthGuard)
  @Get("me")
  async getMyFinance(@Req() req: any) {
    return this.financeService.getMyFinance(req.user);
  }




}
