import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth';
import { rewardController } from '../controllers/rewardController';

const router = Router();

router.use(authenticate, requireRole('SUPER_ADMIN'));

router.get('/customer/:document', rewardController.list);
router.post('/:id/redeem', rewardController.redeem);

export default router;
