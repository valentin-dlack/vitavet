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
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiConsumes,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('documents')
@ApiBearerAuth('JWT-auth')
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
  @ApiOperation({
    summary: 'Télécharger un document pour un rendez-vous',
    description:
      'Télécharge un document (radiographie, analyse, etc.) associé à un rendez-vous (VET uniquement)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'appointmentId',
    description: 'ID du rendez-vous',
    type: 'string',
  })
  @ApiBody({
    description: 'Fichier à télécharger',
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Fichier à télécharger (max 10MB)',
        },
        description: {
          type: 'string',
          description: 'Description du document (optionnel)',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Document téléchargé avec succès',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        filename: { type: 'string' },
        originalName: { type: 'string' },
        mimetype: { type: 'string' },
        size: { type: 'number' },
        description: { type: 'string', nullable: true },
        appointmentId: { type: 'string' },
        uploadedBy: { type: 'string' },
        uploadedAt: { type: 'string', format: 'date-time' },
        message: { type: 'string', example: 'Document uploaded successfully' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Fichier invalide ou trop volumineux',
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT invalide ou manquant',
  })
  @ApiForbiddenResponse({
    description: 'Permissions insuffisantes (VET requis)',
  })
  @ApiNotFoundResponse({
    description: 'Rendez-vous non trouvé',
  })
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
  @ApiOperation({
    summary: 'Télécharger un document',
    description:
      'Télécharge un document spécifique (accès contrôlé selon les permissions)',
  })
  @ApiParam({
    name: 'documentId',
    description: 'ID du document à télécharger',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Fichier téléchargé',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT invalide ou manquant',
  })
  @ApiForbiddenResponse({
    description: 'Accès refusé au document',
  })
  @ApiNotFoundResponse({
    description: 'Document non trouvé',
  })
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
