import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Class } from "./schema/class.schema";
import { User } from "../users/user.schema"; // ✅ to update teacher/student profiles

@Injectable()
export class ClassesService {
  constructor(
    @InjectModel(Class.name) private classModel: Model<Class>,
    @InjectModel(User.name) private userModel: Model<User>
  ) {}

  // ✅ Create new class
  async createClass(dto: any) {
    const existing = await this.classModel.findOne({
      institute: dto.institute,
      name: dto.name,
    });
    if (existing)
      throw new BadRequestException("This class already exists for institute");
    return this.classModel.create(dto);
  }

  // ✅ Create new class or add section if already exists
  // ✅ Create new class or add section if already exists
  async createOrAddSection(dto: any) {
    // ✅ Normalize section name
    const sectionName = dto.section || dto.sections?.[0]?.name;

    if (!dto.institute || !dto.name || !sectionName) {
      throw new BadRequestException(
        "Institute, class name, and section name are required"
      );
    }

    // ✅ Find existing class
    const existing = await this.classModel.findOne({
      institute: dto.institute,
      name: dto.name,
    });

    if (existing) {
      // ✅ Check if section already exists
      const sectionExists = existing.sections.some(
        (s) => s?.name?.toLowerCase() === sectionName.toLowerCase()
      );
      if (sectionExists) {
        throw new BadRequestException(
          `Section '${sectionName}' already exists in class '${dto.name}'`
        );
      }

      // ✅ Add new section safely
      existing.sections.push({
        name: sectionName,
        students: [],
      });

      await existing.save();
      return existing;
    } else {
      // ✅ Create brand new class with its first section
      return this.classModel.create({
        institute: dto.institute,
        name: dto.name,
        sections: [
          {
            name: sectionName,
            students: [],
          },
        ],
      });
    }
  }

  // ✅ Get classes by institute
  async getClassesByInstitute(instituteId: string) {
    return this.classModel
      .find({ institute: instituteId })
      .populate("sections.teacher", "name email role") // 👩‍🏫 populate teacher info
      .populate("sections.students", "name email role"); // 👨‍🎓 populate student info
  }

  // ✅ Assign teacher to a section
  // ✅ Assign teacher to a section (prevent duplicate assignment)
  async assignTeacherToSection(
    classId: string,
    sectionName: string,
    teacherId: string
  ) {
    const classDoc = await this.classModel.findById(classId);
    if (!classDoc) throw new NotFoundException("Class not found");

    const section = classDoc.sections.find(
      (s) => s.name.toLowerCase() === sectionName.toLowerCase()
    );
    if (!section) throw new NotFoundException("Section not found");

    // 🚫 Check if teacher already assigned elsewhere
    const existingTeacher = await this.classModel.findOne({
      "sections.teacher": teacherId,
    });
    if (existingTeacher) {
      throw new BadRequestException(
        `This teacher is already assigned to ${existingTeacher.name}`
      );
    }

    // ✅ Assign teacher
    section.teacher = new Types.ObjectId(teacherId);
    await classDoc.save();

    // ✅ Update teacher profile
    await this.userModel.updateOne(
      { _id: teacherId },
      {
        $set: {
          "profile.assignedClass": classDoc.name,
          "profile.assignedSection": section.name,
        },
      }
    );

    return { message: "Teacher assigned successfully", class: classDoc };
  }

  // ✅ Assign multiple students to a section
  // ✅ Assign multiple students to a section (prevent overlaps)
  async assignStudentsToSection(
    classId: string,
    sectionName: string,
    studentIds: string[]
  ) {
    const classDoc = await this.classModel.findById(classId);
    if (!classDoc) throw new NotFoundException("Class not found");

    const section = classDoc.sections.find(
      (s) => s.name.toLowerCase() === sectionName.toLowerCase()
    );
    if (!section) throw new NotFoundException("Section not found");

    // 🚫 Validate that none of the students are already in another section
    const conflictingStudents = await this.classModel.find({
      "sections.students": { $in: studentIds },
    });

    if (conflictingStudents.length > 0) {
      const names = conflictingStudents.map((c) => c.name).join(", ");
      throw new BadRequestException(
        `Some students are already assigned in classes: ${names}`
      );
    }

    // ✅ Add students safely (no duplicates in same section)
    section.students = [
      ...new Set([
        ...(section.students || []).map((id) => id.toString()),
        ...studentIds,
      ]),
    ].map((id) => new Types.ObjectId(id));

    await classDoc.save();

    // ✅ Update each student profile
    await this.userModel.updateMany(
      { _id: { $in: studentIds } },
      {
        $set: {
          "profile.className": classDoc.name,
          "profile.section": section.name,
        },
      }
    );

    return { message: "Students assigned successfully", class: classDoc };
  }

  // ✅ Get all students of a section
  async getStudentsBySection(classId: string, sectionName: string) {
    const classDoc = await this.classModel.findById(classId);
    if (!classDoc) throw new NotFoundException("Class not found");

    const section = classDoc.sections.find(
      (s) => s.name.toLowerCase() === sectionName.toLowerCase()
    );
    if (!section) throw new NotFoundException("Section not found");

    // ✅ Populate full student info
    const students = await this.userModel
      .find({ _id: { $in: section.students } })
      .select("name email profile.studentId profile.className profile.section");

    return students;
  }
}
