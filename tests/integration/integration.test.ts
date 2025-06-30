import fetch from 'node-fetch';

const BASE_URL = process.env.FLOOD_WARNING_API || 'http://weather-warning-test.ap-southeast-2.elasticbeanstalk.com';

describe('Flood Warning API Integration Tests', () => {

    describe('/health endpoint', () => {
        it('should return a 200 OK status for /health', async () => {
            const response = await fetch(`${BASE_URL}/health`);
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty('status','OK');
        });
    });

   describe('/ endpoint', () => {
        it('should return a 200 OK for valid state', async () => {
            const response = await fetch(`${BASE_URL}?state=NSW`);
            expect(response.status).toBe(200);
        });
        it('should return a 400 Bad Request if state parameter is missing', async () => {
            const response = await fetch(`${BASE_URL}`);
            expect(response.status).toBe(400);
            const data = await response.json();
            expect(data).toHaveProperty('error','State query parameter is required');
        });

        it('should return a 404 when state is invalid', async () => {
            const response = await fetch(`${BASE_URL}?state=INVALID`);
            expect(response.status).toBe(404);
            const data = await response.json();
            expect(data).toHaveProperty('error','No warnings found for the specified state');
        });
    });

    describe('/warnings/:id endpoint', () => {
        const existingWarningId = 'IDQ10090'; // Example existing warning ID

        it(`should return a 200 OK status and warning data for existing warning ID ${existingWarningId}`, async () => {
            const response = await fetch(`${BASE_URL}/warning/${existingWarningId}`);
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty('expiryTime');
            expect(data).toHaveProperty('issueTimeUtc');
            expect(data).toHaveProperty('productType');
            expect(data).toHaveProperty('service');
            expect(data).toHaveProperty('text');
        });

    });
});
