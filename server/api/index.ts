// Vercel runs the Express app as ONE serverless function: every request is rewritten to this file
// (see vercel.json) and Express does its own routing, exactly as it does behind `npm start`.
// Nothing listens on a port here; Vercel calls the exported app for each request.
import app from "../src/app";

export default app;
