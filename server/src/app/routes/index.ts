import express from "express";
import { AuthRoutes } from "../modules/Auth/auth.routes";
import { ProjectRoutes } from "../modules/Project/project.routes";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/projects",
    route: ProjectRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
