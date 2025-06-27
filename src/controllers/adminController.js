import Merchant from '../models/merchantModel.js';
import Branch from '../models/branchModel.js';
import Customer from '../models/customerModel.js';
import Transaction from '../models/transactionModel.js';
import { AppError } from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';
import logger from '../utils/logger.js';

// Get all merchants
export const getAllMerchants = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build query
  const query = {};
  if (req.query.status) query.sStatus = req.query.status;
  if (req.query.search) {
    query.$or = [
      { sBusinessName: { $regex: req.query.search, $options: 'i' } },
      { sEmail: { $regex: req.query.search, $options: 'i' } },
      { sFirstName: { $regex: req.query.search, $options: 'i' } },
      { sLastName: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  // Execute query
  const merchants = await Merchant.find(query)
    .select('-sPasswordHash')
    .sort({ dCreatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Merchant.countDocuments(query);

  res.status(200).json({
    status: 'success',
    results: merchants.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    data: {
      merchants
    }
  });
});

// Get merchant by ID
export const getMerchantById = catchAsync(async (req, res, next) => {
  const merchant = await Merchant.findById(req.params.id)
    .select('-sPasswordHash')
    .lean();

  if (!merchant) {
    return next(new AppError('Merchant not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      merchant
    }
  });
});

// Approve merchant
export const approveMerchant = catchAsync(async (req, res, next) => {
  const merchant = await Merchant.findByIdAndUpdate(
    req.params.id,
    { sStatus: 'approved' },
    { new: true }
  ).select('-sPasswordHash');

  if (!merchant) {
    return next(new AppError('Merchant not found', 404));
  }

  logger.info(`Merchant approved: ${merchant.sEmail}`);

  res.status(200).json({
    status: 'success',
    data: {
      merchant
    }
  });
});

// Reject merchant
export const rejectMerchant = catchAsync(async (req, res, next) => {
  const { sRejectionReason } = req.body;

  if (!sRejectionReason) {
    return next(new AppError('Rejection reason is required', 400));
  }

  const merchant = await Merchant.findByIdAndUpdate(
    req.params.id,
    { 
      sStatus: 'rejected',
      sRejectionReason
    },
    { new: true }
  ).select('-sPasswordHash');

  if (!merchant) {
    return next(new AppError('Merchant not found', 404));
  }

  logger.info(`Merchant rejected: ${merchant.sEmail}`);

  res.status(200).json({
    status: 'success',
    data: {
      merchant
    }
  });
});

// Update merchant
export const updateMerchant = catchAsync(async (req, res, next) => {
  // Fields that can be updated by admin
  const allowedFields = [
    'sFirstName',
    'sLastName',
    'sPhoneNumber',
    'sBusinessName',
    'sBusinessAddress',
    'nCommissionPercent',
    'sStatus'
  ];

  // Filter out unwanted fields
  const filteredBody = {};
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      filteredBody[key] = req.body[key];
    }
  });

  const merchant = await Merchant.findByIdAndUpdate(
    req.params.id,
    filteredBody,
    {
      new: true,
      runValidators: true
    }
  ).select('-sPasswordHash');

  if (!merchant) {
    return next(new AppError('Merchant not found', 404));
  }

  logger.info(`Merchant updated by admin: ${merchant.sEmail}`);

  res.status(200).json({
    status: 'success',
    data: {
      merchant
    }
  });
});

// Delete merchant (soft delete)
export const deleteMerchant = catchAsync(async (req, res, next) => {
  const merchant = await Merchant.findByIdAndUpdate(
    req.params.id,
    { sStatus: 'inactive' },
    { new: true }
  ).select('-sPasswordHash');

  if (!merchant) {
    return next(new AppError('Merchant not found', 404));
  }

  logger.info(`Merchant deactivated by admin: ${merchant.sEmail}`);

  res.status(200).json({
    status: 'success',
    message: 'Merchant deactivated successfully'
  });
});

// Get all branches
export const getAllBranches = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build query
  const query = {};
  if (req.query.status) query.sStatus = req.query.status;
  if (req.query.merchantId) query.oMerchantId = req.query.merchantId;

  // Execute query
  const branches = await Branch.find(query)
    .populate('oMerchantId', 'sBusinessName sEmail')
    .populate('oAssignedWorkerId', 'sFirstName sLastName sEmail')
    .sort({ dCreatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Branch.countDocuments(query);

  res.status(200).json({
    status: 'success',
    results: branches.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    data: {
      branches
    }
  });
});

