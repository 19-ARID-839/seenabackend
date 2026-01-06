// import {
//   Injectable,
//   NotFoundException,
//   BadRequestException,
// } from "@nestjs/common";
// import { InjectModel } from "@nestjs/mongoose";
// import { Model, Types } from "mongoose";
// import { Class } from "./schema/class.schema";
// import { User } from "../users/user.schema"; // ✅ to update teacher/student profiles

// @Injectable()
// export class ClassesService {
//   constructor(
//     @InjectModel(Class.name) private classModel: Model<Class>,
//     @InjectModel(User.name) private userModel: Model<User>
//   ) {}

//   // ✅ Create new class
//   async createClass(dto: any) {
//     const existing = await this.classModel.findOne({
//       institute: dto.institute,
//       name: dto.name,
//     });
//     if (existing)
//       throw new BadRequestException("This class already exists for institute");
//     return this.classModel.create(dto);
//   }

//   // ✅ Create new class or add section if already exists
//   // ✅ Create new class or add section if already exists
//   async createOrAddSection(dto: any) {
//     // ✅ Normalize section name
//     const sectionName = dto.section || dto.sections?.[0]?.name;

//     if (!dto.institute || !dto.name || !sectionName) {
//       throw new BadRequestException(
//         "Institute, class name, and section name are required"
//       );
//     }

//     // ✅ Find existing class
//     const existing = await this.classModel.findOne({
//       institute: dto.institute,
//       name: dto.name,
//     });

//     if (existing) {
//       // ✅ Check if section already exists
//       const sectionExists = existing.sections.some(
//         (s) => s?.name?.toLowerCase() === sectionName.toLowerCase()
//       );
//       if (sectionExists) {
//         throw new BadRequestException(
//           `Section '${sectionName}' already exists in class '${dto.name}'`
//         );
//       }

//       // ✅ Add new section safely
//       existing.sections.push({
//         name: sectionName,
//         students: [],
//       });

//       await existing.save();
//       return existing;
//     } else {
//       // ✅ Create brand new class with its first section
//       return this.classModel.create({
//         institute: dto.institute,
//         name: dto.name,
//         sections: [
//           {
//             name: sectionName,
//             students: [],
//           },
//         ],
//       });
//     }
//   }

//   // ✅ Get classes by institute
//   async getClassesByInstitute(instituteId: string) {
//     return this.classModel
//       .find({ institute: instituteId })
//       .populate("sections.teacher", "name email role") // 👩‍🏫 populate teacher info
//       .populate("sections.students", "name email role"); // 👨‍🎓 populate student info
//   }

//   // ✅ Assign teacher to a section
//   // ✅ Assign teacher to a section (prevent duplicate assignment)
//   async assignTeacherToSection(
//     classId: string,
//     sectionName: string,
//     teacherId: string
//   ) {
//     const classDoc = await this.classModel.findById(classId);
//     if (!classDoc) throw new NotFoundException("Class not found");

//     const section = classDoc.sections.find(
//       (s) => s.name.toLowerCase() === sectionName.toLowerCase()
//     );
//     if (!section) throw new NotFoundException("Section not found");

//     // 🚫 Check if teacher already assigned elsewhere
//     const existingTeacher = await this.classModel.findOne({
//       "sections.teacher": teacherId,
//     });
//     if (existingTeacher) {
//       throw new BadRequestException(
//         `This teacher is already assigned to ${existingTeacher.name}`
//       );
//     }

//     // ✅ Assign teacher
//     section.teacher = new Types.ObjectId(teacherId);
//     await classDoc.save();

//     // ✅ Update teacher profile
//     await this.userModel.updateOne(
//       { _id: teacherId },
//       {
//         $set: {
//           "profile.assignedClass": classDoc.name,
//           "profile.assignedSection": section.name,
//         },
//       }
//     );

//     return { message: "Teacher assigned successfully", class: classDoc };
//   }

//   // ✅ Assign multiple students to a section
//   // ✅ Assign multiple students to a section (prevent overlaps)
//   async assignStudentsToSection(
//     classId: string,
//     sectionName: string,
//     studentIds: string[]
//   ) {
//     const classDoc = await this.classModel.findById(classId);
//     if (!classDoc) throw new NotFoundException("Class not found");

