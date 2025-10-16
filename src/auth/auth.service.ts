import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { InstitutesService } from "../institutes/institutes.service";
import { Role } from "src/common/roles.enum";
import { use } from "passport";

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
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    let exists = true
    for (let i = 0; i < length; i++)
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
  }

  async createTokens(user: any) {
    console.log("🔐 Signing token with secret:", process.env.JWT_SECRET);

    const payload = {
      sub: user._id,
      role: user.role,
      institute: user.institute || null,
    };

    // ✅ Access Token
    const accessToken = this.signPayload(payload, {
      secret: process.env.JWT_SECRET || "change_this_secret",
      expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    });

    // ✅ Refresh Token
    const refreshToken = this.signPayload(
      { sub: user._id },
      {
        secret:
          process.env.JWT_REFRESH_SECRET ||
          (process.env.JWT_SECRET || "change_this_secret") + "_refresh",
        expiresIn: "7d",
      }
    );

    const hash = await bcrypt.hash(refreshToken, 10);
    await this.usersService.setRefreshTokenHash(user._id, hash);

    return { accessToken, refreshToken };
  }

  async registerFullInstitute(data: any) {
    // ✅ Validate director info
    if (!data.directorEmail || !data.password)
      throw new BadRequestException("Director email and password are required");

    // ✅ Check duplicate director
    const existing = await this.usersService.findByEmail(data.directorEmail);
    if (existing)
      throw new BadRequestException("Director with this email already exists");

    // ✅ Generate Institute code
    const code = this.generateInstituteCode();

    // ✅ Create Institute
    const institute = await this.institutesService.create({
      name: data.instituteName,
      code,
      address: data.city || "",
      contactEmail: data.directorEmail,
      createdBy: data.directorEmail,
      settings: {
        type: data.instituteType,
        branch: data.branch,
        establishedYear: data.establishedYear,
        registrationNo: data.registrationNo,
      },
    });

    // ✅ Create Director
    const director = await this.usersService.createUser({
      name: data.directorName,
      email: data.directorEmail,
      phone: data.directorPhone,
      password: data.password,
      cnic: data.directorCnic,
      role: Role.DIRECTOR,
      institute: institute._id,
    });

    // ✅ Create other roles (Principal, Vice Principal, Admin)
    const defaultPassword = "123456";

    const rolesToCreate = [
      { info: data.principal, role: Role.PRINCIPAL },
      { info: data.vicePrincipal, role: Role.VICEPRINCIPAL },
      { info: data.admin, role: Role.ADMIN },
    ];

    for (const { info, role } of rolesToCreate) {
      if (info?.name) {
        await this.usersService.createUser({
          name: info.name,
          email: info.email,
          phone: info.phone,
          password: defaultPassword,
          role,
          institute: institute._id,
          cnic: info.cnic,
        });
      }
    }

    // ✅ Create tokens for director
    const tokens = await this.createTokens(director);

    return {
      message: "Institute and users created successfully",
      institute: {
        id: institute._id,
        name: institute.name,
        code: institute.code,
      },
      director: {
        id: director._id,
        name: director.name,
        email: director.email,
      },
      ...tokens,
    };
  }

  async userRegister(data: any) {
    // 🧩 Validate basic info
    if (!data.email && !data.phone) {
      throw new BadRequestException("Email or phone is required");
    }

    if (data.email && (await this.usersService.findByEmail(data.email))) {
      throw new BadRequestException("User with this email already exists");
    }

    if (data.phone && (await this.usersService.findByPhone(data.phone))) {
      throw new BadRequestException("User with this phone already exists");
    }

    const role = (data.role || "student").toLowerCase();

    if (role === Role.DIRECTOR) {
      throw new BadRequestException("Cannot register as director");
    }

    // 🏫 Validate institute/branch code
    if (!data.instituteCode) {
      throw new BadRequestException("Institute or branch code is required");
    }

    const foundInstitute = await this.institutesService.findByCode(
      data.instituteCode.toUpperCase()
    );

    if (!foundInstitute) {
      throw new NotFoundException("Invalid institute or branch code");
    }

    // ✅ Create new user linked with both ObjectId & readable code
    const user = await this.usersService.createUser({
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
      role,
      institute: foundInstitute._id, // MongoDB relation
      instituteCode: foundInstitute.code, // readable
      cnic: data.cnic,
    });

    const tokens = await this.createTokens(user);

    return {
      ...tokens,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        institute: {
          id: foundInstitute._id,
          name: foundInstitute.name,
          code: foundInstitute.code,
        },
      },
    };
  }

  async validateUser(emailOrPhone: string, pass: string) {
    const user = await this.usersService.validateUserByPassword(
      emailOrPhone,
      pass
    );
    if (!user) return null;
    return user;
  }

  async login(emailOrPhone: string, password: string) {
    const user = await this.validateUser(emailOrPhone, password);
    if (!user) throw new UnauthorizedException("Invalid credentials");

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

// async register(data: any) {
//   if (!data.email && !data.phone) {
//     throw new BadRequestException("Email or phone is required");
//   }

//   // uniqueness checks
//   if (data.email) {
//     const exists = await this.usersService.findByEmail(data.email);
//     if (exists)
//       throw new BadRequestException("User with this email already exists");
//   }
//   if (data.phone) {
//     const exists = await this.usersService.findByPhone(data.phone);
//     if (exists)
//       throw new BadRequestException("User with this phone already exists");
//   }

//   const role = (data.role || "student").toLowerCase();
//   let instituteId = null;
//   let instituteCode: string | null = null;

//   if (role === "director") {
//     instituteCode = this.generateInstituteCode();
//     const institute = await this.institutesService.create({
//       name: data.instituteName || `${data.name} Institute`,
//       code: instituteCode,
//       contactEmail: data.email || undefined,
//       createdBy: data.email || data.phone || undefined,
//     });
//     instituteId = institute._id;
//   } else {
//     if (!data.instituteCode) {
//       throw new BadRequestException(
//         "Institute code is required for this role"
//       );
//     }
//     const institute = await this.institutesService.findByCode(
//       data.instituteCode
//     );
//     if (!institute) throw new NotFoundException("Invalid institute code");
//     instituteId = institute._id;
//   }

//   const user = await this.usersService.createUser({
//     name: data.name,
//     email: data.email,
//     phone: data.phone,
//     password: data.password,
//     role,
//     institute: instituteId,
//   });

//   const tokens = await this.createTokens(user);

//   // ✅ fetch institute details
//   const institute = await this.institutesService.findById(instituteId);

//   return {
//     ...tokens,
//     user: {
//       id: user._id,
//       name: user.name,
//       email: user.email,
//       phone: user.phone,
//       role: user.role,
//       institute: {
//         id: institute._id,
//         name: institute.name,
//         code: institute.code,
//       },
//     },
//   };
// }
// async register(data: any) {
//   // 1️⃣ Basic checks
//   if (!data.directorEmail)
//     throw new BadRequestException("Director email required");
//   if (!data.instituteName)
//     throw new BadRequestException("Institute name required");

//   // 2️⃣ Ensure no duplicate director user
//   const existing = await this.usersService.findByEmail(data.directorEmail);
//   if (existing) throw new BadRequestException("Director already exists");

//   // 3️⃣ Create Institute + code
//   const instituteCode = this.generateInstituteCode();
//   const institute = await this.institutesService.create({
//     name: data.instituteName,
//     code: instituteCode,
//     contactEmail: data.directorEmail,
//     contactPhone: data.directorPhone,
//     createdBy: data.directorEmail,
//   });

//   // 4️⃣ Create Director (main user)
//   const director = await this.usersService.createUser({
//     name: data.directorName,
//     email: data.directorEmail,
//     phone: data.directorPhone,
//     password: data.password,
//     role: "director",
//     institute: institute._id,
//   });

//   // 5️⃣ Create default subordinate users
//   const roles = [
//     { key: "principal", role: "principal" },
//     { key: "vicePrincipal", role: "vice_principal" },
//     { key: "admin", role: "admin" },
//   ];

//   for (const r of roles) {
//     const info = (data as any)[r.key];
//     if (info?.email || info?.name) {
//       await this.usersService.createUser({
//         name: info.name,
//         email: info.email,
//         phone: info.phone,
//         password: "123456", // default
//         role: r.role,
//         institute: institute._id,
//       });
//     }
//   }

//   // 6️⃣ Create Tokens for Director
//   const tokens = await this.createTokens(director);

//   return {
//     ...tokens,
//     user: {
//       id: director._id,
//       name: director.name,
//       email: director.email,
//       role: director.role,
//       institute: {
//         id: institute._id,
//         name: institute.name,
//         code: institute.code,
//       },
//     },
//   };
// }
