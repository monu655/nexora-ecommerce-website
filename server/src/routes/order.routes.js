import { Router } from 'express';
import * as ctrl from '../controllers/order.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { checkoutSchema } from './validators.js';

const router = Router();
router.use(requireAuth);

router.post('/checkout', validate(checkoutSchema), ctrl.checkout);
router.get('/', ctrl.myOrders);
router.get('/:id', ctrl.getMyOrder);
router.post('/:id/cancel', ctrl.cancelMyOrder);

export default router;
