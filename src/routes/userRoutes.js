import express from 'express';
import { body, param, query } from 'express-validator';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  activateUser,
  updateUserRole,
  getUserStats
} from '../controllers/userController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';

const router = express.Router();

// Validation rules
const mongoIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID format')
];

const updateUserValidation = [
  body('sFirstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('sLastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('oProfile.sPhone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('oProfile.dDateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth')
];

const updateRoleValidation = [
  body('sRole')
    .isIn(['user', 'admin', 'moderator'])
    .withMessage('Role must be one of: user, admin, moderator')
];

const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('role')
    .optional()
    .isIn(['user', 'admin', 'moderator'])
    .withMessage('Role must be one of: user, admin, moderator'),
  query('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be a boolean value')
];

// All routes are protected
router.use(protect);

// Routes accessible by all authenticated users
router.get('/', queryValidation, validate, getAllUsers);
router.get('/stats', restrictTo('admin'), getUserStats);
router.get('/:id', mongoIdValidation, validate, getUserById);

// Routes accessible by admin and moderator
router.put('/:id', 
  restrictTo('admin', 'moderator'), 
  mongoIdValidation, 
  updateUserValidation, 
  validate, 
  updateUser
);

router.put('/:id/activate', 
  restrictTo('admin', 'moderator'), 
  mongoIdValidation, 
  validate, 
  activateUser
);

router.delete('/:id', 
  restrictTo('admin', 'moderator'), 
  mongoIdValidation, 
  validate, 
  deleteUser
);

// Routes accessible by admin only
router.put('/:id/role', 
  restrictTo('admin'), 
  mongoIdValidation, 
  updateRoleValidation, 
  validate, 
  updateUserRole
);

export default router;