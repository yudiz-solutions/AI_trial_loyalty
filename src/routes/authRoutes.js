import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
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
const registerValidation = [
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
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

const loginValidation = [
  body('sEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('sPassword')
    .notEmpty()
    .withMessage('Password is required')
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
    .withMessage('Please provide a valid email')
];

const resetPasswordValidation = [
  body('sToken')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('sNewPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number')
];

// Public routes
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/forgot-password', forgotPasswordValidation, validate, forgotPassword);
router.post('/reset-password', resetPasswordValidation, validate, resetPassword);

// Protected routes
router.use(protect); // All routes after this middleware are protected

router.get('/me', getMe);
router.put('/update-password', updatePasswordValidation, validate, updatePassword);
router.post('/logout', logout);

export default router;