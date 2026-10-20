const { fingerprintDocument, isValidCnpj, normalizeCnpj } = require('../domain/document');
const { FiscalDomainError } = require('../domain/errors');

const SERVICES_BY_PROVIDER = Object.freeze({
  INTEGRA_CONTADOR: new Set(['FISCAL_STATUS']),
  ACTIVE_DEBT: new Set(['ACTIVE_DEBT_STATUS']),
});

const assertInput = (input, adapters) => {
  if (!input.tenantId || !input.userId) {
    throw new FiscalDomainError('Tenant and user context are required.', {
      code: 'TENANT_CONTEXT_REQUIRED',
      statusCode: 403,
    });
  }
  if (input.hasLegalAuthorization !== true) {
    throw new FiscalDomainError('Legal authorization must be confirmed.', {
      code: 'LEGAL_AUTHORIZATION_REQUIRED',
      statusCode: 403,
    });
  }
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(input.idempotencyKey || '')) {
    throw new FiscalDomainError('A valid idempotency key is required.', {
      code: 'INVALID_IDEMPOTENCY_KEY',
    });
  }
  if (!SERVICES_BY_PROVIDER[input.provider]?.has(input.service) || !adapters[input.provider]) {
    throw new FiscalDomainError('Unsupported fiscal provider or service.', {
      code: 'UNSUPPORTED_FISCAL_SERVICE',
    });
  }
};

const executeFiscalQuery = async ({ repository, adapters, hashSecret, now = () => new Date() }, input) => {
  assertInput(input, adapters);

  const document = normalizeCnpj(input.document);
  if (!isValidCnpj(document)) {
    throw new FiscalDomainError('A valid CNPJ is required.', { code: 'INVALID_CNPJ' });
  }

  const existing = await repository.findByIdempotencyKey(input.tenantId, input.idempotencyKey);
  if (existing) return { query: existing, replayed: true };

  const startedAt = now();
  let query;
  try {
    query = await repository.createProcessing({
      tenant: input.tenantId,
      requestedBy: input.userId,
      provider: input.provider,
      service: input.service,
      idempotencyKey: input.idempotencyKey,
      documentFingerprint: fingerprintDocument(`${input.tenantId}:${document}`, hashSecret),
      documentLast4: document.slice(-4),
      legalAuthorizationConfirmed: true,
      status: 'PROCESSING',
      mock: true,
      requestedAt: startedAt,
    });
  } catch (error) {
    if (error?.code === 11000) {
      const replay = await repository.findByIdempotencyKey(input.tenantId, input.idempotencyKey);
      if (replay) return { query: replay, replayed: true };
    }
    throw error;
  }

  try {
    const response = await adapters[input.provider].query({ document, service: input.service });
    const completed = await repository.complete(query.id, input.tenantId, {
      ...response,
      completedAt: now(),
    });
    return { query: completed, replayed: false };
  } catch (error) {
    await repository.fail(query.id, input.tenantId, {
      status: 'EXTERNAL_ERROR',
      errorCode: 'SIMULATED_PROVIDER_ERROR',
      completedAt: now(),
    });
    throw new FiscalDomainError('The fiscal provider is temporarily unavailable.', {
      code: 'EXTERNAL_PROVIDER_ERROR',
      statusCode: 502,
    });
  }
};

module.exports = { SERVICES_BY_PROVIDER, executeFiscalQuery };
