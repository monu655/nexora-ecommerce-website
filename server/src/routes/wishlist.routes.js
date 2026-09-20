import { Router } from 'express';
import * as ctrl from '../controllers/wishlist.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', ctrl.getWishlist);
router.post('/toggle', ctrl.toggleWishlist);
router.delete('/:productId', ctrl.removeFromWishlist);

export default router;
