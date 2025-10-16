import { Controller, Post, Body, Get, Query, Param, Put, BadRequestException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { CreateLeaveDto, ApproveLeaveDto } from './dto/leave.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  /** Mark single attendance (create or update) */
  @Post('mark')
  async mark(@Body() body: CreateAttendanceDto) {
    return this.attendanceService.markAttendance(body as any);
  }


  /** Bulk mark attendance for many users */
  @Post('bulk')
  async bulk(@Body() body: BulkAttendanceDto) {
    return this.attendanceService.bulkMark(body.institute, body.items);
  }

  /** Get attendance for a user (use query params from/to) */
  @Get('user/:id')
  async getUserAttendance(@Param('id') id: string, @Query() q: QueryAttendanceDto) {
    return this.attendanceService.getAttendanceByRole(id, q.from, q.to);
  }

  

  /** Summary by status (present/absent/late/etc) for an institute, optional role filter */
  @Get('summary')
  async summary(@Query() q: QueryAttendanceDto) {
if (!q.instituteId) throw new BadRequestException('instituteId is required');
    return this.attendanceService.getAttendanceSummary(q.instituteId, q.from, q.to, q.role);
  }

  /** Monthly chart data for an institute (and optional user) */
  @Get('chart/month')
  async monthlyChart(@Query() q: { instituteId: string; year: string; month: string; userId?: string }) {
    const year = parseInt(q.year || String(new Date().getUTCFullYear()), 10);
    const month = parseInt(q.month || String(new Date().getUTCMonth() + 1), 10);
    return this.attendanceService.monthlyChart(q.instituteId, year, month, q.userId);
  }

  /** Leave endpoints */
  @Post('leave')
  async requestLeave(@Body() body: CreateLeaveDto) {
    return this.attendanceService.requestLeave(body as any);
  }

  @Get('leave')
  async listLeaves(@Query() q: { institute?: string; user?: string; status?: string }) {
    return this.attendanceService.listLeaves(q);
  }

  @Put('leave/:id/approve')
  async approveLeave(@Param('id') id: string, @Body() body: ApproveLeaveDto) {
    return this.attendanceService.approveLeave(id, body.approver, !!body.approve, body.notes);
  }

  // ✅ NEW ENDPOINT: update single attendance status
  // @Put('update')
  // async updateAttendanceStatus(
  //   @Body('studentId') studentId: string,
  //   @Body('instituteId') instituteId: string,
  //   @Body('date') date: string,
  //   @Body('status') status: string,
  //   @Req() req: any,
  // ) {
  //   if (!studentId || !instituteId || !status) {
  //     throw new BadRequestException('Missing required fields');
  //   }

  //   const updated = await this.attendanceService.updateAttendanceStatus(
  //     studentId,
  //     instituteId,
  //     date,
  //     status,
  //     req.user?._id, // optional for tracking who made the change
  //   );

  //   return {
  //     message: 'Attendance updated successfully',
  //     data: updated,
  //   };
  // }
}
