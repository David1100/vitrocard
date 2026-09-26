import { describe, expect, it } from 'vitest';
import { createCustomerSchema } from '../src/validators/customerValidator';
import { createSalonSchema } from '../src/validators/salonValidator';
import { createVisitSchema } from '../src/validators/visitValidator';
import { redeemRewardSchema } from '../src/validators/rewardValidator';
import { loginSchema } from '../src/validators/authValidator';
import { slugify } from '../src/validators/salonValidator';

describe('validators: clientes', () => {
  it('acepta un documento válido de 6–12 dígitos', () => {
    expect(createCustomerSchema.safeParse({ document: '1032764412', firstName: 'David' }).success).toBe(true);
  });

  it('rechaza documento con letras o longitud incorrecta', () => {
    expect(createCustomerSchema.safeParse({ document: 'abc123', firstName: 'X' }).success).toBe(false);
    expect(createCustomerSchema.safeParse({ document: '12345', firstName: 'X' }).success).toBe(false);
    expect(createCustomerSchema.safeParse({ document: '1234567890123456', firstName: 'X' }).success).toBe(false);
  });
});

describe('validators: salones', () => {
  it('normaliza slug sin acentos ni espacios', () => {
    expect(createSalonSchema.safeParse({ name: 'Salón Aurora ™' }).success).toBe(true);
  });

  it('email opcional debe ser email válido si se provee', () => {
    const bad = createSalonSchema.safeParse({ name: 'Aurora', email: 'no-es-email' });
    expect(bad.success).toBe(false);
  });

  it('slugify quita acentos y espacios', () => {
    expect(slugify('Café & Spa Ñ')).toBe('cafe-spa-n');
  });
});

describe('validators: visitas', () => {
  it('requiere document y salonId numérico', () => {
    expect(createVisitSchema.safeParse({ document: '1032764412', salonId: '1' }).success).toBe(true);
    expect(createVisitSchema.safeParse({ document: '1032764412', salonId: 'xyz' }).success).toBe(false);
  });
});

describe('validators: canje y login', () => {
  it('canje requiere salonId numérico', () => {
    expect(redeemRewardSchema.safeParse({ salonId: '2' }).success).toBe(true);
    expect(redeemRewardSchema.safeParse({ salonId: 'a' }).success).toBe(false);
  });

  it('login exige contraseña con mínimo de longitud y email válido', () => {
    expect(loginSchema.safeParse({ email: 'admin@vitro.com', password: '12345678' }).success).toBe(true);
    expect(loginSchema.safeParse({ email: 'mal', password: '12345678' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'corta' }).success).toBe(false);
  });
});
