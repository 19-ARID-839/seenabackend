// src/tasks/task.controller.ts
import { Controller, Post, Body, UseGuards, Req, Get, Param, Patch, Query, BadRequestException } from '@nestjs/common';
import { TaskService } from './task.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { SubmitTaskDto } from './dto/submit-task.dto';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  async createTask(@Body() dto: CreateTaskDto, @Req() req: any) {
    // req.user contains sub, role, institute
    return this.taskService.createTask(dto, req.user.sub, req.user.institute);
  }

  @Get('summary')
  async getSummary(@Req() req: any) {
    return this.taskService.getSummary(req.user.institute);
  }

  @Get()
  async listTasks(@Req() req: any, @Query('role') role?: string) {
    // role optional, fallback to req.user.role
    return this.taskService.getTasksForUser(req.user.sub, req.user.role, req.user.institute);
  }

  @Get(':id')
  async getTask(@Param('id') id: string) {
    return this.taskService.getTaskById(id);
  }

  @Patch(':id/progress')
  async updateProgress(@Param('id') id: string, @Body() dto: UpdateProgressDto, @Req() req: any) {
    return this.taskService.updateProgress(id, req.user.sub, dto);
  }

  @Post(':id/submit')
  async submitTask(@Param('id') id: string, @Body() dto: SubmitTaskDto, @Req() req: any) {
    return this.taskService.submitTask(id, req.user.sub, dto);
  }

  @Post(':id/submissions/:sid/approve')
  async approveSubmission(@Param('id') id: string, @Param('sid') sid: string, @Req() req: any) {
    // check role: only owner (assignedBy) or admin/principal/owner can approve
    // controller can check req.user.role or compare owner
    return this.taskService.approveSubmission(id, sid, req.user.sub);
  }

  @Get('search')
  async search(@Query('q') q: string, @Req() req: any) {
    if (!q) throw new BadRequestException('Query required');
    return this.taskService.searchTasks(req.user.sub, q);
  }
}
