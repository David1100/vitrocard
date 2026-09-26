import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';
import { DashboardService } from '../services/dashboardService';

const router = Router();
const service = new DashboardService();

router.get(
  '/stats',
  authenticate,
  requireRole('SUPER_ADMIN'),
  asyncHandler(async (_req, res) => {
    res.json(await service.stats());
  }),
);

export default router;
