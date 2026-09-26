import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth';
import { customerController } from '../controllers/customerController';

const router = Router();

router.use(authenticate, requireRole('SUPER_ADMIN'));

router.get('/', customerController.list);
router.post('/create', customerController.create);
router.get('/:id', customerController.get);
router.put('/:id', customerController.update);
router.patch('/:id', customerController.setStatus);

export default router;
