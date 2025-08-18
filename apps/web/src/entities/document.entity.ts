export interface Document {
  id: string;
  filename: string;
  storagePath: string;
  mimetype: string;
  sizeBytes: number;
  description?: string;
  createdAt: string;
}
