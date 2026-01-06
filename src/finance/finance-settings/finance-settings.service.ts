import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CreateFinanceSettingsDto } from "./dto/CreateFinanceSettingsDto";
import { FinanceSettings } from "./finance-settings.schema";
@Injectable()
export class FinanceSettingsService {
  constructor(
    @InjectModel(FinanceSettings.name)
    private model: Model<FinanceSettings>
  ) {}

  /* ----------------------------------------
     PUBLIC METHODS
  -----------------------------------------*/

  async save(instituteId: string, dto: CreateFinanceSettingsDto) {
    this.validateBusinessRules(dto);
    this.normalizeData(dto);

    return this.model.findOneAndUpdate(
      { institute: instituteId },
      { institute: instituteId, ...dto },
      { upsert: true, new: true }
    );
  }

  async getByInstitute(instituteId: string) {
    return this.model.findOne({ institute: instituteId });
  }

  /* ----------------------------------------
     VALIDATION ORCHESTRATOR
  -----------------------------------------*/

  private validateBusinessRules(dto: CreateFinanceSettingsDto) {
    this.validateClassFeeRules(dto.classFeeRules);
    this.validateStaffPayrollRules((dto as any).staffPayrollRules);
    this.validateFines(dto.fines);
    this.validatePaymentSettings((dto as any).paymentSettings);
    this.validateExamSystem(dto);
  }

  /* ----------------------------------------
     CLASS FEES VALIDATION
  -----------------------------------------*/

  private validateClassFeeRules(rules: any[]) {
    const classNames = new Set<string>();

    for (const rule of rules) {
      if (classNames.has(rule.className)) {
        throw new BadRequestException(
          `Duplicate class fee rule for class "${rule.className}"`
        );
      }
      classNames.add(rule.className);

      if (rule.transportFee?.enabled && !rule.transportFee.amount) {
        throw new BadRequestException(
          `Transport fee amount required for class "${rule.className}"`
        );
      }

      if (rule.lateFee) {
        if (rule.lateFee.amount <= 0) {
          throw new BadRequestException(
            `Late fee amount must be greater than 0 for class "${rule.className}"`
          );
        }

        if (rule.lateFee.maxCap && rule.lateFee.maxCap < rule.lateFee.amount) {
          throw new BadRequestException(
            `Late fee maxCap cannot be less than amount for class "${rule.className}"`
          );
        }
      }
    }
  }

  /* ----------------------------------------
     STAFF PAYROLL VALIDATION
  -----------------------------------------*/

  private validateStaffPayrollRules(rules: any[]) {
    const roles = new Set<string>();

    for (const rule of rules) {
      if (roles.has(rule.role)) {
        throw new BadRequestException(
          `Duplicate payroll rule for role "${rule.role}"`
        );
      }
      roles.add(rule.role);

      if (rule.salaryType === "fixed" && !rule.baseSalary) {
        throw new BadRequestException(
          `Base salary required for fixed salary role "${rule.role}"`
        );
      }

      if (rule.salaryType === "hourly" && !rule.hourlyRate) {
        throw new BadRequestException(
          `Hourly rate required for hourly salary role "${rule.role}"`
        );
      }

      if (
        rule.attendanceImpact?.deductOnAbsence &&
        !rule.attendanceImpact.perDayDeduction
      ) {
        throw new BadRequestException(
          `Per-day deduction required when absence deduction is enabled for "${rule.role}"`
        );
      }

      if (rule.leavePolicy.unpaidLeaveAfter < 0) {
        throw new BadRequestException(
          `Invalid unpaidLeaveAfter for role "${rule.role}"`
        );
      }
    }
  }

  /* ----------------------------------------
     FINES VALIDATION
  -----------------------------------------*/

