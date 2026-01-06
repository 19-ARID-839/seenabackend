// ------------------ Controller ------------------

import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  NotFoundException,
} from "@nestjs/common";
import { ClassesService } from "./classes.service";

@Controller("classes")
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  async create(@Body() Body: any) {
    return this.classesService.createOrAddSection(Body);
  }

  @Get(":instituteId")
  async getByInstitute(@Param("instituteId") instituteId: string) {
    return this.classesService.getClassesByInstitute(instituteId);
  }

  // Assign teacher (advanced)
  @Patch(":classId/sections/:sectionName/teachers")
  async assignTeacher(
    @Param("classId") classId: string,
    @Param("sectionName") sectionName: string,
    @Body() body: any
  ) {
    if (!body?.teacherId) throw new NotFoundException("teacherId is required");
    return this.classesService.assignTeacherAdvanced(classId, sectionName, body);
  }

  // Assign multiple students to a section
  @Patch(":classId/sections/:sectionName/students")
  async assignStudents(
    @Param("classId") classId: string,
    @Param("sectionName") sectionName: string,
    @Body() body: any
  ) {
    if (!body?.studentIds?.length)
      throw new NotFoundException("At least one studentId is required");
    return this.classesService.assignStudentsToSection(
      classId,
      sectionName,
      body.studentIds
    );
  }

  // Assign roles to a student (monitor, cr, etc.)
  @Patch(":classId/sections/:sectionName/students/roles")
  async assignStudentRoles(
    @Param("classId") classId: string,
    @Param("sectionName") sectionName: string,
    @Body() body: any
  ) {
    if (!body?.studentId || !body?.roles?.length)
      throw new NotFoundException("studentId and at least one role are required");
    return this.classesService.assignStudentRoles(classId, sectionName, body);
  }

  // Get students for a section
  @Get(":classId/sections/:sectionName/students")
  async getStudents(
    @Param("classId") classId: string,
    @Param("sectionName") sectionName: string
  ) {
    return this.classesService.getStudentsBySection(classId, sectionName);
  }
}


// import {
//   Controller,
//   Post,
//   Get,
//   Patch,
//   Param,
//   Body,
//   NotFoundException,
// } from "@nestjs/common";
// import { ClassesService } from "./classes.service";

// @Controller("classes")
// export class ClassesController {
//   constructor(private readonly classesService: ClassesService) {}

//   // ✅ Create new class
//   // @Post()
//   // async create(@Body() dto: any) {
//   //   return this.classesService.createClass(dto);
//   // }

//   @Post()
// async create(@Body() dto: any) {
//   return this.classesService.createOrAddSection(dto);
// }


//   // ✅ Get all classes of an institute
//   @Get(":instituteId")
//   async getByInstitute(@Param("instituteId") instituteId: string) {
//     return this.classesService.getClassesByInstitute(instituteId);
//   }

//   // ✅ Assign teacher to a section
//   @Patch(":classId/sections/:sectionName/teacher")
//   async assignTeacher(
//     @Param("classId") classId: string,
//     @Param("sectionName") sectionName: string,
//     @Body("teacherId") teacherId: string
//   ) {
//     if (!teacherId) throw new NotFoundException("teacherId is required");
//     return this.classesService.assignTeacherToSection(
//       classId,
//       sectionName,
//       teacherId
//     );
//   }

//   // ✅ Assign students to a section
//   @Patch(":classId/sections/:sectionName/students")
//   async assignStudents(
//     @Param("classId") classId: string,
//     @Param("sectionName") sectionName: string,
//     @Body("studentIds") studentIds: string[]
//   ) {
//     if (!studentIds?.length)
//       throw new NotFoundException("At least one studentId is required");
//     return this.classesService.assignStudentsToSection(
//       classId,
//       sectionName,
//       studentIds
//     );
//   }

//   // ✅ Get all students in a section
//   @Get(":classId/sections/:sectionName/students")
//   async getStudents(
//     @Param("classId") classId: string,
//     @Param("sectionName") sectionName: string
//   ) {
//     return this.classesService.getStudentsBySection(classId, sectionName);
//   }
// }
