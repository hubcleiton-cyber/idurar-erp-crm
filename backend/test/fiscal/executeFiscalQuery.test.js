const assert = require('node:assert/strict');
const test = require('node:test');
const { executeFiscalQuery } = require('../../src/fiscal/services/executeFiscalQuery');

const validInput = {
  tenantId: 'tenant-a',
  userId: 'user-a',
  idempotencyKey: 'request-0001',
  provider: 'INTEGRA_CONTADOR',
  service: 'FISCAL_STATUS',
  document: '45.723.174/0001-10',
  hasLegalAuthorization: true,
};

const createRepository = () => {
  const records = new Map();
  return {
    records,
    async findByIdempotencyKey(tenant, key) {
      return records.get(`${tenant}:${key}`) || null;
    },
    async createProcessing(data) {
      const record = { ...data, id: `query-${records.size + 1}` };
      records.set(`${data.tenant}:${data.idempotencyKey}`, record);
      return record;
    },
    async complete(id, tenant, result) {
      const entry = [...records.entries()].find(([, value]) => value.id === id && value.tenant === tenant);
      const completed = { ...entry[1], ...result };
      records.set(entry[0], completed);
      return completed;
    },
    async fail(id, tenant, result) {
      return this.complete(id, tenant, result);
    },
  };
};

const createDependencies = (repository = createRepository()) => ({
  repository,
  hashSecret: 'test-only-secret',
  now: () => new Date('2026-10-20T01:14:00.000Z'),
  adapters: {
    INTEGRA_CONTADOR: {
      async query({ service }) {
        return {
          protocol: 'SIM-IC-001',
          source: 'INTEGRA_CONTADOR_SIMULATOR',
          status: 'COMPLETED',
          resultSummary: { outcome: 'NO_PENDING', pendingCount: 0, service },
        };
      },
    },
  },
});

test('requires tenant context and explicit legal authorization', async () => {
  await assert.rejects(
    () => executeFiscalQuery(createDependencies(), { ...validInput, tenantId: undefined }),
    { code: 'TENANT_CONTEXT_REQUIRED' }
  );
  await assert.rejects(
    () => executeFiscalQuery(createDependencies(), { ...validInput, hasLegalAuthorization: false }),
    { code: 'LEGAL_AUTHORIZATION_REQUIRED' }
  );
});

test('stores only a keyed fingerprint and last four digits of the CNPJ', async () => {
  const repository = createRepository();
  const { query } = await executeFiscalQuery(createDependencies(repository), validInput);

  assert.equal(query.status, 'COMPLETED');
  assert.equal(query.documentLast4, '0110');
  assert.equal(query.document, undefined);
  assert.notEqual(query.documentFingerprint, validInput.document.replace(/\D/g, ''));
});

test('replays an idempotent request only inside the same tenant', async () => {
  const repository = createRepository();
  const dependencies = createDependencies(repository);

  const first = await executeFiscalQuery(dependencies, validInput);
  const replay = await executeFiscalQuery(dependencies, validInput);
  const otherTenant = await executeFiscalQuery(dependencies, {
    ...validInput,
    tenantId: 'tenant-b',
  });

  assert.equal(first.replayed, false);
  assert.equal(replay.replayed, true);
  assert.equal(replay.query.id, first.query.id);
  assert.notEqual(otherTenant.query.id, first.query.id);
  assert.notEqual(otherTenant.query.documentFingerprint, first.query.documentFingerprint);
});

test('rejects an invalid CNPJ before calling the provider', async () => {
  await assert.rejects(
    () => executeFiscalQuery(createDependencies(), { ...validInput, document: '11.111.111/1111-11' }),
    { code: 'INVALID_CNPJ' }
  );
});
