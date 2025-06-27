import express from 'express';
import { body } from 'express-validator';
import {
  login,
  registerMerchant,
  getMe,
  updatePassword,
  forgotPassword,
  resetPassword,
  logout
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';

const router = express.Router();

// Validation rules
const loginValidation = [
  body('sEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('sPassword')
    .notEmpty()
    .withMessage('Password is required'),
  body('sRole')
    .isIn(['admin', 'merchant', 'worker'])
    .withMessage('Role must be admin, merchant, or worker')
];

const registerMerchantValidation = [
  body('sFirstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('sLastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('sEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('sPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('sBusinessName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be between 2 and 100 characters'),
  body('sBusinessAddress')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Business address must be between 5 and 200 characters')
];

const updatePasswordValidation = [
  body('sCurrentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('sNewPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
];

const forgotPasswordValidation = [
  body('sEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('sRole')
    .isIn(['admin', 'merchant', 'worker'])
    .withMessage('Role must be admin, merchant, or worker')
];

const resetPasswordValidation = [
  body('sToken')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('sNewPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('sRole')
    .isIn(['admin', 'merchant', 'worker'])
    .withMessage('Role must be admin, merchant, or worker')
];

// Public routes
router.post('/login', loginValidation, validate, login);
router.post('/register-merchant', registerMerchantValidation, validate, registerMerchant);
router.post('/forgot-password', forgotPasswordValidation, validate, forgotPassword);
router.post('/reset-password', resetPasswordValidation, validate, resetPassword);

// Protected routes
router.use(protect); // All routes after this middleware are protected

router.get('/me', getMe);
router.put('/update-password', updatePasswordValidation, validate, updatePassword);
router.post('/logout', logout);

export default router;