//     const section = classDoc.sections.find(
//       (s) => s.name.toLowerCase() === sectionName.toLowerCase()
//     );
//     if (!section) throw new NotFoundException("Section not found");

//     // 🚫 Validate that none of the students are already in another section
//     const conflictingStudents = await this.classModel.find({
//       "sections.students": { $in: studentIds },
//     });

//     if (conflictingStudents.length > 0) {
//       const names = conflictingStudents.map((c) => c.name).join(", ");
//       throw new BadRequestException(
//         `Some students are already assigned in classes: ${names}`
//       );
//     }

//     // ✅ Add students safely (no duplicates in same section)
//     section.students = [
//       ...new Set([
//         ...(section.students || []).map((id) => id.toString()),
//         ...studentIds,
//       ]),
//     ].map((id) => new Types.ObjectId(id));

//     await classDoc.save();

//     // ✅ Update each student profile
//     await this.userModel.updateMany(
//       { _id: { $in: studentIds } },
//       {
//         $set: {
//           "profile.className": classDoc.name,
//           "profile.section": section.name,
//         },
//       }
//     );

//     return { message: "Students assigned successfully", class: classDoc };
//   }

//   // ✅ Get all students of a section
//   async getStudentsBySection(classId: string, sectionName: string) {
//     const classDoc = await this.classModel.findById(classId);
//     if (!classDoc) throw new NotFoundException("Class not found");

//     const section = classDoc.sections.find(
//       (s) => s.name.toLowerCase() === sectionName.toLowerCase()
//     );
//     if (!section) throw new NotFoundException("Section not found");

//     // ✅ Populate full student info
//     const students = await this.userModel
//       .find({ _id: { $in: section.students } })
//       .select("name email profile.studentId profile.className profile.section");

//     return students;
//   }
// }




import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Class } from "./schema/class.schema";
import { User } from "../users/user.schema"; // adjust path if needed

// --- DTO interfaces kept for clarity (no class-validator required) ---
interface CreateOrAddSectionDto {
  institute: string;
  name: string; // class name
  section?: string; // single section name
  sections?: { name: string }[];
}

interface AssignTeacherDto {
  teacherId: string;
  subject?: string;
  isIncharge?: boolean;
}

interface AssignStudentsDto {
  studentIds: string[];
}

interface AssignStudentRolesDto {
  studentId: string;
  roles: string[]; // e.g. ["monitor","cr"]
}

@Injectable()
export class ClassesService {
  constructor(
    @InjectModel(Class.name) private classModel: Model<Class>,
    @InjectModel(User.name) private userModel: Model<User>
  ) {}

  // --------------------
  // Helper: run populate on a query then normalize result(s)
  // --------------------
  private async populateAndNormalize<T>(query: any) {
    // populate the nested references we expect
    // note: these populates will only work where the array item has a 'student' or 'teacher' field holding an ObjectId
    const populated = await query
      .populate("sections.teachers.teacher", "name email profile")
      .populate("sections.students.student", "name email profile")
      .exec();

    // if single doc
    if (!populated) return populated;
    if (!Array.isArray(populated)) {
      return this.normalizeClassDoc(populated);
    }

    // array of docs
    const normalized = await Promise.all(populated.map((d: any) => this.normalizeClassDoc(d)));
    return normalized;
  }

