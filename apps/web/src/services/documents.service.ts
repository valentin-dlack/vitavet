import { httpService } from './http.service';
import type { Document } from '../entities/document.entity';

class DocumentsService {
  async uploadDocument(
    appointmentId: string,
    file: File,
    description?: string,
  ): Promise<Document> {
    console.log('Uploading document:', { appointmentId, file, description });
    
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }

    console.log('FormData created:', formData);

    return httpService
      .post<Document>(`/documents/upload/appointment/${appointmentId}`, formData);
  }

  async getDocumentsForAppointment(appointmentId: string): Promise<Document[]> {
    return httpService
      .get<Document[]>(`/appointments/${appointmentId}/documents`);
  }
}

export const documentsService = new DocumentsService();