  private validateFines(fines: any[]) {
    const codes = new Set<string>();

    for (const fine of fines) {
      if (codes.has(fine.code)) {
        throw new BadRequestException(`Duplicate fine code "${fine.code}"`);
      }
      codes.add(fine.code);

      if (fine.amount <= 0) {
        throw new BadRequestException(
          `Fine amount must be greater than zero (${fine.code})`
        );
      }

      if (fine.maxCap && fine.maxCap < fine.amount) {
        throw new BadRequestException(
          `Fine maxCap cannot be less than amount (${fine.code})`
        );
      }
    }
  }

  /* ----------------------------------------
     PAYMENT SETTINGS VALIDATION
  -----------------------------------------*/

  private validatePaymentSettings(settings: any) {
    if (
      settings.allowedMethods.includes("bank") &&
      (!settings.bankAccounts || settings.bankAccounts.length === 0)
    ) {
      throw new BadRequestException(
        `At least one bank account is required when bank payment is enabled`
      );
    }

    if (settings.receiptNumbering.startFrom < 0) {
      throw new BadRequestException(
        `Receipt numbering start value must be >= 0`
      );
    }
  }

  /* ----------------------------------------
     EXAM SYSTEM CONSISTENCY
  -----------------------------------------*/

  private validateExamSystem(dto: CreateFinanceSettingsDto) {
    if (
      dto.examSystem === "annual" &&
      dto.classFeeRules.some((r: any) => r.examFeePerTerm)
    ) {
      throw new BadRequestException(
        `examFeePerTerm is not allowed for annual exam system`
      );
    }
  }

  /* ----------------------------------------
     NORMALIZATION (DEFAULTS & CLEANUP)
  -----------------------------------------*/

  private normalizeData(dto: CreateFinanceSettingsDto) {
    dto.classFeeRules.forEach((r: any) => {
      if (
        typeof r.transportFee === "object" &&
        r.transportFee !== null &&
        !(r.transportFee as any).enabled
      ) {
        delete r.transportFee;
      }
      if (!r.lateFee) {
        delete r.lateFee;
      }
    });

    (dto as any).staffPayrollRules.forEach((r: any) => {
      if (!(r.overtimePolicy as any)?.enabled) {
        delete r.overtimePolicy;
      }
    });
  }

  /* ----------------------------------------
     UPDATE METHODS
  -----------------------------------------*/

  // async updateFeeRules(
  //   instituteId: string,
  //   dto: { sameFeeForWholeInstitute: boolean; classFeeRules: any[] }
  // ) {
  //   console.log("Updating fee rules with DTO:", dto);

  //   const institute = await this.model.findOne({ institute: instituteId });
  //   if (!institute) throw new Error("Institute not found");

  //   const updatedRules = [...institute.classFeeRules];

  //   for (const rule of dto.classFeeRules) {
  //     const index = updatedRules.findIndex((r) => r.className === rule.className);
  //     if (index > -1) {
  //       // Update existing class
  //       updatedRules[index] = { ...updatedRules[index], ...rule };
  //     } else {
  //       // Add new class
  //       updatedRules.push(rule);
  //     }
  //   }

  //   return this.model.findOneAndUpdate(
  //     { institute: instituteId },
  //     { $set: { sameFeeForWholeInstitute: dto.sameFeeForWholeInstitute, classFeeRules: updatedRules } },
  //     { new: true }
  //   );
  // }

  // async updateFeeRules(
  //   instituteId: string,
  //   dto: { sameFeeForWholeInstitute: boolean; classFeeRules: any[] }
  // ) {
  //   for (const rule of dto.classFeeRules) {
  //     const result = await this.model.updateOne(
  //       {
  //         institute: instituteId,
  //         "classFeeRules.className": rule.className,
  //       },
  //       {
  //         $set: {
  //           "classFeeRules.$.tuitionFee": rule.tuitionFee,
  //           "classFeeRules.$.admissionFee": rule.admissionFee,
  //           "classFeeRules.$.examFeePerTerm": rule.examFeePerTerm,
  //           sameFeeForWholeInstitute: dto.sameFeeForWholeInstitute,
  //         },
  //       }
  //     );

