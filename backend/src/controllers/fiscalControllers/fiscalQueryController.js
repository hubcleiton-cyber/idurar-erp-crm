const mongoose = require('mongoose');
const { createMockActiveDebtAdapter } = require('@/fiscal/adapters/mockActiveDebtAdapter');
const { createMockIntegraContadorAdapter } = require('@/fiscal/adapters/mockIntegraContadorAdapter');
const { FiscalDomainError } = require('@/fiscal/domain/errors');
const {
  MongooseFiscalQueryRepository,
} = require('@/fiscal/repositories/MongooseFiscalQueryRepository');
const { executeFiscalQuery } = require('@/fiscal/services/executeFiscalQuery');

const adapters = {
  ACTIVE_DEBT: createMockActiveDebtAdapter(),
  INTEGRA_CONTADOR: createMockIntegraContadorAdapter(),
};

const create = async (req, res) => {
  try {
    const idempotencyKey = req.get('Idempotency-Key');
    const repository = new MongooseFiscalQueryRepository(mongoose.model('FiscalQuery'));
    const result = await executeFiscalQuery(
      {
        repository,
        adapters,
        hashSecret: process.env.FISCAL_DATA_HASH_KEY,
      },
      {
        tenantId: req.tenantId,
        userId: String(req.admin._id),
        idempotencyKey,
        provider: req.body.provider,
        service: req.body.service,
        document: req.body.document,
        hasLegalAuthorization: req.body.hasLegalAuthorization,
      }
    );

    return res.status(result.replayed ? 200 : 201).json({
      success: true,
      result: result.query,
      replayed: result.replayed,
      message: 'Simulated fiscal query completed.',
    });
  } catch (error) {
    if (error instanceof FiscalDomainError) {
      return res.status(error.statusCode).json({
        success: false,
        result: null,
        message: error.message,
        code: error.code,
      });
    }

    if (error.message === 'FISCAL_DATA_HASH_KEY is required') {
      return res.status(503).json({
        success: false,
        result: null,
        message: 'Fiscal data protection is not configured.',
        code: 'FISCAL_CONFIGURATION_MISSING',
      });
    }

    throw error;
  }
};

module.exports = { create };
