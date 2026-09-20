import { Router } from 'express';
import * as ctrl from '../controllers/product.controller.js';
import * as reviews from '../controllers/review.controller.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { productQuerySchema, reviewSchema } from './validators.js';

const router = Router();

router.get('/', validate(productQuerySchema), ctrl.getProducts);
router.get('/facets', ctrl.getFacets);
router.get('/:idOrSlug', ctrl.getProduct);
router.get('/:productId/reviews', reviews.listProductReviews);
router.post('/:productId/reviews', requireAuth, validate(reviewSchema), reviews.createReview);

export default router;
