import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { AppError } from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';

// Protect routes - verify JWT token
export const protect = catchAsync(async (req, res, next) => {
  // Get token from header
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  // Verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Check if user still exists
  const currentUser = await User.findById(decoded.userId);
  if (!currentUser) {
    return next(new AppError('The user belonging to this token does no longer exist.', 401));
  }

  // Check if user is active
  if (!currentUser.bIsActive) {
    return next(new AppError('Your account has been deactivated. Please contact support.', 401));
  }

  // Grant access to protected route
  req.user = currentUser;
  next();
});

// Restrict to certain roles
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.sRole)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const currentUser = await User.findById(decoded.userId);
      
      if (currentUser && currentUser.bIsActive) {
        req.user = currentUser;
      }
    } catch (error) {
      // Token is invalid, but we don't throw an error
      // Just continue without setting req.user
    }
  }

  next();
});