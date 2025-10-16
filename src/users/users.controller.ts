// src/users/users.controller.ts
import { Controller, Get, Put, Param, Body, Post, Query } from "@nestjs/common";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ✅ Get a user profile
  @Get(":id/profile")
  async getProfile(@Param("id") id: string) {
    return this.usersService.findById(id);
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

  const users = await this.usersService.findUsers(filters, fullProfile === "true");

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


  @Get(":driverId/students")
  async getStudentsForDriver(@Param("driverId") driverId: string) {
    return this.usersService.findStudentsForDriver(driverId);
  }
}
