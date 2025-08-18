import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';
import { Appointment } from '../appointments/entities/appointment.entity';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
  ) {}

  async create(
    appointmentId: string,
    userId: string,
    file: Express.Multer.File,
    description?: string,
  ): Promise<Document> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id: appointmentId },
    });
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Check if file exists
    if (!file) {
      throw new NotFoundException('No file uploaded');
    }

    // Ensure we have a valid filename
    const filename =
      file.originalname ||
      `document_${Date.now()}.${file.mimetype?.split('/')[1] || 'bin'}`;

    const documentData = {
      appointmentId,
      uploadedByUserId: userId,
      filename,
      storagePath: file.path,
      mimetype: file.mimetype,
      sizeBytes: file.size,
      description,
    };

    const document = this.documentRepository.create(documentData);

    return this.documentRepository.save(document);
  }

  async findById(documentId: string): Promise<Document | null> {
    return this.documentRepository.findOne({
      where: { id: documentId },
      relations: ['appointment'],
    });
  }

  async checkUserAccess(documentId: string, userId: string): Promise<boolean> {
    const document = await this.findById(documentId);
    if (!document) {
      return false;
    }

    // Get the appointment to check user access
    const appointment = await this.appointmentRepository.findOne({
      where: { id: document.appointmentId },
      relations: ['animal', 'animal.owner'],
    });

    if (!appointment) {
      return false;
    }

    // Check if user is the owner of the animal or the vet who uploaded the document
    return (
      appointment.animal?.owner?.id === userId ||
      document.uploadedByUserId === userId
    );
  }
}
