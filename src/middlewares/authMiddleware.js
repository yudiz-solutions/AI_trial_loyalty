import jwt from 'jsonwebtoken';
import Admin from '../models/adminModel.js';
import Merchant from '../models/merchantModel.js';
import Worker from '../models/workerModel.js';
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

  let currentUser;
  let Model;

  // Determine which model to use based on role
  switch (decoded.role) {
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
      return next(new AppError('Invalid user role in token', 401));
  }

  // Check if user still exists
  currentUser = await Model.findById(decoded.userId);
  if (!currentUser) {
    return next(new AppError('The user belonging to this token does no longer exist.', 401));
  }

  // Check if merchant is approved (for merchant access)
  if (decoded.role === 'merchant' && !['approved', 'active'].includes(currentUser.sStatus)) {
    return next(new AppError('Your account is not approved yet.', 401));
  }

  // Check if worker is active (for worker access)
  if (decoded.role === 'worker' && currentUser.sStatus !== 'active') {
    return next(new AppError('Your account is inactive.', 401));
  }

  // Grant access to protected route
  req.user = {
    userId: currentUser._id,
    role: decoded.role,
    email: currentUser.sEmail,
    ...currentUser.toObject()
  };
  
  next();
});

// Restrict to certain roles
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
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
      
      let currentUser;
      let Model;

      switch (decoded.role) {
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
          return next();
      }

      currentUser = await Model.findById(decoded.userId);
      
      if (currentUser) {
        req.user = {
          userId: currentUser._id,
          role: decoded.role,
          email: currentUser.sEmail,
          ...currentUser.toObject()
        };
      }
    } catch (error) {
      // Token is invalid, but we don't throw an error
      // Just continue without setting req.user
    }
  }

  next();
});