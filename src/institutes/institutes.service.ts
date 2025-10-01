import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Institute } from './institute.schema';
import { Model } from 'mongoose';

@Injectable()
export class InstitutesService {
  constructor(@InjectModel(Institute.name) private model: Model<Institute>) {}

  async create(data: Partial<Institute>) {
    const doc = new this.model(data);
    return doc.save();
  }

  async findByCode(code: string) {
    return this.model.findOne({ code }).exec();
  }

  async findById(id: string) {
    const ins = await this.model.findById(id).exec();
    if (!ins) throw new NotFoundException('Institute not found');
    return ins;
  }
}
