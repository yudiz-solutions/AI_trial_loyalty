import express from 'express';
import { body, param, query } from 'express-validator';
import {
  getMyCustomers,
  getCustomerById,
  topupCustomer,
  redeemFromCustomer,
  getCustomerTransactions
} from '../controllers/workerController.js';
import { protect, restrictTo } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validationMiddleware.js';

const router = express.Router();

// Validation rules
const mongoIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid customer ID format')
];

const transactionValidation = [
  body('nPoints')
    .isInt({ min: 1 })
    .withMessage('Points must be a positive integer'),
  body('nCashEquivalentValue')
    .isFloat({ min: 0.01 })
    .withMessage('Cash equivalent value must be greater than 0')
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

// All routes are protected and restricted to worker
router.use(protect);
router.use(restrictTo('worker'));

// Customer routes
router.get('/customers', queryValidation, validate, getMyCustomers);
router.get('/customers/:id', mongoIdValidation, validate, getCustomerById);
router.post('/customers/:id/topup', mongoIdValidation, transactionValidation, validate, topupCustomer);
router.post('/customers/:id/redeem', mongoIdValidation, transactionValidation, validate, redeemFromCustomer);
router.get('/customers/:id/transactions', mongoIdValidation, queryValidation, validate, getCustomerTransactions);

export default router;