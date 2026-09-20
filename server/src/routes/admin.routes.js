import { Router } from 'express';
import * as admin from '../controllers/admin.controller.js';
import * as products from '../controllers/product.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { productBodySchema, orderStatusSchema, stockSchema } from './validators.js';

const router = Router();

// Every admin route passes through authentication *and* role authorisation.
router.use(requireAuth, requireAdmin);

router.get('/analytics/dashboard', admin.dashboard);
router.get('/analytics/revenue', admin.revenueSeries);
router.get('/analytics/categories', admin.categoryPerformance);

router.get('/products', products.adminListProducts);
router.post('/products', validate(productBodySchema), products.createProduct);
router.patch('/products/:id', products.updateProduct);
router.patch('/products/:id/stock', validate(stockSchema), products.updateStock);
router.delete('/products/:id', products.deleteProduct);
router.post('/products/:id/restore', products.restoreProduct);

router.get('/orders', admin.listOrders);
router.get('/orders/:id', admin.getOrder);
router.patch('/orders/:id/status', validate(orderStatusSchema), admin.updateOrderStatus);

router.get('/customers', admin.listCustomers);
router.patch('/customers/:id/status', admin.setCustomerStatus);

export default router;
