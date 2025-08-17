import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnimalsService } from './animals.service';
import { Animal } from './entities/animal.entity';

describe('AnimalsService', () => {
  let service: AnimalsService;
  let repo: Repository<Animal>;

  const repoMock = {
    find: jest.fn(),
  } as unknown as Repository<Animal>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnimalsService,
        { provide: getRepositoryToken(Animal), useValue: repoMock },
      ],
    }).compile();

    service = module.get<AnimalsService>(AnimalsService);
    repo = module.get(getRepositoryToken(Animal));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(repo).toBeDefined();
  });

  it('findByOwnerAndClinic returns animals for owner and clinic', async () => {
    (repo.find as any) = jest
      .fn()
      .mockResolvedValue([
        { id: 'a1', ownerId: 'u1', clinicId: 'c1', name: 'Milo' },
      ]);
    const res = await service.findByOwnerAndClinic('u1', 'c1');
    expect(repo.find).toHaveBeenCalledWith({
      where: { ownerId: 'u1', clinicId: 'c1' },
    });
    expect(res).toHaveLength(1);
  });
});
