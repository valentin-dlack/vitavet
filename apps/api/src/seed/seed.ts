import 'reflect-metadata';
import '../env';
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
import { TimeSlot } from '../slots/entities/time-slot.entity';

async function bootstrap() {
  // Only allow running in production when explicitly requested (e.g., staging)
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.SEED_ON_DEPLOY !== 'true'
  ) {
    console.log('Seed skipped: SEED_ON_DEPLOY is not true');
    return;
  }

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
    const timeSlotRepo = dataSource.getRepository(TimeSlot);

    // Create users
    const owner = await usersService
      .create('owner@example.com', 'password123', 'Olivia', 'Owner')
      .catch(
        async () => (await usersService.findByEmail('owner@example.com'))!,
      );
    // Ensure explicit global role OWNER
    await usersService.assignGlobalRole(owner.id, 'OWNER');

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

    const webmaster = await usersService
      .create('webmaster@example.com', 'password123', 'Webmaster', 'Webmaster')
      .catch(
        async () => (await usersService.findByEmail('webmaster@example.com'))!,
      );
    // Ensure webmaster has global WEBMASTER role (not clinic-bound)
    await usersService.assignGlobalRole(webmaster.id, 'WEBMASTER');

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

    // Create realistic time slots for the next 14 days
    console.log('Creating time slots...');
    const veterinarians = [vet1, vet2];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Generate slots for the next 14 days
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const currentDay = new Date(today);
      currentDay.setDate(today.getDate() + dayOffset);

      // Skip weekends (0 = Sunday, 6 = Saturday)
      const dayOfWeek = currentDay.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      for (const vet of veterinarians) {
        // Generate 3-4 random slots per day per vet, between 9h and 19h
        const numSlots = Math.floor(Math.random() * 2) + 3; // 3 or 4 slots
        const usedHours = new Set<number>();

        for (let slotIndex = 0; slotIndex < numSlots; slotIndex++) {
          // Random hour between 9 and 18 (so slots end before 19h)
          let randomHour: number;
          do {
            randomHour = Math.floor(Math.random() * 10) + 9; // 9 to 18
          } while (usedHours.has(randomHour));

          usedHours.add(randomHour);

          // Random minute: 0 or 30
          const randomMinute = Math.random() < 0.5 ? 0 : 30;

          const slotStart = new Date(currentDay);
          slotStart.setHours(randomHour, randomMinute, 0, 0);

          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotStart.getMinutes() + 30); // 30 min slots

          // Check if slot already exists
          const existingSlot = await timeSlotRepo.findOne({
            where: {
              clinicId: clinic.id,
              vetUserId: vet.id,
              startsAt: slotStart,
            },
          });

          if (!existingSlot) {
            // Check if there's already an appointment at this time
            const conflictingApt = await aptRepo.findOne({
              where: {
                vetUserId: vet.id,
                startsAt: slotStart,
              },
            });

            await timeSlotRepo.save(
              timeSlotRepo.create({
                clinicId: clinic.id,
                vetUserId: vet.id,
                startsAt: slotStart,
                endsAt: slotEnd,
                isAvailable: !conflictingApt, // Not available if appointment exists
                durationMinutes: 30,
              }),
            );
          }
        }
      }
    }

    console.log('Time slots created successfully!');

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

    console.log('\n✅ Seed complete. Demo accounts:');
    console.log('OWNER     : owner@example.com / password123');
    console.log('VET #1    : vet1@example.com  / password123');
    console.log('VET #2    : vet2@example.com  / password123');
    console.log('ASV       : asv@example.com   / password123');
    console.log('ADMIN     : admin@example.com / password123');
    console.log('WEBMASTER : webmaster@example.com / password123\n');

    console.log('📅 Time slots created for the next 14 days (weekdays only)');
    console.log('   - 3-4 slots per day per vet');
    console.log('   - Between 9h and 19h');
    console.log('   - 30min duration each');
    console.log(
      '   - Automatically marked unavailable if appointment exists\n',
    );
  } finally {
    await app.close();
  }
}

bootstrap().catch((e) => {
  console.error(e);
  process.exit(1);
});
