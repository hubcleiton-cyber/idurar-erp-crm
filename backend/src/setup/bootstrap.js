require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');
const mongoose = require('mongoose');

const requiredEnvironment = ['DATABASE', 'BOOTSTRAP_ADMIN_EMAIL', 'BOOTSTRAP_ADMIN_PASSWORD'];

const validateEnvironment = () => {
  const missing = requiredEnvironment.filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Missing required environment: ${missing.join(', ')}`);
  if (process.env.BOOTSTRAP_ADMIN_PASSWORD.length < 12) {
    throw new Error('BOOTSTRAP_ADMIN_PASSWORD must contain at least 12 characters');
  }
};

const loadModels = () => {
  for (const filePath of globSync('./src/models/**/*.js')) {
    require(path.resolve(filePath));
  }
};

const seedSettings = async () => {
  const Setting = mongoose.model('Setting');
  const settings = globSync('./src/setup/defaultSettings/**/*.json').flatMap((filePath) =>
    JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  );

  if (!settings.length) return;
  await Setting.bulkWrite(
    settings.map((setting) => ({
      updateOne: {
        filter: { settingKey: setting.settingKey },
        update: { $setOnInsert: setting },
        upsert: true,
      },
    }))
  );
};

const bootstrap = async () => {
  validateEnvironment();
  await mongoose.connect(process.env.DATABASE);
  loadModels();

  const Tenant = mongoose.model('Tenant');
  const Admin = mongoose.model('Admin');
  const AdminPassword = mongoose.model('AdminPassword');

  const tenant = await Tenant.findOneAndUpdate(
    { slug: 'demo' },
    {
      $setOnInsert: {
        name: process.env.TENANT_NAME || 'Demonstracao Fiscal',
        slug: 'demo',
        status: 'ACTIVE',
      },
    },
    { new: true, upsert: true, runValidators: true }
  );

  const email = process.env.BOOTSTRAP_ADMIN_EMAIL.trim().toLowerCase();
  let admin = await Admin.findOne({ email, removed: false });
  if (!admin) {
    admin = await Admin.create({
      email,
      name: process.env.BOOTSTRAP_ADMIN_NAME || 'Administrador',
      enabled: true,
      role: 'owner',
      tenant: tenant._id,
    });
  } else if (!admin.tenant) {
    admin.tenant = tenant._id;
    await admin.save();
  }

  const hasPassword = await AdminPassword.exists({ user: admin._id, removed: false });
  if (!hasPassword) {
    const passwordRecord = new AdminPassword();
    const salt = crypto.randomBytes(16).toString('hex');
    await AdminPassword.create({
      user: admin._id,
      salt,
      password: passwordRecord.generateHash(salt, process.env.BOOTSTRAP_ADMIN_PASSWORD),
      emailVerified: true,
    });
  }

  await seedSettings();
  console.log('Bootstrap completed without exposing credentials.');
};

bootstrap()
  .then(() => mongoose.disconnect())
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error(`Bootstrap failed: ${error.message}`);
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
  });
