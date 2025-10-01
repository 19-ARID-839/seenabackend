import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { InstitutesService } from '../institutes/institutes.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private institutesService: InstitutesService
  ) {}

  private signPayload(payload: any, opts?: any) {
    return this.jwtService.sign(payload, opts);
  }

  private generateInstituteCode(length = 6) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < length; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
  }

  async createTokens(user: any) {
    const payload = { sub: user._id, role: user.role, institute: user.institute || null };
    const accessToken = this.signPayload(payload, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
    const refreshToken = this.signPayload({ sub: user._id }, { secret: process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET + '_refresh'), expiresIn: '7d' });
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.usersService.setRefreshTokenHash(user._id, hash);
    return { accessToken, refreshToken };
  }

  // async register(data: any) {
  //   if (!data.email && !data.phone) {
  //     throw new BadRequestException('Email or phone is required');
  //   }

  //   // uniqueness checks
  //   if (data.email) {
  //     const exists = await this.usersService.findByEmail(data.email);
  //     if (exists) throw new BadRequestException('User with this email already exists');
  //   }
  //   if (data.phone) {
  //     const exists = await this.usersService.findByPhone(data.phone);
  //     if (exists) throw new BadRequestException('User with this phone already exists');
  //   }

  //   const role = (data.role || 'student').toLowerCase();

  //   let instituteId = null;

  //   if (role === 'director') {
  //     // create institute for director
  //     const code = this.generateInstituteCode();
  //     const institute = await this.institutesService.create({
  //       name: data.instituteName || `${data.name} Institute`,
  //       code,
  //       contactEmail: data.email || undefined,
  //       createdBy: data.email || data.phone || undefined
  //     });
  //     instituteId = institute._id;
  //   } else {
  //     if (!data.instituteCode) {
  //       throw new BadRequestException('Institute code is required for this role');
  //     }
  //     const institute = await this.institutesService.findByCode(data.instituteCode);
  //     if (!institute) throw new NotFoundException('Invalid institute code');
  //     instituteId = institute._id;
  //   }

  //   const user = await this.usersService.createUser({
  //     name: data.name,
  //     email: data.email,
  //     phone: data.phone,
  //     password: data.password,
  //     role,
  //     institute: instituteId
  //   });

  //   return this.createTokens(user);
  // }
async register(data: any) {
  if (!data.email && !data.phone) {
    throw new BadRequestException('Email or phone is required');
  }

  // uniqueness checks
  if (data.email) {
    const exists = await this.usersService.findByEmail(data.email);
    if (exists) throw new BadRequestException('User with this email already exists');
  }
  if (data.phone) {
    const exists = await this.usersService.findByPhone(data.phone);
    if (exists) throw new BadRequestException('User with this phone already exists');
  }

  const role = (data.role || 'student').toLowerCase();
  let instituteId = null;
  let instituteCode: string | null = null;

  if (role === 'director') {
    instituteCode = this.generateInstituteCode();
    const institute = await this.institutesService.create({
      name: data.instituteName || `${data.name} Institute`,
      code: instituteCode,
      contactEmail: data.email || undefined,
      createdBy: data.email || data.phone || undefined,
    });
    instituteId = institute._id;
  } else {
    if (!data.instituteCode) {
      throw new BadRequestException('Institute code is required for this role');
    }
    const institute = await this.institutesService.findByCode(data.instituteCode);
    if (!institute) throw new NotFoundException('Invalid institute code');
    instituteId = institute._id;
  }

  const user = await this.usersService.createUser({
    name: data.name,
    email: data.email,
    phone: data.phone,
    password: data.password,
    role,
    institute: instituteId,
  });

  const tokens = await this.createTokens(user);

  // ✅ fetch institute details
  const institute = await this.institutesService.findById(instituteId);

  return {
    ...tokens,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      institute: {
        id: institute._id,
        name: institute.name,
        code: institute.code,
      },
    },
  };
}






  async validateUser(emailOrPhone: string, pass: string) {
    const user = await this.usersService.validateUserByPassword(emailOrPhone, pass);
    if (!user) return null;
    return user;
  }

async login(emailOrPhone: string, password: string) {
  const user = await this.validateUser(emailOrPhone, password);
  if (!user) throw new UnauthorizedException('Invalid credentials');

  const tokens = await this.createTokens(user);

  // ✅ fetch institute details
  const institute = user.institute
    ? await this.institutesService.findById(user.institute.toString())
    : null;

  return {
    ...tokens,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      institute: institute
        ? {
            id: institute._id,
            name: institute.name,
            code: institute.code,
          }
        : null,
    },
  };
}


  async refresh(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.refreshTokenHash) throw new UnauthorizedException();
    const ok = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!ok) throw new UnauthorizedException();
    return this.createTokens(user);
  }
}
