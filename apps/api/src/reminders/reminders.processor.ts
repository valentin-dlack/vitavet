import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RemindersService } from './reminders.service';

@Injectable()
export class RemindersProcessor {
  constructor(private readonly remindersService: RemindersService) {}

  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'process-due-reminders',
    disabled: process.env.DISABLE_REMINDER_CRON === '1',
  })
  async handleCron() {
    await this.remindersService.processDueReminders();
  }
}
