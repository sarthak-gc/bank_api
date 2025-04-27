import express from "express";
import {
  signup,
  verifyOtp,
  login,
  getMe,
  updateMe,
  getProfile,
  getBalance,
  logout,
  getNotifications,
  updatePIN,
  deleteAccount,
  setPin,
} from "../controllers/user.controllers";
import { authMiddleware } from "../middleware/authMiddleware";

const userRoutes = express.Router();

userRoutes.post("/signup", signup);
userRoutes.post("/otp-verification", verifyOtp);
userRoutes.post("/login", login);

userRoutes.use(authMiddleware);
userRoutes.get("/me", getMe);
userRoutes.get("/profile/:profileId", getProfile);

userRoutes.post("/transactionPin", setPin);
userRoutes.put("/me", updateMe);

userRoutes.get("/balance", getBalance);
userRoutes.post("/logout", logout);
userRoutes.get("/notification", getNotifications);
userRoutes.put("/updatePIN", updatePIN);
userRoutes.delete("/deleteAccount", deleteAccount);

export default userRoutes;
