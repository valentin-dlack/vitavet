import { HealthController } from './health.controller';

describe('HealthController (root)', () => {
  it('ok() returns status ok', () => {
    const controller = new HealthController();
    expect(controller.ok()).toEqual({ status: 'ok' });
  });
});
