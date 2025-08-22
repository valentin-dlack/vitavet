import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('DocumentsController', () => {
  let controller: DocumentsController;
  const serviceMock = {
    create: jest.fn(),
    findById: jest.fn(),
    checkUserAccess: jest.fn(),
  } as unknown as DocumentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [{ provide: DocumentsService, useValue: serviceMock }],
    }).compile();

    controller = module.get<DocumentsController>(DocumentsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadFile', () => {
    it('delegates to service.create', async () => {
      (serviceMock.create as any) = jest.fn().mockResolvedValue({ id: 'd1' });
      const res = await controller.uploadFile(
        'apt1',
        { originalname: 'x.txt' } as any,
        { id: 'u1' } as any,
        'desc',
      );
      expect(serviceMock.create).toHaveBeenCalledWith('apt1', 'u1', expect.any(Object), 'desc');
      expect(res).toEqual({ id: 'd1' });
    });
  });

  describe('downloadDocument', () => {
    function createResSpy() {
      const headers: Record<string, string> = {};
      return {
        setHeader: (k: string, v: string) => {
          headers[k] = v;
        },
        sendFile: jest.fn(),
        _headers: headers,
      } as any;
    }

    it('404 when document not found', async () => {
      (serviceMock.findById as any) = jest.fn().mockResolvedValue(null);
      await expect(
        controller.downloadDocument('missing', { id: 'u1' } as any, createResSpy()),
      ).rejects.toThrow(NotFoundException);
    });

    it('403 when user has no access', async () => {
      (serviceMock.findById as any) = jest.fn().mockResolvedValue({ id: 'd1', mimetype: 'text/plain', filename: 'f.txt', storagePath: '/tmp/f.txt' });
      (serviceMock.checkUserAccess as any) = jest.fn().mockResolvedValue(false);
      await expect(
        controller.downloadDocument('d1', { id: 'u2' } as any, createResSpy()),
      ).rejects.toThrow(ForbiddenException);
    });

    it('sets headers and sends file on success', async () => {
      (serviceMock.findById as any) = jest.fn().mockResolvedValue({ id: 'd1', mimetype: 'text/plain', filename: 'f.txt', storagePath: '/tmp/f.txt' });
      (serviceMock.checkUserAccess as any) = jest.fn().mockResolvedValue(true);
      const res = createResSpy();
      await controller.downloadDocument('d1', { id: 'u1' } as any, res);
      expect(res._headers['Content-Type']).toBe('text/plain');
      expect(res._headers['Content-Disposition']).toContain('filename="f.txt"');
      expect(res.sendFile).toHaveBeenCalledWith('/tmp/f.txt', { root: '.' });
    });
  });
});


