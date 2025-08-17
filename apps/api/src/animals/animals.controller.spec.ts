import { Test, TestingModule } from '@nestjs/testing';
import { AnimalsController } from './animals.controller';
import { AnimalsService } from './animals.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('AnimalsController', () => {
  let controller: AnimalsController;
  let service: AnimalsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnimalsController],
      providers: [
        {
          provide: AnimalsService,
          useValue: {
            findByOwnerAndClinic: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AnimalsController>(AnimalsController);
    service = module.get<AnimalsService>(AnimalsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getMyAnimals delegates to service with current user and clinicId', async () => {
    const res = await controller.getMyAnimals({ id: 'u1' } as any, 'c1');
    expect(service.findByOwnerAndClinic).toHaveBeenCalledWith('u1', 'c1');
    expect(res).toEqual([]);
  });
});
