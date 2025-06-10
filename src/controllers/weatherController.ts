import { Request, Response, NextFunction } from 'express';
import { getLogger } from "../utils/logger";
import { WarningsService } from '../services/warningsService';

// Logger for the weather controller
const weatherControllerLogger = getLogger('WeatherController');

/**
 * Controller for handling flood-related requests.
 * This controller interacts with the warningsService to fetch flood warnings.
 */
export const getWarnings = async (req: Request, res: Response, next: NextFunction) => {
  try {
        // Validate the state query parameter
        if (!req.query.state) {
            res.status(400).send({ error: 'State query parameter is required' });
            return;
        }
        // Initialize the Warning Service to handle requests related to flood warnings
        const warningsService = new WarningsService();
        
        // Fetch the flood warnings for the specified state using the Warning Service
        // This will return an array of warnings, each containing details like title, description, and severity
        const warnings = await warningsService.getWarnings(req.query.state as string);

        if (!warnings || warnings.length === 0) {
           res.status(404).send({ error: 'No warnings found for the specified state' });
           return;
        } 
        res.status(200).send(warnings);
    } catch (error) {
    // Handle any errors that occur during the fetching of warnings
    weatherControllerLogger.error('Error fetching warnings:', error);
    next(error);
  }
};


export const getWarningById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    
    // Extract the warning ID from the request parameters
    const warningId = req.params.id;
    if (!warningId) {
       res.status(400).send({ error: 'Warning ID is required' });
       return;
    }

    // Initialize the Warning Service to handle requests related to flood warnings
    const warningsService = new WarningsService();
    // Fetch the warning details by ID using the Warning Service
    const  warningDetails = await warningsService.getWarningDetails(warningId);

    if (!warningDetails) {
      // If the warning is not found, return a 404 error
      weatherControllerLogger.error(`Warning with ID ${warningId} not found.`);
      res.status(404).send({ error: 'Warning not found' });
      return;
    }
    res.status(200).send(warningDetails);
  } catch (error) {
    // Handle any errors that occur during the fetching or parsing of the warning
    weatherControllerLogger.error('Error fetching warning by ID:', error);
    next(error);
  }
};
