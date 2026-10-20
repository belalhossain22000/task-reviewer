import express from "express";

const router = express.Router();

const moduleRoutes: { path: string; route: express.Router }[] = [];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
