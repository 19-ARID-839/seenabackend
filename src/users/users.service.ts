import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async createUser(data: Partial<User>) {
    const copy: any = { ...data };
    if (copy.password) {
      const hash = await bcrypt.hash(copy.password, 10);
      copy.password = hash;
    }
    const created = new this.userModel(copy);
    return created.save();
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  async findByPhone(phone: string) {
    return this.userModel.findOne({ phone }).exec();
  }

  async findById(id: string) {
    const u = await this.userModel.findById(id).exec();
    if (!u) throw new NotFoundException('User not found');
    return u;
  }

  async validateUserByPassword(emailOrPhone: string, plain: string) {
    const user = emailOrPhone.includes('@') ? await this.findByEmail(emailOrPhone) : await this.findByPhone(emailOrPhone);
    if (!user || !user.password) return null;
    const match = await bcrypt.compare(plain, user.password);
    if (!match) return null;
    return user;
  }

  async setRefreshTokenHash(userId: string, hash: string) {
    return this.userModel.findByIdAndUpdate(userId, { refreshTokenHash: hash }).exec();
  }
}
