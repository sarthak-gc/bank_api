import { NextFunction, Request, Response } from "express";
import jwt, { JsonWebTokenError, JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

interface decodedI extends JwtPayload {
  email: string;
  deleteRequest: boolean;
}
export const checkAccountDeleteValidity = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies["account_delete_token"];
  if (!token) {
    res.status(401).json({
      status: "error",
      message: "account delete token not found",
    });
    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.ACCOUNT_DELETE_TOKEN || "secret"
    ) as decodedI;

    if (decoded.deleteRequest) {
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