  // Normalize a single class document to ensure consistent shape:
  // - sections[].teachers -> array of { teacher: User|ObjectId, subject, isIncharge }
  // - sections[].students -> array of { student: User|ObjectId, roles }
  // It also handles legacy shapes:
  // - section.teacher (single ObjectId) -> converts to teachers array
  // - section.students may be [ObjectId] or [{ _id: ObjectId, roles: [] }] -> converts to students array with student field
  private async normalizeClassDoc(classDoc: any) {
    if (!classDoc || !classDoc.sections) return classDoc;

    // Collect missing user ids for batch fetch (to avoid N queries)
    const studentIdsToFetch = new Set<string>();
    const teacherIdsToFetch = new Set<string>();

    // First pass: detect missing `student` or `teacher` subfields that need filling
    classDoc.sections.forEach((section: any) => {
      // legacy single teacher field -> convert to teachers array if needed
      if (section.teacher && !section.teachers) {
        section.teachers = [
          { teacher: section.teacher, subject: "", isIncharge: false },
        ];
        delete section.teacher;
      }

      // If section.teachers exists, check entries: if teacher populated, ok; if teacher is id, queue for fetch
      if (Array.isArray(section.teachers)) {
        section.teachers.forEach((t: any) => {
          if (t && t.teacher) {
            // populated object (has name) or ObjectId
            if (typeof t.teacher === "string" || t.teacher instanceof Types.ObjectId) {
              teacherIdsToFetch.add(t.teacher.toString());
            }
          }
        });
      } else {
        section.teachers = [];
      }

      // Normalize students shapes:
      // Possible legacy shapes:
      //  - section.students = [ObjectId, ...]
      //  - section.students = [{ roles: [], _id: ObjectId }]  (some older saved subdocs)
      // Expected:
      //  - section.students = [{ student: ObjectId, roles: [] }, ... ]
      if (!Array.isArray(section.students)) {
        section.students = [];
      } else {
        // transform entries that are plain ObjectId or have _id but no 'student'
        section.students = section.students.map((entry: any) => {
          // If entry already has 'student' field, keep as-is
          if (entry && entry.student) return entry;

          // If entry is plain ObjectId or string, convert to { student: id, roles: [] }
          if (typeof entry === "string" || entry instanceof Types.ObjectId) {
            studentIdsToFetch.add(entry.toString());
            return { student: entry, roles: [] };
          }

          // If entry has _id but no student (legacy), treat _id as student id
          if (entry && (entry._id || entry.id) && !entry.student) {
            const id = (entry._id || entry.id).toString();
            studentIdsToFetch.add(id);
            return { student: new Types.ObjectId(id), roles: entry.roles || [] };
          }

          // If entry is already { student, roles } but student is id -> queue it
          if (entry && entry.student && (typeof entry.student === "string" || entry.student instanceof Types.ObjectId)) {
            studentIdsToFetch.add(entry.student.toString());
            return { student: entry.student, roles: entry.roles || [] };
          }

          // Otherwise fallback
          return { student: null, roles: entry?.roles || [] };
        });
      }
    });

    // Batch fetch missing users
    const teachersToFetch = Array.from(teacherIdsToFetch);
    const studentsToFetch = Array.from(studentIdsToFetch);

    const fetchedTeachersMap: Record<string, any> = {};
    const fetchedStudentsMap: Record<string, any> = {};

    if (teachersToFetch.length) {
      const fetched = await this.userModel
        .find({ _id: { $in: teachersToFetch.map((id) => new Types.ObjectId(id)) } })
        .select("name email profile")
        .lean();
      fetched.forEach((u: any) => (fetchedTeachersMap[u._id.toString()] = u));
    }

    if (studentsToFetch.length) {
      const fetched = await this.userModel
        .find({ _id: { $in: studentsToFetch.map((id) => new Types.ObjectId(id)) } })
        .select("name email profile")
        .lean();
      fetched.forEach((u: any) => (fetchedStudentsMap[u._id.toString()] = u));
    }

    // Second pass: replace id references with user objects if populate didn't already
    classDoc.sections = classDoc.sections.map((section: any) => {
      // normalize teachers entries
      section.teachers = (section.teachers || []).map((t: any) => {
        // if populated (object with name), keep
        if (t && t.teacher && typeof t.teacher === "object" && t.teacher._id) {
          return { teacher: t.teacher, subject: t.subject || "", isIncharge: !!t.isIncharge };
        }

        const tid = t?.teacher?.toString?.() || null;
        const teacherObj = tid ? (fetchedTeachersMap[tid] || null) : null;
        return { teacher: teacherObj || (tid ? new Types.ObjectId(tid) : null), subject: t?.subject || "", isIncharge: !!t?.isIncharge };
      });

      // normalize students entries
      section.students = (section.students || []).map((s: any) => {
        // if already populated (student is object)
        if (s && s.student && typeof s.student === "object" && s.student._id) {
          return { student: s.student, roles: s.roles || [] };
        }

        const sid = s?.student?.toString?.() || null;
        const studentObj = sid ? (fetchedStudentsMap[sid] || null) : null;
        return { student: studentObj || (sid ? new Types.ObjectId(sid) : null), roles: s?.roles || [] };
      });

      return section;
    });

    return classDoc;
  }

