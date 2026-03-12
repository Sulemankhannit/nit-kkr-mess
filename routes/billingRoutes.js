const express = require('express');
const router = express.Router();
const { getLedger, applyRebate, getPendingRebates, updateRebateStatus, claimReward, getMyRebates } = require('../controllers/billingController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Student routes
router.get('/ledger', protect, getLedger);
router.post('/rebate', protect, applyRebate);
router.get('/myrebates', protect, getMyRebates);
// Endpoint: POST /api/billing/claim-reward
// Description: Claim a free meal QR if user has enough skipped meals
router.post('/claim-reward', protect, claimReward);

// Endpoint: POST /api/billing/guest-pass
// Description: Buy a guest pass (adds to dues)
router.post('/guest-pass', protect, require('../controllers/billingController').buyGuestPass);

// Admin routes
router.get('/admin/rebates', protect, adminOnly, getPendingRebates);
router.put('/admin/rebate/:rebateId', protect, adminOnly, updateRebateStatus);
router.post('/admin/generate-invoices', protect, adminOnly, require('../controllers/billingController').generateInvoices);

module.exports = router;
