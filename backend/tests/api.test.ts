import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { AppError } from '../src/middlewares/errorHandler';

describe('API smoke (sin tocar BD)', () => {
  it('GET /api/health responde ok', async () => {
    const res = await request(createApp()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', service: 'vitro-api' });
  });

  it('endpoints admin exigen auth (401 sin token)', async () => {
    for (const route of ['/api/customers', '/api/visits', '/api/rewards/customer/123456', '/api/dashboard/stats']) {
      const res = await request(createApp()).get(route);
      expect(res.status).toBe(401);
    }
  });

  it('login sin body falla con 400 (validator) y sin detalles técnicos', async () => {
    const res = await request(createApp()).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body?.message).toBeTruthy();
    // No debe revelar errores técnicos crudos
    expect(res.body.message as string).not.toMatch(/Prisma|SQL/i);
  });
});

describe('middlewarate errorHandler', () => {
  it('AppError conserva statusCode y mensaje amigable', () => {
    const err = new AppError(409, 'Ya existe un cliente con ese documento.');
    expect(err.statusCode).toBe(409);
    expect(err.message).toContain('documento');
  });
});
