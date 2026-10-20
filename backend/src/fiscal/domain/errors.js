class FiscalDomainError extends Error {
  constructor(message, { code, statusCode = 400 } = {}) {
    super(message);
    this.name = 'FiscalDomainError';
    this.code = code || 'FISCAL_VALIDATION_ERROR';
    this.statusCode = statusCode;
  }
}

module.exports = { FiscalDomainError };
