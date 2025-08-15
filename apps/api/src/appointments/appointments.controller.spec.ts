import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('AppointmentsController', () => {
  let controller: AppointmentsController;
  let service: AppointmentsService;

  const serviceMock = {
    createAppointment: jest.fn(),
    getPendingAppointments: jest.fn(),
    confirmAppointment: jest.fn(),
  } as unknown as AppointmentsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const builder = Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [
        {
          provide: AppointmentsService,
          useValue: serviceMock,
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) });

    const module: TestingModule = await builder.compile();

    controller = module.get<AppointmentsController>(AppointmentsController);
    service = module.get<AppointmentsService>(AppointmentsService);
  });

  it('should create appointment and return message', async () => {
    const dto: CreateAppointmentDto = {
      clinicId: 'c1',
      animalId: 'a1',
      vetUserId: 'v1',
      startsAt: new Date('2024-01-10T10:00:00.000Z').toISOString(),
    } as any;

    (service.createAppointment as any) = jest.fn().mockResolvedValue({
      id: 'apt-1',
      clinicId: 'c1',
      animalId: 'a1',
      vetUserId: 'v1',
      status: 'PENDING',
      startsAt: dto.startsAt,
      endsAt: new Date('2024-01-10T10:30:00.000Z').toISOString(),
      createdAt: new Date('2024-01-10T09:00:00.000Z').toISOString(),
    });

    const res = await controller.createAppointment(dto, { id: 'u1' } as any);
    expect(service.createAppointment).toHaveBeenCalledWith(dto, 'u1');
    expect(res).toMatchObject({
      id: 'apt-1',
      message: 'Appointment created successfully. Pending confirmation.',
    });
  });

  it('should return pending appointments', async () => {
    (service.getPendingAppointments as any) = jest
      .fn()
      .mockResolvedValue([{ id: 'apt' }]);
    const res = await controller.getPendingAppointments();
    expect(service.getPendingAppointments).toHaveBeenCalled();
    expect(res).toEqual([{ id: 'apt' }]);
  });

  it('should confirm appointment and return message', async () => {
    (service.confirmAppointment as any) = jest
      .fn()
      .mockResolvedValue({ id: 'apt', status: 'CONFIRMED' });
    const res = await controller.confirmAppointment('apt');
    expect(service.confirmAppointment).toHaveBeenCalledWith('apt');
    expect(res).toMatchObject({
      id: 'apt',
      message: 'Appointment confirmed successfully.',
    });
  });
});
