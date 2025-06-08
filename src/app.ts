import express from 'express';
import routes from './routers/routes';
import { errorHandler } from './middlewares/errorHandler';
import { getLogger } from './utils/logger';
import config from './config/config';

const appLogger = getLogger('App');

appLogger.info('Application starting up...', { port: config.port, env: config.nodeEnv });
appLogger.debug('Debug logging is enabled.', { level: config.log.level });

// Create an Express application
const app = express();

// Middleware to log requests
app.use(express.json());

app.use((_, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// Routes
app.use('/', routes);

// Global error handler - should be after routes
app.use(errorHandler);

export default app;