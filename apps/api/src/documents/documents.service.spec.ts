import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentsService } from './documents.service';
import { Document } from './entities/document.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { NotFoundException } from '@nestjs/common';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let docRepo: Repository<Document>;
  let aptRepo: Repository<Appointment>;

  const docRepoMock = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  } as unknown as Repository<Document>;

  const aptRepoMock = {
    findOne: jest.fn(),
  } as unknown as Repository<Appointment>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: getRepositoryToken(Document), useValue: docRepoMock },
        { provide: getRepositoryToken(Appointment), useValue: aptRepoMock },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
    docRepo = module.get(getRepositoryToken(Document));
    aptRepo = module.get(getRepositoryToken(Appointment));
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(docRepo).toBeDefined();
    expect(aptRepo).toBeDefined();
  });

  describe('create', () => {
    const exampleFile = {
      originalname: 'report.pdf',
      mimetype: 'application/pdf',
      path: '/tmp/report.pdf',
      size: 1234,
    } as unknown as Express.Multer.File;

    it('creates document when appointment exists and file provided', async () => {
      (aptRepo.findOne as any) = jest.fn().mockResolvedValue({ id: 'apt1' });
      (docRepo.create as any) = jest
        .fn()
        .mockImplementation((d: Partial<Document>): Document => d as Document);
      (docRepo.save as any) = jest.fn().mockResolvedValue({ id: 'doc1' });

      const doc = await service.create('apt1', 'user1', exampleFile, 'desc');
      expect(aptRepo.findOne).toHaveBeenCalledWith({ where: { id: 'apt1' } });
      expect(docRepo.create).toHaveBeenCalled();
      expect(docRepo.save).toHaveBeenCalled();
      expect(doc).toEqual({ id: 'doc1' });
    });

    it('throws NotFound when appointment missing', async () => {
      (aptRepo.findOne as any) = jest.fn().mockResolvedValue(null);
      await expect(
        service.create('missing', 'user1', exampleFile, 'desc'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFound when file missing', async () => {
      (aptRepo.findOne as any) = jest.fn().mockResolvedValue({ id: 'apt1' });
      await expect(
        service.create('apt1', 'user1', undefined as any, 'desc'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('delegates to repository with relations', async () => {
      (docRepo.findOne as any) = jest.fn().mockResolvedValue(null);
      await service.findById('doc1');
      expect(docRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'doc1' },
        relations: ['appointment'],
      });
    });
  });

  describe('checkUserAccess', () => {
    it('returns false when document not found', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue(null);
      const allowed = await service.checkUserAccess('doc1', 'u1');
      expect(allowed).toBe(false);
    });

    it('returns false when appointment not found', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue({
        id: 'doc1',
        appointmentId: 'apt1',
        uploadedByUserId: 'u2',
      } as any);
      (aptRepo.findOne as any) = jest.fn().mockResolvedValue(null);
      const allowed = await service.checkUserAccess('doc1', 'u1');
      expect(allowed).toBe(false);
    });

    it('allows owner of animal', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue({
        id: 'doc1',
        appointmentId: 'apt1',
        uploadedByUserId: 'u2',
      } as any);
      (aptRepo.findOne as any) = jest.fn().mockResolvedValue({
        id: 'apt1',
        animal: { owner: { id: 'u1' } },
      });
      const allowed = await service.checkUserAccess('doc1', 'u1');
      expect(allowed).toBe(true);
    });

    it('allows uploader vet', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue({
        id: 'doc1',
        appointmentId: 'apt1',
        uploadedByUserId: 'u1',
      } as any);
      (aptRepo.findOne as any) = jest.fn().mockResolvedValue({ id: 'apt1' });
      const allowed = await service.checkUserAccess('doc1', 'u1');
      expect(allowed).toBe(true);
    });

    it('denies unrelated user', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue({
        id: 'doc1',
        appointmentId: 'apt1',
        uploadedByUserId: 'u2',
      } as any);
      (aptRepo.findOne as any) = jest.fn().mockResolvedValue({
        id: 'apt1',
        animal: { owner: { id: 'owner-x' } },
      });
      const allowed = await service.checkUserAccess('doc1', 'u1');
      expect(allowed).toBe(false);
    });
  });
});
