import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { DataSource } from 'typeorm';
import { Clinic } from '../clinics/entities/clinic.entity';
import { UserClinicRole } from '../users/entities/user-clinic-role.entity';
import { Animal } from '../animals/entities/animal.entity';
import { AppointmentType } from '../appointments/entities/appointment-type.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { ReminderRule } from '../reminders/entities/reminder-rule.entity';
import { ReminderInstance } from '../reminders/entities/reminder-instance.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  try {
    const usersService = app.get(UsersService);

    // Access repositories via DataSource to avoid module forFeature requirements
    const dataSource = app.get(DataSource);
    const clinicRepo = dataSource.getRepository(Clinic);
    const roleRepo = dataSource.getRepository(UserClinicRole);
    const animalRepo = dataSource.getRepository(Animal);
    const aptTypeRepo = dataSource.getRepository(AppointmentType);
    const aptRepo = dataSource.getRepository(Appointment);
    const ruleRepo = dataSource.getRepository(ReminderRule);
    const instanceRepo = dataSource.getRepository(ReminderInstance);

    // Create users
    const owner = await usersService
      .create('owner@example.com', 'password123', 'Olivia', 'Owner')
      .catch(
        async () => (await usersService.findByEmail('owner@example.com'))!,
      );

    const vet1 = await usersService
      .create('vet1@example.com', 'password123', 'Victor', 'Vet')
      .catch(async () => (await usersService.findByEmail('vet1@example.com'))!);

    const vet2 = await usersService
      .create('vet2@example.com', 'password123', 'Vanessa', 'Vet')
      .catch(async () => (await usersService.findByEmail('vet2@example.com'))!);

    const asv = await usersService
      .create('asv@example.com', 'password123', 'Aline', 'ASV')
      .catch(async () => (await usersService.findByEmail('asv@example.com'))!);

    const adminClinic = await usersService
      .create('admin@example.com', 'password123', 'Alex', 'Admin')
      .catch(
        async () => (await usersService.findByEmail('admin@example.com'))!,
      );

    // Create clinic
    let clinic = await clinicRepo.findOne({
      where: { name: 'Clinique VitaVet' },
    });
    if (!clinic) {
      clinic = await clinicRepo.save(
        clinicRepo.create({
          name: 'Clinique VitaVet',
          postcode: '75011',
          city: 'Paris',
        }),
      );
    }

    // Roles
    const roles = [
      { userId: owner.id, clinicId: clinic.id, role: 'OWNER' as const },
      { userId: vet1.id, clinicId: clinic.id, role: 'VET' as const },
      { userId: vet2.id, clinicId: clinic.id, role: 'VET' as const },
      { userId: asv.id, clinicId: clinic.id, role: 'ASV' as const },
      {
        userId: adminClinic.id,
        clinicId: clinic.id,
        role: 'ADMIN_CLINIC' as const,
      },
    ];

    for (const r of roles) {
      const exists = await roleRepo.findOne({ where: r });
      if (!exists) {
        await roleRepo.save(roleRepo.create(r));
      }
    }

    // Animals for owner
    let animal1 = await animalRepo.findOne({
      where: { name: 'Milo', clinicId: clinic.id },
    });
    if (!animal1) {
      animal1 = await animalRepo.save(
        animalRepo.create({
          name: 'Milo',
          clinicId: clinic.id,
          ownerId: owner.id,
        }),
      );
    }

    let animal2 = await animalRepo.findOne({
      where: { name: 'Luna', clinicId: clinic.id },
    });
    if (!animal2) {
      animal2 = await animalRepo.save(
        animalRepo.create({
          name: 'Luna',
          clinicId: clinic.id,
          ownerId: owner.id,
        }),
      );
    }

    // Appointment type
    let consult30 = await aptTypeRepo.findOne({
      where: { label: 'Consultation 30m' },
    });
    if (!consult30) {
      consult30 = await aptTypeRepo.save(
        aptTypeRepo.create({ label: 'Consultation 30m', durationMin: 30 }),
      );
    }

    // Reminder rule
    let rule = await ruleRepo.findOne({
      where: { scope: 'APPOINTMENT' },
    });
    if (!rule) {
      rule = await ruleRepo.save(
        ruleRepo.create({
          scope: 'APPOINTMENT',
          offsetDays: -7,
          channelEmail: true,
          channelPush: false,
          active: true,
        }),
      );
    }

    // Appointments sample
    const now = new Date();
    const today10 = new Date(now);
    today10.setHours(10, 0, 0, 0);
    const today1030 = new Date(now);
    today1030.setHours(10, 30, 0, 0);

    const pendingApt = await aptRepo.findOne({
      where: { clinicId: clinic.id, animalId: animal1.id, startsAt: today10 },
    });
    if (!pendingApt) {
      await aptRepo.save(
        aptRepo.create({
          clinicId: clinic.id,
          animalId: animal1.id,
          vetUserId: vet1.id,
          typeId: consult30.id,
          status: 'PENDING',
          startsAt: today10,
          endsAt: new Date(today10.getTime() + 30 * 60 * 1000),
          createdByUserId: asv.id,
        }),
      );
    }

    const confirmedApt = await aptRepo.findOne({
      where: { clinicId: clinic.id, animalId: animal2.id, startsAt: today1030 },
    });
    if (!confirmedApt) {
      await aptRepo.save(
        aptRepo.create({
          clinicId: clinic.id,
          animalId: animal2.id,
          vetUserId: vet2.id,
          typeId: consult30.id,
          status: 'CONFIRMED',
          startsAt: today1030,
          endsAt: new Date(today1030.getTime() + 30 * 60 * 1000),
          createdByUserId: owner.id,
        }),
      );
    }

    // Reminder instance example J-7
    const onePending = await aptRepo.findOne({
      where: { clinicId: clinic.id, status: 'PENDING' },
    });
    if (onePending) {
      const sendAt = new Date(
        onePending.startsAt.getTime() - 7 * 24 * 60 * 60 * 1000,
      );
      const exists = await instanceRepo.findOne({
        where: {
          ruleId: rule.id,
          userId: owner.id,
          appointmentId: onePending.id,
        },
      });
      if (!exists) {
        await instanceRepo.save(
          instanceRepo.create({
            ruleId: rule.id,
            userId: owner.id,
            appointmentId: onePending.id,
            sendAt,
            status: 'SCHEDULED',
            payload: {},
          }),
        );
      }
    }

    // Output helpful demo credentials

    console.log('\nSeed complete. Demo accounts:');
    console.log('OWNER  : owner@example.com / password123');
    console.log('VET #1 : vet1@example.com  / password123');
    console.log('VET #2 : vet2@example.com  / password123');
    console.log('ASV    : asv@example.com   / password123');
    console.log('ADMIN  : admin@example.com / password123\n');
  } finally {
    await app.close();
  }
}

bootstrap().catch((e) => {
  console.error(e);
  process.exit(1);
});
