import Worker from '../models/workerModel.js';
import Branch from '../models/branchModel.js';
import Customer from '../models/customerModel.js';
import Transaction from '../models/transactionModel.js';
import MerchantSettings from '../models/merchantSettingsModel.js';
import { AppError } from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';
import logger from '../utils/logger.js';

// Worker Management
export const getAllWorkers = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = { oMerchantId: req.user.userId };
  if (req.query.status) query.sStatus = req.query.status;

  const workers = await Worker.find(query)
    .select('-sPasswordHash')
    .populate('oBranchId', 'sName sCity')
    .sort({ dCreatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Worker.countDocuments(query);

  res.status(200).json({
    status: 'success',
    results: workers.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    data: {
      workers
    }
  });
});

export const createWorker = catchAsync(async (req, res, next) => {
  const {
    sFirstName,
    sLastName,
    sEmail,
    sPhoneNumber,
    sPassword,
    oBranchId
  } = req.body;

  // Check if worker already exists
  const existingWorker = await Worker.findByEmail(sEmail);
  if (existingWorker) {
    return next(new AppError('Worker already exists with this email', 400));
  }

  // Verify branch belongs to merchant
  if (oBranchId) {
    const branch = await Branch.findOne({ _id: oBranchId, oMerchantId: req.user.userId });
    if (!branch) {
      return next(new AppError('Branch not found or does not belong to you', 404));
    }
  }

  const worker = await Worker.create({
    sFirstName,
    sLastName,
    sEmail,
    sPhoneNumber,
    sPasswordHash: sPassword,
    oMerchantId: req.user.userId,
    oBranchId
  });

  logger.info(`Worker created by merchant: ${sEmail}`);

  res.status(201).json({
    status: 'success',
    data: {
      worker: {
        ...worker.toObject(),
        sPasswordHash: undefined
      }
    }
  });
});

export const getWorkerById = catchAsync(async (req, res, next) => {
  const worker = await Worker.findOne({
    _id: req.params.id,
    oMerchantId: req.user.userId
  })
    .select('-sPasswordHash')
    .populate('oBranchId', 'sName sCity sAddress')
    .lean();

  if (!worker) {
    return next(new AppError('Worker not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      worker
    }
  });
});

export const updateWorker = catchAsync(async (req, res, next) => {
  const allowedFields = [
    'sFirstName',
    'sLastName',
    'sPhoneNumber',
    'oBranchId',
    'sProfileImageUrl',
    'sStatus'
  ];

  const filteredBody = {};
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      filteredBody[key] = req.body[key];
    }
  });

  // Verify branch belongs to merchant if updating branch
  if (filteredBody.oBranchId) {
    const branch = await Branch.findOne({ 
      _id: filteredBody.oBranchId, 
      oMerchantId: req.user.userId 
    });
    if (!branch) {
      return next(new AppError('Branch not found or does not belong to you', 404));
    }
  }

  const worker = await Worker.findOneAndUpdate(
    { _id: req.params.id, oMerchantId: req.user.userId },
    filteredBody,
    { new: true, runValidators: true }
  ).select('-sPasswordHash');

  if (!worker) {
    return next(new AppError('Worker not found', 404));
  }

  logger.info(`Worker updated by merchant: ${worker.sEmail}`);

  res.status(200).json({
    status: 'success',
    data: {
      worker
    }
  });
});

export const deleteWorker = catchAsync(async (req, res, next) => {
  const worker = await Worker.findOneAndUpdate(
    { _id: req.params.id, oMerchantId: req.user.userId },
    { sStatus: 'inactive' },
    { new: true }
  ).select('-sPasswordHash');

  if (!worker) {
    return next(new AppError('Worker not found', 404));
  }

  logger.info(`Worker deactivated by merchant: ${worker.sEmail}`);

  res.status(200).json({
    status: 'success',
    message: 'Worker deactivated successfully'
  });
});

// Branch Management
export const getAllBranches = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = { oMerchantId: req.user.userId };
  if (req.query.status) query.sStatus = req.query.status;

  const branches = await Branch.find(query)
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

export const createBranch = catchAsync(async (req, res, next) => {
  const {
    sName,
    sCity,
    sState,
    sAddress,
    sBranchImageUrl,
    oAssignedWorkerId
  } = req.body;

  // Verify worker belongs to merchant if assigning
  if (oAssignedWorkerId) {
    const worker = await Worker.findOne({ 
      _id: oAssignedWorkerId, 
      oMerchantId: req.user.userId 
    });
    if (!worker) {
      return next(new AppError('Worker not found or does not belong to you', 404));
    }
  }

  const branch = await Branch.create({
    sName,
    sCity,
    sState,
    sAddress,
    sBranchImageUrl,
    oMerchantId: req.user.userId,
    oAssignedWorkerId
  });

  logger.info(`Branch created by merchant: ${sName}`);

  res.status(201).json({
    status: 'success',
    data: {
      branch
    }
  });
});

