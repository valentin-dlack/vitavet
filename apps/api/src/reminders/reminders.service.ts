import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { ReminderRule } from './entities/reminder-rule.entity';
import { ReminderInstance } from './entities/reminder-instance.entity';
import { NotificationLog } from '../notifications/entities/notification-log.entity';
import { Appointment } from '../appointments/entities/appointment.entity';

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

  async processDueReminders(limit = 100): Promise<number> {
    const now = new Date();
    const due = await this.instanceRepo.find({
      where: { status: 'SCHEDULED', sendAt: LessThanOrEqual(now) },
      take: limit,
    });
    let processed = 0;
    for (const inst of due) {
      try {
        // Simulate send (email)
        await this.logRepo.save({
          instanceId: inst.id,
          channel: 'EMAIL',
          deliveryStatus: 'DELIVERED',
        } as any);
        inst.status = 'SENT';
        await this.instanceRepo.save(inst);
        processed++;
      } catch (e) {
        inst.status = 'FAILED';
        console.error(e);
        await this.instanceRepo.save(inst);
      }
    }
    return processed;
  }

  async listInstances(status?: 'SCHEDULED' | 'SENT' | 'FAILED' | 'CANCELLED') {
    const where = status ? { status } : {};
    return this.instanceRepo.find({ where, order: { sendAt: 'DESC' } as any });
  }
}
