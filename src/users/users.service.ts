import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model, Types } from "mongoose";
import { User } from "./user.schema";
import * as bcrypt from "bcryptjs";
import { cleanObject } from "src/common/clean";

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  private generateCustomId(prefix: string, instituteCode: string): string {
    const year = new Date().getFullYear().toString().slice(-2); // e.g. "25"
    const random = Math.floor(1000 + Math.random() * 9000); // 4-digit unique part
    return `${instituteCode}-${prefix}-${year}${random}`;
  }

  private readonly allowedFieldsByRole: Record<
    "director" | "principal" | "admin" | "teacher" | "student",
    string[]
  > = {
    director: [
      "name",
      "email",
      "phone",
      "password",
      "cnic",
      "role",
      "institute",
      "instituteCode",
    ],
    principal: [
      "name",
      "email",
      "phone",
      "password",
      "cnic",
      "role",
      "institute",
      "instituteCode",
    ],
    admin: [
      "name",
      "email",
      "phone",
      "password",
      "cnic",
      "role",
      "institute",
      "instituteCode",
    ],
    teacher: [
      "name",
      "email",
      "phone",
      "password",
      "cnic",
      "role",
      "institute",
      "instituteCode",
    ],
    student: [
      "name",
      "email",
      "phone",
      "password",
      "cnic",
      "role",
      "institute",
      "instituteCode",
    ],
  };

  async assertUserUniqueness(data: {
  email?: string;
  phone?: string;
  cnic?: string;
}) {
  if (data.email) {
    const exists = await this.userModel.findOne({ email: data.email });
    if (exists) throw new BadRequestException("Email already exists");
  }

  if (data.phone) {
    const exists = await this.userModel.findOne({ phone: data.phone });
    if (exists) throw new BadRequestException("Phone already exists");
  }

  if (data.cnic) {
    const exists = await this.userModel.findOne({ cnic: data.cnic });
    if (exists) throw new BadRequestException("CNIC already exists");
  }
}


  // Example helper to find users by roles and institute
  async findByRolesAndInstitute(instituteId: string, roles: string[]) {
    return this.userModel.find({
      institute: instituteId,
      role: { $in: roles },
    });
  }

  private normalizeInstitute(institute: any) {
    if (!institute) return institute;
    if (Types.ObjectId.isValid(institute)) {
      return new Types.ObjectId(institute);
    }
    if (institute?._id && Types.ObjectId.isValid(institute._id)) {
      return new Types.ObjectId(institute._id);
    }
    return institute;
  }

  // users.service.ts
  async checkRequiredRoles(instituteId: string) {
    const requiredRoles = ["principal", "viceprincipal", "admin"];

    let objectId: mongoose.Types.ObjectId | null = null;
    if (mongoose.Types.ObjectId.isValid(instituteId)) {
      objectId = new mongoose.Types.ObjectId(instituteId);
    }

    // 🔍 Ensure we only include valid filters
    const query: any = {
      role: { $in: requiredRoles },
      $or: [
        { institute: objectId },
        { instituteCode: instituteId.toUpperCase() },
      ],
    };

    if (!objectId) {
      // If somehow invalid, just match by code
      delete query.$or;
      query.instituteCode = instituteId.toUpperCase();
    }

    const existingUsers = await this.userModel
      .find(query)
      .select("name role email institute instituteCode");

    const existingRoles = existingUsers.map((u) => u.role.toLowerCase());
    const missingRoles = requiredRoles.filter(
      (r) => !existingRoles.includes(r)
    );

    console.log(
      "🧩 Existing users:",
      existingUsers.map((u) => u.role)
    );
    console.log("📋 Missing roles:", missingRoles);

    return { existing: existingUsers, missing: missingRoles };
  }

  // async createUser(data: Partial<User & { institute?: any }>) {
  //   const copy: any = { ...data };

  //   if (!copy.password) throw new BadRequestException('Password is required for user creation');

  //   // Hash password
  //   const hash = await bcrypt.hash(copy.password, 10);
  //   copy.password = hash;

  //   // If institute provided as object transform to id
  //   if (copy.institute && typeof copy.institute === 'object') {
  //     copy.institute = copy.institute._id || copy.institute;
  //   }

  //   // Normalize instituteCode
  //   if (copy.instituteCode) {
  //     copy.instituteCode = String(copy.instituteCode).toUpperCase();
  //   }

  //   const createdUser = new this.userModel(copy);
  //   return createdUser.save();
  // }

  // async createUser(data: Partial<User>) {
  //   const copy: any = { ...data };

  //   // Hash password if provided
  //   if (copy.password) {
  //     const hash = await bcrypt.hash(copy.password, 10);
  //     copy.password = hash;
  //   }

  //   // Ensure institute reference is an ObjectId
  //   if (copy.institute && typeof copy.institute === "object") {
  //     copy.institute = copy.institute._id;
  //   }

  //   // Normalize code
  //   if (copy.instituteCode) {
  //     copy.instituteCode = copy.instituteCode.toUpperCase();
  //   }

  //   const createdUser = new this.userModel(copy);
  //   return await createdUser.save();
  // }

  async createUser(data: Partial<User & { institute?: any }>) {
    if (!data.password) {
      throw new BadRequestException("Password is required for user creation");
    }

    // ✅ Hash password
    data.password = await bcrypt.hash(data.password, 10);

    // ✅ Normalize institute fields
    if (data.institute && typeof data.institute === "object") {
      data.institute = data.institute._id || data.institute;
    }

    if (data.instituteCode) {
      data.instituteCode = String(data.instituteCode).toUpperCase();
    }

    // ✅ Clean null / undefined / empty string values
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(
        ([, value]) => value !== undefined && value !== null && value !== ""
      )
    );

    // ✅ Directly create user with all fields
    const createdUser = new this.userModel(cleanData);
    return await createdUser.save();
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  async findByPhone(phone: string) {
    return this.userModel.findOne({ phone }).exec();
  }

  async findById(id: string) {
    const u = await this.userModel.findById(id).exec();
    if (!u) throw new NotFoundException("User not found");
    return u;
  }

  // ✅ Get all users for a specific institute

  async getUsersByInstitute(instituteId: string) {
    const id = new Types.ObjectId(instituteId);
    console.log("🏫 Fetching users for institute:", id);

    const users = await this.userModel
      .find({ institute: id })
      .select("name email phone role institute")
      .lean();

    console.log("📦 Found users:", users);
    return { users };
  }

  async validateUserByPassword(emailOrPhone: string, plain: string) {
    const user = emailOrPhone.includes("@")
      ? await this.findByEmail(emailOrPhone)
      : await this.findByPhone(emailOrPhone);
    if (!user || !user.password) return null;
    const match = await bcrypt.compare(plain, user.password);
    if (!match) return null;
    return user;
  }

  async findStudentsForDriver(driverId: string) {
    const driver = await this.userModel.findById(driverId).exec();
    if (!driver || driver.role !== "driver") {
      throw new NotFoundException("Driver not found");
    }

    return this.userModel
      .find({ role: "student", institute: driver.institute })
      .exec();
  }

  async updateUserProfile(
    userId: string,
    profile: any,
    mode: "admin" | "self" = "self"
  ) {
    const commonFields = [
      "gender",
      "dob",
      "address",
      "cnic",
      "nationality",
      "bloodGroup",
      "emergencyContact",
      "profileImage",
      "religion",
    ];

    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException("User not found");

    const update: any = {};
    const allowed: string[] = [...commonFields];

    // 🎓 STUDENT LOGIC
    if (user.role === "student") {
      allowed.push(
        "address",
        "className",
        "section",
        "subjects",
        "fatherName",
        "guardianPhone",
        "bloodGroup",
        "gender"
      );

      if (mode === "self" && !profile.className)
        throw new BadRequestException("Class name is required");
      if (mode === "self" && !profile.section)
        throw new BadRequestException("Section is required");
      if (
        mode === "self" &&
        (!profile.subjects || profile.subjects.length === 0)
      )
        throw new BadRequestException("At least one subject is required");

      if (!user.profile.rollNumber) {
        const year = new Date().getFullYear().toString().slice(-2);
        const unique = Math.random().toString(36).substring(2, 5).toUpperCase();
        update["profile.rollNumber"] = `S${year}-${unique}`;
      }

      if (!user.profile.studentId)
        update["profile.studentId"] = `STU-${Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase()}`;
    }

    // 👨‍🏫 TEACHER LOGIC
    else if (user.role === "teacher") {
      allowed.push(
        "qualification",
        "department",
        "subjectsTaught",
        "employmentStatus",
        "gender",
        "address"
      );

      if (mode === "self" && !profile.qualification)
        throw new BadRequestException("Qualification is required");
      if (mode === "self" && !profile.department)
        throw new BadRequestException("Department is required");
      if (
        mode === "self" &&
        (!profile.subjectsTaught || profile.subjectsTaught.length === 0)
      )
        throw new BadRequestException(
          "At least one subject taught is required"
        );

      if (!user.profile.teacherId)
        update["profile.teacherId"] = `TCH-${Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase()}`;

      update["profile.employmentStatus"] = profile.employmentStatus || "active";
    }

    // 👨‍👩‍👧 PARENT LOGIC
    else if (user.role === "parent") {
      allowed.push(
        "relation",
        "occupation",
        "workplace",
        "monthlyIncome",
        "address",
        "gender",
        "dob",
        "studentId"
      );

        if (!Array.isArray(profile.childIds) || profile.childIds.length === 0) {
    throw new BadRequestException("At least one child is required");
  }

      if (mode === "self" && !profile.studentId)
        throw new BadRequestException("Student ID is required to link child");

  const students = await this.userModel.find({
    _id: { $in: profile.childIds },
    role: "student",
    institute: user.institute,
  });

  if (students.length !== profile.childIds.length) {
    throw new NotFoundException(
      "One or more students not found in your institute"
    );
  }

  // ✅ Link children → parent
  await this.userModel.updateOne(
    { _id: user._id },
    {
      $addToSet: {
        "profile.childIds": { $each: profile.childIds },
      },
      $set: {
        "profile.relation": profile.relation || "guardian",
      },
    }
  );

  // ✅ Link parent → children
  await this.userModel.updateMany(
    { _id: { $in: profile.childIds } },
    {
      $addToSet: {
        "profile.parents": {
          parentId: user._id,
          relation: profile.relation || "guardian",
        },
      },
    }
  );



      // // Find student by studentId within same institute
      // const student = await this.userModel.findOne({
      //   "profile.studentId": profile.studentId,
      //   role: "student",
      //   institute: user.institute,
      // });

      // if (!student)
      //   throw new NotFoundException(
      //     "No student found with this ID in your institute"
      //   );

      // // ✅ Add child link to parent
      // await this.userModel.updateOne(
      //   { _id: user._id },
      //   {
      //     $addToSet: {
      //       "profile.childIds": student._id,
      //     },
      //     $set: {
      //       "profile.relation": profile.relation || "guardian",
      //     },
      //   }
      // );

      // // ✅ Add parent link to student
      // await this.userModel.updateOne(
      //   { _id: student._id },
      //   {
      //     $addToSet: {
      //       "profile.parents": {
      //         parentId: user._id,
      //         relation: profile.relation || "guardian",
      //       },
      //     },
      //   }
      // );
    }

    // 🚌 DRIVER LOGIC
    else if (user.role === "driver") {
      allowed.push(
        "licenseNumber",
        "vehicleNumber",
        "assignedRoute",
        "address",
        "gender"
      );

      if (mode === "self" && !profile.licenseNumber)
        throw new BadRequestException("License number is required");
      if (mode === "self" && !profile.vehicleNumber)
        throw new BadRequestException("Vehicle number is required");

      if (!user.profile.driverId)
        update["profile.driverId"] = `DRV-${Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase()}`;

      update["profile.assignedRoute"] =
        profile.assignedRoute || user.profile.assignedRoute || "";
    }

    // 🧑‍💼 ADMIN / DIRECTOR LOGIC
    else if (["admin", "director"].includes(user.role)) {
      allowed.push("instituteName", "level", "joiningDateAdmin", "address");

      if (mode === "self" && !profile.instituteName)
        throw new BadRequestException("Institute name is required");
      if (mode === "self" && !profile.level)
        throw new BadRequestException("Admin/Director level is required");

      update["profile.joiningDateAdmin"] =
        profile.joiningDateAdmin || new Date().toISOString();
    }

    // 🧩 Meta info
    update["profile.updatedBy"] = userId;
    update["profile.updatedAt"] = new Date().toISOString();

    // ✅ Only add allowed fields
    for (const key of allowed) {
      if (profile[key] !== undefined) {
        update[`profile.${key}`] = profile[key];
      }
    }

    const updated = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true }
    );

    return updated;
  }

  async findUsers(filters: any, fullProfile = false) {
    const query: any = {};

    // 🎯 Role filter
    if (filters.role) query.role = filters.role;

    // 🏫 Institute filter (safe ObjectId conversion)
    if (filters.institute) {
      try {
        query.institute = new mongoose.Types.ObjectId(filters.institute);
      } catch {
        query.institute = filters.institute;
      }
    }

    // 🎓 Class filter
    if (filters["profile.className"])
      query["profile.className"] = filters["profile.className"];

    // 🧩 Decide which fields to select
    const selectFields = fullProfile
      ? "name email role cnic phone institute profile"
      : "name email role institute profile.className profile.section profile.studentId";

    return this.userModel.find(query).select(selectFields).exec();
  }

  async findAllForAdmin(filters: any) {
    const query: any = {};
    if (filters.role) query.role = filters.role;
    if (filters.institute)
      query.institute = new mongoose.Types.ObjectId(filters.institute);
    if (filters["profile.className"])
      query["profile.className"] = filters["profile.className"];

    return this.userModel.find(query).exec(); // returns full document
  }

  async setRefreshTokenHash(userId: string, hash: string) {
    return this.userModel
      .findByIdAndUpdate(userId, { refreshTokenHash: hash })
      .exec();
  }

  // users.service.ts
  // async createUserWithProfile(data: any) {
  //   // 1️⃣ create base user
  //   const user = await this.createUser({
  //     name: data.name,
  //     email: data.email,
  //     phone: data.phone,
  //     cnic: data.cnic,
  //     password: data.password,
  //     role: data.role,
  //     instituteCode: data.instituteCode,
  //     institute: data.institute,
  //   });

  //   // 2️⃣ attach profile if provided
  //   if (data.profile && Object.keys(data.profile).length > 0) {
  //     await this.updateUserProfile(String(user._id), data.profile, "admin");
  //   }

  //   // 3️⃣ return populated user
  //   return this.findById(user._id);
  // }
  async createUserWithProfile(data: any) {
    const instituteId = this.normalizeInstitute(data.institute);

      await this.assertUserUniqueness({
    email: data.email,
    phone: data.phone,
    cnic: data.cnic,
  });



    const user = await this.createUser({
      name: data.name,
      email: data.email,
      phone: data.phone,
      cnic: data.cnic,
      password: data.password,
      role: data.role,
      instituteCode: data.instituteCode,
      institute: instituteId, // 🔥 FIXED
    });

    if (data.profile && Object.keys(data.profile).length > 0) {
      await this.updateUserProfile(String(user._id), data.profile, "admin");
    }

    return this.findById(user._id);
  }

  // async updateUserByAdmin(userId: string, data: any) {
  //   const { base, profile } = data;

  //   if (base) {
  //     await this.userModel.findByIdAndUpdate(userId, base, );
  //   }

  //   if (profile) {
  //     await this.updateUserProfile(userId, profile, "admin"); // 🔥 reuse logic
  //   }

  //   return this.findById(userId);
  // }

  async updateUserByAdmin(userId: string, data: any) {
    const { base, profile } = data;

    if (base?.institute) {
      base.institute = this.normalizeInstitute(base.institute);
    }

    if (base) {
      await this.userModel.findByIdAndUpdate(userId, base, { new: true });
    }

    if (profile) {
      await this.updateUserProfile(userId, profile, "admin");
    }

    return this.findById(userId);
  }

  async deleteUser(id: string) {
    return this.userModel.findByIdAndDelete(id);
  }

  async findByIds(ids: string[]) {
  return this.userModel.find(
    { _id: { $in: ids } },
    { name: 1, role: 1, profile: 1 }
  );
}

}
