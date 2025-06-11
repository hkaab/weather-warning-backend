// Importing the flood controller functions
// These functions will handle the logic for fetching flood warnings    
// and a specific warning by ID
// File: src/routers/routes.ts  

import { Router } from 'express';
import { getStateWarnings, getWarningDetailsById } from '../controllers/weatherController';   

const router = Router();

// Define routes
router.get('/', getStateWarnings);
router.get('/warning/:id', getWarningDetailsById);

// Health check route
router.get('/health', (_, res) => {
  res.status(200).send({ status: 'OK' });
});

// Export the router
export default router;