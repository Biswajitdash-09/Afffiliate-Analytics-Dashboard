
import { isbot } from 'isbot';

// Allow 10 clicks per IP per minute
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const ipRequestMap = new Map();

export function isBot(userAgent) {
    return isbot(userAgent);
}

export function checkRateLimit(ip) {
    const now = Date.now();
    const requestData = ipRequestMap.get(ip) || { count: 0, startTime: now };

    if (now - requestData.startTime > RATE_LIMIT_WINDOW) {
        requestData.count = 1;
        requestData.startTime = now;
    } else {
        requestData.count++;
    }

    ipRequestMap.set(ip, requestData);

    return requestData.count <= RATE_LIMIT_MAX_REQUESTS;
}
