import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth';
import { visitController } from '../controllers/visitController';

const router = Router();

router.use(authenticate, requireRole('SUPER_ADMIN'));

router.get('/', visitController.list);
router.post('/create', visitController.create);
router.patch('/:id/cancel', visitController.cancel);

export default router;
