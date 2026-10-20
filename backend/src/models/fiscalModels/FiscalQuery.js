const mongoose = require('mongoose');

const fiscalQuerySchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.ObjectId, ref: 'Tenant', required: true, index: true },
    requestedBy: { type: mongoose.Schema.ObjectId, ref: 'Admin', required: true },
    provider: { type: String, enum: ['INTEGRA_CONTADOR', 'ACTIVE_DEBT'], required: true },
    service: { type: String, enum: ['FISCAL_STATUS', 'ACTIVE_DEBT_STATUS'], required: true },
    idempotencyKey: { type: String, required: true, maxlength: 128 },
    documentFingerprint: { type: String, required: true, select: false },
    documentLast4: { type: String, required: true, minlength: 4, maxlength: 4 },
    legalAuthorizationConfirmed: { type: Boolean, required: true },
    status: {
      type: String,
      enum: ['PROCESSING', 'COMPLETED', 'UNAVAILABLE', 'INVALID_CREDENTIAL', 'EXTERNAL_ERROR'],
      required: true,
    },
    protocol: { type: String, trim: true, maxlength: 160 },
    source: { type: String, trim: true, maxlength: 160 },
    resultSummary: { type: mongoose.Schema.Types.Mixed },
    errorCode: { type: String, trim: true, maxlength: 80 },
    mock: { type: Boolean, default: true, required: true },
    requestedAt: { type: Date, required: true },
    completedAt: Date,
  },
  { timestamps: true }
);

fiscalQuerySchema.index({ tenant: 1, idempotencyKey: 1 }, { unique: true });
fiscalQuerySchema.index({ tenant: 1, requestedAt: -1 });

module.exports = mongoose.model('FiscalQuery', fiscalQuerySchema);
