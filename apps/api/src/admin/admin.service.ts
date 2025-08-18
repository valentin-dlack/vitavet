import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ClinicsService } from '../clinics/clinics.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly usersService: UsersService,
    private readonly clinicsService: ClinicsService,
  ) {}

  findAllUsers() {
    return this.usersService.findAll();
  }

  findAllClinics() {
    return this.clinicsService.findAll();
  }
}
