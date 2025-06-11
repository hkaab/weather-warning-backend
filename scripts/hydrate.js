"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hydrateAustralianWeatherWarnings = exports.AustralianStateEnum = void 0;
var node_fetch_1 = require("node-fetch"); // Assuming 'node-fetch' is installed (npm install node-fetch@2) for older Node.js versions. For Node.js 18+, 'fetch' is native.
var BASE_URL = process.env.FLOOD_WARNING_API || 'http://flood-warning-api-test.us-east-1.elasticbeanstalk.com';
var INTERVAL_MS = 10 * 60 * 1000; // 10 minutes in milliseconds
var DETAIL_CALL_DELAY_MS = 200;
var AustralianStateEnum;
(function (AustralianStateEnum) {
    AustralianStateEnum["NT"] = "NT";
    AustralianStateEnum["NSW"] = "NSW";
    AustralianStateEnum["QLD"] = "QLD";
    AustralianStateEnum["SA"] = "SA";
    AustralianStateEnum["TAS"] = "TAS";
    AustralianStateEnum["VIC"] = "VIC";
    AustralianStateEnum["WA"] = "WA";
    AustralianStateEnum["ACT"] = "ACT";
})(AustralianStateEnum || (exports.AustralianStateEnum = AustralianStateEnum = {}));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
var getWarningDetails = function (warningId) { return __awaiter(void 0, void 0, void 0, function () {
    var url, response, data, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                console.info("Fetching warning details for ID: ".concat(warningId));
                url = "".concat(BASE_URL, "/warning/").concat(warningId);
                return [4 /*yield*/, (0, node_fetch_1.default)(url)];
            case 1:
                response = _a.sent();
                if (!response.ok) {
                    // Check for 404 specifically
                    if (response.status === 404) {
                        console.warn("Warning details for ID ".concat(warningId, " not found (404)."));
                        return [2 /*return*/, null]; // Return null if not found
                    }
                    console.error("API response not OK for warning details for ID ".concat(warningId, ": ").concat(response.status, " ").concat(response.statusText));
                    throw new Error("Failed to fetch warning details for ".concat(warningId, ": ").concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2:
                data = _a.sent();
                console.info("Successfully fetched details for warning ID: ".concat(warningId));
                return [2 /*return*/, data];
            case 3:
                error_1 = _a.sent();
                console.error("Error fetching warning details for ID ".concat(warningId, ":"), error_1);
                return [2 /*return*/, null]; // Return null on error
            case 4: return [2 /*return*/];
        }
    });
}); };
var getStateWarnings = function (state) { return __awaiter(void 0, void 0, void 0, function () {
    var url, response, data, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                console.info("Fetching flood warnings for state: ".concat(state));
                url = "".concat(BASE_URL, "?state=").concat(state);
                return [4 /*yield*/, (0, node_fetch_1.default)(url)];
            case 1:
                response = _a.sent();
                if (!response.ok) {
                    console.error("API response not OK for state ".concat(state, ": ").concat(response.status, " ").concat(response.statusText));
                    // Throw an error to be caught by the hydrateFloodWarning's try/catch
                    throw new Error("Failed to fetch warnings for ".concat(state, ": ").concat(response.statusText));
                }
                return [4 /*yield*/, response.json()];
            case 2:
                data = _a.sent();
                console.info("Successfully fetched warnings for state: ".concat(state));
                return [2 /*return*/, data];
            case 3:
                error_2 = _a.sent();
                console.error("Error fetching flood warning for state ".concat(state, ":"), error_2);
                // Depending on your error handling strategy, you might want to rethrow or return null/empty.
                // For hydration, it's often better to log and continue with other states.
                return [2 /*return*/, null];
            case 4: return [2 /*return*/];
        }
    });
}); };
var hydrateAustralianWeatherWarnings = function () { return __awaiter(void 0, void 0, void 0, function () {
    var australianStates, stateHydrationResults, totalSuccessfulStates, totalFailedStates, totalStatesWithNoIds;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.info('Starting full flood warning hydration process...');
                australianStates = Object.values(AustralianStateEnum);
                return [4 /*yield*/, Promise.allSettled(australianStates.map(function (state) { return __awaiter(void 0, void 0, void 0, function () {
                        var warningIds, successfulDetails, failedDetails, _i, warningIds_1, id, details, error_3;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    console.info("Hydrating for state: ".concat(state));
                                    return [4 /*yield*/, getStateWarnings(state)];
                                case 1:
                                    warningIds = _a.sent();
                                    if (!warningIds || warningIds.length === 0) {
                                        console.info("No warning IDs found for state ".concat(state, ", skipping detail hydration."));
                                        return [2 /*return*/, { state: state, status: 'no_ids', detailsFetched: 0 }];
                                    }
                                    console.info("Found ".concat(warningIds.length, " warning IDs for state ").concat(state, ". Fetching details with delay..."));
                                    successfulDetails = 0;
                                    failedDetails = 0;
                                    _i = 0, warningIds_1 = warningIds;
                                    _a.label = 2;
                                case 2:
                                    if (!(_i < warningIds_1.length)) return [3 /*break*/, 9];
                                    id = warningIds_1[_i];
                                    _a.label = 3;
                                case 3:
                                    _a.trys.push([3, 5, , 6]);
                                    return [4 /*yield*/, getWarningDetails(id)];
                                case 4:
                                    details = _a.sent();
                                    if (details) {
                                        successfulDetails++;
                                    }
                                    else {
                                        // Null implies 404 or other non-throwing failure in getWarningDetails
                                        failedDetails++;
                                    }
                                    return [3 /*break*/, 6];
                                case 5:
                                    error_3 = _a.sent();
                                    // This catch is for errors thrown by getWarningDetails (non-404 network/API errors)
                                    console.error("Error processing warning detail for ".concat(id, ":"), error_3);
                                    failedDetails++;
                                    return [3 /*break*/, 6];
                                case 6:
                                    if (!(DETAIL_CALL_DELAY_MS > 0)) return [3 /*break*/, 8];
                                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, DETAIL_CALL_DELAY_MS); })];
                                case 7:
                                    _a.sent();
                                    _a.label = 8;
                                case 8:
                                    _i++;
                                    return [3 /*break*/, 2];
                                case 9:
                                    // --- End of Major Change ---
                                    console.info("Detail hydration for state ".concat(state, " complete. Successfully fetched ").concat(successfulDetails, ", Failed/Not Found ").concat(failedDetails, " details."));
                                    return [2 /*return*/, { state: state, status: 'fulfilled', detailsFetched: successfulDetails, detailsFailed: failedDetails }];
                            }
                        });
                    }); }))];
            case 1:
                stateHydrationResults = _a.sent();
                totalSuccessfulStates = stateHydrationResults.filter(function (r) { return r.status === 'fulfilled' && r.value.status !== 'no_ids'; }).length;
                totalFailedStates = stateHydrationResults.filter(function (r) { return r.status === 'rejected'; }).length;
                totalStatesWithNoIds = stateHydrationResults.filter(function (r) { return r.status === 'fulfilled' && r.value.status === 'no_ids'; }).length;
                console.info('Full hydration process complete.');
                console.info("Summary: States with warnings hydrated: ".concat(totalSuccessfulStates, ", States with no warnings: ").concat(totalStatesWithNoIds, ", States with errors: ").concat(totalFailedStates));
                return [2 /*return*/];
        }
    });
}); };
exports.hydrateAustralianWeatherWarnings = hydrateAustralianWeatherWarnings;
// --- Execution Logic ---
// 1. Run immediately on startup
console.info('Initial full hydration run started...');
(0, exports.hydrateAustralianWeatherWarnings)().then(function () {
    console.info('Initial full hydration run complete.');
}).catch(function (err) {
    console.error('Initial full hydration run failed unexpectedly:', err);
});
// 2. Set up the interval for subsequent runs
console.info("Scheduling future full hydration runs every ".concat(INTERVAL_MS / 1000 / 60, " minutes..."));
setInterval(function () {
    console.info('Scheduled full hydration run started...');
    (0, exports.hydrateAustralianWeatherWarnings)().then(function () {
        console.info('Scheduled full hydration run complete.');
    }).catch(function (err) {
        console.error('Scheduled full hydration run failed unexpectedly:', err);
    });
}, INTERVAL_MS);
// Keep the Node.js process alive if this is the only thing running
// process.stdin.resume();
