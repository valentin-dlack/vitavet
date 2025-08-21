import { Injectable, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ClinicsService } from '../clinics/clinics.service';
import { User } from '../users/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateClinicDto } from '../clinics/dto/create-clinic.dto';
import { Clinic } from '../clinics/entities/clinic.entity';

@Injectable()
export class AdminService {
  constructor(
    private readonly usersService: UsersService,
    private readonly clinicsService: ClinicsService,
  ) {}

  async createUser(
    createUserDto: CreateUserDto,
  ): Promise<Omit<User, 'password'>> {
    const { email, password, firstName, lastName } = createUserDto;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create the user with the 'ASV' role.
    const user = await this.usersService.create(
      email,
      password,
      firstName,
      lastName,
      'ASV',
    );

    return user;
  }

  async updateUser(
    userId: string,
    updateUserDto: Partial<CreateUserDto>,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.usersService.update(userId, updateUserDto);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return { ...result, fullName: `${result.firstName} ${result.lastName}` };
  }

  async removeUser(userId: string): Promise<void> {
    return this.usersService.remove(userId);
  }

  async updateClinic(
    clinicId: string,
    updateClinicDto: Partial<CreateClinicDto>,
  ): Promise<Clinic> {
    return this.clinicsService.update(clinicId, updateClinicDto);
  }

  findAllUsers() {
    return this.usersService.findAll();
  }

  findAllClinics() {
    return this.clinicsService.findAll();
  }
}