  // --------------------
  // Create class or add section (keeps previous behavior)
  // --------------------
  async createOrAddSection(dto: CreateOrAddSectionDto) {
    const sectionName = dto.section || dto.sections?.[0]?.name;

    if (!dto.institute || !dto.name || !sectionName) {
      throw new BadRequestException(
        "Institute, class name, and section name are required"
      );
    }

    const existing = await this.classModel.findOne({
      institute: dto.institute,
      name: dto.name,
    });

    if (existing) {
      const sectionExists = existing.sections.some(
        (s) => s?.name?.toLowerCase() === sectionName.toLowerCase()
      );
      if (sectionExists) {
        throw new BadRequestException(
          `Section '${sectionName}' already exists in class '${dto.name}'`
        );
      }

      existing.sections.push({
        name: sectionName,
        teachers: [],
        students: [],
      });

      await existing.save();
      // return populated + normalized
      return this.populateAndNormalize(this.classModel.findById(existing._id));
    } else {
      const created = await this.classModel.create({
        institute: dto.institute,
        name: dto.name,
        sections: [
          {
            name: sectionName,
            teachers: [],
            students: [],
          },
        ],
      });
      return this.populateAndNormalize(this.classModel.findById(created._id));
    }
  }

  // --------------------
  // Get classes by institute (populate teachers & students) and normalize
  // --------------------
  async getClassesByInstitute(instituteId: string) {
    return this.populateAndNormalize(this.classModel.find({ institute: instituteId }));
  }

  // --------------------
  // Assign a teacher to a section with subject and optional incharge flag
  // --------------------
  // async assignTeacherAdvanced(
  //   classId: string,
  //   sectionName: string,
  //   dto: AssignTeacherDto
  // ) {
  //   const { teacherId, subject, isIncharge } = dto;

  //   const classDoc = await this.classModel.findById(classId);
  //   if (!classDoc) throw new NotFoundException("Class not found");

  //   const section = classDoc.sections.find(
  //     (s) => s.name.toLowerCase() === sectionName.toLowerCase()
  //   );
  //   if (!section) throw new NotFoundException("Section not found");

  //   // Prevent a teacher being assigned to multiple classes/sections if that's your rule
  //   const teacherAlready = await this.classModel.findOne({
  //     "sections.teachers.teacher": teacherId,
  //   });
  //   if (teacherAlready) {
  //     throw new BadRequestException("Teacher is already assigned elsewhere");
  //   }

  //   // If marking as incharge, ensure no other incharge exists in this section
  //   if (isIncharge) {
  //     const existingIncharge = section.teachers.find((t) => t.isIncharge);
  //     if (existingIncharge) {
  //       throw new BadRequestException("This section already has an incharge");
  //     }
  //   }

  //   // Push teacher entry
  //   section.teachers.push({
  //     teacher: new Types.ObjectId(teacherId),
  //     subject: subject || "",
  //     isIncharge: !!isIncharge,
  //   });

  //   await classDoc.save();

  //   // Update teacher profile assignedClasses (push)
  //   await this.userModel.updateOne(
  //     { _id: teacherId },
  //     {
  //       $push: {
  //         "profile.assignedClasses": {
  //           className: classDoc.name,
  //           sectionName: section.name,
  //           subject: subject || "",
  //           isIncharge: !!isIncharge,
  //         },
  //       },
  //     }
  //   );

  //   // return populated + normalized class
  //   return this.populateAndNormalize(this.classModel.findById(classId));
  // }
  async assignTeacherAdvanced(
  classId: string,
  sectionName: string,
  dto: AssignTeacherDto
) {
  const { teacherId, subject, isIncharge } = dto;

  const classDoc = await this.classModel.findById(classId);
  if (!classDoc) throw new NotFoundException("Class not found");

  const section = classDoc.sections.find(
    (s) => s.name.toLowerCase() === sectionName.toLowerCase()
  );
  if (!section) throw new NotFoundException("Section not found");

  // ❌ WRONG: You were blocking all assignments
  // const teacherAlready = ...

  // ✅ Only block if teacher already incharge somewhere else
  if (isIncharge) {
    const inchargeExists = await this.classModel.findOne({
      "sections.teachers": {
        $elemMatch: {
          teacher: teacherId,
          isIncharge: true,
        },
      },
    });

    if (inchargeExists) {
      throw new BadRequestException(
        "Teacher is already an incharge of another section"
      );
    }
  }

  // No need to block regular subject assignments
  // Teacher can teach in multiple classes

  // Check if already assigned to THIS section (optional)
  const alreadyInSection = section.teachers.find(
    (t) => t.teacher.toString() === teacherId
  );
  if (alreadyInSection) {
    throw new BadRequestException("Teacher is already assigned to this section");
  }

  // Save
  section.teachers.push({
    teacher: new Types.ObjectId(teacherId),
    subject: subject || "",
    isIncharge: !!isIncharge,
  });

  await classDoc.save();

  await this.userModel.updateOne(
    { _id: teacherId },
    {
      $push: {
        "profile.assignedClasses": {
          className: classDoc.name,
          sectionName: section.name,
          subject: subject || "",
          isIncharge: !!isIncharge,
        },
      },
    }
  );

  return this.populateAndNormalize(this.classModel.findById(classId));
}