  //     // If class does not exist → insert
  //     if (result.matchedCount === 0) {
  //       await this.model.updateOne(
  //         { institute: instituteId },
  //         {
  //           $push: { classFeeRules: rule },
  //           $set: {
  //             sameFeeForWholeInstitute: dto.sameFeeForWholeInstitute,
  //           },
  //         }
  //       );
  //     }
  //   }

  //   return this.model.findOne({ institute: instituteId });
  // }
  async updateFeeRules(
  instituteId: string,
  dto: { sameFeeForWholeInstitute: boolean; classFeeRules: any[] }
) {
  for (const rule of dto.classFeeRules) {
    const updatePayload: any = {};

    for (const [key, value] of Object.entries(rule)) {
      if (key !== "_id" && key !== "className") {
        updatePayload[`classFeeRules.$.${key}`] = value;
      }
    }

    const result = await this.model.updateOne(
      {
        institute: instituteId,
        "classFeeRules.className": rule.className,
      },
      {
        $set: {
          ...updatePayload,
          sameFeeForWholeInstitute: dto.sameFeeForWholeInstitute,
        },
      }
    );

    // INSERT if not found
    if (result.matchedCount === 0) {
      await this.model.updateOne(
        { institute: instituteId },
        {
          $push: { classFeeRules: rule },
          $set: { sameFeeForWholeInstitute: dto.sameFeeForWholeInstitute },
        }
      );
    }
  }

  return this.model.findOne({ institute: instituteId });
}

async updateStaffPayrollRules(instituteId: string, rules: any[]) {
  for (const rule of rules) {
    const updatePayload: any = {};

    for (const [key, value] of Object.entries(rule)) {
      if (key !== "_id" && key !== "role") {
        updatePayload[`staffPayrollRules.$.${key}`] = value;
      }
    }

    const result = await this.model.updateOne(
      {
        institute: instituteId,
        "staffPayrollRules.role": rule.role,
      },
      { $set: updatePayload }
    );

    if (result.matchedCount === 0) {
      await this.model.updateOne(
        { institute: instituteId },
        { $push: { staffPayrollRules: rule } }
      );
    }
  }

  return this.model.findOne({ institute: instituteId });
}

async updateFines(instituteId: string, fines: any[]) {
  for (const fine of fines) {
    const updatePayload: any = {};

    for (const [key, value] of Object.entries(fine)) {
      if (key !== "_id" && key !== "trigger") {
        updatePayload[`fines.$.${key}`] = value;
      }
    }

    const result = await this.model.updateOne(
      {
        institute: instituteId,
        "fines.trigger": fine.trigger,
      },
      { $set: updatePayload }
    );

    if (result.matchedCount === 0) {
      await this.model.updateOne(
        { institute: instituteId },
        { $push: { fines: fine } }
      );
    }
  }

  return this.model.findOne({ institute: instituteId });
}


  // async updateStaffPayrollRules(instituteId: string, rules: any[]) {
  //   for (const rule of rules) {
  //     const result = await this.model.updateOne(
  //       {
  //         institute: instituteId,
  //         "staffPayrollRules.role": rule.role,
  //       },
  //       {
  //         $set: {
  //           "staffPayrollRules.$.salaryType": rule.salaryType,
  //           "staffPayrollRules.$.baseSalary": rule.baseSalary,
  //         },
  //       }
  //     );

  //     if (result.matchedCount === 0) {
  //       await this.model.updateOne(
  //         { institute: instituteId },
  //         { $push: { staffPayrollRules: rule } }
  //       );
  //     }
  //   }

  //   return this.model.findOne({ institute: instituteId });
  // }

  // async updateFines(instituteId: string, fines: any[]) {
  //   for (const fine of fines) {
  //     const result = await this.model.updateOne(
  //       {
  //         institute: instituteId,
  //         "fines.trigger": fine.trigger,
  //       },
  //       {
  //         $set: {
  //           "fines.$.title": fine.title,
  //           "fines.$.amount": fine.amount,
  //           "fines.$.appliesTo": fine.appliesTo,
  //           "fines.$.frequency": fine.frequency,
  //           "fines.$.trigger": fine.trigger,
  //         },
  //       }
  //     );

