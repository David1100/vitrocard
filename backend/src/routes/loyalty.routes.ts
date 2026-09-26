import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth';
import { loyaltyController } from '../controllers/loyaltyController';

const router = Router();

// Ruta pública y anónima: solo lectura, sin datos sensibles, con rate limiting global.
router.get('/lookup/:document', loyaltyController.lookup);

// Configuración protegida.
router.get('/config', authenticate, requireRole('SUPER_ADMIN'), loyaltyController.getConfig);
router.patch('/config', authenticate, requireRole('SUPER_ADMIN'), loyaltyController.updateConfig);

export default router;
