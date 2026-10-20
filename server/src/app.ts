import express, { Application, NextFunction, Request, Response } from "express";

import httpStatus from "http-status";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import config from "./config";
import GlobalErrorHandler from "./app/middlewares/globalErrorHandler";
import { rateLimiters } from "./app/middlewares/rateLimiters";
import router from "./app/routes";



const app: Application = express();

// Behind a reverse proxy (or a hosting platform's load balancer) every request arrives from that proxy's IP.
// TRUST_PROXY=<number of proxies in front> makes req.ip the real client IP, which the
// per-IP rate limiters depend on. Leave it at 0 when clients connect directly.
app.set("trust proxy", config.trust_proxy);

export const corsOptions = {
  origin: config.client_origins,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  // Browsers hide most response headers from cross-origin pages. The client needs
  // Retry-After to show "try again in N seconds" on a 429.
  exposedHeaders: ["Retry-After"],
  credentials: true,
};

// Middleware setup
app.use(helmet());
app.use(cors(corsOptions));
app.use(cookieParser());
// The largest legitimate body is a project submission (a few KB).
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(express.static("public"));

// Route handler for root endpoint
app.get("/", (req: Request, res: Response) => {
  res.send({
    success:true,
    statusCode: httpStatus.OK,
    message: "Welcome to Server !",
  });
});

// Router setup
app.use("/api/v1", rateLimiters.globalLimiter, router);

// Error handling middleware
app.use(GlobalErrorHandler);

// Not found handler
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: "API NOT FOUND!",
    errorSources: [
      {
        path: req.originalUrl,
        message: "Your requested path is not found!",
      },
    ],
  });
});

export default app;
