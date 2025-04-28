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
  requestPinChange,
  requestDeleteAccount,
} from "../controllers/user.controllers";
import { authMiddleware } from "../middleware/authMiddleware";
import { checkPasswordResetValidity } from "../middleware/checkPasswordResetValidity";
import { checkAccountDeleteValidity } from "../middleware/checkAccountDeleteValidity";

const userRoutes = express.Router();

userRoutes.post("/signup", signup);
userRoutes.post("/otp-verification/:type", verifyOtp); // register done
userRoutes.post("/login", login);

userRoutes.use(authMiddleware);
userRoutes.get("/me", getMe);
userRoutes.get("/profile/:profileId", getProfile);

userRoutes.post("/transactionPin", setPin);
userRoutes.put("/me", updateMe);

userRoutes.get("/balance", getBalance);
userRoutes.post("/logout", logout);
userRoutes.get("/notification", getNotifications);

userRoutes.post("/pin", requestPinChange);
userRoutes.put("/pin", checkPasswordResetValidity, updatePIN);

userRoutes.post("/deleteAccount", requestDeleteAccount);
userRoutes.delete("/deleteAccount", checkAccountDeleteValidity, deleteAccount);

export default userRoutes;
