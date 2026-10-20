const crypto = require('crypto');

const createMockIntegraContadorAdapter = () => ({
  provider: 'INTEGRA_CONTADOR',
  async query({ service }) {
    return {
      protocol: `SIM-IC-${crypto.randomUUID()}`,
      source: 'INTEGRA_CONTADOR_SIMULATOR',
      status: 'COMPLETED',
      resultSummary: {
        outcome: 'NO_PENDING',
        pendingCount: 0,
        service,
      },
    };
  },
});

module.exports = { createMockIntegraContadorAdapter };
