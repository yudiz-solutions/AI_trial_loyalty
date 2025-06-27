import express from 'express';
import { body, param, query } from 'express-validator';
import {
  getAllMerchants,
  getMerchantById,
  approveMerchant,
  rejectMerchant,
  updateMerchant,
  deleteMerchant,
  getAllBranches,
  updateBranchStatus,
  getAllCustomers,
  getCustomerById,
  updateCustomerStatus,
  getAllTransactions,
  updateTransactionPayStatus
} from '../controllers/adminController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';

const router = express.Router();

// Validation rules
const mongoIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format')
];

const rejectMerchantValidation = [
  body('sRejectionReason')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Rejection reason must be between 10 and 500 characters')
];

const updateMerchantValidation = [
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
  body('sBusinessName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be between 2 and 100 characters'),
  body('nCommissionPercent')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Commission percent must be between 0 and 100'),
  body('sStatus')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'active', 'inactive'])
    .withMessage('Invalid status')
];

const statusValidation = [
  body('sStatus')
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive')
];

const payStatusValidation = [
  body('sPayStatus')
    .isIn(['paid', 'unpaid'])
    .withMessage('Pay status must be paid or unpaid')
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

// All routes are protected and restricted to admin
router.use(protect);
router.use(restrictTo('admin'));

// Merchant routes
router.get('/merchants', queryValidation, validate, getAllMerchants);
router.get('/merchants/:id', mongoIdValidation, validate, getMerchantById);
router.post('/merchants/:id/approve', mongoIdValidation, validate, approveMerchant);
router.post('/merchants/:id/reject', mongoIdValidation, rejectMerchantValidation, validate, rejectMerchant);
router.put('/merchants/:id', mongoIdValidation, updateMerchantValidation, validate, updateMerchant);
router.delete('/merchants/:id', mongoIdValidation, validate, deleteMerchant);

// Branch routes
router.get('/branches', queryValidation, validate, getAllBranches);
router.patch('/branches/:id/status', mongoIdValidation, statusValidation, validate, updateBranchStatus);

// Customer routes
router.get('/customers', queryValidation, validate, getAllCustomers);
router.get('/customers/:id', mongoIdValidation, validate, getCustomerById);
router.patch('/customers/:id/status', mongoIdValidation, statusValidation, validate, updateCustomerStatus);

// Transaction routes
router.get('/transactions', queryValidation, validate, getAllTransactions);
router.patch('/transactions/:id/pay-status', mongoIdValidation, payStatusValidation, validate, updateTransactionPayStatus);

export default router;