import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/userModel.js';
import Token from '../models/tokenModel.js';
import { AppError } from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';
import logger from '../utils/logger.js';

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  // Remove password from output
  user.sPasswordHash = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

// Register user
export const register = catchAsync(async (req, res, next) => {
  const { sFirstName, sLastName, sEmail, sPassword } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(sEmail);
  if (existingUser) {
    return next(new AppError('User already exists with this email', 400));
  }

  // Create user
  const user = await User.create({
    sFirstName,
    sLastName,
    sEmail,
    sPasswordHash: sPassword
  });

  logger.info(`New user registered: ${sEmail}`);
  sendTokenResponse(user, 201, res);
});

// Login user
export const login = catchAsync(async (req, res, next) => {
  const { sEmail, sPassword } = req.body;

  // Check if email and password exist
  if (!sEmail || !sPassword) {
    return next(new AppError('Please provide email and password', 400));
  }

  // Check for user and include password
  const user = await User.findByEmail(sEmail).select('+sPasswordHash');
  if (!user) {
    return next(new AppError('Invalid credentials', 401));
  }

  // Check if user is active
  if (!user.bIsActive) {
    return next(new AppError('Account is deactivated', 401));
  }

  // Check if password matches
  const isPasswordValid = await user.isPasswordValid(sPassword);
  if (!isPasswordValid) {
    return next(new AppError('Invalid credentials', 401));
  }

  // Update last login
  await user.updateLastLogin();

  logger.info(`User logged in: ${sEmail}`);
  sendTokenResponse(user, 200, res);
});

// Get current user
export const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

// Update password
export const updatePassword = catchAsync(async (req, res, next) => {
  const { sCurrentPassword, sNewPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user.id).select('+sPasswordHash');

  // Check current password
  const isCurrentPasswordValid = await user.isPasswordValid(sCurrentPassword);
  if (!isCurrentPasswordValid) {
    return next(new AppError('Current password is incorrect', 400));
  }

  // Update password
  user.sPasswordHash = sNewPassword;
  await user.save();

  logger.info(`Password updated for user: ${user.sEmail}`);
  sendTokenResponse(user, 200, res);
});

// Forgot password
export const forgotPassword = catchAsync(async (req, res, next) => {
  const { sEmail } = req.body;

  // Get user based on email
  const user = await User.findByEmail(sEmail);
  if (!user) {
    return next(new AppError('No user found with that email address', 404));
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Save token to database
  await Token.create({
    oUserId: user._id,
    sToken: resetToken,
    sType: 'password-reset',
    dExpiresAt: expiresAt
  });

  logger.info(`Password reset token generated for user: ${sEmail}`);

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
  const { sToken, sNewPassword } = req.body;

  // Find valid token
  const tokenDoc = await Token.findValidToken(sToken, 'password-reset');
  if (!tokenDoc) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  // Get user
  const user = await User.findById(tokenDoc.oUserId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Update password
  user.sPasswordHash = sNewPassword;
  await user.save();

  // Mark token as used
  await tokenDoc.markAsUsed();

  logger.info(`Password reset successful for user: ${user.sEmail}`);
  sendTokenResponse(user, 200, res);
});

// Logout (if using token blacklisting)
export const logout = catchAsync(async (req, res, next) => {
  // In a real application, you might want to blacklist the token
  // For now, we'll just send a success response
  
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
});