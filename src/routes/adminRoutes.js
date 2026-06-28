import express from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { getAllUsers } from "../controllers/adminController.js";

const router = express.Router();

router.get("/users", authenticate, authorize("admin"), getAllUsers);

export default router;
