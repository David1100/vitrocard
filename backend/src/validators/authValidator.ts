import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'El email es obligatorio.', invalid_type_error: 'El email es obligatorio.' })
    .trim()
    .min(3, 'El email es obligatorio.')
    .max(180, 'El email no puede superar 180 caracteres.')
    .email('El email no tiene un formato válido.'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria.', invalid_type_error: 'La contraseña es obligatoria.' })
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    .max(100, 'La contraseña no puede superar 100 caracteres.'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/** Valida el body del endpoint contra un schema zod y aborta con error si no cumple. */
export function parseLoginBody(body: unknown): LoginInput {
  return loginSchema.parse(body);
}