  // --------------------
  // Assign multiple students to a section
  // --------------------
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

    // Check if any of these students already exist in any class.section (configurable)
    const conflicting = await this.classModel.find({
      "sections.students.student": { $in: studentIds.map((id) => new Types.ObjectId(id)) },
    });

    if (conflicting.length > 0) {
      const names = conflicting.map((c) => c.name).join(", ");
      throw new BadRequestException(
        `Some students are already assigned in classes: ${names}`
      );
    }

    // Add students uniquely in this section (default roles empty)
    const existingStudentIds = (section.students || []).map((s) => {
      // support legacy entries where student might be stored as _id or student
      if (s && s.student) return s.student.toString();
      // access possible legacy _id using any cast to satisfy TS
      if (s && (s as any)._id) return (s as any)._id.toString();
      return null;
    }).filter(Boolean);

    const merged = [
      ...new Set([...existingStudentIds, ...studentIds.map((s) => s.toString())]),
    ];

    section.students = merged.map((id) => ({ student: new Types.ObjectId(id), roles: [] }));

    await classDoc.save();

    // Update students' profile (set className and section). Use updateMany for efficiency
    await this.userModel.updateMany(
      { _id: { $in: studentIds.map((id) => new Types.ObjectId(id)) } },
      {
        $set: {
          "profile.className": classDoc.name,
          "profile.section": section.name,
        },
      }
    );

    // return populated + normalized class
    return this.populateAndNormalize(this.classModel.findById(classId));
  }

  // --------------------
  // Assign or merge roles for a single student inside a section
  // --------------------
  async assignStudentRoles(
    classId: string,
    sectionName: string,
    dto: AssignStudentRolesDto
  ) {
    const { studentId, roles } = dto;

    const classDoc = await this.classModel.findById(classId);
    if (!classDoc) throw new NotFoundException("Class not found");

    const section = classDoc.sections.find(
      (s) => s.name.toLowerCase() === sectionName.toLowerCase()
    );
    if (!section) throw new NotFoundException("Section not found");

    // find student entry; support legacy shapes
    let studentEntry = section.students.find(
      (s) => {
        if (!s) return false;
        if (s.student) return s.student.toString() === studentId;
        // legacy entries might store student id on _id — cast to any to avoid TS error
        if ((s as any)._id) return (s as any)._id.toString() === studentId;
        return false;
      }
    );

    if (!studentEntry) {
      // add student with roles
      section.students.push({
        student: new Types.ObjectId(studentId),
        roles: roles || [],
      });
    } else {
      // merge roles uniquely
      studentEntry.roles = Array.from(new Set([...(studentEntry.roles || []), ...(roles || [])]));
    }

    await classDoc.save();

    // Update student's profile.classRoles: push or merge
    await this.userModel.updateOne(
      { _id: studentId },
      {
        $push: {
          "profile.classRoles": {
            className: classDoc.name,
            sectionName: section.name,
            roles,
          },
        },
      }
    );

    // return populated + normalized class
    return this.populateAndNormalize(this.classModel.findById(classId));
  }

  // --------------------
  // Get all students of a section (populated)
  // --------------------
  async getStudentsBySection(classId: string, sectionName: string) {
    // Use populated + normalized class document to be consistent
    const classDoc = await this.populateAndNormalize(this.classModel.findById(classId));
    if (!classDoc) throw new NotFoundException("Class not found");

    const section = classDoc.sections.find(
      (s: any) => s.name.toLowerCase() === sectionName.toLowerCase()
    );
    if (!section) throw new NotFoundException("Section not found");

    // section.students now contains { student: <User|ObjectId>, roles: [] }
    // Collect real user ids and fetch full users (if not already populated)
    const userIds = section.students
      .map((s: any) => (s.student && s.student._id ? s.student._id : s.student))
      .filter(Boolean)
      .map((id: any) => new Types.ObjectId(id));

    const students = await this.userModel
      .find({ _id: { $in: userIds } })
      .select("name email profile.studentId profile.className profile.section profile.classRoles");

    return students;
  }


}



