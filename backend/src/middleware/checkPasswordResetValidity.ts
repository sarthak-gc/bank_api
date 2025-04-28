import { NextFunction, Request, Response } from "express";
import jwt, { JsonWebTokenError, JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

interface decodedI extends JwtPayload {
  email: string;
  resetRequest: boolean;
}
export const checkPasswordResetValidity = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies["pin_reset_token"];
  if (!token) {
    res.status(401).json({
      status: "error",
      message: "Pin change token not found",
    });
    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.PIN_RESET_TOKEN || "secret"
    ) as decodedI;

    if (decoded.resetRequest) {
      next();
    } else {
      res.status(400).json({
        status: "error",
        message: "Invalid request",
      });
      return;
    }
  } catch (e) {
    if (e instanceof JsonWebTokenError) {
      console.error(e.message);
      res.status(401).json({
        status: "error",
        message: e.message,
      });
      return;
    }
    console.error(e);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
    return;
  }
};
