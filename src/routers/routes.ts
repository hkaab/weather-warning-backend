// Importing the flood controller functions
// These functions will handle the logic for fetching flood warnings    
// and a specific warning by ID
// File: src/routers/routes.ts  

import { Router } from 'express';
import { getWarnings, getWarningById } from '../controllers/weatherController';   

const router = Router();

// Define routes
router.get('/', getWarnings);
router.get('/warning/:id', getWarningById);

// Export the router
export default router;