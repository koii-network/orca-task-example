import express from "express";

// Just used for coloring of the REST API logs
export function configureMorgan(morgan: any, app: any) {
    // Define custom morgan token for colored status
    morgan.token("status-colored", (req: express.Request, res: express.Response) => {
        const status = res.statusCode;
        const color =
            status >= 500
                ? 31 // red
                : status >= 400
                    ? 33 // yellow
                    : status >= 300
                        ? 36 // cyan
                        : 32; // green
        return `\x1b[${color}m${status}\x1b[0m`;
    });

    // Add this middleware before morgan to capture response body
    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
        const originalJson = res.json;
        res.json = function (body) {
            res.locals.responseBody = body;
            return originalJson.call(this, body);
        };
        next();
    });

    // Add custom token for error message
    morgan.token("error-message", (req: express.Request, res: express.Response) => {
        const expressRes = res as express.Response;
        if (expressRes.statusCode >= 400) {
            return expressRes.locals.responseBody?.message || "";
        }
        return "";
    });

    // Modified morgan configuration
    app.use(
        morgan(":method :url :status-colored :error-message - :response-time ms", {
            skip: (req: express.Request) => req.url === "/healthz",
        }),
    );
}