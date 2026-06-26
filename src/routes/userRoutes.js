import express from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { getMyProfile } from "../controllers/userController.js";

const router = express.Router();

router.get("/me", authenticate, getMyProfile);

export default router;
