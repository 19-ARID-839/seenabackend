import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { User } from "./user.schema";
import * as bcrypt from "bcryptjs";

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  private generateCustomId(prefix: string, instituteCode: string): string {
    const year = new Date().getFullYear().toString().slice(-2); // e.g. "25"
    const random = Math.floor(1000 + Math.random() * 9000); // 4-digit unique part
    return `${instituteCode}-${prefix}-${year}${random}`;
  }

  async createUser(data: Partial<User>) {
    const copy: any = { ...data };

    // Hash password if provided
    if (copy.password) {
      const hash = await bcrypt.hash(copy.password, 10);
      copy.password = hash;
    }

    // Ensure institute reference is an ObjectId
    if (copy.institute && typeof copy.institute === "object") {
      copy.institute = copy.institute._id;
    }

    // Normalize code
    if (copy.instituteCode) {
      copy.instituteCode = copy.instituteCode.toUpperCase();
    }

    const createdUser = new this.userModel(copy);
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

 async updateUserProfile(userId: string, profile: any) {
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

    if (!profile.className)
      throw new BadRequestException("Class name is required");
    if (!profile.section)
      throw new BadRequestException("Section is required");
    if (!profile.subjects || profile.subjects.length === 0)
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

    if (!profile.qualification)
      throw new BadRequestException("Qualification is required");
    if (!profile.department)
      throw new BadRequestException("Department is required");
    if (!profile.subjectsTaught || profile.subjectsTaught.length === 0)
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

    if (!profile.studentId)
      throw new BadRequestException("Student ID is required to link child");

    // Find student by studentId within same institute
    const student = await this.userModel.findOne({
      "profile.studentId": profile.studentId,
      role: "student",
      institute: user.institute,
    });

    if (!student)
      throw new NotFoundException(
        "No student found with this ID in your institute"
      );

    // ✅ Add child link to parent
    await this.userModel.updateOne(
      { _id: user._id },
      {
        $addToSet: {
          "profile.childIds": student._id,
        },
        $set: {
          "profile.relation": profile.relation || "guardian",
        },
      }
    );

    // ✅ Add parent link to student
    await this.userModel.updateOne(
      { _id: student._id },
      {
        $addToSet: {
          "profile.parents": {
            parentId: user._id,
            relation: profile.relation || "guardian",
          },
        },
      }
    );
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

    if (!profile.licenseNumber)
      throw new BadRequestException("License number is required");
    if (!profile.vehicleNumber)
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

    if (!profile.instituteName)
      throw new BadRequestException("Institute name is required");
    if (!profile.level)
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
    ? "name email role institute profile"
    : "name email role institute profile.className profile.section profile.studentId";

  return this.userModel.find(query).select(selectFields).exec();
}

  async setRefreshTokenHash(userId: string, hash: string) {
    return this.userModel
      .findByIdAndUpdate(userId, { refreshTokenHash: hash })
      .exec();
  }
}
