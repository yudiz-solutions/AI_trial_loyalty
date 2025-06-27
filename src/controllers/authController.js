import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Admin from '../models/adminModel.js';
import Merchant from '../models/merchantModel.js';
import Worker from '../models/workerModel.js';
import PasswordResetToken from '../models/passwordResetTokenModel.js';
import { AppError } from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';
import logger from '../utils/logger.js';

// Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Send token response
const sendTokenResponse = (user, role, statusCode, res) => {
  const token = generateToken(user._id, role);

  // Remove password from output
  user.sPasswordHash = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: {
        ...user.toObject(),
        role
      }
    }
  });
};

// Login for all user types
export const login = catchAsync(async (req, res, next) => {
  const { sEmail, sPassword, sRole } = req.body;

  // Check if email, password, and role exist
  if (!sEmail || !sPassword || !sRole) {
    return next(new AppError('Please provide email, password, and role', 400));
  }

  let user;
  let Model;

  // Determine which model to use based on role
  switch (sRole) {
    case 'admin':
      Model = Admin;
      break;
    case 'merchant':
      Model = Merchant;
      break;
    case 'worker':
      Model = Worker;
      break;
    default:
      return next(new AppError('Invalid role specified', 400));
  }

  // Find user and include password
  user = await Model.findByEmail(sEmail).select('+sPasswordHash');
  if (!user) {
    return next(new AppError('Invalid credentials', 401));
  }

  // Check if merchant is approved (for merchant login)
  if (sRole === 'merchant' && !['approved', 'active'].includes(user.sStatus)) {
    return next(new AppError('Account is not approved yet', 401));
  }

  // Check if worker is active (for worker login)
  if (sRole === 'worker' && user.sStatus !== 'active') {
    return next(new AppError('Account is inactive', 401));
  }

  // Check if password matches
  const isPasswordValid = await user.isPasswordValid(sPassword);
  if (!isPasswordValid) {
    return next(new AppError('Invalid credentials', 401));
  }

  logger.info(`${sRole} logged in: ${sEmail}`);
  sendTokenResponse(user, sRole, 200, res);
});

// Register merchant
export const registerMerchant = catchAsync(async (req, res, next) => {
  const {
    sFirstName,
    sLastName,
    sEmail,
    sPhoneNumber,
    sPassword,
    sBusinessName,
    sBusinessAddress
  } = req.body;

  // Check if merchant already exists
  const existingMerchant = await Merchant.findByEmail(sEmail);
  if (existingMerchant) {
    return next(new AppError('Merchant already exists with this email', 400));
  }

  // Create merchant
  const merchant = await Merchant.create({
    sFirstName,
    sLastName,
    sEmail,
    sPhoneNumber,
    sPasswordHash: sPassword,
    sBusinessName,
    sBusinessAddress
  });

  logger.info(`New merchant registered: ${sEmail}`);
  sendTokenResponse(merchant, 'merchant', 201, res);
});

// Get current user
export const getMe = catchAsync(async (req, res, next) => {
  let user;
  let Model;

  // Determine which model to use based on role
  switch (req.user.role) {
    case 'admin':
      Model = Admin;
      break;
    case 'merchant':
      Model = Merchant;
      break;
    case 'worker':
      Model = Worker;
      break;
    default:
      return next(new AppError('Invalid user role', 400));
  }

  user = await Model.findById(req.user.userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user: {
        ...user.toObject(),
        role: req.user.role
      }
    }
  });
});

// Update password
export const updatePassword = catchAsync(async (req, res, next) => {
  const { sCurrentPassword, sNewPassword } = req.body;

  let user;
  let Model;

  // Determine which model to use based on role
  switch (req.user.role) {
    case 'admin':
      Model = Admin;
      break;
    case 'merchant':
      Model = Merchant;
      break;
    case 'worker':
      Model = Worker;
      break;
    default:
      return next(new AppError('Invalid user role', 400));
  }

  // Get user with password
  user = await Model.findById(req.user.userId).select('+sPasswordHash');
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Check current password
  const isCurrentPasswordValid = await user.isPasswordValid(sCurrentPassword);
  if (!isCurrentPasswordValid) {
    return next(new AppError('Current password is incorrect', 400));
  }

  // Update password
  user.sPasswordHash = sNewPassword;
  await user.save();

  logger.info(`Password updated for ${req.user.role}: ${user.sEmail}`);
  sendTokenResponse(user, req.user.role, 200, res);
});

// Forgot password
export const forgotPassword = catchAsync(async (req, res, next) => {
  const { sEmail, sRole } = req.body;

  if (!sEmail || !sRole) {
    return next(new AppError('Please provide email and role', 400));
  }

  let user;
  let Model;

  // Determine which model to use based on role
  switch (sRole) {
    case 'admin':
      Model = Admin;
      break;
    case 'merchant':
      Model = Merchant;
      break;
    case 'worker':
      Model = Worker;
      break;
    default:
      return next(new AppError('Invalid role specified', 400));
  }

  // Get user based on email
  user = await Model.findByEmail(sEmail);
  if (!user) {
    return next(new AppError('No user found with that email address', 404));
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Save token to database
  await PasswordResetToken.create({
    sEmail,
    sToken: resetToken,
    dExpiresAt: expiresAt
  });

  logger.info(`Password reset token generated for ${sRole}: ${sEmail}`);

  res.status(200).json({
    status: 'success',
    message: 'Password reset token generated',
    data: {
      resetToken // In production, send this via email
    }
  });
});

// Reset password
export const resetPassword = catchAsync(async (req, res, next) => {
  const { sToken, sNewPassword, sRole } = req.body;

  if (!sToken || !sNewPassword || !sRole) {
    return next(new AppError('Please provide token, new password, and role', 400));
  }

  // Find valid token
  const tokenDoc = await PasswordResetToken.findValidToken(sToken);
  if (!tokenDoc) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  let user;
  let Model;

  // Determine which model to use based on role
  switch (sRole) {
    case 'admin':
      Model = Admin;
      break;
    case 'merchant':
      Model = Merchant;
      break;
    case 'worker':
      Model = Worker;
      break;
    default:
      return next(new AppError('Invalid role specified', 400));
  }

  // Get user
  user = await Model.findByEmail(tokenDoc.sEmail);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Update password
  user.sPasswordHash = sNewPassword;
  await user.save();

  // Delete the used token
  await PasswordResetToken.findByIdAndDelete(tokenDoc._id);

  logger.info(`Password reset successful for ${sRole}: ${user.sEmail}`);
  sendTokenResponse(user, sRole, 200, res);
});

// Logout
export const logout = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
});