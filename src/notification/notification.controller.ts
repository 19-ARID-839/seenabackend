import { Body, Controller, Get, Post, Param, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /** Send a new notification */
  @Post('send')
  async send(@Body() body: any, @Req() req: any) {
    const senderId = req.user?.sub || body.sender; // fallback
    return this.notificationService.sendNotification({
      sender: senderId,
      receiver: body.receiver,
      institute: body.institute,
      messageType: body.messageType,
      medium: body.medium,
      message: body.message,
      meta: body.meta,
    });
  }

  /** Get all notifications sent by current user */
  @Get('sent')
  async getSent(@Req() req: any) {
    const userId = req.user?.sub;
    return this.notificationService.getSentNotifications(userId);
  }

  /** Get all notifications received by current user */
  @Get('received')
  async getReceived(@Req() req: any) {
    const userId = req.user?.sub;
    return this.notificationService.getReceivedNotifications(userId);
  }

  /** Admin: get sent notifications by a specific user */
  @Get('sent/:id')
  async getSentByUser(@Param('id') id: string) {
    return this.notificationService.getSentNotifications(id);
  }

  // notification.controller.ts
@Get('user/:id')
@UseGuards(JwtAuthGuard)
async getUserNotifications(@Param('id') id: string) {
  return this.notificationService.getUserNotifications(id);
}

 @Post('complaint')
  async sendComplaint(@Body() body: any, @Req() req: any) {
    const senderId = req.user?.sub;
    if (!senderId) throw new BadRequestException('Unauthorized');

    const { message, receiverRole, institute, isAnonymous = true, messageType = 'complaint', medium = 'in-app' } = body;
    if (!message || !receiverRole || !institute) {
      throw new BadRequestException('Missing required fields: message, receiverRole, institute');
    }

    return this.notificationService.sendRoleNotification({
      sender: senderId,
      receiverRole,
      institute,
      messageType,
      medium,
      message,
      isAnonymous,
    });
  }

  // Updated user notifications endpoint — use req.user to determine id+role
  @Get('me')
  async getMyNotifications(@Req() req: any) {
    const userId = req.user?.sub;
    const userRole = req.user?.role;
    return this.notificationService.getUserNotifications(userId, userRole);
  }

}