// Update branch status
export const updateBranchStatus = catchAsync(async (req, res, next) => {
  const { sStatus } = req.body;

  if (!['active', 'inactive'].includes(sStatus)) {
    return next(new AppError('Invalid status', 400));
  }

  const branch = await Branch.findByIdAndUpdate(
    req.params.id,
    { sStatus },
    { new: true }
  ).populate('oMerchantId', 'sBusinessName');

  if (!branch) {
    return next(new AppError('Branch not found', 404));
  }

  logger.info(`Branch status updated by admin: ${branch.sName} -> ${sStatus}`);

  res.status(200).json({
    status: 'success',
    data: {
      branch
    }
  });
});

// Get all customers
export const getAllCustomers = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build query
  const query = {};
  if (req.query.status) query.sStatus = req.query.status;
  if (req.query.merchantId) query.oMerchantId = req.query.merchantId;
  if (req.query.branchId) query.oBranchId = req.query.branchId;

  // Execute query
  const customers = await Customer.find(query)
    .populate('oMerchantId', 'sBusinessName')
    .populate('oBranchId', 'sName sCity')
    .populate('oAssignedWorkerId', 'sFirstName sLastName')
    .sort({ dRegistrationDate: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Customer.countDocuments(query);

  res.status(200).json({
    status: 'success',
    results: customers.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    data: {
      customers
    }
  });
});

// Get customer by ID
export const getCustomerById = catchAsync(async (req, res, next) => {
  const customer = await Customer.findById(req.params.id)
    .populate('oMerchantId', 'sBusinessName')
    .populate('oBranchId', 'sName sCity sAddress')
    .populate('oAssignedWorkerId', 'sFirstName sLastName sEmail')
    .lean();

  if (!customer) {
    return next(new AppError('Customer not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      customer
    }
  });
});

// Update customer status
export const updateCustomerStatus = catchAsync(async (req, res, next) => {
  const { sStatus } = req.body;

  if (!['active', 'inactive'].includes(sStatus)) {
    return next(new AppError('Invalid status', 400));
  }

  const customer = await Customer.findByIdAndUpdate(
    req.params.id,
    { sStatus },
    { new: true }
  ).populate('oMerchantId', 'sBusinessName');

  if (!customer) {
    return next(new AppError('Customer not found', 404));
  }

  logger.info(`Customer status updated by admin: ${customer.sFullName} -> ${sStatus}`);

  res.status(200).json({
    status: 'success',
    data: {
      customer
    }
  });
});

// Get all transactions
export const getAllTransactions = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build query
  const query = {};
  if (req.query.type) query.sType = req.query.type;
  if (req.query.payStatus) query.sPayStatus = req.query.payStatus;
  if (req.query.merchantId) query.oMerchantId = req.query.merchantId;
  if (req.query.customerId) query.oCustomerId = req.query.customerId;

  // Execute query
  const transactions = await Transaction.find(query)
    .populate('oCustomerId', 'sFullName sPhoneNumber')
    .populate('oMerchantId', 'sBusinessName')
    .populate('oBranchId', 'sName sCity')
    .populate('oWorkerId', 'sFirstName sLastName')
    .sort({ dTransactionDate: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Transaction.countDocuments(query);

  res.status(200).json({
    status: 'success',
    results: transactions.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    data: {
      transactions
    }
  });
});

// Update transaction pay status
export const updateTransactionPayStatus = catchAsync(async (req, res, next) => {
  const { sPayStatus } = req.body;

  if (!['paid', 'unpaid'].includes(sPayStatus)) {
    return next(new AppError('Invalid pay status', 400));
  }

  const transaction = await Transaction.findByIdAndUpdate(
    req.params.id,
    { sPayStatus },
    { new: true }
  ).populate('oCustomerId', 'sFullName')
    .populate('oMerchantId', 'sBusinessName');

  if (!transaction) {
    return next(new AppError('Transaction not found', 404));
  }

  logger.info(`Transaction pay status updated by admin: ${transaction._id} -> ${sPayStatus}`);

  res.status(200).json({
    status: 'success',
    data: {
      transaction
    }
  });
});