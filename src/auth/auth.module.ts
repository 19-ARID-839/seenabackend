import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import { InstitutesModule } from '../institutes/institutes.module';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/user.schema';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    forwardRef(() => InstitutesModule),
    PassportModule.register({ defaultStrategy: 'jwt' }), // ✅ Important
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'change_this_secret',
      signOptions: { expiresIn: '1h' },
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtStrategy], // ✅ Important for other modules (like Institutes)
})
export class AuthModule {}


// // src/auth/auth.module.ts
// import { Module, forwardRef } from '@nestjs/common';
// import { JwtModule } from '@nestjs/jwt';
// import { PassportModule } from '@nestjs/passport';
// import { MongooseModule } from '@nestjs/mongoose';
// import { UsersModule } from '../users/users.module';
// import { AuthService } from './auth.service';
// import { AuthController } from './auth.controller';
// import { User, UserSchema } from '../users/user.schema';
// import { JwtStrategy } from './jwt.strategy';
// import { InstitutesModule } from '../institutes/institutes.module';

// @Module({
//   imports: [
//     PassportModule.register({ defaultStrategy: 'jwt' }), // ✅ register passport-jwt
//     JwtModule.register({
//       secret: process.env.JWT_SECRET || 'change_this_secret',
//       signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '15m' },
//     }),
//     MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
//     forwardRef(() => UsersModule),     // ✅ avoid circular dependencies
//     forwardRef(() => InstitutesModule) // ✅ avoid circular dependencies
//   ],
//   providers: [AuthService, JwtStrategy],
//   controllers: [AuthController],
//   exports: [AuthService, JwtStrategy, JwtModule, PassportModule], // ✅ make available elsewhere
// })
// export class AuthModule {}
