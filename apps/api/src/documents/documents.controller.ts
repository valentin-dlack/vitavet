import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Body,
  Res,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { DocumentsService } from './documents.service';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload/appointment/:appointmentId')
  @Roles('VET')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          const originalName = file.originalname || 'document';
          const extension = extname(originalName) || '.bin';
          cb(null, `${randomName}${extension}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  uploadFile(
    @Param('appointmentId') appointmentId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
    @Body('description') description?: string,
  ) {
    return this.documentsService.create(
      appointmentId,
      user.id,
      file,
      description,
    );
  }

  @Get('download/:documentId')
  async downloadDocument(
    @Param('documentId') documentId: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    const document = await this.documentsService.findById(documentId);
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Check if user has access to this document
    const hasAccess = await this.documentsService.checkUserAccess(
      documentId,
      user.id,
    );
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this document');
    }

    res.setHeader('Content-Type', document.mimetype);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${document.filename}"`,
    );

    // Send the file
    res.sendFile(document.storagePath, { root: '.' });
  }
}
