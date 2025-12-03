import { Controller, Post, Get, Body, Param, UseGuards, Req, Query, UploadedFiles, UseInterceptors, BadRequestException } from '@nestjs/common';
import { ClubService } from './club.service';
import { CreateClubDto } from './dto/create-club.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('clubs')
@UseGuards(JwtAuthGuard)
export class ClubController {
  constructor(private readonly clubService: ClubService) {}

  @Post()
  async createClub(@Body() dto: CreateClubDto, @Req() req: any) {
    return this.clubService.createClub(dto, req.user.sub);
  }

  @Get()
  async listClubs(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.clubService.getClubs({}, Number(page), Number(limit));
  }

  @Get(':id')
  async getClub(@Param('id') id: string) {
    return this.clubService.getClubById(id);
  }

  @Post(':id/join')
  async join(@Param('id') id: string, @Req() req: any) {
    return this.clubService.joinClub(id, req.user.sub);
  }

  @Post(':id/leave')
  async leave(@Param('id') id: string, @Req() req: any) {
    return this.clubService.leaveClub(id, req.user.sub);
  }

//   // send message via REST (multipart for attachments)
//   @Post(':id/message')
// //   @UseInterceptors(FilesInterceptor('files')) // multipart field 'files'
//   async sendMessage(
//     @Param('id') id: string,
//     @UploadedFiles() files: Express.Multer.File[],
//     @Body() body: any,
//     @Req() req: any,
//   ) {
//     // if files exist, process & store them (see notes below)
//     const attachments = Array.isArray(body.attachments) ? body.attachments : [];

//     // If files exist in multipart form, map them to attachments (you'll upload to GridFS/S3)
//     if (files && files.length) {
//       // Placeholder: you must implement actual file upload logic that returns file url/id
//       const processed = files.map((f) => ({
//         url: `/uploads/${f.filename}`, // replace with actual file location (GridFS id or S3 url)
//         filename: f.originalname,
//         mimeType: f.mimetype,
//         size: f.size,
//         uploadedBy: req.user.sub,
//       }));
//       attachments.push(...processed);
//     }

//     const dto: SendMessageDto = {
//       text: body.text,
//       attachments,
//       type: body.type,
//     };

//     return this.clubService.sendMessage(id, req.user.sub, dto);
//   }

//   @Get(':id/messages')
//   async getMessages(@Param('id') id: string, @Query('page') page = '1', @Query('limit') limit = '50') {
//     return this.clubService.getMessages(id, Number(page), Number(limit));
//   }

  @Post(':id/messages/:mid/read')
  async markRead(@Param('id') id: string, @Param('mid') mid: string, @Req() req: any) {
    return this.clubService.markRead(id, mid, req.user.sub);
  }

  @Get(':id/search')
  async search(@Param('id') id: string, @Query('q') q: string) {
    if (!q) throw new BadRequestException('Query required');
    return this.clubService.searchMessages(id, q);
  }


  /// ======================================================

  @Get(':clubId/messages')
async getMessages(@Param('clubId') clubId: string) {
  return this.clubService.getMessages(clubId);
}

@Post(':clubId/message')
async sendMessage(
  @Param('clubId') clubId: string,
  @Body() dto: SendMessageDto,
  @Req() req: any
) {
  return this.clubService.sendMessage(clubId, req.user.sub, dto);
}

}
