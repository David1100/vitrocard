import { z } from 'zod';

const slugify = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const createSalonSchema = z.object({
  name: z
    .string({ required_error: 'El nombre del salón es obligatorio.', invalid_type_error: 'El nombre del salón es obligatorio.' })
    .trim()
    .min(2, 'El nombre del salón debe tener al menos 2 caracteres.')
    .max(120, 'El nombre del salón no puede superar 120 caracteres.'),
  address: z
    .string({ invalid_type_error: 'La dirección debe ser texto.' })
    .trim()
    .max(255, 'La dirección no puede superar 255 caracteres.')
    .optional(),
  phone: z
    .string({ invalid_type_error: 'El teléfono debe ser texto.' })
    .trim()
    .regex(/^[+\d\s-]{6,32}$/, 'El teléfono solo admite dígitos, espacios, + y - (entre 6 y 32 caracteres).')
    .optional(),
  email: z
    .string({ invalid_type_error: 'El email debe ser texto.' })
    .trim()
    .email('El email no tiene un formato válido.')
    .optional(),
});

export const updateSalonSchema = createSalonSchema.partial();

export const listSalonsQuerySchema = z.object({
  search: z.string().trim().max(60, 'La búsqueda no puede superar 60 caracteres.').optional(),
  page: z.coerce.number({ invalid_type_error: 'Página inválida.' }).int().min(1).default(1),
  perPage: z.coerce.number({ invalid_type_error: 'Elementos por página inválidos.' }).int().min(1).max(50).default(20),
});

export type CreateSalonInput = z.infer<typeof createSalonSchema>;
export type UpdateSalonInput = z.infer<typeof updateSalonSchema>;
export { slugify };
