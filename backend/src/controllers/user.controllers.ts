import { Request, Response } from "express";
import dotenv from "dotenv";
import { AccountType, PrismaClient } from "@prisma/client";
import { getPrisma } from "../utils/getPrisma";
import { sendMail } from "../utils/sendMail";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  createOtp,
  createUser,
  deleteOtp,
  findOtp,
  findUser,
  getOtp,
  getUpdatedData,
  getValidAccType,
  simpleInputValidation,
  updateUser,
  verifyUserStatus,
} from "../utils/users";
import { date } from "zod";
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

  const response = simpleInputValidation(res, [otp, email]);
  if (response) return;
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

  const response = simpleInputValidation(res, [email, password]);
  if (response) return;
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
  const payLoad = {
    userId: userExists.userId,
    username: userExists.username,
  };
  const secretToken = process.env.JWT_SECRET_TOKEN || "secret";
  const token = jwt.sign(payLoad, secretToken, {
    expiresIn: "30d",
    algorithm: "HS512",
  });

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.ENVIRONMENT?.toLowerCase() === "production",
  });

  res.json({
    status: "success",
    message: "Login successful",
  });
  return;
};

export const getMe = async (req: Request, res: Response) => {
  const userId = req.userId;
  const prisma = getPrisma();
  const options = { userId };
  const select = {
    userId: true,
    firstName: true,
    lastName: true,
    username: true,
    email: true,
    dateOfBirth: true,
    accountType: true,
    balance: true,
    dailyTransaction: true,
    monthlyTransaction: true,
  };
  const user = await findUser(prisma, options, select);

  res.json({
    status: "success",
    message: "Details retrieved",
    data: {
      details: user,
    },
  });
  return;
};

export const updateMe = async (req: Request, res: Response) => {
  const userId = req.userId;
  const {
    lastName = "",
    firstName = "",
    transactionPin = "",
    dateOfBirth = "",
    password = "",
  } = req.body;
  const prisma = getPrisma();

  const options = { userId };
  const select = {
    lastName: true,
    firstName: true,
    transactionPin: true,
    dateOfBirth: true,
    password: true,
  };
  const user = await findUser(prisma, options, select);

  const updateData = await getUpdatedData(
    user,
    lastName,
    firstName,
    transactionPin,
    dateOfBirth,
    password
  );

  //?````````````````` NOT WORKING FIX THIS LATER `````````````````

  if (!updateData) {
    res.json({
      status: "error",
      message: "Nothing to update here",
    });
    return;
  }
  const updatedUser = await prisma.user.update({
    where: {
      userId,
    },
    data: updateData,
    select: {
      userId: true,
      firstName: true,
      lastName: true,
      username: true,
      email: true,
      dateOfBirth: true,
      accountType: true,
      balance: true,
      dailyTransaction: true,
      monthlyTransaction: true,
    },
  });

  res.json({
    status: "success",
    message: "Profile updated successfully",
    data: updatedUser,
  });
  return;
};

export const getProfile = async (req: Request, res: Response) => {
  const userId = req.userId;

  const { profileId } = req.params;

  if (userId === profileId) {
    res.status(411).json({
      status: "error",
      message: "Own data retrieval failed",
    });
    return;
  }

  const prisma = getPrisma();
  const options = { userId: profileId };
  const select = {
    userId: true,
    lastName: true,
    username: true,
    firstName: true,
  };

  const user = await findUser(prisma, options, select);

  if (!user) {
    res.status(404).json({
      status: "error",
      message: "User not found",
    });
    return;
  }

  user.firstName = "***" + user.firstName?.slice(4);
  res.json({
    status: "success",
    message: "User found",
    data: {
      user,
    },
  });
  return;
};

export const setPin = async (req: Request, res: Response) => {
  const userId = req.userId;

  const { pin = null } = req.body;

  if (!Number(pin)) {
    res.json({
      status: "error",
      message: "Pin is required in numerical format",
    });
    if (pin.length !== 4) {
      res.json({
        status: "error",
        message: "Only 4 digit pins are allowed",
      });
    }

    const transactionPin = await bcrypt.hash(pin, 12);
    const prisma = getPrisma();
    const filter = {
      userId,
      transactionPin: null,
    };
    const data = {
      transactionPin,
    };
    const select = {
      userId: true,
      lastName: true,
      username: true,
      firstName: true,
      transactionPin: true,
    };

    await updateUser(prisma, filter, data, select);
  }

  res.json({
    status: "success",
    message: "Pin Set Successfully",
  });
  return;
};

export const getBalance = async (req: Request, res: Response) => {
  const userId = req.userId;
  const prisma = getPrisma();

  const options = {
    userId,
  };
  const select = {
    balance: true,
  };

  const balance = await findUser(prisma, options, select);

  if (!balance) {
    res.json({
      status: "success",
      message: "User not  found",
    });
    return;
  }

  res.json({
    status: "success",
    message: "Balance retrieved successfully",
    data: {
      balance: balance.balance,
    },
  });
  return;
};

export const logout = async (req: Request, res: Response) => {
  res.cookie("token", "");
  res.json("logout successfully");
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