  //     if (result.matchedCount === 0) {
  //       await this.model.updateOne(
  //         { institute: instituteId },
  //         { $push: { fines: fine } }
  //       );
  //     }
  //   }

  //   return this.model.findOne({ institute: instituteId });
  // }

  async updatePaymentSettings(instituteId: string, settings: any) {
    console.log("Updating payment settings with:", settings);

    return this.model.findOneAndUpdate(
      { institute: instituteId },
      {
        $set: {
          paymentSettings: settings,
        },
      },
      { new: true }
    );
  }

  async updateGeneralSettings(instituteId: string, dto: any) {
    console.log("Updating general settings with DTO:", dto);

    return this.model.findOneAndUpdate(
      { institute: instituteId },
      {
        $set: {
          feeCollectionType: dto.feeCollectionType,
          examSystem: dto.examSystem,
          globalRules: dto.globalRules,
          feeDeadline: dto.feeDeadline,
        },
      },
      { new: true }
    );
  }

  async updateGlobalRules(instituteId: string, globalRules: any) {
    console.log("Updating global rules with:", globalRules);
    return this.model.findOneAndUpdate(
      { institute: instituteId },
      { $set: { globalRules: globalRules } },
      { new: true }
    );
  }

  async getFinanceSettings(instituteId: string) {
    const settings = await this.model.findOne({ institute: instituteId });

    return settings;
  }

//   async ensureFinanceSettings(instituteId: string) {
//   let settings = await this.model.findOne({ institute: instituteId });

//   if (!settings) {
//     settings = await this.model.create({
//       institute: instituteId,
//       academicYearStartMonth: "march",
//       examSystem: "monthly",
//       feeCollectionType: "monthly",
//       sameFeeForWholeInstitute: false,
//       classFeeRules: [],
//       staffPayrollRules: [],
//       fines: [],
//       paymentSettings: {},
//       globalRules: { currency: "PKR" },
//     });
//   }

//   return settings;
// }

async initFinanceSettings(instituteId: string) {
  // 1. Check if already exists
  const exists = await this.model.findOne({ institute: instituteId });
  if (exists) return exists;

  // 2. Create DEFAULT settings
  return this.model.create({
    institute: instituteId,
    academicYearStartMonth: "march",
    examSystem: "semester",
    feeCollectionType: "monthly",
    feeDeadline: 10,
    sameFeeForWholeInstitute: false,
    classFeeRules: [],
    staffPayrollRules: [],
    fines: [],
    paymentSettings: {
      allowedMethods: [],
      bankAccounts: [],
    },
    globalRules: {
      currency: "PKR",
      roundingStrategy: "up",
    },
  });
}






}

// async updateFeeRules(
//   instituteId: string,
//   dto: {
//     sameFeeForWholeInstitute: boolean;
//     classFeeRules: any[];
//   }
// ) {
//   console.log("Updating fee rules with DTO:", dto);

//   return this.model.findOneAndUpdate(
//     { institute: instituteId },
//     {
//       $set: {
//         sameFeeForWholeInstitute: dto.sameFeeForWholeInstitute,
//         classFeeRules: dto.classFeeRules,
//       },
//     },
//     { new: true }
//   );
// }

// async updateStaffPayrollRules(instituteId: string, rules: any[]) {
//   console.log("Updating staff payroll rules with:", rules);

//   return this.model.findOneAndUpdate(
//     { institute: instituteId },
//     {
//       $set: {
//         staffPayrollRules: rules,
//       },
//     },
//     { new: true }
//   );
// }

// async updateFines(instituteId: string, fines: any[]) {
//   console.log("Updating fines with:", fines);

//   return this.model.findOneAndUpdate(
//     { institute: instituteId },
//     {
//       $set: {
//         fines,
//       },
//     },
//     { new: true }
//   );
// }
