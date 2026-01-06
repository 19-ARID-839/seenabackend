import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type LeaveRequestDocument = LeaveRequest & Document;

@Schema({ timestamps: true })
export class LeaveRequest {
  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  user!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Institute", required: true })
  institute!: Types.ObjectId;

  @Prop({ type: Date, required: true })
  from!: Date;

  @Prop({ type: Date, required: true })
  to!: Date;

  @Prop()
  reason?: string;

  @Prop({ type: String, default: "" })
  applicationText?: string;

  /** pending → approved → rejected → resubmitted */
  @Prop({
    enum: ["pending", "approved", "rejected", "resubmitted"],
    default: "pending",
  })
  status!: string;

  @Prop({ type: String })
className?: string;

@Prop({ type: String })
sectionName?: string;


  /** who approved / rejected */
  @Prop({ type: Types.ObjectId, ref: "User" })
  approver?: Types.ObjectId;

  /** current role expected to act */
  @Prop({
    enum: ["teacher", "principal", "admin"],
    default: "teacher",
  })
  currentApproverRole!: string;

  @Prop({
  type: [String],
  default: ["teacher"],
})
allowedApproverRoles!: string[];


  /** teacher approval deadline */
  @Prop({ type: Date })
  teacherDeadline?: Date;

  /** rejection reason by approver */
  @Prop()
  rejectionReason?: string;

  /** student response after rejection */
  @Prop()
  studentResubmissionText?: string;

  /** approval flags */
  @Prop({ default: false })
  isApprovedByTeacher?: boolean;

  @Prop({ default: false })
  isApprovedByPrincipal?: boolean;

  @Prop({ default: false })
  isApprovedByAdmin?: boolean;

  /** history for audit */
  @Prop({
    type: [
      {
        action: String,
        by: { type: Types.ObjectId, ref: "User" },
        role: String,
        note: String,
        at: Date,
      },
    ],
    default: [],
  })
  timeline!: any[];
  @Prop({ type: Types.ObjectId, ref: "User" })
createdBy!: Types.ObjectId;

@Prop({
  enum: ["student", "parent"],
})
createdByRole!: string;

@Prop({ type: Types.ObjectId, ref: "User" })
forStudent?: Types.ObjectId;

}


// @Schema({ timestamps: true })
// export class LeaveRequest {
//   @Prop({ type: Types.ObjectId, ref: "User", required: true })
//   user!: Types.ObjectId;

//   @Prop({ type: Types.ObjectId, ref: "Institute", required: true })
//   institute!: Types.ObjectId;

//   @Prop({ type: Date, required: true })
//   from!: Date;

//   @Prop({ type: Date, required: true })
//   to!: Date;

//   @Prop()
//   reason?: string;

//   @Prop({ type: String, default: "" })
//   applicationText?: string;

//   @Prop({
//     required: true,
//     enum: ["pending", "approved", "rejected"],
//     default: "pending",
//   })
//   status!: "pending" | "approved" | "rejected";

//   @Prop({ type: Types.ObjectId, ref: "User" })
//   approver?: Types.ObjectId;

//   @Prop({ type: Object, default: {} })
//   meta?: any;

//   @Prop({ type: Boolean, default: false })
//   isApprovedByAdmin?: boolean;

//   @Prop({ type: Boolean, default: false })
//   isApprovedByPrincipal?: boolean;

//   @Prop({ type: Boolean, default: false })
//   isApprovedByIncharge?: boolean;
// }

export const LeaveRequestSchema = SchemaFactory.createForClass(LeaveRequest);


// --- Now here if a student want update his request or change it by any mean we have have to give him an edit button on clicking a dialog will apear for editing the request for which we have to create api --- secned the rquest only apear to teacher for 2 or three hours if teacher perform or do not perfect approved/ reject opration the request will go to other higer roles like admin pricnipal, vice principal etc --- if request will be rejected by teacher or after timer by admin or other higer role in that reject time we have to give an input on reject cliking button so he can give reason for rejection of his request like if student say he is ill so teacher or admin can ask give me madical report etc so in that case another button will apear to to that student or user so he can give his perfect reason again for apprrovence of his request and for thse all we need apis --- giving all detail kindly give me changes and new api or schema changes or everything else so we can go futher