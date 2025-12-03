import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Club, ClubSchema } from './club.schema';
import { ClubService } from './club.service';
import { ClubController } from './club.controller';
import { ClubGateway } from './club.gateway';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClubDocument } from './club.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Club.name, schema: ClubSchema }])],
  controllers: [ClubController],
  providers: [
    ClubGateway,
    ClubService,
    {
      provide: 'SOCKET_SERVER',
      useFactory: (gateway: ClubGateway) => gateway.server,
      inject: [ClubGateway],
    },
  ],
  exports: [ClubService],
})
export class ClubModule implements OnModuleInit {
  constructor(
    @InjectModel(Club.name) private clubModel: Model<ClubDocument>,
  ) {}

async onModuleInit() {
  const existing = await this.clubModel.findOne({ slug: 'global-student-club' });
  if (!existing) {
    // COMMENT THIS OUT TEMPORARILY
    // await this.clubModel.create({
    //   name: 'Global Student Community',
    //   slug: 'global-student-club',
    //   isPublic: true,
    //   members: [],
    //   messages: [],
    // });
    // console.log('🌍 Global Student Club created automatically!');
  }
}

}
