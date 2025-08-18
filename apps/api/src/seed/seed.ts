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

    // Animals for owner (enriched fields)
    let animal1 = await animalRepo.findOne({
      where: { name: 'Milo', clinicId: clinic.id },
    });
    if (!animal1) {
      animal1 = await animalRepo.save(
        animalRepo.create({
          name: 'Milo',
          clinicId: clinic.id,
          ownerId: owner.id,
          species: 'chien',
          breed: 'Labrador',
          sex: 'MALE',
          isSterilized: true,
          color: 'noir',
          chipId: '250269604000000',
          weightKg: 28.5,
          heightCm: 55,
          isNac: false,
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
          species: 'chat',
          breed: 'Européen',
          sex: 'FEMALE',
          isSterilized: true,
          color: 'tigré',
          chipId: '250269604000001',
          weightKg: 4.2,
          heightCm: 25,
          isNac: false,
        }),
      );
    }

    // Appointment types
    let consult30 = await aptTypeRepo.findOne({
      where: { label: 'Consultation 30m' },
    });
    if (!consult30) {
      consult30 = await aptTypeRepo.save(
        aptTypeRepo.create({ label: 'Consultation 30m', durationMin: 30 }),
      );
    }
    let consult60 = await aptTypeRepo.findOne({
      where: { label: 'Consultation 60m' },
    });
    if (!consult60) {
      consult60 = await aptTypeRepo.save(
        aptTypeRepo.create({ label: 'Consultation 60m', durationMin: 60 }),
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

    // Realistic appointments per animal: one 3 months ago, one today, one in 2 months
    const now = new Date();
    const animals = [animal1, animal2];
    const vets = [vet1, vet2];
    const types = [consult30, consult60];

    type SeedStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED';
    async function upsertAppointment(opts: {
      animal: Animal;
      vet: typeof vet1;
      startsAt: Date;
      type: AppointmentType;
      status: SeedStatus;
      createdByUserId: string;
    }) {
      const { animal, vet, startsAt, type, status, createdByUserId } = opts;
      const endsAt = new Date(
        startsAt.getTime() + type.durationMin * 60 * 1000,
      );
      const exists = await aptRepo.findOne({
        where: { clinicId: clinic!.id, startsAt, vetUserId: vet.id },
      });
      if (!exists) {
        await aptRepo.save(
          aptRepo.create({
            clinicId: clinic!.id,
            animalId: animal.id,
            vetUserId: vet.id,
            typeId: type.id,
            status,
            startsAt,
            endsAt,
            createdByUserId,
          }),
        );
      }
    }

    for (let i = 0; i < animals.length; i++) {
      const animal = animals[i];
      const vet = vets[i % vets.length];

      // 3 months ago, 10:00
      const past = new Date(now);
      past.setMonth(now.getMonth() - 3);
      past.setHours(10, 0, 0, 0);
      await upsertAppointment({
        animal,
        vet,
        startsAt: past,
        type: types[i % types.length],
        status: 'COMPLETED',
        createdByUserId: vet.id,
      });

      // today, 14:00
      const today = new Date(now);
      today.setHours(14, 0, 0, 0);
      await upsertAppointment({
        animal,
        vet,
        startsAt: today,
        type: types[(i + 1) % types.length],
        status: 'CONFIRMED',
        createdByUserId: animal.ownerId,
      });

      // in 2 months, 11:00
      const future = new Date(now);
      future.setMonth(now.getMonth() + 2);
      future.setHours(11, 0, 0, 0);
      await upsertAppointment({
        animal,
        vet,
        startsAt: future,
        type: types[i % types.length],
        status: 'CONFIRMED',
        createdByUserId: animal.ownerId,
      });
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
