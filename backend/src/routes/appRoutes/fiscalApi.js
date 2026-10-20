const express = require('express');
const rateLimit = require('express-rate-limit');
const fiscalQueryController = require('@/controllers/fiscalControllers/fiscalQueryController');
const requireTenant = require('@/middlewares/requireTenant');

const router = express.Router();
const fiscalQueryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

router
  .route('/fiscal/queries')
  .post(fiscalQueryLimiter, requireTenant, fiscalQueryController.create);

module.exports = router;
