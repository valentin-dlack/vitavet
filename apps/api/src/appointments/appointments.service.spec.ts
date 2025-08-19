import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RemindersService } from '../reminders/reminders.service';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './entities/appointment.entity';
import { User } from '../users/entities/user.entity';
import { Animal } from '../animals/entities/animal.entity';
import {
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { TimeSlot } from '../slots/entities/time-slot.entity';
import { UserClinicRole } from '../users/entities/user-clinic-role.entity';
import { Document } from '../documents/entities/document.entity';
import { RejectAppointmentDto } from './dto/reject-appointment.dto';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let appointmentRepo: Repository<Appointment>;
  let userRepo: Repository<User>;
  let animalRepo: Repository<Animal>;
  // Repositories obtained via DI, not needed as local variables in tests

  const appointmentRepoMock = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    count: jest.fn(),
  };

  const userRepoMock = {
    find: jest.fn(),
  } as unknown as Repository<User>;

  const animalRepoMock = {
    find: jest.fn(),
    findOne: jest.fn(),
  } as unknown as Repository<Animal>;

  const timeSlotRepoMock: Partial<Repository<TimeSlot>> = {
    findOne: jest.fn(),
    save: jest.fn(),
  } as unknown as Repository<TimeSlot>;

  const ucrRepoMock: Partial<Repository<UserClinicRole>> = {
    find: jest.fn(),
    findOne: jest.fn(),
  } as unknown as Repository<UserClinicRole>;

  const documentRepoMock: Partial<Repository<Document>> = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  } as unknown as Repository<Document>;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: getRepositoryToken(Appointment),
          useValue: appointmentRepoMock as unknown as Repository<Appointment>,
        },
        { provide: getRepositoryToken(User), useValue: userRepoMock },
        { provide: getRepositoryToken(Animal), useValue: animalRepoMock },
        { provide: getRepositoryToken(TimeSlot), useValue: timeSlotRepoMock },
        { provide: getRepositoryToken(UserClinicRole), useValue: ucrRepoMock },
        { provide: getRepositoryToken(Document), useValue: documentRepoMock },
        {
          provide: RemindersService,
          useValue: { planAppointmentReminders: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    appointmentRepo = module.get(getRepositoryToken(Appointment));
    userRepo = module.get(getRepositoryToken(User));
    animalRepo = module.get(getRepositoryToken(Animal));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(appointmentRepo).toBeDefined();
    expect(userRepo).toBeDefined();
    expect(animalRepo).toBeDefined();
  });

  describe('createAppointment', () => {
    it('creates a pending appointment and returns mapped response', async () => {
      const now = new Date('2024-01-15T09:00:00.000Z');
      const dto = {
        clinicId: 'clinic-1',
        animalId: 'animal-1',
        vetUserId: 'vet-1',
        startsAt: now.toISOString(),
        typeId: undefined,
      };

      (animalRepoMock.findOne as any) = jest.fn().mockResolvedValue({
        id: 'animal-1',
        clinicId: 'clinic-1',
        ownerId: 'owner-1',
      });
      (ucrRepoMock.find as any) = jest
        .fn()
        .mockResolvedValue([
          { userId: 'creator-1', clinicId: 'clinic-1', role: 'ASV' },
        ]);
      (ucrRepoMock.findOne as any) = jest.fn().mockResolvedValue({
        userId: 'vet-1',
        clinicId: 'clinic-1',
        role: 'VET',
      });
      (timeSlotRepoMock.findOne as any) = jest.fn().mockResolvedValue({
        id: 'slot-1',
        durationMinutes: 30,
        isAvailable: true,
      });
      (appointmentRepo.findOne as any) = jest.fn().mockResolvedValue(null);
      const created: Partial<Appointment> = {
        ...dto,
        startsAt: now,
        endsAt: new Date(now.getTime() + 30 * 60 * 1000),
        status: 'PENDING',
        createdByUserId: 'creator-1',
      };
      (appointmentRepo.create as any) = jest.fn().mockReturnValue(created);
      const saved = {
        id: 'apt-1',
        ...created,
        createdAt: new Date('2024-01-10T10:00:00.000Z'),
      } as unknown as Appointment;
      (appointmentRepo.save as any) = jest.fn().mockResolvedValue(saved);
      (timeSlotRepoMock.save as any) = jest.fn().mockResolvedValue({});

      const res = await service.createAppointment(dto as any, 'creator-1');

      expect(appointmentRepo.findOne).toHaveBeenCalled();
      expect(appointmentRepo.create).toHaveBeenCalled();
      expect(appointmentRepo.save).toHaveBeenCalled();
      expect(res).toMatchObject({
        id: 'apt-1',
        clinicId: 'clinic-1',
        animalId: 'animal-1',
        vetUserId: 'vet-1',
        status: 'PENDING',
      });
      expect(new Date(res.endsAt).getTime()).toBe(
        new Date(dto.startsAt).getTime() + 30 * 60 * 1000,
      );
    });

    it('throws ConflictException when slot already booked', async () => {
      (animalRepoMock.findOne as any) = jest.fn().mockResolvedValue({
        id: 'animal-1',
        clinicId: 'clinic-1',
        ownerId: 'creator-1',
      });
      (ucrRepoMock.find as any) = jest
        .fn()
        .mockResolvedValue([
          { userId: 'creator-1', clinicId: 'clinic-1', role: 'OWNER' },
        ]);
      (ucrRepoMock.findOne as any) = jest.fn().mockResolvedValue({
        userId: 'vet-1',
        clinicId: 'clinic-1',
        role: 'VET',
      });
      (timeSlotRepoMock.findOne as any) = jest.fn().mockResolvedValue({
        id: 'slot-1',
        durationMinutes: 30,
        isAvailable: true,
      });
      (appointmentRepo.findOne as any) = jest
        .fn()
        .mockResolvedValue({ id: 'conflict' });

      await expect(
        service.createAppointment(
          {
            clinicId: 'clinic-1',
            animalId: 'animal-1',
            vetUserId: 'vet-1',
            startsAt: new Date().toISOString(),
          } as any,
          'creator-1',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getPendingAppointments', () => {
    it('returns mapped pending appointments with vet, animal and owner', async () => {
      const aptA: Appointment = {
        id: 'a',
        clinicId: 'c1',
        animalId: 'an1',
        vetUserId: 'v1',
        typeId: null,
        status: 'PENDING',
        startsAt: new Date('2024-01-10T09:00:00.000Z'),
        endsAt: new Date('2024-01-10T09:30:00.000Z'),
        createdByUserId: 'creator',
        createdAt: new Date('2024-01-09T12:00:00.000Z'),
        updatedAt: new Date('2024-01-09T12:00:00.000Z'),
      } as any;
      const aptB: Appointment = {
        id: 'b',
        clinicId: 'c1',
        animalId: 'an2',
        vetUserId: 'v2',
        typeId: null,
        status: 'PENDING',
        startsAt: new Date('2024-01-11T09:00:00.000Z'),
        endsAt: new Date('2024-01-11T09:30:00.000Z'),
        createdByUserId: 'creator',
        createdAt: new Date('2024-01-09T12:00:00.000Z'),
        updatedAt: new Date('2024-01-09T12:00:00.000Z'),
      } as any;

      (appointmentRepo.find as any) = jest.fn().mockResolvedValue([aptA, aptB]);

      // userRepo.find is called twice: first for vets, then for owners
      (userRepo.find as any) = jest
        .fn()
        .mockImplementation(({ where }: any) => {
          let ids: string[] = [];
          if (Array.isArray(where)) {
            ids = where.map((w: { id: string }) => w.id);
          } else if (where?.id?._value && Array.isArray(where.id._value)) {
            // When using TypeORM In([...]) the operator stores values in _value
            ids = where.id._value as string[];
          }
          // if includes vets ids
          if (ids.includes('v1') || ids.includes('v2')) {
            return Promise.resolve([
              {
                id: 'v1',
                firstName: 'Vet',
                lastName: 'One',
                email: 'v1@ex.com',
              },
              {
                id: 'v2',
                firstName: 'Vet',
                lastName: 'Two',
                email: 'v2@ex.com',
              },
            ]);
          }
          // owners ids
          return Promise.resolve([
            {
              id: 'owner-1',
              firstName: 'Alice',
              lastName: 'Owner',
              email: 'alice@ex.com',
            },
            {
              id: 'owner-2',
              firstName: 'Bob',
              lastName: 'Owner',
              email: 'bob@ex.com',
            },
          ]);
        });

      (animalRepo.find as any) = jest.fn().mockResolvedValue([
        { id: 'an1', name: 'Fido', birthdate: null, ownerId: 'owner-1' },
        {
          id: 'an2',
          name: 'Luna',
          birthdate: '2019-05-10',
          ownerId: 'owner-2',
        },
      ]);

      // Mock count method
      (appointmentRepo.count as any) = jest.fn().mockResolvedValue(2);

      const res = await service.getPendingAppointments();
      expect(res.appointments).toHaveLength(2);
      expect(res.total).toBe(2);
      expect(res.appointments[0]).toMatchObject({
        id: 'a',
        vet: {
          id: 'v1',
          firstName: 'Vet',
          lastName: 'One',
          email: 'v1@ex.com',
        },
        animal: { id: 'an1', name: 'Fido', birthdate: null },
        owner: {
          id: 'owner-1',
          firstName: 'Alice',
          lastName: 'Owner',
          email: 'alice@ex.com',
        },
      });
      expect(res.appointments[1]).toMatchObject({ id: 'b' });
      expect(appointmentRepo.find).toHaveBeenCalled();
      expect(appointmentRepo.count).toHaveBeenCalled();
    });

    it('supports pagination with limit and offset', async () => {
      (appointmentRepo.find as any) = jest.fn().mockResolvedValue([
        {
          id: 'a',
          clinicId: 'c',
          animalId: 'an1',
          vetUserId: 'v1',
          status: 'PENDING',
          startsAt: new Date(),
          endsAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      (appointmentRepo.count as any) = jest.fn().mockResolvedValue(50);

      const res = await service.getPendingAppointments('clinic-1', 10, 20);

      expect(res.appointments).toHaveLength(1);
      expect(res.total).toBe(50);
      expect(appointmentRepo.find).toHaveBeenCalledWith({
        where: { status: 'PENDING', clinicId: 'clinic-1' },
        order: { startsAt: 'ASC' },
        skip: 20,
        take: 10,
      });
      expect(appointmentRepo.count).toHaveBeenCalledWith({
        where: { status: 'PENDING', clinicId: 'clinic-1' },
      });
    });
  });

  describe('confirmAppointment', () => {
    it('confirms a pending appointment', async () => {
      const pending: Appointment = {
        id: 'x',
        clinicId: 'c',
        animalId: 'an',
        vetUserId: 'v',
        status: 'PENDING',
        startsAt: new Date('2024-01-10T10:00:00.000Z'),
        endsAt: new Date('2024-01-10T10:30:00.000Z'),
        createdByUserId: 'creator',
        createdAt: new Date('2024-01-09T12:00:00.000Z'),
        updatedAt: new Date('2024-01-09T12:00:00.000Z'),
        typeId: null,
      } as any;

      (appointmentRepo.findOne as any) = jest.fn().mockResolvedValue(pending);
      (appointmentRepo.save as any) = jest
        .fn()
        .mockImplementation((a: Appointment) => ({ ...a }));

      const res = await service.confirmAppointment('x');
      expect(res.status).toBe('CONFIRMED');
      expect(appointmentRepo.save).toHaveBeenCalled();
    });

    it('throws NotFoundException when appointment missing', async () => {
      (appointmentRepo.findOne as any) = jest.fn().mockResolvedValue(null);
      await expect(service.confirmAppointment('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ConflictException when status not PENDING', async () => {
      (appointmentRepo.findOne as any) = jest
        .fn()
        .mockResolvedValue({ id: 'z', status: 'CONFIRMED' });
      await expect(service.confirmAppointment('z')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('completeAppointment', () => {
    it('should complete an appointment with notes and report', async () => {
      const appointmentId = 'apt-1';
      const vetId = 'vet-1';
      const completeDto = {
        notes: 'Internal notes',
        report: 'Consultation report',
      };
      const appointment = {
        id: appointmentId,
        vetUserId: vetId,
        status: 'CONFIRMED',
        startsAt: new Date(),
        endsAt: new Date(),
        createdAt: new Date(),
      };

      jest
        .spyOn(appointmentRepo, 'findOne')
        .mockResolvedValue(appointment as any);
      jest
        .spyOn(appointmentRepo, 'save')
        .mockImplementation((apt: Appointment) => Promise.resolve({ ...apt }));

      const result = await service.completeAppointment(
        appointmentId,
        vetId,
        completeDto,
      );

      expect(appointmentRepo.findOne).toHaveBeenCalledWith({
        where: { id: appointmentId },
      });
      expect(appointmentRepo.save).toHaveBeenCalledWith({
        ...appointment,
        notes: completeDto.notes,
        report: completeDto.report,
        status: 'COMPLETED',
      });
      expect(result.status).toBe('COMPLETED');
    });

    it('should throw NotFoundException if appointment does not exist', async () => {
      jest.spyOn(appointmentRepo, 'findOne').mockResolvedValue(null);
      await expect(
        service.completeAppointment('apt-1', 'vet-1', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if vet is not assigned to the appointment', async () => {
      const appointment = { id: 'apt-1', vetUserId: 'another-vet-id' };
      jest
        .spyOn(appointmentRepo, 'findOne')
        .mockResolvedValue(appointment as any);
      await expect(
        service.completeAppointment('apt-1', 'vet-1', {}),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if appointment is already completed', async () => {
      const appointment = {
        id: 'apt-1',
        vetUserId: 'vet-1',
        status: 'COMPLETED',
      };
      jest
        .spyOn(appointmentRepo, 'findOne')
        .mockResolvedValue(appointment as any);
      await expect(
        service.completeAppointment('apt-1', 'vet-1', {}),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('rejectAppointment', () => {
    const mockAppointment = {
      id: 'apt-1',
      clinicId: 'clinic-1',
      animalId: 'animal-1',
      vetUserId: 'vet-1',
      status: 'PENDING',
      startsAt: new Date('2024-01-10T10:00:00Z'),
      endsAt: new Date('2024-01-10T10:30:00Z'),
      createdAt: new Date('2024-01-01T00:00:00Z'),
      animal: { id: 'animal-1', name: 'Milo' },
      vet: { id: 'vet-1', firstName: 'Dr', lastName: 'Smith' },
    };

    const rejectDto: RejectAppointmentDto = {
      rejectionReason: 'Vétérinaire indisponible à cette date',
    };

    it('should reject a pending appointment', async () => {
      appointmentRepoMock.findOne.mockResolvedValue(mockAppointment);
      appointmentRepoMock.save.mockResolvedValue({
        ...mockAppointment,
        status: 'REJECTED',
        rejectionReason: rejectDto.rejectionReason,
      });

      const result = await service.rejectAppointment('apt-1', rejectDto);

      expect(appointmentRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: 'apt-1' },
        relations: { animal: true, vet: true },
      });
      expect(appointmentRepoMock.save).toHaveBeenCalledWith({
        ...mockAppointment,
        status: 'REJECTED',
        rejectionReason: rejectDto.rejectionReason,
      });
      expect(result.status).toBe('REJECTED');
    });

    it('should throw NotFoundException when appointment not found', async () => {
      appointmentRepoMock.findOne.mockResolvedValue(null);

      await expect(
        service.rejectAppointment('apt-1', rejectDto),
      ).rejects.toThrow('Appointment not found');
    });

    it('should throw ConflictException when appointment is already rejected', async () => {
      appointmentRepoMock.findOne.mockResolvedValue({
        ...mockAppointment,
        status: 'REJECTED',
      });

      await expect(
        service.rejectAppointment('apt-1', rejectDto),
      ).rejects.toThrow('Appointment is already rejected');
    });

    it('should throw ConflictException when appointment is completed', async () => {
      appointmentRepoMock.findOne.mockResolvedValue({
        ...mockAppointment,
        status: 'COMPLETED',
      });

      await expect(
        service.rejectAppointment('apt-1', rejectDto),
      ).rejects.toThrow('Cannot reject a completed appointment');
    });
  });
});
