import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { InstitutesModule } from './institutes/institutes.module';
import * as dotenv from 'dotenv';
import { AttendanceModule } from './attendance/attendance.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ClassesModule } from './classes/classes.module';
import { NotificationModule } from './notification/notification.module';
import { ClubModule } from './club/club.module';
import { TaskModule } from './tasks/task.module';
import { FinanceModule } from './finance/finance.module';

dotenv.config();

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/seena_dev'),
    AuthModule,
    UsersModule,
    InstitutesModule,
    AttendanceModule,
    ClassesModule,
    NotificationModule,
    ClubModule,
    TaskModule,
    FinanceModule
  ],
})
export class AppModule {}
