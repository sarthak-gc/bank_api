import { NextFunction, Request, Response } from "express";
import jwt, { JsonWebTokenError, JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import { getPrisma } from "../utils/getPrisma";
dotenv.config();

interface decodedI extends JwtPayload {
  userId: string;
  username: string;
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies["token"];
  if (!token) {
    res.status(401).json({
      status: "error",
      message: "Token not found ",
    });
    return;
  }
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET_TOKEN || "secret"
    ) as decodedI;

    const prisma = getPrisma();
    const user = await prisma.user.findFirst({
      where: {
        userId: decoded.userId,
      },
    });

    if (!user) {
      res.json({
        status: "error",
        message: "User not found, try logging in again",
      });
      return;
    }
    req.userId = decoded.userId;
    req.username = decoded.username;
    next();
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
