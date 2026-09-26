import { z } from 'zod';

export const updateLoyaltyProgramSchema = z.object({
  requiredVisits: z.coerce
    .number({ required_error: 'Las visitas requeridas son obligatorias.', invalid_type_error: 'Las visitas requeridas deben ser un número.' })
    .int('Las visitas requeridas deben ser un número entero.')
    .min(1, 'Las visitas requeridas deben ser al menos 1.')
    .max(100, 'Las visitas requeridas no pueden superar 100.'),
  isActive: z.boolean({ invalid_type_error: 'El estado del programa debe ser verdadero o falso.' }).optional(),
});

export type UpdateLoyaltyProgramInput = z.infer<typeof updateLoyaltyProgramSchema>;
