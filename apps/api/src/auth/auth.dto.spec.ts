import { plainToInstance } from 'class-transformer';
import { validate, ValidatorOptions } from 'class-validator';
import { RegisterDto } from './dto/auth.dto';

const validatorOptions: ValidatorOptions = {
  whitelist: true,
  forbidNonWhitelisted: true,
};

describe('RegisterDto', () => {
  it('rechaza email vacío / inválido', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: 'no-es-un-email',
      password: '12345678',
      perspectiva: 'usuario',
    });
    const errors = await validate(dto, validatorOptions);
    const props = errors.map((e) => e.property);
    expect(props).toContain('email');
  });

  it('rechaza password menor a 8 caracteres', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: 'user@velar.cr',
      password: '1234',
      perspectiva: 'usuario',
    });
    const errors = await validate(dto, validatorOptions);
    const props = errors.map((e) => e.property);
    expect(props).toContain('password');
  });

  it('rechaza perspectiva inválida', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: 'user@velar.cr',
      password: '12345678',
      perspectiva: 'admin',
    });
    const errors = await validate(dto, validatorOptions);
    const props = errors.map((e) => e.property);
    expect(props).toContain('perspectiva');
  });

  it('rechaza campos desconocidos con forbidNonWhitelisted', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: 'user@velar.cr',
      password: '12345678',
      perspectiva: 'usuario',
      isAdmin: true,
    });
    const errors = await validate(dto, validatorOptions);
    const props = errors.map((e) => e.property);
    expect(props).toContain('isAdmin');
  });

  it('acepta payload válido — usuario', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: 'comprador@velar.cr',
      password: 'Velar12345!',
      perspectiva: 'usuario',
      nombres: 'Juan',
      apellidos: 'Pérez',
    });
    const errors = await validate(dto, validatorOptions);
    expect(errors).toHaveLength(0);
  });

  it('acepta payload válido — partido', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: 'partido@velar.cr',
      password: 'Velar12345!',
      perspectiva: 'partido',
      nombrePartido: 'Partido Velar',
      codigo: 'PV',
    });
    const errors = await validate(dto, validatorOptions);
    expect(errors).toHaveLength(0);
  });
});
