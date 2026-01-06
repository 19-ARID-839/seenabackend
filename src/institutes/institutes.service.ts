import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Institute } from "./institute.schema";
import { Model, Types } from "mongoose";

@Injectable()
export class InstitutesService {
  generateInstituteCode() {
    throw new Error("Method not implemented.");
  }
  instituteModel: any;
  constructor(@InjectModel(Institute.name) private model: Model<Institute>) {}

  async create(data: Partial<Institute>) {
    const doc = new this.model(data);
    return doc.save();
  }

  // async create(data: Partial<Institute>) {
  //   const doc = new this.model(data);
  //   return doc.save();
  // }

  findByCode(code: string) {
    return this.model.findOne({ code }).exec();
  }

async findByDirectorId(directorId: string) {
  const branches = await this.model
    .find({ createdByDirector: new Types.ObjectId(directorId) })
    .sort({ createdAt: -1 })
    .exec();

  console.log("📦 Found branches for director:", directorId, branches);
  return branches;
}


  async findById(id: string) {
    const ins = await this.model.findById(id).exec();
    if (!ins) throw new NotFoundException("Institute not found");
    return ins;
  }

  async findByInstituteId(id: string) {
    const ins = await this.model.findOne({ code: id }).exec();
    if (!ins) throw new NotFoundException("Institute not found");
    return ins;
  }

async getInstituteById(id: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new NotFoundException('Invalid institute ID');
  }

  const institute = await this.model.findById(id).lean(); // ✅ use this.model
  if (!institute) {
    throw new NotFoundException('Institute not found');
  }

  return institute;
}

}
