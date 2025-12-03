// src/users/users.controller.ts
import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Post,
  Query,
  UseGuards,
  Req,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ✅ Get a user profile
  @Get(":id/profile")
  async getProfile(@Param("id") id: string) {
    return this.usersService.findById(id);
  }

  @Get("check-required-roles/:instituteId")
  async checkRequiredRoles(@Param("instituteId") instituteId: string) {
    return this.usersService.checkRequiredRoles(instituteId);
  }

  // ✅ Update a user profile
  // user.controller.ts
  @Post(":id/profile")
  async updateProfile(@Param("id") id: string, @Body() profile: any) {
    // ✅ prevent full user being saved in profile
    delete profile._id;
    delete profile.name;
    delete profile.email;
    delete profile.phone;
    delete profile.password;
    delete profile.role;
    delete profile.institute;
    delete profile.isActive;
    delete profile.refreshTokenHash;
    delete profile.createdAt;
    delete profile.updatedAt;
    delete profile.__v;

    return this.usersService.updateUserProfile(id, profile);
  }

  // 🧭 GET /users — Fetch users by filters (role, institute, etc.)
  @Get()
  async findAll(
    @Query("role") role?: string,
    @Query("institute") institute?: string,
    @Query("className") className?: string,
    @Query("fullProfile") fullProfile?: string
  ) {
    const filters: any = {};

    if (role) filters.role = role.toLowerCase();
    if (institute) filters.institute = institute;
    if (className) filters["profile.className"] = className;

    const users = await this.usersService.findUsers(
      filters,
      fullProfile === "true"
    );

    // 🎯 For dropdown (students only, and not full profile)
    if (role?.toLowerCase() === "student" && fullProfile !== "true") {
      return users.map((u) => ({
        _id: u._id,
        name: u.name,
        studentId: u.profile?.studentId,
        className: u.profile?.className,
        section: u.profile?.section,
      }));
    }

    return users;
  }

  @Get("full")
  async findAllFull(
    @Query("role") role?: string,
    @Query("institute") institute?: string,
    @Query("className") className?: string
  ) {
    const filters: any = {};

    if (role) filters.role = role.toLowerCase();
    if (institute) filters.institute = institute;
    if (className) filters["profile.className"] = className;

    const users = await this.usersService.findUsers(filters, true); // ✅ fullProfile = true
    return users;
  }

  @Get("all")
  @UseGuards(JwtAuthGuard)
  async getAllUsers(@Req() req: any) {
    const instituteId = req.user?.institute;

    if (!instituteId) {
      throw new UnauthorizedException("Authentication failed (no institute)");
    }

    const users = await this.usersService.findUsers(
      { institute: instituteId },
      true
    );

    return users.map((u) => ({
      _id: u._id,
      name: u.name,
      role: u.role,
      email: u.email,
      className: u.profile?.className,
      section: u.profile?.section,
    }));
  }

  @Get(":driverId/students")
  async getStudentsForDriver(@Param("driverId") driverId: string) {
    return this.usersService.findStudentsForDriver(driverId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("institute")
  async getInstituteUsers(@Req() req: any) {
    const user = req.user; // Comes from JWT
    return this.usersService.getUsersByInstitute(user.institute);
  }
}
