import { Request, Response } from "express";
import requestIp from "request-ip";
import dotenv from "dotenv";
import { AccountType, OtpType, Status } from "@prisma/client";
import { getPrisma } from "../utils/getPrisma";
import { sendMail } from "../utils/sendMail";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  createOtp,
  createUser,
  deleteOtp,
  deleteUser,
  findOtp,
  findUser,
  getOtp,
  getUpdatedData,
  getValidAccType,
  simpleInputValidation,
  updateUser,
  validateOtp,
  validateType,
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

    let userData = {
      firstName,
      lastName,
      username,
      password: hashedPass,
      email,
      accountType: validAccType,
    };

    await createUser(prisma, userData);

    const otp = getOtp();

    const data = {
      email,
      otp,
      type: OtpType.REGISTER,
    };

    await createOtp(prisma, data);
    await sendMail(email, OtpType.REGISTER, otp);

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

  const type = req.params.type;

  const response = simpleInputValidation(res, [otp, email]);
  if (response) return;

  const validatedType = validateType(type);
  const prisma = getPrisma();

  if (!validatedType) {
    res.json({
      status: "error",
      message: "Invalid Request",
    });
    return;
  }

  const data: {
    email: string;
    type: OtpType;
  } = {
    email,
    type: validatedType,
  };
  const otpExists = await findOtp(prisma, data);

  if (!otpExists) {
    res.json({
      status: "error",
      message: "Invalid request, re-generate otp and try again",
    });
    return;
  }

  if (otpExists.isUsed || otpExists.expiresAt < new Date(Date.now())) {
    await deleteOtp(prisma, otpExists.type, otpExists.id);
    res.json({
      status: "error",
      message: "Otp expired, try again",
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

  if (otpExists.type === OtpType.REGISTER || otpExists.type === OtpType.DELETE)
    await deleteOtp(prisma, validatedType, otpExists.id);

  if (otpExists.type === OtpType.REGISTER) {
    await verifyUserStatus(prisma, email);
    res.json({
      status: "success",
      message: "Verification successful, You can now login",
    });
  }
  if (otpExists.type === OtpType.DELETE) {
    await deleteUser(prisma, email);
    res.json({
      status: "success",
      message: "Verification successful, You can now delete account",
    });
  }
  if (otpExists.type === OtpType.CHANGE_PASSWORD) {
    await validateOtp(prisma, OtpType.CHANGE_PASSWORD, otpExists.id);
    res.json({
      status: "success",
      message: "Verification successful, You can now change Password",
    });
  }

  if (otpExists.type === OtpType.CHANGE_PIN) {
    await validateOtp(prisma, OtpType.CHANGE_PIN, otpExists.id);
    const secretToken = (process.env.PIN_RESET_TOKEN as string) || "secret";

    const payLoad = {
      email,
      resetRequest: true,
    };
    const token = jwt.sign(payLoad, secretToken, {
      expiresIn: "30d",
      algorithm: "HS512",
    });

    res.cookie("pin_reset_token", token);
    res.json({
      status: "success",
      message: "Verification successful, You can now change Pin",
    });
  }

  return;
};

export const login = async (req: Request, res: Response) => {
  const { email = "", password = "", location = "-" } = req.body;

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

  let ip = requestIp.getClientIp(req);
  // ? ----------------------- create notification here-------------------------------
  await prisma.loginHistory.create({
    data: {
      userId: payLoad.userId,
      location: location,
      ip,
    },
  });

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.ENVIRONMENT?.toLowerCase() === "production",
  });

  res.json({
    status: "success",
    message: "Login successful",
    ip,
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

  if (Object.keys(updateData).length == 0) {
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
    return;
  }

  if (String(pin).length !== 4) {
    res.json({
      status: "error",
      message: "Only 4 digit pins are allowed",
    });
    return;
  }

  const transactionPin = await bcrypt.hash(String(pin), 12);
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
    email: true,
    lastName: true,
    username: true,
    firstName: true,
    transactionPin: true,
  };

  // ? ----------------------- create notification here-------------------------------
  if (await updateUser(res, prisma, filter, data, select)) return;
  // console.log("Hi there");
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
  const userId = req.userId;

  const prisma = getPrisma();
  await prisma.notification.findMany({
    where: {
      receiverId: userId,
    },
    select: {
      notificationId: true,
      type: true,
      receiverId: true,
      balance: true,
      message: true,
      createdAt: true,
      read: true,
      Receiver: true,
    },
  });
  res.json("notification");
  return;
};

export const requestPinChange = async (req: Request, res: Response) => {
  const email = req.email;

  const prisma = getPrisma();
  const otpExists = await findOtp(prisma, {
    email,
    type: OtpType.CHANGE_PIN,
  });
  console.log("HI THERE");

  console.log(otpExists);
  if (otpExists) {
    res.json({
      status: "error",
      message: "Otp already sent to your mail. Verify to continue",
    });
    return;
  }
  const otp = getOtp();

  const data: {
    email: string;
    otp: number;
    type: OtpType;
  } = {
    email,
    otp,
    type: OtpType.CHANGE_PIN,
  };

  createOtp(prisma, data);
  sendMail(email, OtpType.CHANGE_PIN, otp);

  res.json({
    status: "success",
    message: "Otp sent to your email. Verify the otp to change your pin",
  });
  return;
};

export const deleteAccount = async (req: Request, res: Response) => {
  const userId = req.userId;
  const prisma = getPrisma();

  const options = {
    userId,
    isDeleted: false,
    isVerified: true,
    status: Status.ACTIVE,
  };

  const user = await findUser(prisma, options);
  console.log(user);
  if (!user) {
    res.json({
      status: "error",
      message: "Account doesn't exist",
    });
    return;
  }

  const filter = {
    userId,
    isDeleted: false,
    isVerified: true,
    status: Status.ACTIVE,
  };
  const data = {
    isDeleted: true,
    isVerified: false,
    status: Status.CLOSED,
  };
  await updateUser(res, prisma, filter, data);

  console.log("jo");

  // res.cookie("account_delete_token", "");
  res.json({
    status: "success",
    message: "User Deleted",
  });
};

export const updatePIN = async (req: Request, res: Response) => {
  const { pin } = req.body;
  const userId = req.userId;
  if (!pin || !Number(pin)) {
    res.json({
      status: "error",
      message: "Invalid pin, Pin must be in numerical format",
    });
    return;
  }

  if (String(pin).length !== 4) {
    res.json({
      status: "error",
      message: "Only 4 digit pins are allowed",
    });
    return;
  }

  const transactionPin = await bcrypt.hash(String(pin), 12);
  const prisma = getPrisma();
  // ? ----------------------- create notification here-------------------------------
  await prisma.user.update({
    where: {
      userId,
    },
    data: {
      transactionPin,
    },
  });

  res.cookie("pin_reset_token", "");
  res.json({
    status: "success",
    message: "Pin Updated",
  });
};

export const requestDeleteAccount = async (req: Request, res: Response) => {
  const email = req.email;

  const prisma = getPrisma();
  const otpExists = await findOtp(prisma, {
    email,
    type: OtpType.DELETE,
  });

  if (otpExists) {
    res.json({
      status: "error",
      message: "Otp already sent to your mail. Verify to continue",
    });
    return;
  }

  const otp = getOtp();

  const data: {
    email: string;
    otp: number;
    type: OtpType;
  } = {
    email,
    otp,
    type: OtpType.DELETE,
  };
  createOtp(prisma, data);
  sendMail(email, OtpType.DELETE, otp);
  const secretToken = (process.env.ACCOUNT_DELETE_TOKEN as string) || "secret";

  const payLoad = {
    email,
    deleteRequest: true,
  };
  const token = jwt.sign(payLoad, secretToken, {
    expiresIn: "30d",
    algorithm: "HS512",
  });

  res.cookie("account_delete_token", token);
  res.json({
    status: "success",
    message: "Otp sent to your email. Verify the otp to delete your account",
  });
  return;
};
