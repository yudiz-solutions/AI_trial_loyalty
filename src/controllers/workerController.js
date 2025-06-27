import Customer from '../models/customerModel.js';
import Transaction from '../models/transactionModel.js';
import MerchantSettings from '../models/merchantSettingsModel.js';
import { AppError } from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';
import logger from '../utils/logger.js';

// Get customers assigned to worker
export const getMyCustomers = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = { oAssignedWorkerId: req.user.userId };
  if (req.query.status) query.sStatus = req.query.status;

  const customers = await Customer.find(query)
    .populate('oBranchId', 'sName sCity')
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

// Get customer by ID (only if assigned to worker)
export const getCustomerById = catchAsync(async (req, res, next) => {
  const customer = await Customer.findOne({
    _id: req.params.id,
    oAssignedWorkerId: req.user.userId
  })
    .populate('oBranchId', 'sName sCity sAddress')
    .populate('oMerchantId', 'sBusinessName')
    .lean();

  if (!customer) {
    return next(new AppError('Customer not found or not assigned to you', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      customer
    }
  });
});

// Top up customer wallet (credit transaction)
export const topupCustomer = catchAsync(async (req, res, next) => {
  const { nPoints, nCashEquivalentValue } = req.body;

  if (!nPoints || !nCashEquivalentValue || nPoints <= 0 || nCashEquivalentValue <= 0) {
    return next(new AppError('Valid points and cash equivalent value are required', 400));
  }

  // Find customer
  const customer = await Customer.findOne({
    _id: req.params.id,
    oAssignedWorkerId: req.user.userId,
    sStatus: 'active'
  });

  if (!customer) {
    return next(new AppError('Customer not found or not assigned to you', 404));
  }

  // Get merchant settings to check limits
  const settings = await MerchantSettings.findByMerchant(customer.oMerchantId);
  const maxWalletBalance = settings?.nMaxWalletBalance || 10000;

  // Check if top-up would exceed max wallet balance
  if (customer.nWalletBalance + nPoints > maxWalletBalance) {
    return next(new AppError(`Top-up would exceed maximum wallet balance of ${maxWalletBalance}`, 400));
  }

  // Calculate admin commission
  const merchantSettings = settings || {};
  const commissionPercent = merchantSettings.nCommissionPercent || 0;
  const nAdminCommissionValue = (nCashEquivalentValue * commissionPercent) / 100;

  // Update customer wallet balance
  const newWalletBalance = customer.nWalletBalance + nPoints;
  
  // Create transaction
  const transaction = await Transaction.create({
    oCustomerId: customer._id,
    oMerchantId: customer.oMerchantId,
    oBranchId: customer.oBranchId,
    oWorkerId: req.user.userId,
    sType: 'credit',
    nPoints,
    nCashEquivalentValue,
    nAdminCommissionValue,
    nWalletBalanceAfterTransaction: newWalletBalance
  });

  // Update customer
  await Customer.findByIdAndUpdate(customer._id, {
    nWalletBalance: newWalletBalance,
    dLastTransactionDate: new Date(),
    dFirstTransactionDate: customer.dFirstTransactionDate || new Date()
  });

  logger.info(`Customer wallet topped up by worker: ${customer.sFullName} +${nPoints} points`);

  res.status(201).json({
    status: 'success',
    data: {
      transaction,
      newWalletBalance
    }
  });
});

// Redeem from customer wallet (debit transaction)
export const redeemFromCustomer = catchAsync(async (req, res, next) => {
  const { nPoints, nCashEquivalentValue } = req.body;

  if (!nPoints || !nCashEquivalentValue || nPoints <= 0 || nCashEquivalentValue <= 0) {
    return next(new AppError('Valid points and cash equivalent value are required', 400));
  }

  // Find customer
  const customer = await Customer.findOne({
    _id: req.params.id,
    oAssignedWorkerId: req.user.userId,
    sStatus: 'active'
  });

  if (!customer) {
    return next(new AppError('Customer not found or not assigned to you', 404));
  }

  // Check if customer has sufficient balance
  if (customer.nWalletBalance < nPoints) {
    return next(new AppError('Insufficient wallet balance', 400));
  }

  // Get merchant settings to check daily redemption limit
  const settings = await MerchantSettings.findByMerchant(customer.oMerchantId);
  const maxDailyRedemption = settings?.nMaxDailyRedemption || 1000;

  // Check daily redemption limit (simplified - checking today's total redemptions)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayRedemptions = await Transaction.aggregate([
    {
      $match: {
        oCustomerId: customer._id,
        sType: 'debit',
        dTransactionDate: { $gte: today, $lt: tomorrow }
      }
    },
    {
      $group: {
        _id: null,
        totalRedeemed: { $sum: '$nPoints' }
      }
    }
  ]);

  const totalRedeemedToday = todayRedemptions[0]?.totalRedeemed || 0;
  
  if (totalRedeemedToday + nPoints > maxDailyRedemption) {
    return next(new AppError(`Daily redemption limit of ${maxDailyRedemption} points exceeded`, 400));
  }

  // Calculate admin commission
  const merchantSettings = settings || {};
  const commissionPercent = merchantSettings.nCommissionPercent || 0;
  const nAdminCommissionValue = (nCashEquivalentValue * commissionPercent) / 100;

  // Update customer wallet balance
  const newWalletBalance = customer.nWalletBalance - nPoints;
  
  // Create transaction
  const transaction = await Transaction.create({
    oCustomerId: customer._id,
    oMerchantId: customer.oMerchantId,
    oBranchId: customer.oBranchId,
    oWorkerId: req.user.userId,
    sType: 'debit',
    nPoints,
    nCashEquivalentValue,
    nAdminCommissionValue,
    nWalletBalanceAfterTransaction: newWalletBalance
  });

  // Update customer
  await Customer.findByIdAndUpdate(customer._id, {
    nWalletBalance: newWalletBalance,
    dLastTransactionDate: new Date()
  });

  logger.info(`Customer wallet redeemed by worker: ${customer.sFullName} -${nPoints} points`);

  res.status(201).json({
    status: 'success',
    data: {
      transaction,
      newWalletBalance
    }
  });
});

// Get customer transactions
export const getCustomerTransactions = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Verify customer is assigned to worker
  const customer = await Customer.findOne({
    _id: req.params.id,
    oAssignedWorkerId: req.user.userId
  });

  if (!customer) {
    return next(new AppError('Customer not found or not assigned to you', 404));
  }

  const query = { oCustomerId: req.params.id };
  if (req.query.type) query.sType = req.query.type;

  const transactions = await Transaction.find(query)
    .populate('oWorkerId', 'sFirstName sLastName')
    .populate('oBranchId', 'sName sCity')
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