const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const cors = require('cors');
const compression = require('compression');

const cookieParser = require('cookie-parser');

const coreAuthRouter = require('./routes/coreRoutes/coreAuth');
const coreApiRouter = require('./routes/coreRoutes/coreApi');
const coreDownloadRouter = require('./routes/coreRoutes/coreDownloadRouter');
const corePublicRouter = require('./routes/coreRoutes/corePublicRouter');
const adminAuth = require('./controllers/coreControllers/adminAuth');

const errorHandlers = require('./handlers/errorHandlers');
const erpApiRouter = require('./routes/appRoutes/appApi');
const fiscalApiRouter = require('./routes/appRoutes/fiscalApi');

const fileUpload = require('express-fileupload');
// create our Express app
const app = express();

const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);

app.use(
  cors({
    origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)),
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(compression());

// // default options
// app.use(fileUpload());

// Here our API Routes

app.get('/api/health', (req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  return res.status(databaseReady ? 200 : 503).json({
    success: databaseReady,
    status: databaseReady ? 'ready' : 'database_unavailable',
  });
});

app.use('/api', coreAuthRouter);
app.use('/api', adminAuth.isValidAuthToken, coreApiRouter);
app.use('/api', adminAuth.isValidAuthToken, erpApiRouter);
app.use('/api', adminAuth.isValidAuthToken, fiscalApiRouter);
app.use('/download', coreDownloadRouter);
app.use('/public', corePublicRouter);

if (process.env.NODE_ENV === 'production') {
  const frontendDirectory = path.resolve(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDirectory));
  app.get('*', (req, res, next) => {
    const reservedPath = ['/api/', '/download/', '/public/'].some((prefix) =>
      req.path.startsWith(prefix)
    );
    if (reservedPath) return next();
    return res.sendFile(path.join(frontendDirectory, 'index.html'));
  });
}

// If that above routes didnt work, we 404 them and forward to error handler
app.use(errorHandlers.notFound);

// production error handler
app.use(errorHandlers.productionErrors);

// done! we export it so we can start the site in start.js
module.exports = app;
