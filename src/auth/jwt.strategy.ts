import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import * as dotenv from 'dotenv';

dotenv.config(); // ✅ make sure .env is loaded before using process.env

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    console.log('🧩 JwtStrategy using secret:', process.env.JWT_SECRET);

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'change_this_secret',
    });
  }

  async validate(payload: any) {
    console.log('🎯 JwtStrategy.validate payload:', payload);
    return {
      sub: payload.sub,
      role: payload.role,
      institute: payload.institute,
    };
  }
}


// import { Injectable } from "@nestjs/common";
// import { PassportStrategy } from "@nestjs/passport";
// import { ExtractJwt, Strategy } from "passport-jwt";

// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy) {
//   constructor() {
//     super({
//       jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//       ignoreExpiration: false,
//       secretOrKey: process.env.JWT_SECRET || "change_this_secret",
//     });
//   }

//   async validate(payload: any) {
//     console.log("✅ JWT Payload validated:", payload); // 👈 Add this temporarily

//     // ✅ Must return an object that JwtAuthGuard sets as req.user
//     return {
//       sub: payload.sub,
//       role: payload.role,
//       institute: payload.institute,
//     };
//   }
// }

