import fetch from 'node-fetch'; // Assuming 'node-fetch' is installed (npm install node-fetch@2) for older Node.js versions. For Node.js 18+, 'fetch' is native.

const BASE_URL = process.env.FLOOD_WARNING_API || 'http://flood-warning-api-test.us-east-1.elasticbeanstalk.com';
const INTERVAL_MS = 10 * 60 * 1000; // 10 minutes in milliseconds
const DETAIL_CALL_DELAY_MS = 200;

export enum AustralianStateEnum {
  NT = "NT",
  NSW = "NSW",
  QLD = "QLD",
  SA = "SA",
  TAS = "TAS",
  VIC = "VIC",
  WA = "WA",
  ACT = "ACT",
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getWarningDetails = async (warningId: string): Promise<any | null> => {
  try {
    console.info(`Fetching warning details for ID: ${warningId}`);
    const url = `${BASE_URL}/warning/${warningId}`;
    const response = await fetch(url);

    if (!response.ok) {
      // Check for 404 specifically
      if (response.status === 404) {
        console.warn(`Warning details for ID ${warningId} not found (404).`);
        return null; // Return null if not found
      }
      console.error(`API response not OK for warning details for ID ${warningId}: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch warning details for ${warningId}: ${response.statusText}`);
    }

    const data = await response.json();
    console.info(`Successfully fetched details for warning ID: ${warningId}`);
    return data;
  } catch (error) {
    console.error(`Error fetching warning details for ID ${warningId}:`, error);
    return null; // Return null on error
  }

}

const getStateWarnings = async (state: string): Promise<string[] | null> => {
  try {
    console.info(`Fetching flood warnings for state: ${state}`);
    // It seems your API expects a query parameter for the state, like ?state=NSW
    // Make sure your BASE_URL doesn't end with a '/', or adjust the template literal.
    // Assuming BASE_URL is like 'http://api.example.com/warnings'
    const url = `${BASE_URL}?state=${state}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`API response not OK for state ${state}: ${response.status} ${response.statusText}`);
      // Throw an error to be caught by the hydrateFloodWarning's try/catch
      throw new Error(`Failed to fetch warnings for ${state}: ${response.statusText}`);
    }

    const data = await response.json();
    console.info(`Successfully fetched warnings for state: ${state}`);
    return data;
  } catch (error) {
    console.error(`Error fetching flood warning for state ${state}:`, error);
    // Depending on your error handling strategy, you might want to rethrow or return null/empty.
    // For hydration, it's often better to log and continue with other states.
    return null;
  }
};

export const hydrateAustralianWeatherWarnings = async () => {

   console.info('Starting full flood warning hydration process...');
  const australianStates: string[] = Object.values(AustralianStateEnum);

  const stateHydrationResults = await Promise.allSettled(
    australianStates.map(async state => {
      console.info(`Hydrating for state: ${state}`);
      const warningIds = await getStateWarnings(state);

      if (!warningIds || warningIds.length === 0) {
        console.info(`No warning IDs found for state ${state}, skipping detail hydration.`);
        return { state, status: 'no_ids', detailsFetched: 0 };
      }

      console.info(`Found ${warningIds.length} warning IDs for state ${state}. Fetching details with delay...`);
      let successfulDetails = 0;
      let failedDetails = 0;

      // --- Major Change Here: Iterating sequentially with a delay ---
      for (const id of warningIds) {
        try {
          const details = await getWarningDetails(id);
          if (details) {
            successfulDetails++;
          } else {
            // Null implies 404 or other non-throwing failure in getWarningDetails
            failedDetails++;
          }
        } catch (error) {
          // This catch is for errors thrown by getWarningDetails (non-404 network/API errors)
          console.error(`Error processing warning detail for ${id}:`, error);
          failedDetails++;
        }

        // Introduce the delay after each detail call
        if (DETAIL_CALL_DELAY_MS > 0) {
          await new Promise(resolve => setTimeout(resolve, DETAIL_CALL_DELAY_MS));
        }
      }
      // --- End of Major Change ---

      console.info(`Detail hydration for state ${state} complete. Successfully fetched ${successfulDetails}, Failed/Not Found ${failedDetails} details.`);

      return { state, status: 'fulfilled', detailsFetched: successfulDetails, detailsFailed: failedDetails };
    })
  );

  // Overall summary
  const totalSuccessfulStates = stateHydrationResults.filter(r => r.status === 'fulfilled' && (r as PromiseFulfilledResult<any>).value.status !== 'no_ids').length;
  const totalFailedStates = stateHydrationResults.filter(r => r.status === 'rejected').length;
  const totalStatesWithNoIds = stateHydrationResults.filter(r => r.status === 'fulfilled' && (r as PromiseFulfilledResult<any>).value.status === 'no_ids').length;

  console.info('Full hydration process complete.');
  console.info(`Summary: States with warnings hydrated: ${totalSuccessfulStates}, States with no warnings: ${totalStatesWithNoIds}, States with errors: ${totalFailedStates}`);
};

// --- Execution Logic ---

// 1. Run immediately on startup
console.info('Initial full hydration run started...');
hydrateAustralianWeatherWarnings().then(() => {
  console.info('Initial full hydration run complete.');
}).catch(err => {
  console.error('Initial full hydration run failed unexpectedly:', err);
});

// 2. Set up the interval for subsequent runs
console.info(`Scheduling future full hydration runs every ${INTERVAL_MS / 1000 / 60} minutes...`);
setInterval(() => {
  console.info('Scheduled full hydration run started...');
  hydrateAustralianWeatherWarnings().then(() => {
    console.info('Scheduled full hydration run complete.');
  }).catch(err => {
    console.error('Scheduled full hydration run failed unexpectedly:', err);
  });
}, INTERVAL_MS);

// Keep the Node.js process alive if this is the only thing running
// process.stdin.resume();