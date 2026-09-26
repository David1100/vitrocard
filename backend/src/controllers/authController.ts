import type { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { authService } from '../services/authService';
import { loginSchema } from '../validators/authValidator';
import type { UserRef } from '../utils/jwt';
import { AppError } from '../middlewares/errorHandler';

export class AuthController {
  login = asyncHandler(async (req: Request, res: Response) => {
    const body = loginSchema.parse(req.body);
    const result = await authService.login(body, res);
    // login() ya responde con 401 si falla; si devuelve resultado, respondemos 200.
    if (result) {
      res.json(result);
    }
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.refresh(req, res);
    // refresh() ya responde 401 si falla.
    if (result) {
      res.json(result);
    }
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    await authService.logout(req, res);
  });

  me = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as UserRef | undefined;
    if (!user) throw new AppError(401, 'Sesión no válida.');
    const me = await authService.me(user);
    res.json(me);
  });
}

export const authController = new AuthController();
