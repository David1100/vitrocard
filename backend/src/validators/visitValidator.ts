import { z } from 'zod';

export const createVisitSchema = z.object({
  document: z.string().regex(/^\d{6,12}$/, 'El documento del cliente debe tener entre 6 y 12 dígitos.'),
  salonId: z.string().regex(/^\d+$/, 'El salón seleccionado no es válido.'),
});

export const listVisitsQuerySchema = z.object({
  search: z.string().trim().max(60, 'La búsqueda no puede superar 60 caracteres.').optional(),
  page: z.coerce.number({ invalid_type_error: 'Página inválida.' }).int().min(1).default(1),
  perPage: z.coerce.number({ invalid_type_error: 'Elementos por página inválidos.' }).int().min(1).max(50).default(20),
});

export type CreateVisitInput = z.infer<typeof createVisitSchema>;
export type ListVisitsQuery = z.infer<typeof listVisitsQuerySchema>;
