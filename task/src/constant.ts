// Use environment variables for configurable ports
const middleServerHost = process.env.MIDDLE_SERVER_HOST || 'localhost';
const middleServerPort = process.env.MIDDLE_SERVER_PORT || '5001';
const middleServerUrl = `http://${middleServerHost}:${middleServerPort}`;

export { middleServerUrl };