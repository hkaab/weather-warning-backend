import { Request, Response, NextFunction } from 'express';
import { BomService } from '../services/bomService';
import { getAmocToStateId } from '../utils/stateMapping';
import { FloodWarningParser } from '../parsers/floodWarningParser';
import { getLogger } from "../utils/logger";

const weatherControllerLogger = getLogger('WeatherController');

/**
 * Controller for handling flood-related requests.
 * This controller interacts with the BomService to fetch flood warnings.
 */
export const getWarnings = async (req: Request, res: Response, next: NextFunction) => {
  try {

        if (!req.query.state) {
           res.status(400).send({ error: 'State query parameter is required' });
           return;
        }

        // Initialize the BOM service to handle requests related to flood warnings
        const bomService = new BomService();
        
        // Get the AMOC ID for the state from the query parameter
        // This ID is used to fetch the relevant flood warnings
        const stateAmocId = getAmocToStateId(req.query.state?.toString() || "");
       

        // Fetch the flood warnings for the specified state using the BOM service
        // This will return an array of warnings, each containing details like title, description, and severity
        const warnings = await bomService.getWarnings(stateAmocId);

        if (!warnings || warnings.length === 0) {
           res.status(404).send({ error: 'No warnings found for the specified state' });
           return;
        } 
        res.send(warnings);
    } catch (error) {
    // Handle any errors that occur during the fetching of warnings
    weatherControllerLogger.error('Error fetching warnings:', error);
    next(error);
  }
};

export const getWarningById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Initialize the BOM service to handle requests related to flood warnings
    const bomService = new BomService();

    // Extract the warning ID from the request parameters
    const warningId = req.params.id;
    if (!warningId) {
       res.status(400).send({ error: 'Warning ID is required' });
       return;
    }

    // Validate the warning ID format (optional, depending on your requirements)
    if (!/^[a-zA-Z0-9-]+$/.test(warningId)) {
       res.status(400).send({ error: 'Invalid warning ID format' });
       return;
    }
    
    // Download the XML content of the flood warning using the BOM service
    // If the warning is not found, return a 404 error
    const warning = await bomService.downloadXml(warningId);
    if (!warning) {
      res.status(404).send({ error: 'Warning not found' });
      return;
    }

    // Parse the downloaded XML content to extract structured warning information
    // using the FloodWarningParser
    const floodWarningParser= new FloodWarningParser(bomService,warning);

    // Get the warning information, including the text content
    // This will return an object containing details like title, description, and severity
    const warningText = await bomService.downloadText(warningId)
    if (!warningText) {
      res.status(404).send({ error: 'Warning text not found' });
      return;
    }
    
    // Log the warning text for debugging purposes
    // This text is the main content of the warning, which may include details about the flood situation
    weatherControllerLogger.info("Warning text:", warningText);

    // Get the structured warning information from the parser
    const warningInfo = await floodWarningParser.getWarningInfo();
    weatherControllerLogger.info("Warning info:", warningInfo);

    // Send the structured warning information as the response
    // This includes details like title, description, severity, and the text content of the warning
    res.send({ ...warningInfo, text: warningText });
  } catch (error) {
    // Handle any errors that occur during the fetching or parsing of the warning
    weatherControllerLogger.error('Error fetching warning by ID:', error);
    next(error);
  }
};
