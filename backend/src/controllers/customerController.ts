import type { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middlewares/errorHandler';
import { CustomerService } from '../services/customerService';
import { CustomerRepository } from '../repositories/customerRepository';
import type { UserRef } from '../utils/jwt';
import {
  createCustomerSchema,
  updateCustomerSchema,
  listCustomersQuerySchema,
} from '../validators/customerValidator';
import { ZodError } from 'zod';
import { requiredParamId } from '../utils/params';

const service = new CustomerService(new CustomerRepository());

/** Traduce errores de validación a mensajes amigables. */
function toMessage(err: unknown): never {
  if (err instanceof ZodError) {
    const first = err.issues[0];
    throw new AppError(400, first ? first.message : 'Datos inválidos.');
  }
  throw err;
}

export class CustomerController {
  create = asyncHandler(async (req: Request, res: Response) => {
    try {
      const input = createCustomerSchema.parse(req.body);
      const customer = await service.create(input, req.user as UserRef);
      res.status(201).json({ message: 'Cliente creado correctamente.', customer });
    } catch (err) {
      toMessage(err);
    }
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    try {
      const input = updateCustomerSchema.parse(req.body);
      const customer = await service.update(requiredParamId(req), input, req.user as UserRef);
      res.json({ message: 'Cliente actualizado correctamente.', customer });
    } catch (err) {
      toMessage(err);
    }
  });

  setStatus = asyncHandler(async (req: Request, res: Response) => {
    const status = req.body['status'] === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const result = await service.setStatus(requiredParamId(req), status, req.user as UserRef);
    res.json({ message: status === 'ACTIVE' ? 'Cliente reactivado.' : 'Cliente desactivado.', customer: result });
  });

  get = asyncHandler(async (req: Request, res: Response) => {
    const customer = await service.get(requiredParamId(req));
    if (!customer) throw new AppError(404, 'Cliente no encontrado.');
    res.json(customer);
  });

  list = asyncHandler(async (req: Request, res: Response) => {
    try {
      const query = listCustomersQuerySchema.parse(req.query);
      const result = await service.list(query);
      res.json(result);
    } catch (err) {
      toMessage(err);
    }
  });
}

export const customerController = new CustomerController();