// import {
//   Injectable,
//   NotFoundException,
//   BadRequestException,
// } from "@nestjs/common";
// import { InjectModel } from "@nestjs/mongoose";
// import { Model, Types } from "mongoose";
// import { Class } from "./schema/class.schema";
// import { User } from "../users/user.schema"; // adjust path if needed

// // --- DTOs (simple shapes, you can replace with class-validator DTOs later) ---
// interface CreateOrAddSectionDto {
//   institute: string;
//   name: string; // class name
//   section?: string; // single section name
//   sections?: { name: string }[];
// }

// interface AssignTeacherDto {
//   teacherId: string;
//   subject?: string;
//   isIncharge?: boolean;
// }

// interface AssignStudentsDto {
//   studentIds: string[];
// }

// interface AssignStudentRolesDto {
//   studentId: string;
//   roles: string[]; // e.g. ["monitor","cr"]
// }

// @Injectable()
// export class ClassesService {
//   constructor(
//     @InjectModel(Class.name) private classModel: Model<Class>,
//     @InjectModel(User.name) private userModel: Model<User>
//   ) {}

//   // Create class or add section (keeps previous behavior)
//   async createOrAddSection(dto: CreateOrAddSectionDto) {
//     const sectionName = dto.section || dto.sections?.[0]?.name;

//     if (!dto.institute || !dto.name || !sectionName) {
//       throw new BadRequestException(
//         "Institute, class name, and section name are required"
//       );
//     }

//     const existing = await this.classModel.findOne({
//       institute: dto.institute,
//       name: dto.name,
//     });

//     if (existing) {
//       const sectionExists = existing.sections.some(
//         (s) => s?.name?.toLowerCase() === sectionName.toLowerCase()
//       );
//       if (sectionExists) {
//         throw new BadRequestException(
//           `Section '${sectionName}' already exists in class '${dto.name}'`
//         );
//       }

//       existing.sections.push({
//         name: sectionName,
//         teachers: [],
//         students: [],
//       });

//       await existing.save();
//       return existing;
//     } else {
//       return this.classModel.create({
//         institute: dto.institute,
//         name: dto.name,
//         sections: [
//           {
//             name: sectionName,
//             teachers: [],
//             students: [],
//           },
//         ],
//       });
//     }
//   }

//   // Get classes by institute (populate teachers & students)
//   async getClassesByInstitute(instituteId: string) {
//     return this.classModel
//       .find({ institute: instituteId })
//       .populate("sections.teachers.teacher", "name email role profile")
//       .populate("sections.students.student", "name email role profile");
//   }

//   // Assign a teacher to a section with subject and optional incharge flag
//   async assignTeacherAdvanced(
//     classId: string,
//     sectionName: string,
//     dto: AssignTeacherDto
//   ) {
//     const { teacherId, subject, isIncharge } = dto;

//     const classDoc = await this.classModel.findById(classId);
//     if (!classDoc) throw new NotFoundException("Class not found");

//     const section = classDoc.sections.find(
//       (s) => s.name.toLowerCase() === sectionName.toLowerCase()
//     );
//     if (!section) throw new NotFoundException("Section not found");

//     // Prevent a teacher being assigned to multiple classes/sections if that's your rule
//     const teacherAlready = await this.classModel.findOne({
//       "sections.teachers.teacher": teacherId,
//     });
//     if (teacherAlready) {
//       // allow if teacher is already assigned in THIS class & section with same subject? for now block
//       throw new BadRequestException("Teacher is already assigned elsewhere");
//     }

//     // If marking as incharge, ensure no other incharge exists in this section
//     if (isIncharge) {
//       const existingIncharge = section.teachers.find((t) => t.isIncharge);
//       if (existingIncharge) {
//         throw new BadRequestException("This section already has an incharge");
//       }
//     }

