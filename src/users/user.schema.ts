import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { Role } from "../common/roles.enum";
import { Profile, ProfileSchema } from './profile.schema';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  name!: string;

   @Prop()
  cnic?: string;

  @Prop({ index: true, unique: true, sparse: true })
  email?: string;

  @Prop({ index: true, unique: true, sparse: true })
  phone?: string;

  @Prop({
    required: true,
    enum: Object.values(Role),
  })
  role!: Role;

    @Prop()
  password?: string;

  @Prop({ type: Types.ObjectId, ref: 'Institute', required: true })
  institute!: Types.ObjectId;

  @Prop({ required: true })
  instituteCode!: string;

  // ✅ Use subdocument schema now
  @Prop({ type: ProfileSchema, default: {} })
  profile!: Profile;

  @Prop()
  refreshTokenHash?: string;

  @Prop({ default: true })
  isActive!: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);




UserSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $exists: true } } }
);

UserSchema.index(
  { phone: 1 },
  { unique: true, partialFilterExpression: { phone: { $exists: true } } }
);










// import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
// import { Document, Types } from "mongoose";
// import { Role } from "../common/roles.enum";

// @Schema({ timestamps: true })
// export class User extends Document {
//   @Prop({ required: true })
//   name!: string;

//   @Prop()
//   cnic?: string;

//   @Prop({ index: true })
//   email?: string;

//   @Prop({ index: true })
//   phone?: string;

//   @Prop()
//   password?: string;

//   @Prop({
//     required: true,
//     enum: Object.values(Role),
//   })
//   role!: Role;

//   // ✅ Store reference to actual Institute document
//   @Prop({ type: Types.ObjectId, ref: "Institute", required: true })
//   institute!: Types.ObjectId;

//   // ✅ Store human-readable code alongside reference
//   @Prop({ required: true })
//   instituteCode!: string;

//   @Prop()
//   branch?: string;

// @Prop({ type: Object, default: {} })
// profile?: {
//   // 🧍 Common fields (applies to all users)
//   gender?: string;
//   dob?: string; // ISO string
//   address?: string;
//   cnic?: string; // in case general CNIC required
//   nationality?: string;
//   bloodGroup?: string;
//   emergencyContact?: string;
//   profileImage?: string;
//   religion?: string;

//   // 🧑‍🎓 STUDENT FIELDS
//   rollNumber?: string;
//   studentId?: string;
//   className?: string;
//   section?: string;
//   subjects?: string[];
//   admissionDate?: string;
//   previousSchool?: string;
//   fatherName?: string;
//   fatherCnic?: string;
//   motherName?: string;
//   motherCnic?: string;
//   guardianName?: string;
//   guardianRelation?: string;
//   guardianPhone?: string;
//   guardianAddress?: string;
//   transportRoute?: string;
//   hostelRoom?: string;
//   medicalConditions?: string;
//   attendancePercentage?: number;
  

//   // 👨‍🏫 TEACHER FIELDS
//   qualification?: string;
//   experience?: number;
//   specialization?: string;
//   department?: string;
//   designation?: string;
//   subjectsTaught?: string[];
//   joiningDate?: string;
//   salary?: number;
//   teacherId?: string;
//   employmentStatus?: "active" | "on-leave" | "resigned";

//   // 👨‍💼 ADMIN / DIRECTOR FIELDS
//   instituteName?: string;
//   instituteCode?: string;
//   branchName?: string;
//   level?: string; // e.g. "Director", "Admin", "Branch Manager"
//   officePhone?: string;
//   joiningDateAdmin?: string;
//   responsibilities?: string[];
//   signatureImage?: string;

//   // 👨‍👩‍👧 PARENT FIELDS
//   parentId?: string;
//   childIds?: string[]; // links to student(s)
//   relation?: string; // father, mother, guardian
//   occupation?: string;
//   workplace?: string;
//   monthlyIncome?: number;
//   educationLevel?: string;
//   emergencyPhone?: string;

//   // 🚌 DRIVER FIELDS
//   vehicleNumber?: string;
//   licenseNumber?: string;
//   licenseExpiry?: string;
//   vehicleType?: string;
//   vehicleModel?: string;
//   vehicleCapacity?: number;
//   vehicleColor?: string;
//   assignedRoute?: string;
//   driverId?: string;

//   // 🧑‍💻 STAFF (non-teaching) FIELDS
//   staffId?: string;
//   roleTitle?: string; // e.g. clerk, librarian, peon
//   workShift?: string;
//   joinedOn?: string;
//   salaryStaff?: number;

//   // 🧩 SYSTEM / LINK FIELDS
//   institute?: string; // references main institute id
//   branch?: string; // references sub-branch id
//   childId?: string; // single child (for single-link parent)
//   createdBy?: string; // userId who created this user
//   updatedBy?: string;
// };



//   @Prop()
//   refreshTokenHash?: string;

//   @Prop({ default: true })
//   isActive!: boolean;
// }

// export const UserSchema = SchemaFactory.createForClass(User);

// UserSchema.index(
//   { email: 1 },
//   { unique: true, partialFilterExpression: { email: { $exists: true } } }
// );

// UserSchema.index(
//   { phone: 1 },
//   { unique: true, partialFilterExpression: { phone: { $exists: true } } }
// );

