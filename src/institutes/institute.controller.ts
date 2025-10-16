import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { InstitutesService } from "./institutes.service";
import { UsersService } from "../users/users.service";
import { Role } from "../common/roles.enum";

@Controller("institutes")
export class InstituteController {
  constructor(
    private readonly institutesService: InstitutesService,
    private readonly usersService: UsersService
  ) {}

  // ✅ Fetch all branch institutes created by the current director
  @UseGuards(JwtAuthGuard)
  @Get("my-branches")
  async getMyBranches(@Req() req: any) {
    console.log("✅ Req.user:", req.user);

    const { sub, role } = req.user;

    if (role !== Role.DIRECTOR) {
      throw new ForbiddenException("Only directors can view branches");
    }

    const director = await this.usersService.findById(sub);
    if (!director) throw new ForbiddenException("Director not found");

    const branches = await this.institutesService.findByDirectorId(sub);

    return {
      director: director.name,
      branches,
    };
  }

  // ✅ Create a new branch as a separate institute
  @UseGuards(JwtAuthGuard)
  @Post("create-branch")
  async createBranch(@Body() data: any, @Req() req: any) {
      console.log("🟢 create-branch called, req.user:", req.user);

    const { sub, role } = req.user;

    if (role !== Role.DIRECTOR) {
      throw new ForbiddenException("Only directors can create branches");
    }

    const director = await this.usersService.findById(sub);
    if (!director) throw new ForbiddenException("Director not found");

    if (!data.name || !data.city) {
      throw new BadRequestException("Branch name and city are required");
    }

    const code = this.generateInstituteCode();

    const branch = await this.institutesService.create({
      name: data.name,
      code,
      city: data.city,
      contactEmail: director.email,
      parentInstitute: data.parentInstituteId || director.institute,
      createdByDirector: director._id,
      settings: {
        tier: data.tier || "Standard",
        establishedYear: data.establishedYear || "",
        type: data.instituteType || "Private",
      },
    });

    return {
      message: "✅ Branch created successfully",
      branch,
    };
  }

  // 🔢 Helper to generate random branch code
  private generateInstituteCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from({ length: 6 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join("");
  }
}
