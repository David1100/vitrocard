import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth';
import { salonController } from '../controllers/salonController';

const router = Router();

// Público y anónimo: welcome del QR (antes del guard admin).
router.get('/qr/:code', salonController.lookupQr);

router.use(authenticate, requireRole('SUPER_ADMIN'));

router.get('/', salonController.list);
router.post('/create', salonController.create);
router.get('/:id', salonController.get);
router.put('/:id', salonController.update);
router.patch('/:id', salonController.setStatus);

export default router;
