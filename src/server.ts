import app from './app';
import config from './config/config';
import  {getLogger} from './utils/logger';


// Initialize the logger
// This will log the server startup information
const serverLogger = getLogger('Server');

serverLogger.info('Server starting up...', { port: config.port, env: config.nodeEnv });

//listen for incoming requests on the configured port
app.listen(config.port, () => {
  serverLogger.info(`Server running on port ${config.port}`);
});