import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Institute, InstituteSchema } from './institute.schema';
import { InstitutesService } from './institutes.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Institute.name, schema: InstituteSchema }])],
  providers: [InstitutesService],
  exports: [InstitutesService],
})
export class InstitutesModule {}
