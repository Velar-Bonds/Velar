import {
  createBondRequestRequestSchema,
  createReportRequestSchema,
  createTransferRequestSchema,
  registerRequestSchema,
} from '@velar/types';
import { validateSchemaForm } from './schema-form';

describe('shared schema form integration', () => {
  it('maps signup errors to localized inline fields', () => {
    const result = validateSchemaForm(registerRequestSchema, {
      email: 'invalid', password: 'short', perspectiva: 'usuario',
    }, 'es');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.email).toEqual(['Ingresá un correo electrónico válido.']);
      expect(result.errors.password).toEqual(['La contraseña debe tener al menos 8 caracteres.']);
      expect(result.errors.nombres).toEqual(['Este campo es obligatorio.']);
    }
  });

  it.each([
    ['bond', createBondRequestRequestSchema, { faceValue: 0 }],
    ['transfer', createTransferRequestSchema, { bondTokenId: '', amount: -1 }],
    ['report', createReportRequestSchema, { title: '', description: '' }],
  ])('uses the shared %s schema', (_name, schema, values) => {
    expect(validateSchemaForm(schema, values, 'en').success).toBe(false);
  });
});
