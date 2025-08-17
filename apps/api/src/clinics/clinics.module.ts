import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Clinic } from './entities/clinic.entity';
import { ClinicsService } from './clinics.service';
import { ClinicsController } from './clinics.controller';
import { User } from '../users/entities/user.entity';
import { UserClinicRole } from '../users/entities/user-clinic-role.entity';
import { Service } from './entities/service.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Clinic, User, UserClinicRole, Service])],
  providers: [ClinicsService],
  controllers: [ClinicsController],
  exports: [ClinicsService],
})
export class ClinicsModule {}
