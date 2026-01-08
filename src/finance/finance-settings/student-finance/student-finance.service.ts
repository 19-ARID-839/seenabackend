import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Class } from "src/classes/schema/class.schema";
import { FinanceSettings } from "../finance-settings.schema";
import { StudentFinance } from "./student-finance.schema";

@Injectable()
export class StudentFinanceSeeting {
  constructor(
    @InjectModel(FinanceSettings.name)
    private financeSettingsModel: Model<FinanceSettings>,

    @InjectModel(StudentFinance.name)
    private studentFinanceModel: Model<StudentFinance>,

    @InjectModel(Class.name)
    private classModel: Model<Class>
  ) {}

  async applyClassFinance(
    instituteId: string,
    classId: string,
    sectionId: string
  ) {
    // 1️⃣ Fetch class + section
    const classDoc = await this.classModel.findOne(
      {
        _id: classId,
        institute: instituteId,
        "sections._id": sectionId,
      },
      {
        name: 1, // ✅ REQUIRED
        "sections.$": 1,
      }
    );

    if (!classDoc) {
      throw new BadRequestException("Invalid class or section");
    }

    const section = classDoc.sections[0];

    // 2️⃣ Load finance settings
    const settings = await this.financeSettingsModel.findOne({
      institute: instituteId,
    });

    if (!settings) {
      throw new BadRequestException("No finance settings found");
    }

    // 3️⃣ Resolve rule
    const classKey = `${classDoc.name}|${section.name}`;
    let rule = settings.classFeeRules.find((r) => r.className === classKey);

    console.log("RULES: ", rule);

    if (!rule && settings.sameFeeForWholeInstitute) {
      rule = settings.classFeeRules[0]; // or global default
    }

    if (!rule) {
      throw new BadRequestException("No fee rule found");
    }

    // 4️⃣ Assign to students (bulk)
    const academicYear = (settings as any)?.academicYear || "2025-26";
    const feesSnapshot = {
      admissionFee: rule.admissionFee ?? 0,
      tuitionFee: rule.tuitionFee ?? 0,
      examFeePerTerm: rule.examFeePerTerm ?? 0,

      transportFee: rule.transportFee
        ? {
            enabled: rule.transportFee.enabled,
            amount: rule.transportFee.amount,
          }
        : undefined,

      lateFee: rule.lateFee
        ? {
            amount: rule.lateFee.amount,
            maxCap: rule.lateFee.maxCap,
          }
        : undefined,
    };

    const globalRulesSnapshot = {
      currency: settings.globalRules?.currency ?? "PKR",
      roundingStrategy: settings.globalRules?.roundingStrategy ?? "up",
      feeCollectionType: settings.feeCollectionType,
      examSystem: settings.examSystem,
      feeDeadline: settings.feeDeadline,
    };

    console.log("Class name:", classDoc.name);
    console.log("Section name:", section.name);
    console.log("Generated classKey:", classKey);

    console.log(
      "Available rules:",
      settings.classFeeRules.map((r) => r.className)
    );

    await this.studentFinanceModel.bulkWrite(
      section.students.map((s) => {
        const instituteObjId = new Types.ObjectId(instituteId);
        const studentObjId = new Types.ObjectId(s.student);
        const classObjId = new Types.ObjectId(classId);
        const sectionObjId = new Types.ObjectId(sectionId);

        return {
          updateOne: {
            filter: {
              institute: instituteObjId,
              student: studentObjId,
              academicYear,
            },
            update: {
              $setOnInsert: {
                institute: instituteObjId,
                student: studentObjId,
                classId: classObjId,
                sectionId: sectionObjId,
                academicYear,
              },
              $set: {
                fees: feesSnapshot,
                globalRulesSnapshot,
                fineRules: settings.fines ?? [],
                customized: false,
                locked: false,
                source: {
                  appliedFrom: "class-rule",
                  // ruleId: rule._id?.toString(),
                },
              },
            },
            upsert: true,
          },
        };
      })
    );

    return { message: "Finance rules applied to class successfully" };
  }

  async getAll(instituteId: string) {
    return this.studentFinanceModel
      .find({
        institute: new Types.ObjectId(instituteId), // 🔥 FIX
      })
      .populate("student", "name rollNumber profile.className profile.section")
      // .populate("classId", "name")
      // .populate("sectionId", "name")
      .lean();
  }

  async updateById(instituteId: string, id: string, payload: any) {
    const updated = await this.studentFinanceModel.findOneAndUpdate(
      { _id: id, institute: instituteId },
      {
        $set: {
          fees: payload.fees,
          fineRules: payload.fineRules,
          customized: true,
        },
      },
      { new: true }
    );

    if (!updated) {
      throw new BadRequestException("Student finance not found");
    }

    return {
      message: "Student finance updated",
      data: updated,
    };
  }
}
