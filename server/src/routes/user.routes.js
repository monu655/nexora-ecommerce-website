import { Router } from 'express';
import * as ctrl from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { addressSchema } from './validators.js';

const router = Router();
router.use(requireAuth);

router.patch('/profile', ctrl.updateProfile);
router.post('/change-password', ctrl.changePassword);
router.get('/addresses', ctrl.listAddresses);
router.post('/addresses', validate(addressSchema), ctrl.addAddress);
router.patch('/addresses/:addressId', ctrl.updateAddress);
router.delete('/addresses/:addressId', ctrl.deleteAddress);

export default router;
