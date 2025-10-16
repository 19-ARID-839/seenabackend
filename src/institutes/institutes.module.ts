import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InstitutesService } from './institutes.service';
import { InstituteController } from './institute.controller';
import { Institute, InstituteSchema } from './institute.schema';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Institute.name, schema: InstituteSchema }]),
    forwardRef(() => UsersModule),
    forwardRef(() => AuthModule), // ✅ This must be here
  ],
  controllers: [InstituteController],
  providers: [InstitutesService],
  exports: [InstitutesService],
})
export class InstitutesModule {}