//     // Push teacher entry
//     section.teachers.push({
//       teacher: new Types.ObjectId(teacherId),
//       subject: subject || "",
//       isIncharge: !!isIncharge,
//     });

//     await classDoc.save();

//     // Update teacher profile assignedClasses (push)
//     await this.userModel.updateOne(
//       { _id: teacherId },
//       {
//         $push: {
//           "profile.assignedClasses": {
//             className: classDoc.name,
//             sectionName: section.name,
//             subject: subject || "",
//             isIncharge: !!isIncharge,
//           },
//         },
//       }
//     );

//     return { message: "Teacher assigned successfully", class: classDoc };
//   }

//   // Assign multiple students to a section (keeps previous prevention of duplicates across classes)
//   async assignStudentsToSection(
//     classId: string,
//     sectionName: string,
//     studentIds: string[]
//   ) {
//     const classDoc = await this.classModel.findById(classId);
//     if (!classDoc) throw new NotFoundException("Class not found");

//     const section = classDoc.sections.find(
//       (s) => s.name.toLowerCase() === sectionName.toLowerCase()
//     );
//     if (!section) throw new NotFoundException("Section not found");

//     // Check if any of these students already exist in any class.section (configurable)
//     const conflicting = await this.classModel.find({
//       "sections.students.student": { $in: studentIds.map((id) => new Types.ObjectId(id)) },
//     });

//     if (conflicting.length > 0) {
//       const names = conflicting.map((c) => c.name).join(", ");
//       throw new BadRequestException(
//         `Some students are already assigned in classes: ${names}`
//       );
//     }

//     // Add students uniquely in this section (default roles empty)
//     const existingStudentIds = (section.students || []).map((s) => s.student.toString());
//     const merged = [
//       ...new Set([...existingStudentIds, ...studentIds.map((s) => s.toString())]),
//     ];

//     section.students = merged.map((id) => ({ student: new Types.ObjectId(id), roles: [] }));

//     await classDoc.save();

//     // Update students' profile (set className and section). Use updateMany for efficiency
//     await this.userModel.updateMany(
//       { _id: { $in: studentIds.map((id) => new Types.ObjectId(id)) } },
//       {
//         $set: {
//           "profile.className": classDoc.name,
//           "profile.section": section.name,
//         },
//       }
//     );

//     return { message: "Students assigned successfully", class: classDoc };
//   }

//   // Assign or merge roles for a single student inside a section
//   async assignStudentRoles(
//     classId: string,
//     sectionName: string,
//     dto: AssignStudentRolesDto
//   ) {
//     const { studentId, roles } = dto;

//     const classDoc = await this.classModel.findById(classId);
//     if (!classDoc) throw new NotFoundException("Class not found");

//     const section = classDoc.sections.find(
//       (s) => s.name.toLowerCase() === sectionName.toLowerCase()
//     );
//     if (!section) throw new NotFoundException("Section not found");

//     // find student entry
//     let studentEntry = section.students.find(
//       (s) => s.student.toString() === studentId
//     );

//     if (!studentEntry) {
//       // add student with roles
//       section.students.push({
//         student: new Types.ObjectId(studentId),
//         roles: roles || [],
//       });
//     } else {
//       // merge roles uniquely
//       studentEntry.roles = Array.from(new Set([...(studentEntry.roles || []), ...(roles || [])]));
//     }

//     await classDoc.save();

//     // Update student's profile.classRoles: push or merge
//     await this.userModel.updateOne(
//       { _id: studentId },
//       {
//         $push: {
//           "profile.classRoles": {
//             className: classDoc.name,
//             sectionName: section.name,
//             roles,
//           },
//         },
//       }
//     );

//     return { message: "Student roles updated", class: classDoc };
//   }

//   // Get all students of a section (populated)
//   async getStudentsBySection(classId: string, sectionName: string) {
//     const classDoc = await this.classModel.findById(classId);
//     if (!classDoc) throw new NotFoundException("Class not found");

//     const section = classDoc.sections.find(
//       (s) => s.name.toLowerCase() === sectionName.toLowerCase()
//     );
//     if (!section) throw new NotFoundException("Section not found");

//     const students = await this.userModel
//       .find({ _id: { $in: section.students.map((s) => s.student) } })
//       .select("name email profile.studentId profile.className profile.section profile.classRoles");

//     return students;
//   }
// }


