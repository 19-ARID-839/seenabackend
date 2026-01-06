import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
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
    private classModel: Model<Class>,
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
      { "sections.$": 1 }
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
    let rule = settings.classFeeRules.find(
      r => r.className === classKey
    );

    // if (!rule && settings.sameFeeForWholeInstitute) {
    //   rule = settings.classFeeRules[0]; // or global default
    // }

    // if (!rule) {
    //   throw new BadRequestException("No fee rule found");
    // }

    // 4️⃣ Assign to students (bulk)
    const academicYear = (settings as any)?.academicYear || "2025-26";

    console.log("Class name:", classDoc.name);
console.log("Section name:", section.name);
console.log("Generated classKey:", classKey);

console.log(
  "Available rules:",
  settings.classFeeRules.map(r => r.className)
);


    await this.studentFinanceModel.bulkWrite(
      section.students.map(s => ({
        updateOne: {
          filter: {
            institute: instituteId,
            student: (s.student as any).toString(),
            academicYear,
          },
          update: {
            $setOnInsert: {
              institute: instituteId,
              student: (s.student as any).toString(),
              classId,
              sectionId,
              academicYear,
            },
            $set: {
              fees: rule,
              customized: false,
            },
          },
          upsert: true,
        },
      }))
    );

    return { message: "Finance rules applied to class successfully" };
  }
}
