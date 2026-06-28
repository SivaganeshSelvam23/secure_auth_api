import express from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import {
  getAllUsers,
  updateUserStatus,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/users", authenticate, authorize("admin"), getAllUsers);
router.patch(
  "/users/:id/status",
  authenticate,
  authorize("admin"),
  updateUserStatus,
);

export default router;
