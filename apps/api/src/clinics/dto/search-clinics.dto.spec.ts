import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { SearchClinicsDto } from './search-clinics.dto';

describe('SearchClinicsDto', () => {
  it('accepts valid postcode', async () => {
    const dto = plainToInstance(SearchClinicsDto, { postcode: '75001' });
    const errs = await validate(dto);
    expect(errs.length).toBe(0);
  });

  it('rejects too long postcode', async () => {
    const dto = plainToInstance(SearchClinicsDto, {
      postcode: '1234567890123',
    });
    const errs = await validate(dto);
    expect(errs.length).toBeGreaterThan(0);
  });

  it('rejects invalid characters', async () => {
    const dto = plainToInstance(SearchClinicsDto, { postcode: '75001$' });
    const errs = await validate(dto);
    expect(errs.length).toBeGreaterThan(0);
  });
});
