import User from '../models/userModel.js';
import { AppError } from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';
import logger from '../utils/logger.js';

// Get all users
export const getAllUsers = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build query
  const query = {};
  if (req.query.role) query.sRole = req.query.role;
  if (req.query.active !== undefined) query.bIsActive = req.query.active === 'true';

  // Execute query
  const users = await User.find(query)
    .select('-sPasswordHash')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await User.countDocuments(query);

  res.status(200).json({
    status: 'success',
    results: users.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    data: {
      users
    }
  });
});

// Get user by ID
export const getUserById = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).lean();

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

// Update user
export const updateUser = catchAsync(async (req, res, next) => {
  // Fields that can be updated
  const allowedFields = [
    'sFirstName',
    'sLastName',
    'oProfile.sPhone',
    'oProfile.sAvatar',
    'oProfile.dDateOfBirth',
    'oProfile.sAddress'
  ];

  // Filter out unwanted fields
  const filteredBody = {};
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      filteredBody[key] = req.body[key];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.params.id,
    filteredBody,
    {
      new: true,
      runValidators: true
    }
  );

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  logger.info(`User updated: ${user.sEmail}`);

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

// Delete user (soft delete)
export const deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { bIsActive: false },
    { new: true }
  );

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  logger.info(`User deactivated: ${user.sEmail}`);

  res.status(200).json({
    status: 'success',
    message: 'User deactivated successfully'
  });
});

// Activate user
export const activateUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { bIsActive: true },
    { new: true }
  );

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  logger.info(`User activated: ${user.sEmail}`);

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

// Update user role (admin only)
export const updateUserRole = catchAsync(async (req, res, next) => {
  const { sRole } = req.body;

  if (!['user', 'admin', 'moderator'].includes(sRole)) {
    return next(new AppError('Invalid role', 400));
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { sRole },
    { new: true }
  );

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  logger.info(`User role updated: ${user.sEmail} -> ${sRole}`);

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

// Get user statistics
export const getUserStats = catchAsync(async (req, res, next) => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: {
          $sum: { $cond: [{ $eq: ['$bIsActive', true] }, 1, 0] }
        },
        verifiedUsers: {
          $sum: { $cond: [{ $eq: ['$bIsEmailVerified', true] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalUsers: 1,
        activeUsers: 1,
        inactiveUsers: { $subtract: ['$totalUsers', '$activeUsers'] },
        verifiedUsers: 1,
        unverifiedUsers: { $subtract: ['$totalUsers', '$verifiedUsers'] }
      }
    }
  ]);

  const roleStats = await User.aggregate([
    {
      $group: {
        _id: '$sRole',
        count: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      overview: stats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        verifiedUsers: 0,
        unverifiedUsers: 0
      },
      roleDistribution: roleStats
    }
  });
});