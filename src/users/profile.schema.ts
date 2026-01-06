// src/users/schemas/profile.schema.ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

@Schema({ _id: false })
export class ParentRef {
  @Prop({ type: Types.ObjectId, ref: "User" })
  parentId!: Types.ObjectId;

  @Prop() relation?: string; // father, mother, guardian
}

export const ParentRefSchema = SchemaFactory.createForClass(ParentRef);

@Schema({ _id: false })
export class Profile {
  // 🧍 Common fields
  @Prop() gender?: string;
  @Prop() dob?: string; // ISO string
  @Prop() address?: string;
  @Prop() cnic?: string;
  @Prop() nationality?: string;
  @Prop() bloodGroup?: string;
  @Prop() emergencyContact?: string;
  @Prop() profileImage?: string;
  @Prop() religion?: string;

  // 🧑‍🎓 STUDENT FIELDS
  @Prop({ unique: true, sparse: true }) rollNumber?: string;
  @Prop() studentId?: string;

  @Prop() className?: string;
  @Prop() section?: string;
  @Prop({ type: [String], default: [] }) subjects?: string[];
  @Prop() admissionDate?: string;
  @Prop() previousSchool?: string;

  // removed duplicate parent name storage - we keep links instead
  // keep guardian fields if you still want them:
  @Prop() guardianName?: string;
  @Prop() guardianRelation?: string;
  @Prop() guardianPhone?: string;
  @Prop() guardianAddress?: string;

  // reverse references to parents (for quick lookups)
  @Prop({ type: [ParentRefSchema], default: [] })
  parents?: ParentRef[]; // when student has 1..n parents

  @Prop({
  type: [
    {
      className: String,
      sectionName: String,
      roles: [String],
    },
  ],
  default: [],
})
classRoles?: {
  className: string;
  sectionName: string;
  roles: string[];
}[];


  // 👨‍🏫 TEACHER FIELDS
  @Prop({ unique: true, sparse: true }) teacherId?: string;
  @Prop() qualification?: string;
  @Prop() experience?: number;
  @Prop() specialization?: string;
  @Prop() department?: string;
  @Prop() designation?: string;
  @Prop({ type: [String], default: [] }) subjectsTaught?: string[];
  @Prop() joiningDate?: string;
  @Prop() salary?: number;
  @Prop() employmentStatus?: "active" | "on-leave" | "resigned";

  @Prop({
  type: [
    {
      className: String,
      sectionName: String,
      subject: String,
      isIncharge: Boolean,
    },
  ],
  default: [],
})
assignedClasses?: {
  className: string;
  sectionName: string;
  subject: string;
  isIncharge: boolean;
}[];


  // 👨‍💼 ADMIN / DIRECTOR FIELDS
  @Prop() instituteName?: string;
  @Prop() instituteCode?: string;
  @Prop() branchName?: string;
  @Prop() level?: string; // Director, Admin, Branch Manager
  @Prop() officePhone?: string;
  @Prop() joiningDateAdmin?: string;
  @Prop({ type: [String], default: [] }) responsibilities?: string[];
  @Prop() signatureImage?: string;

  // 👨‍👩‍👧 PARENT FIELDS
  @Prop({ unique: true, sparse: true }) parentId?: string; // optional unique parent code
  @Prop({ type: [Types.ObjectId], ref: "User", default: [] })
  childIds?: Types.ObjectId[];
  @Prop() relation?: string; // father/mother/guardian
  @Prop() occupation?: string;
  @Prop() workplace?: string;
  @Prop() monthlyIncome?: number;
  @Prop() educationLevel?: string;
  @Prop() emergencyPhone?: string;

  // 🚌 DRIVER FIELDS
  @Prop() vehicleNumber?: string;
  @Prop() licenseNumber?: string;
  @Prop() licenseExpiry?: string;
  @Prop() vehicleType?: string;
  @Prop() vehicleModel?: string;
  @Prop() vehicleCapacity?: number;
  @Prop() vehicleColor?: string;
  @Prop() assignedRoute?: string;
  @Prop({ unique: true, sparse: true }) driverId?: string;

  // 🧑‍💻 STAFF (non-teaching)
  @Prop({ unique: true, sparse: true }) staffId?: string;
  @Prop() roleTitle?: string; // clerk, librarian, peon
  @Prop() workShift?: string;
  @Prop() joinedOn?: string;
  @Prop() salaryStaff?: number;

  // 🧩 SYSTEM / LINK FIELDS
  @Prop({ type: Types.ObjectId, ref: "Institute" }) institute?: Types.ObjectId; // optional override
  @Prop({ type: Types.ObjectId, ref: "Institute" }) branch?: Types.ObjectId;
  @Prop() childId?: string; // single child id (legacy)
  @Prop() createdBy?: string; // userId who created
  @Prop() updatedBy?: string;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
