import { validate } from 'class-validator';
import { UpdateUserDto } from './update-user.dto';

describe('UpdateUserDto', () => {
  it('should pass validation with valid data', async () => {
    const dto = new UpdateUserDto();
    dto.email = 'test@example.com';
    dto.firstName = 'John';
    dto.lastName = 'Doe';
    dto.role = 'ASV';
    dto.clinicId = '123e4567-e89b-12d3-a456-426614174000';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass validation with partial data', async () => {
    const dto = new UpdateUserDto();
    dto.email = 'test@example.com';
    // firstName and lastName are optional, so this should pass

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass validation with only role change', async () => {
    const dto = new UpdateUserDto();
    dto.role = 'OWNER';
    dto.clinicId = undefined;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail validation with invalid email', async () => {
    const dto = new UpdateUserDto();
    dto.email = 'invalid-email';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.isEmail).toBeDefined();
  });

  it('should fail validation with invalid role', async () => {
    const dto = new UpdateUserDto();
    dto.role = 'INVALID_ROLE' as any;

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.isEnum).toBeDefined();
  });

  it('should fail validation with invalid clinicId format', async () => {
    const dto = new UpdateUserDto();
    dto.clinicId = 'invalid-uuid';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.isUuid).toBeDefined();
  });

  it('should pass validation with valid UUID for clinicId', async () => {
    const dto = new UpdateUserDto();
    dto.clinicId = '123e4567-e89b-12d3-a456-426614174000';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should accept all valid roles', async () => {
    const validRoles = ['OWNER', 'VET', 'ASV', 'ADMIN_CLINIC', 'WEBMASTER'];

    for (const role of validRoles) {
      const dto = new UpdateUserDto();
      dto.role = role as any;
      dto.clinicId =
        role === 'OWNER' || role === 'WEBMASTER'
          ? undefined
          : '123e4567-e89b-12d3-a456-426614174000';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    }
  });

  it('should pass validation with empty object', async () => {
    const dto = new UpdateUserDto();

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass validation with only firstName', async () => {
    const dto = new UpdateUserDto();
    dto.firstName = 'John';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass validation with only lastName', async () => {
    const dto = new UpdateUserDto();
    dto.lastName = 'Doe';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
