import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { NotificationLog } from './entities/notification-log.entity';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface NotificationData {
  recipientEmail: string;
  recipientName: string;
  appointmentDate?: string;
  animalName?: string;
  clinicName?: string;
  reminderType:
    | 'appointment_24h'
    | 'appointment_1h'
    | 'vaccination'
    | 'treatment';
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(NotificationLog)
    private notificationLogRepo: Repository<NotificationLog>,
  ) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Configuration SMTP depuis les variables d'environnement
    const smtpConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true pour 465, false pour les autres ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };

    // En mode développement, utiliser un transporteur de test si pas de config SMTP
    if (!process.env.SMTP_USER) {
      this.logger.warn('SMTP not configured, using test transporter');
      this.transporter = nodemailer.createTransport({
        host: 'localhost',
        port: 1025,
        ignoreTLS: true,
      });
    } else {
      this.transporter = nodemailer.createTransport(smtpConfig);
    }
  }

  async sendReminderEmail(data: NotificationData): Promise<boolean> {
    try {
      const template = this.getEmailTemplate(data.reminderType, data);

      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@vitavet.com',
        to: data.recipientEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      };

      this.logger.log(`Sending reminder email to ${data.recipientEmail}`);

      const result = await this.transporter.sendMail(mailOptions);

      await this.logNotification(
        'email',
        data.recipientEmail,
        'sent',
        undefined,
        data.reminderType,
        result.messageId,
      );

      this.logger.log(`Email sent successfully to ${data.recipientEmail}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${data.recipientEmail}:`,
        error instanceof Error ? error.message : 'Unknown error',
      );

      await this.logNotification(
        'email',
        data.recipientEmail,
        'failed',
        error instanceof Error ? error.message : 'Unknown error',
        data.reminderType,
      );

      return false;
    }
  }

  private getEmailTemplate(
    type: string,
    data: NotificationData,
  ): EmailTemplate {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    switch (type) {
      case 'appointment_24h':
        return {
          subject: `Rappel : Rendez-vous demain pour ${data.animalName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Rappel de rendez-vous</h2>
              <p>Bonjour ${data.recipientName},</p>
              <p>Nous vous rappelons que vous avez un rendez-vous <strong>demain</strong> pour ${data.animalName}.</p>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Date :</strong> ${data.appointmentDate}</p>
                <p><strong>Clinique :</strong> ${data.clinicName}</p>
              </div>
              <p>Pour modifier ou annuler votre rendez-vous, connectez-vous à votre espace client :</p>
              <a href="${baseUrl}/appointments" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Gérer mes rendez-vous</a>
              <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                Cet email a été envoyé automatiquement. Merci de ne pas y répondre.
              </p>
            </div>
          `,
          text: `
            Rappel de rendez-vous
            
            Bonjour ${data.recipientName},
            
            Nous vous rappelons que vous avez un rendez-vous demain pour ${data.animalName}.
            
            Date : ${data.appointmentDate}
            Clinique : ${data.clinicName}
            
            Pour modifier ou annuler votre rendez-vous, connectez-vous à votre espace client : ${baseUrl}/appointments
            
            Cet email a été envoyé automatiquement. Merci de ne pas y répondre.
          `,
        };

      case 'appointment_1h':
        return {
          subject: `Rendez-vous dans 1 heure pour ${data.animalName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">Rendez-vous dans 1 heure</h2>
              <p>Bonjour ${data.recipientName},</p>
              <p>Votre rendez-vous pour ${data.animalName} est dans <strong>1 heure</strong>.</p>
              <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                <p><strong>Date :</strong> ${data.appointmentDate}</p>
                <p><strong>Clinique :</strong> ${data.clinicName}</p>
              </div>
              <p>N'oubliez pas de vous munir des documents nécessaires.</p>
              <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                Cet email a été envoyé automatiquement. Merci de ne pas y répondre.
              </p>
            </div>
          `,
          text: `
            Rendez-vous dans 1 heure
            
            Bonjour ${data.recipientName},
            
            Votre rendez-vous pour ${data.animalName} est dans 1 heure.
            
            Date : ${data.appointmentDate}
            Clinique : ${data.clinicName}
            
            N'oubliez pas de vous munir des documents nécessaires.
            
            Cet email a été envoyé automatiquement. Merci de ne pas y répondre.
          `,
        };

      case 'vaccination':
        return {
          subject: `Rappel : Vaccination due pour ${data.animalName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #059669;">Rappel de vaccination</h2>
              <p>Bonjour ${data.recipientName},</p>
              <p>Il est temps de programmer la vaccination de ${data.animalName}.</p>
              <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
                <p><strong>Animal :</strong> ${data.animalName}</p>
                <p><strong>Clinique :</strong> ${data.clinicName}</p>
              </div>
              <p>Prenez rendez-vous dès maintenant pour assurer la santé de votre animal :</p>
              <a href="${baseUrl}/clinics" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Prendre rendez-vous</a>
              <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                Cet email a été envoyé automatiquement. Merci de ne pas y répondre.
              </p>
            </div>
          `,
          text: `
            Rappel de vaccination
            
            Bonjour ${data.recipientName},
            
            Il est temps de programmer la vaccination de ${data.animalName}.
            
            Animal : ${data.animalName}
            Clinique : ${data.clinicName}
            
            Prenez rendez-vous dès maintenant pour assurer la santé de votre animal : ${baseUrl}/clinics
            
            Cet email a été envoyé automatiquement. Merci de ne pas y répondre.
          `,
        };

      case 'treatment':
        return {
          subject: `Rappel : Traitement à renouveler pour ${data.animalName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #d97706;">Renouvellement de traitement</h2>
              <p>Bonjour ${data.recipientName},</p>
              <p>Le traitement de ${data.animalName} doit être renouvelé.</p>
              <div style="background-color: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d97706;">
                <p><strong>Animal :</strong> ${data.animalName}</p>
                <p><strong>Clinique :</strong> ${data.clinicName}</p>
              </div>
              <p>Contactez votre vétérinaire pour programmer un rendez-vous :</p>
              <a href="${baseUrl}/clinics" style="background-color: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Contacter la clinique</a>
              <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                Cet email a été envoyé automatiquement. Merci de ne pas y répondre.
              </p>
            </div>
          `,
          text: `
            Renouvellement de traitement
            
            Bonjour ${data.recipientName},
            
            Le traitement de ${data.animalName} doit être renouvelé.
            
            Animal : ${data.animalName}
            Clinique : ${data.clinicName}
            
            Contactez votre vétérinaire pour programmer un rendez-vous : ${baseUrl}/clinics
            
            Cet email a été envoyé automatiquement. Merci de ne pas y répondre.
          `,
        };

      default:
        throw new Error(`Unknown reminder type: ${type}`);
    }
  }

  async logNotification(
    type: string,
    recipient: string,
    status: 'sent' | 'failed' | 'pending',
    error?: string,
    reminderType?: string,
    messageId?: string,
  ): Promise<void> {
    const log = this.notificationLogRepo.create({
      notificationType: type,
      recipient,
      status,
      error,
      reminderType,
      messageId,
      sentAt: new Date(),
    });

    await this.notificationLogRepo.save(log);
  }

  async getNotificationStats(): Promise<{
    total: number;
    sent: number;
    failed: number;
    successRate: number;
  }> {
    const [total, sent, failed] = await Promise.all([
      this.notificationLogRepo.count(),
      this.notificationLogRepo.count({ where: { status: 'sent' } }),
      this.notificationLogRepo.count({ where: { status: 'failed' } }),
    ]);

    return {
      total,
      sent,
      failed,
      successRate: total > 0 ? Math.round((sent / total) * 100) : 0,
    };
  }

  async getNotificationLogs(
    limit = 50,
    offset = 0,
  ): Promise<NotificationLog[]> {
    return this.notificationLogRepo.find({
      order: { sentAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async testEmailConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified successfully');
      return true;
    } catch (error) {
      this.logger.error(
        'SMTP connection failed:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      return false;
    }
  }
}
