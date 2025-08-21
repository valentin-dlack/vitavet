import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UsersModule } from '../users/users.module';
import { ClinicsModule } from '../clinics/clinics.module';

@Module({
  imports: [UsersModule, ClinicsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
