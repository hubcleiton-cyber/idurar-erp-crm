const crypto = require('crypto');

const createMockActiveDebtAdapter = () => ({
  provider: 'ACTIVE_DEBT',
  async query({ service }) {
    return {
      protocol: `SIM-DA-${crypto.randomUUID()}`,
      source: 'ACTIVE_DEBT_SIMULATOR',
      status: 'COMPLETED',
      resultSummary: {
        outcome: 'NO_PENDING',
        pendingCount: 0,
        service,
      },
    };
  },
});

module.exports = { createMockActiveDebtAdapter };
