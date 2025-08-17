import { Test, TestingModule } from '@nestjs/testing';
import { AgendaController } from './agenda.controller';
import { AgendaService } from './agenda.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { User } from '../users/entities/user.entity';

describe('AgendaController', () => {
  let controller: AgendaController;
  let service: AgendaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgendaController],
      providers: [
        {
          provide: AgendaService,
          useValue: { getVetDayAgenda: jest.fn().mockResolvedValue([]) },
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AgendaController>(AgendaController);
    service = module.get<AgendaService>(AgendaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getMyAgenda delegates to service with current user id', async () => {
    const res = await controller.getMyAgenda(
      { id: 'vet1' } as User,
      '2024-01-10',
    );
    expect(service.getVetDayAgenda).toHaveBeenCalled();
    expect(res).toEqual([]);
  });
});
