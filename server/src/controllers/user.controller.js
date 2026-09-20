import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/apiResponse.js';

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  if (name) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;
  await req.user.save();
  return ok(res, { user: req.user }, 'Profile updated');
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await req.user.constructor.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect');
  }
  user.password = newPassword;
  await user.save();
  return ok(res, null, 'Password changed');
});

export const listAddresses = asyncHandler(async (req, res) => ok(res, req.user.addresses));

export const addAddress = asyncHandler(async (req, res) => {
  if (req.user.addresses.length >= 8) {
    throw ApiError.badRequest('You can save up to 8 addresses');
  }
  req.user.addresses.push(req.body);
  await req.user.save();
  return created(res, req.user.addresses, 'Address saved');
});

export const updateAddress = asyncHandler(async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) throw ApiError.notFound('Address not found');
  if (req.body.isDefault) req.user.addresses.forEach((a) => { a.isDefault = false; });
  address.set(req.body);
  await req.user.save();
  return ok(res, req.user.addresses, 'Address updated');
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const address = req.user.addresses.id(req.params.addressId);
  if (!address) throw ApiError.notFound('Address not found');
  address.deleteOne();
  await req.user.save();
  return ok(res, req.user.addresses, 'Address removed');
});
