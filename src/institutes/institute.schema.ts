import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Institute extends Document {
  static code(code: any) {
    throw new Error('Method not implemented.');
  }
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true })
  code!: string; // Generated institute code like “CGH472”

  @Prop()
  address?: string;

  @Prop()
  city?: string;

  @Prop()
  instituteType?: string; // Private, Public, NGO, Trust, etc.

  @Prop()
  establishedYear?: string;

  @Prop({ type: Array, default: [] })
  branches?: {
    name: string;
    city: string;
    address?: string;
    contactEmail?: string;
    contactPhone?: string;
  }[];

  @Prop()
  contactEmail?: string;

  @Prop()
  contactPhone?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  director?: Types.ObjectId; // Who owns/created this institute

  @Prop({ type: Object, default: {} })
  settings?: Record<string, any>;

  @Prop()
  createdBy?: string;

    // ✅ Add these
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Institute', default: null })
  parentInstitute?: mongoose.Types.ObjectId; // the main HQ or root branch

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  createdByDirector!: mongoose.Types.ObjectId;
}

export const InstituteSchema = SchemaFactory.createForClass(Institute);



// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { Document } from 'mongoose';

// @Schema({ timestamps: true })
// export class Institute extends Document {
//   @Prop({ required: true })
//   name!: string;

//   @Prop({ required: true, unique: true })
//   code!: string;

//   @Prop()
//   address?: string;

//   @Prop()
//   contactEmail?: string;

//   @Prop()
//   contactPhone?: string;

//   @Prop({ type: Object, default: {} })
//   settings?: any;

//   @Prop()
//   createdBy?: string;
// }

// export const InstituteSchema = SchemaFactory.createForClass(Institute);
