import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role } from '../common/interfaces';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  name!: string;

  @Prop({ index: true })
  email?: string;

  @Prop({ index: true })
  phone?: string;

  @Prop()
  password?: string;

  @Prop({ required: true, enum: ['student','teacher','parent','admin','director','principal','driver'] })
  role!: Role;

  @Prop({ type: Object, default: {} })
  profile: any;

  @Prop()
  refreshTokenHash?: string;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Institute' })
  institute?: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $exists: true } } });
UserSchema.index({ phone: 1 }, { unique: true, partialFilterExpression: { phone: { $exists: true } } });
