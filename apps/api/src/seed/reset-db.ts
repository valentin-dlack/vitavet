import 'reflect-metadata';
import '../env';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';

async function reset() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });
  try {
    const dataSource = app.get(DataSource);
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    console.log('Dropping public schema ...');
    await queryRunner.query('DROP SCHEMA IF EXISTS public CASCADE;');
    console.log('Recreating public schema ...');
    await queryRunner.query('CREATE SCHEMA public;');
    await queryRunner.release();
    console.log('Database reset done.');
  } finally {
    await app.close();
  }
}

reset().catch((e) => {
  console.error(e);
  process.exit(1);
});
