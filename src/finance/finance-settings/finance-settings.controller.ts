import {
  Controller,
  UseGuards,
  Post,
  Req,
  Body,
  Get,
  Param,
  Patch,
} from "@nestjs/common";
// import { AuthGuard } from "@nestjs/passport";
// import { ClassFeeRuleDto } from "./finance-settings.dto";
import { ClassFeeRuleDto } from "./dto/ClassFeeRuleDto";
import { CreateFinanceSettingsDto } from "./dto/CreateFinanceSettingsDto";
import { FinanceSettingsService } from "./finance-settings.service";
import { GlobalRulesDto } from "./dto/GlobalRulesDto";
import { FineRuleDto } from "./dto/FineRuleDto";
import { PaymentSettingsDto } from "./dto/PaymentSettingsDto";
import { StaffPayrollRuleDto } from "./dto/StaffPayrollRuleDto";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { StudentFinanceSeeting } from "./student-finance/student-finance.service";
console.log("CreateFinanceSettingsDto:", CreateFinanceSettingsDto);
console.log("ClassFeeRuleDto:", ClassFeeRuleDto);
console.log("StaffPayrollRuleDto:", StaffPayrollRuleDto);

@Controller("finance-settings")
@UseGuards(JwtAuthGuard)
export class FinanceSettingsController {
  constructor(
    private readonly service: FinanceSettingsService,
    private readonly studentservice: StudentFinanceSeeting
  ) {}

  @Post()
  save(@Req() req: any, @Body() dto: CreateFinanceSettingsDto) {
    return this.service.save(req.user.institute, dto);
  }

  @Get()
  get(@Req() req: any) {
    return this.service.getByInstitute(req.user.institute);
  }

  // PATCH /finance-settings/general/:instituteId
  @Patch("general/:instituteId")
  updateGeneralSettings(
    @Param("instituteId") instituteId: string,
    @Body()
    dto: {
      instituteType: string;
      examSystem: string;
      feeCollectionType: string;
      academicYearStartMonth: string;
      sameFeeForWholeInstitute: boolean;
      // globalRules: GlobalRulesDto;
    }
  ) {
    return this.service.updateGeneralSettings(instituteId, dto);
  }

  // PATCH /finance-settings/fees/:instituteId
  @Patch("fees/:instituteId")
  updateFeeRules(
    @Req() req: any,
    @Param("instituteId") instituteId: string,
    @Body()
    dto: {
      sameFeeForWholeInstitute: boolean;
      classFeeRules: ClassFeeRuleDto[];
    }
  ) {
    // console.log("Class Dto:: ", dto);
    console.log("Request payload: ", req.body);
    return this.service.updateFeeRules(instituteId, dto);
  }

  // PATCH /finance-settings/staff-payroll/:instituteId
  @Patch("staff-payroll/:instituteId")
  updateStaffPayroll(
    @Req() req: any,
    @Param("instituteId") instituteId: string,
    @Body() dto: StaffPayrollRuleDto[]
  ) {
    console.log("Request payload: ", req.body);

    return this.service.updateStaffPayrollRules(instituteId, dto);
  }

  // PATCH /finance-settings/fines/:instituteId
  @Patch("fines/:instituteId")
  updateFines(
    @Param("instituteId") instituteId: string,
    @Body() dto: FineRuleDto[]
  ) {
    return this.service.updateFines(instituteId, dto);
  }

  // PATCH /finance-settings/payment/:instituteId
  @Patch("payment/:instituteId")
  updatePaymentSettings(
    @Param("instituteId") instituteId: string,
    @Body() dto: PaymentSettingsDto
  ) {
    return this.service.updatePaymentSettings(instituteId, dto);
  }

  @Patch("global-rules/:instituteId")
  updateGlobalRules(
    @Param("instituteId") instituteId: string,
    @Body() dto: GlobalRulesDto
  ) {
    return this.service.updateGlobalRules(instituteId, dto);
  }

  @Get(":instituteId")
  getByInstitute(@Param("instituteId") instituteId: string) {
    return this.service.getByInstitute(instituteId);
  }
  @Post("init/:instituteId")
  initFinanceSettings(@Param("instituteId") instituteId: string) {
    return this.service.initFinanceSettings(instituteId);
  }

  @Post("apply/class/:classId/:sectionId")
  async applyFinanceToClass(
    @Param("classId") classId: string,
    @Param("sectionId") sectionId: string,
    @Req() req: any
  ) {
    console.log("Requst Response: ", req.body);
    const instituteId = req.user.institute;
    const result = await this.studentservice.applyClassFinance(
      instituteId,
      classId,
      sectionId
    );

    console.log("Apply result:", result);
    return result;
  }
}
