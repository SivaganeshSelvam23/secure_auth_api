import express from "express";
import { authenticate } from "../middlewares/authenticate.js";
import {
  getMyProfile,
  updateMyProfile,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/me", authenticate, getMyProfile);
router.patch("/me", authenticate, updateMyProfile);

export default router;
