const crypto = require('crypto');

const normalizeCnpj = (value) => String(value || '').replace(/\D/g, '');

const isValidCnpj = (value) => {
  const cnpj = normalizeCnpj(value);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

  const calculateDigit = (base, weights) => {
    const sum = base
      .split('')
      .reduce((total, digit, index) => total + Number(digit) * weights[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const first = calculateDigit(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = calculateDigit(cnpj.slice(0, 12) + first, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return cnpj.endsWith(`${first}${second}`);
};

const fingerprintDocument = (document, secret) => {
  if (!secret) throw new Error('FISCAL_DATA_HASH_KEY is required');
  return crypto.createHmac('sha256', secret).update(document).digest('hex');
};

module.exports = { fingerprintDocument, isValidCnpj, normalizeCnpj };
