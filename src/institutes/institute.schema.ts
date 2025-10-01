import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Institute extends Document {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true })
  code!: string;

  @Prop()
  address?: string;

  @Prop()
  contactEmail?: string;

  @Prop()
  contactPhone?: string;

  @Prop({ type: Object, default: {} })
  settings?: any;

  @Prop()
  createdBy?: string;
}

export const InstituteSchema = SchemaFactory.createForClass(Institute);
