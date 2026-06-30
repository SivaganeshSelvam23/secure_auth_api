import express from "express";
import { authenticate } from "../middlewares/authenticate.js";
import {
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/me", authenticate, getMyProfile);
router.patch("/me", authenticate, updateMyProfile);
router.patch("/me/password", authenticate, changeMyPassword);
export default router;