export const updateBranch = catchAsync(async (req, res, next) => {
  const allowedFields = [
    'sName',
    'sCity',
    'sState',
    'sAddress',
    'sBranchImageUrl',
    'oAssignedWorkerId',
    'sStatus'
  ];

  const filteredBody = {};
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      filteredBody[key] = req.body[key];
    }
  });

  // Verify worker belongs to merchant if updating assignment
  if (filteredBody.oAssignedWorkerId) {
    const worker = await Worker.findOne({ 
      _id: filteredBody.oAssignedWorkerId, 
      oMerchantId: req.user.userId 
    });
    if (!worker) {
      return next(new AppError('Worker not found or does not belong to you', 404));
    }
  }

  const branch = await Branch.findOneAndUpdate(
    { _id: req.params.id, oMerchantId: req.user.userId },
    filteredBody,
    { new: true, runValidators: true }
  );

  if (!branch) {
    return next(new AppError('Branch not found', 404));
  }

  logger.info(`Branch updated by merchant: ${branch.sName}`);

  res.status(200).json({
    status: 'success',
    data: {
      branch
    }
  });
});

export const deleteBranch = catchAsync(async (req, res, next) => {
  const branch = await Branch.findOneAndUpdate(
    { _id: req.params.id, oMerchantId: req.user.userId },
    { sStatus: 'inactive' },
    { new: true }
  );

  if (!branch) {
    return next(new AppError('Branch not found', 404));
  }

  logger.info(`Branch deactivated by merchant: ${branch.sName}`);

  res.status(200).json({
    status: 'success',
    message: 'Branch deactivated successfully'
  });
});

// Customer Management
export const getAllCustomers = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = { oMerchantId: req.user.userId };
  if (req.query.status) query.sStatus = req.query.status;
  if (req.query.branchId) query.oBranchId = req.query.branchId;

  const customers = await Customer.find(query)
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

export const getCustomerById = catchAsync(async (req, res, next) => {
  const customer = await Customer.findOne({
    _id: req.params.id,
    oMerchantId: req.user.userId
  })
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

export const updateCustomerStatus = catchAsync(async (req, res, next) => {
  const { sStatus } = req.body;

  if (!['active', 'inactive'].includes(sStatus)) {
    return next(new AppError('Invalid status', 400));
  }

  const customer = await Customer.findOneAndUpdate(
    { _id: req.params.id, oMerchantId: req.user.userId },
    { sStatus },
    { new: true }
  );

  if (!customer) {
    return next(new AppError('Customer not found', 404));
  }

  logger.info(`Customer status updated by merchant: ${customer.sFullName} -> ${sStatus}`);

  res.status(200).json({
    status: 'success',
    data: {
      customer
    }
  });
});

// Transaction Management
export const getAllTransactions = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = { oMerchantId: req.user.userId };
  if (req.query.type) query.sType = req.query.type;
  if (req.query.payStatus) query.sPayStatus = req.query.payStatus;
  if (req.query.branchId) query.oBranchId = req.query.branchId;
  if (req.query.customerId) query.oCustomerId = req.query.customerId;

  const transactions = await Transaction.find(query)
    .populate('oCustomerId', 'sFullName sPhoneNumber')
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

export const getTransactionById = catchAsync(async (req, res, next) => {
  const transaction = await Transaction.findOne({
    _id: req.params.id,
    oMerchantId: req.user.userId
  })
    .populate('oCustomerId', 'sFullName sPhoneNumber sEmail')
    .populate('oBranchId', 'sName sCity sAddress')
    .populate('oWorkerId', 'sFirstName sLastName sEmail')
    .lean();

  if (!transaction) {
    return next(new AppError('Transaction not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      transaction
    }
  });
});

// Settings Management
export const getPointsSettings = catchAsync(async (req, res, next) => {
  let settings = await MerchantSettings.findByMerchant(req.user.userId);

  if (!settings) {
    // Create default settings if not exists
    settings = await MerchantSettings.create({
      oMerchantId: req.user.userId
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      settings
    }
  });
});

export const updatePointsSettings = catchAsync(async (req, res, next) => {
  const allowedFields = [
    'nPointToCurrencyRate',
    'nMaxWalletBalance',
    'nMaxDailyRedemption',
    'nMaxCustomersLimit'
  ];

  const filteredBody = {};
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      filteredBody[key] = req.body[key];
    }
  });

  const settings = await MerchantSettings.findOneAndUpdate(
    { oMerchantId: req.user.userId },
    filteredBody,
    { 
      new: true, 
      runValidators: true,
      upsert: true
    }
  );

  logger.info(`Merchant settings updated: ${req.user.userId}`);

  res.status(200).json({
    status: 'success',
    data: {
      settings
    }
  });
});