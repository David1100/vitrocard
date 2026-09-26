import { z } from 'zod';

export const redeemRewardSchema = z.object({
  salonId: z.string().regex(/^\d+$/, 'El salón seleccionado no es válido.'),
});

export type RedeemRewardInput = z.infer<typeof redeemRewardSchema>;
