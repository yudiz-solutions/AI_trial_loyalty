import express from 'express';
import { body, param, query } from 'express-validator';
import {
  getAllWorkers,
  createWorker,
  getWorkerById,
  updateWorker,
  deleteWorker,
  getAllBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  getAllCustomers,
  getCustomerById,
  updateCustomerStatus,
  getAllTransactions,
  getTransactionById,
  getPointsSettings,
  updatePointsSettings
} from '../controllers/merchantController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';

const router = express.Router();

// Validation rules
const mongoIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format')
];

const createWorkerValidation = [
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
    .withMessage('Password must be at least 6 characters long'),
  body('oBranchId')
    .optional()
    .isMongoId()
    .withMessage('Invalid branch ID format')
];

const updateWorkerValidation = [
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
  body('oBranchId')
    .optional()
    .isMongoId()
    .withMessage('Invalid branch ID format'),
  body('sStatus')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive')
];

const createBranchValidation = [
  body('sName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Branch name must be between 2 and 100 characters'),
  body('sCity')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  body('sState')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('State must be between 2 and 50 characters'),
  body('sAddress')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  body('oAssignedWorkerId')
    .optional()
    .isMongoId()
    .withMessage('Invalid worker ID format')
];

const updateBranchValidation = [
  body('sName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Branch name must be between 2 and 100 characters'),
  body('sCity')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  body('sState')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('State must be between 2 and 50 characters'),
  body('sAddress')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  body('oAssignedWorkerId')
    .optional()
    .isMongoId()
    .withMessage('Invalid worker ID format'),
  body('sStatus')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive')
];

const statusValidation = [
  body('sStatus')
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive')
];

const settingsValidation = [
  body('nPointToCurrencyRate')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Point to currency rate must be greater than 0'),
  body('nMaxWalletBalance')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Max wallet balance must be a positive number'),
  body('nMaxDailyRedemption')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Max daily redemption must be a positive number'),
  body('nMaxCustomersLimit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max customers limit must be at least 1')
];

const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// All routes are protected and restricted to merchant
router.use(protect);
router.use(restrictTo('merchant'));

// Worker routes
router.get('/workers', queryValidation, validate, getAllWorkers);
router.post('/workers', createWorkerValidation, validate, createWorker);
router.get('/workers/:id', mongoIdValidation, validate, getWorkerById);
router.put('/workers/:id', mongoIdValidation, updateWorkerValidation, validate, updateWorker);
router.delete('/workers/:id', mongoIdValidation, validate, deleteWorker);

// Branch routes
router.get('/branches', queryValidation, validate, getAllBranches);
router.post('/branches', createBranchValidation, validate, createBranch);
router.put('/branches/:id', mongoIdValidation, updateBranchValidation, validate, updateBranch);
router.delete('/branches/:id', mongoIdValidation, validate, deleteBranch);

// Customer routes
router.get('/customers', queryValidation, validate, getAllCustomers);
router.get('/customers/:id', mongoIdValidation, validate, getCustomerById);
router.patch('/customers/:id/status', mongoIdValidation, statusValidation, validate, updateCustomerStatus);

// Transaction routes
router.get('/transactions', queryValidation, validate, getAllTransactions);
router.get('/transactions/:id', mongoIdValidation, validate, getTransactionById);

// Settings routes
router.get('/settings/points', getPointsSettings);
router.put('/settings/points', settingsValidation, validate, updatePointsSettings);

export default router;