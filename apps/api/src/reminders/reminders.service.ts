import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ReminderRule } from './entities/reminder-rule.entity';
import { ReminderInstance } from './entities/reminder-instance.entity';
import { NotificationLog } from '../notifications/entities/notification-log.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import {
  NotificationService,
  NotificationData,
} from '../notifications/notification.service';

@Injectable()
export class RemindersService {
  constructor(
    @InjectRepository(ReminderRule)
    private readonly ruleRepo: Repository<ReminderRule>,
    @InjectRepository(ReminderInstance)
    private readonly instanceRepo: Repository<ReminderInstance>,
    @InjectRepository(NotificationLog)
    private readonly logRepo: Repository<NotificationLog>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    private readonly notificationService: NotificationService,
  ) {}

  async planAppointmentReminders(appointmentId: string): Promise<void> {
    const apt = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
    });
    if (!apt) return;
    const rules = await this.ruleRepo.find({
      where: { scope: 'APPOINTMENT', active: true as any } as any,
    });
    for (const rule of rules) {
      const sendAt = new Date(apt.startsAt);
      sendAt.setDate(sendAt.getDate() + rule.offsetDays);
      const exists = await this.instanceRepo.findOne({
        where: {
          ruleId: rule.id,
          appointmentId: apt.id,
          userId: apt.createdByUserId,
        },
      });
      if (!exists) {
        await this.instanceRepo.save(
          this.instanceRepo.create({
            ruleId: rule.id,
            userId: apt.createdByUserId,
            appointmentId: apt.id,
            sendAt,
            status: 'SCHEDULED',
            payload: {
              clinicId: apt.clinicId,
              startsAt: apt.startsAt,
              animalId: apt.animalId,
            },
          }),
        );
      }
    }
  }

  async listInstances(status?: 'SCHEDULED' | 'SENT' | 'FAILED' | 'CANCELLED') {
    const where = status ? { status } : {};
    return this.instanceRepo.find({ where, order: { sendAt: 'DESC' } as any });
  }

  // Same as list but for a specific animal.
  async listForAnimal(animalId: string): Promise<ReminderInstance[]> {
    return this.instanceRepo.find({ where: { payload: { animalId } } });
  }

  async processDueReminders(now: Date = new Date()): Promise<number> {
    const due = await this.instanceRepo.find({
      where: {
        status: 'SCHEDULED',
        sendAt: LessThan(now),
      },
      relations: [
        'rule',
        'appointment',
        'appointment.animal',
        'appointment.animal.owner',
        'appointment.clinic',
      ],
    });

    let processedCount = 0;

    for (const inst of due) {
      // Avoid race conditions if another process is running
      if (inst.status !== 'SCHEDULED') continue;

      try {
        const appointment = await this.appointmentRepo.findOne({
          where: { id: inst.appointmentId! },
          relations: ['animal', 'animal.owner', 'clinic'],
        });

        if (
          !appointment ||
          !appointment.animal ||
          !appointment.animal.owner ||
          !appointment.clinic
        ) {
          console.log(`Missing data for reminder ${inst.id}, skipping`);
          inst.status = 'FAILED';
          await this.instanceRepo.save(inst);
          continue;
        }

        // Determine reminder type based on offset
        let reminderType: 'appointment_24h' | 'appointment_1h' =
          'appointment_24h';
        if (inst.rule && inst.rule.offsetDays === 0) {
          reminderType = 'appointment_1h';
        }

        // Prepare notification data
        const notificationData: NotificationData = {
          recipientEmail: appointment.animal.owner.email,
          recipientName: `${appointment.animal.owner.firstName} ${appointment.animal.owner.lastName}`,
          appointmentDate: appointment.startsAt.toLocaleString('fr-FR'),
          animalName: appointment.animal.name,
          clinicName: appointment.clinic.name,
          reminderType,
        };

        // Send the email
        const emailSent =
          await this.notificationService.sendReminderEmail(notificationData);

        // Update instance status
        inst.status = emailSent ? 'SENT' : 'FAILED';
        inst.sendAt = now;
        await this.instanceRepo.save(inst);

        if (emailSent) {
          processedCount++;
        }

        console.log(
          `Processed reminder ${inst.id} for ${appointment.animal.owner.email} - Status: ${inst.status}`,
        );
      } catch (error) {
        console.error(`Error processing reminder ${inst.id}:`, error);
        inst.status = 'FAILED';
        await this.instanceRepo.save(inst);
      }
    }

    return processedCount;
  }
}
