import { z } from 'zod';

const document = z
  .string()
  .regex(/^\d{6,12}$/, 'El documento debe tener entre 6 y 12 dígitos.');

export const createCustomerSchema = z.object({
  document,
  firstName: z
    .string({ required_error: 'El nombre del cliente es obligatorio.', invalid_type_error: 'El nombre del cliente es obligatorio.' })
    .trim()
    .min(1, 'El nombre del cliente es obligatorio.')
    .max(80, 'El nombre no puede superar 80 caracteres.'),
  lastName: z
    .string({ invalid_type_error: 'El apellido debe ser texto.' })
    .trim()
    .max(80, 'El apellido no puede superar 80 caracteres.')
    .optional(),
  phone: z
    .string({ invalid_type_error: 'El teléfono debe ser texto.' })
    .trim()
    .regex(/^[+\d\s-]{6,32}$/, 'El teléfono solo admite dígitos, espacios, + y - (entre 6 y 32 caracteres).')
    .optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial().omit({ document: true });

export const listCustomersQuerySchema = z.object({
  search: z.string().trim().max(60, 'La búsqueda no puede superar 60 caracteres.').optional(),
  page: z.coerce.number({ invalid_type_error: 'Página inválida.' }).int().min(1).default(1),
  perPage: z.coerce.number({ invalid_type_error: 'Elementos por página inválidos.' }).int().min(1).max(50).default(20),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
