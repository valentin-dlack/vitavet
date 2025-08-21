import { validate } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

describe('CreateUserDto', () => {
  it('should pass validation with valid data', async () => {
    const dto = new CreateUserDto();
    dto.email = 'test@example.com';
    dto.firstName = 'John';
    dto.lastName = 'Doe';
    dto.password = 'password123';
    dto.role = 'ASV';
    dto.clinicId = '123e4567-e89b-12d3-a456-426614174000';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should pass validation with global role without clinicId', async () => {
    const dto = new CreateUserDto();
    dto.email = 'test@example.com';
    dto.firstName = 'John';
    dto.lastName = 'Doe';
    dto.password = 'password123';
    dto.role = 'OWNER';
    dto.clinicId = undefined;

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail validation with invalid email', async () => {
    const dto = new CreateUserDto();
    dto.email = 'invalid-email';
    dto.firstName = 'John';
    dto.lastName = 'Doe';
    dto.password = 'password123';
    dto.role = 'ASV';
    dto.clinicId = '123e4567-e89b-12d3-a456-426614174000';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.isEmail).toBeDefined();
  });

  it('should fail validation with empty email', async () => {
    const dto = new CreateUserDto();
    dto.email = '';
    dto.firstName = 'John';
    dto.lastName = 'Doe';
    dto.password = 'password123';
    dto.role = 'ASV';
    dto.clinicId = '123e4567-e89b-12d3-a456-426614174000';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.isNotEmpty).toBeDefined();
  });

  it('should fail validation with short password', async () => {
    const dto = new CreateUserDto();
    dto.email = 'test@example.com';
    dto.firstName = 'John';
    dto.lastName = 'Doe';
    dto.password = '123';
    dto.role = 'ASV';
    dto.clinicId = '123e4567-e89b-12d3-a456-426614174000';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.minLength).toBeDefined();
  });

  it('should fail validation with invalid role', async () => {
    const dto = new CreateUserDto();
    dto.email = 'test@example.com';
    dto.firstName = 'John';
    dto.lastName = 'Doe';
    dto.password = 'password123';
    dto.role = 'INVALID_ROLE' as any;
    dto.clinicId = '123e4567-e89b-12d3-a456-426614174000';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.isEnum).toBeDefined();
  });

  it('should fail validation with invalid clinicId format', async () => {
    const dto = new CreateUserDto();
    dto.email = 'test@example.com';
    dto.firstName = 'John';
    dto.lastName = 'Doe';
    dto.password = 'password123';
    dto.role = 'ASV';
    dto.clinicId = 'invalid-uuid';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.isUuid).toBeDefined();
  });

  it('should pass validation with valid UUID for clinicId', async () => {
    const dto = new CreateUserDto();
    dto.email = 'test@example.com';
    dto.firstName = 'John';
    dto.lastName = 'Doe';
    dto.password = 'password123';
    dto.role = 'ASV';
    dto.clinicId = '123e4567-e89b-12d3-a456-426614174000';

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should accept all valid roles', async () => {
    const validRoles = ['OWNER', 'VET', 'ASV', 'ADMIN_CLINIC', 'WEBMASTER'];

    for (const role of validRoles) {
      const dto = new CreateUserDto();
      dto.email = 'test@example.com';
      dto.firstName = 'John';
      dto.lastName = 'Doe';
      dto.password = 'password123';
      dto.role = role as any;
      dto.clinicId =
        role === 'OWNER' || role === 'WEBMASTER'
          ? undefined
          : '123e4567-e89b-12d3-a456-426614174000';

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    }
  });
});
