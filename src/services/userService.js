import User from '../models/userModel.js';
import { AppError } from '../utils/appError.js';
import logger from '../utils/logger.js';

export class UserService {
  // Create a new user
  static async createUser(userData) {
    try {
      const user = await User.create(userData);
      logger.info(`User created: ${user.sEmail}`);
      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  // Find user by email
  static async findUserByEmail(email) {
    try {
      return await User.findByEmail(email);
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw error;
    }
  }

  // Find user by ID
  static async findUserById(id) {
    try {
      const user = await User.findById(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }
      return user;
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      throw error;
    }
  }

  // Update user
  static async updateUser(id, updateData) {
    try {
      const user = await User.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!user) {
        throw new AppError('User not found', 404);
      }

      logger.info(`User updated: ${user.sEmail}`);
      return user;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  // Soft delete user
  static async deactivateUser(id) {
    try {
      const user = await User.findByIdAndUpdate(
        id,
        { bIsActive: false },
        { new: true }
      );

      if (!user) {
        throw new AppError('User not found', 404);
      }

      logger.info(`User deactivated: ${user.sEmail}`);
      return user;
    } catch (error) {
      logger.error('Error deactivating user:', error);
      throw error;
    }
  }

  // Get paginated users
  static async getPaginatedUsers(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        filters = {}
      } = options;

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const users = await User.find(filters)
        .select('-sPasswordHash')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await User.countDocuments(filters);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting paginated users:', error);
      throw error;
    }
  }

  // Get user statistics
  static async getUserStatistics() {
    try {
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

      return {
        overview: stats[0] || {
          totalUsers: 0,
          activeUsers: 0,
          verifiedUsers: 0
        },
        roleDistribution: roleStats
      };
    } catch (error) {
      logger.error('Error getting user statistics:', error);
      throw error;
    }
  }
}