import { Router } from 'express';
import * as ctrl from '../controllers/cart.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { cartAddSchema, cartUpdateSchema } from './validators.js';

const router = Router();
router.use(requireAuth);

router.get('/', ctrl.getCart);
router.post('/items', validate(cartAddSchema), ctrl.addItem);
router.patch('/items/:productId', validate(cartUpdateSchema), ctrl.updateItem);
router.delete('/items/:productId', ctrl.removeItem);
router.delete('/', ctrl.clearCart);
router.post('/merge', ctrl.mergeCart);

export default router;
