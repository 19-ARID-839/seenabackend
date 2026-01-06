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
  Delete,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import e from "express";
// import { RolesGuard } from "src/auth/roles.guard";
import { Role } from "src/common/interfaces";
import { Types } from "mongoose";

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

  // @Post("admin/create")
  // @UseGuards(JwtAuthGuard)
  // createUserWithProfile(@Body() data: any, @Req() req: any) {
  //   return this.usersService.createUserWithProfile({
  //     ...data,
  //     institute: req.user.institute, // ✅ FROM TOKEN
  //   });
  // }

  @Post("admin/create")
  @UseGuards(JwtAuthGuard)
  createUserWithProfile(@Body() data: any, @Req() req: any) {
    const instituteId = Types.ObjectId.isValid(req.user.institute)
      ? new Types.ObjectId(req.user.institute)
      : req.user.institute?._id;

    return this.usersService.createUserWithProfile({
      ...data,
      institute: instituteId, // ✅ ALWAYS ObjectId
    });
  }

  @Put("admin/:id")
  @UseGuards(JwtAuthGuard)
  updateUserByAdmin(@Param("id") id: string, @Body() body: any) {
    return this.usersService.updateUserByAdmin(id, body);
  }

  @Delete("admin/:id")
  @UseGuards(JwtAuthGuard)
  deleteUser(@Param("id") id: string) {
    return this.usersService.deleteUser(id);
  }

  // 🧭 GET /users — Fetch users by filters (role, institute, etc.)
  // users.controller.ts
  @Get()
  async findAll(
    @Req() req: any,
    @Query("role") role?: string,
    @Query("className") className?: string,
    @Query("fullProfile") fullProfile?: string
  ) {
    console.log("REQ.USER:", req.user);

    const filters: any = {};

    if (role) filters.role = role.toLowerCase();
    if (className) filters["profile.className"] = className;

    // 🔑 Use director access instead of single institute
    // filters["institute.director"] = req.user.id;

    const users = await this.usersService.findUsers(
      filters,
      fullProfile === "true"
    );

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

  // users.controller.ts
  @Get("allforadmin")
  async findAllUsers(
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

  // // simplified mapping for students
  // if (role?.toLowerCase() === "student" && fullProfile !== "true") {
  //   return users.map((u) => ({
  //     _id: u._id,
  //     name: u.name,
  //     email: u.email,
  //     phone: u.phone,
  //     cnic: u.cnic,
  //     // studentId: u.profile?.studentId,
  //     // className: u.profile?.className,
  //     // section: u.profile?.section,
  //   }));
  // }

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

  //   @Get("children")
  // // async getParentChildren(@Query("parentId") parentId: string) {
  // //   const parent = await this.userModel.findById(parentId);

  // //   return this.userModel.find({
  // //     _id: { $in: parent.profile.childIds },
  // //     role: "student"
  // //   }).select("name studentId className section");
  //   async getParentChildren(@Query("parentId") parentId: string) {
  //     return this.usersService.getChildrenOfParent(parentId);
  //   }

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

  @Post("by-ids")
  async getUsersByIds(@Body("ids") ids: string[]) {
    return this.usersService.findByIds(ids);
  }
}
