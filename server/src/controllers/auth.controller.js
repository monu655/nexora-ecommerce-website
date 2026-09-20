import { User } from '../models/User.js';
import { Cart } from '../models/Cart.js';
import { Wishlist } from '../models/Wishlist.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/apiResponse.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/token.js';
import { ROLES } from '../config/constants.js';

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  initials: user.initials,
  avatarColor: user.avatarColor,
  addresses: user.addresses,
  createdAt: user.createdAt,
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (await User.exists({ email })) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const user = await User.create({ name, email, password, phone, role: ROLES.CUSTOMER });
  await Promise.all([
    Cart.create({ user: user._id, items: [] }),
    Wishlist.create({ user: user._id, products: [] }),
  ]);

  return created(res, {
    user: publicUser(user),
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
  }, 'Account created');
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  // Same message for unknown email and wrong password — no account enumeration.
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Email or password is incorrect');
  }
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated');

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  return ok(res, {
    user: publicUser(user),
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user),
  }, 'Signed in');
});

export const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, role: ROLES.ADMIN }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Email or password is incorrect');
  }
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });
  return ok(res, { user: publicUser(user), accessToken: signAccessToken(user) }, 'Signed in');
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Session expired. Please sign in again.');
  }
  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw ApiError.unauthorized();
  return ok(res, { accessToken: signAccessToken(user) });
});

export const me = asyncHandler(async (req, res) => ok(res, { user: publicUser(req.user) }));

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie('nexora_token');
  return ok(res, null, 'Signed out');
});
