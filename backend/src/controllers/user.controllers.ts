import { Request, Response } from "express";
import dotenv from "dotenv";
import { AccountType, PrismaClient } from "@prisma/client";
import { getPrisma } from "../utils/getPrisma";
import { sendMail } from "../utils/sendMail";
import bcrypt from "bcryptjs";
import {
  createOtp,
  createUser,
  deleteOtp,
  findOtp,
  findUser,
  getOtp,
  getValidAccType,
  simpleInputValidation,
  verifyUserStatus,
} from "../utils/users";
dotenv.config();

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      firstName = "",
      lastName = "",
      username = "",
      email = "",
      password = "",
      accountType = "",
    } = req.body;

    const response = simpleInputValidation(res, [
      firstName,
      lastName,
      username,
      email,
      password,
    ]);

    if (response) return;
    const validAccType: AccountType | null = getValidAccType(accountType);
    const hashedPass = await bcrypt.hash(password, 12);

    const prisma = getPrisma();

    const filter = {
      OR: [{ username }, { email }],
      isDeleted: false,
    };

    const userExists = await findUser(prisma, filter);

    if (userExists) {
      if (!userExists.isVerified) {
        res.status(403).json({
          status: "error",
          message: "Otp already sent to your mail. Verify to continue",
        });
        return;
      }
      res.status(403).json({
        status: "error",
        message:
          "User already exists with this username or email. Try with different email or username",
      });
      return;
    }

    let data: any = {
      firstName,
      lastName,
      username,
      password: hashedPass,
      email,
      accountType: validAccType,
    };

    await createUser(prisma, data);

    const otp = getOtp();
    await sendMail(email, otp);

    data = {
      email,
      otp,
    };

    await createOtp(prisma, data);

    res.json({
      status: "success",
      message: "Otp sent to your email. Verify the otp to create account",
    });
    return;
  } catch (e) {
    if (e instanceof SyntaxError)
      res.status(422).json({
        status: "error",
        message: "Invalid input format",
      });
    return;
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { email = "", otp = null } = req.body;

  simpleInputValidation(res, [otp, email]);

  const prisma = getPrisma();

  const data = {
    email,
  };
  const otpExists = await findOtp(prisma, data);

  if (!otpExists) {
    res.json({
      status: "error",
      message: "Registration is necessary before otp verification",
    });
    return;
  }

  const isOtpEqual = Number(otp) === otpExists.otp;
  if (!isOtpEqual) {
    res.json({
      status: "error",
      message: "Invalid Otp",
    });
    return;
  }

  await deleteOtp(prisma, email);
  await verifyUserStatus(prisma, email);
  res.json({
    status: "success",
    message: "Verification successful, You can now login",
  });
  return;
};

export const login = async (req: Request, res: Response) => {
  const { email = "", password = "" } = req.body;

  simpleInputValidation(res, [email, password]);

  const prisma = getPrisma();

  const data = {
    email,
  };
  const userExists = await findUser(prisma, data);

  if (!userExists || userExists.isDeleted) {
    res.json({
      status: "error",
      message: "User not found",
    });
    return;
  }

  if (!userExists.isVerified) {
    res.json({
      status: "error",
      message:
        "User is not verified. Check your mail for otp and verify registration",
    });
    return;
  }
  const isPasswordEqual = await bcrypt.compare(password, userExists.password);

  if (!isPasswordEqual) {
    res.json({
      status: "error",
      message: "Invalid credential",
    });
  }

  res.cookie("token", 123);
  res.json({
    status: "success",
    message: "Login successful",
  });
  return;
};

export const getMe = async (req: Request, res: Response) => {
  res.json("getMe");
  return;
};

export const updateMe = async (req: Request, res: Response) => {
  res.json("updateMe");
  return;
};

export const getProfile = async (req: Request, res: Response) => {
  res.json("profile");
  return;
};

export const getBalance = async (req: Request, res: Response) => {
  res.json("balance");
  return;
};

export const logout = async (req: Request, res: Response) => {
  res.json("logout");
  return;
};

export const getNotifications = async (req: Request, res: Response) => {
  res.json("notification");
  return;
};

export const updatePIN = async (req: Request, res: Response) => {
  res.json("updatePIN");
  return;
};

export const deleteAccount = async (req: Request, res: Response) => {
  res.json("deleteAccount");
  return;
};
