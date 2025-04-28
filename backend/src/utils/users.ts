import { AccountType, OtpType, PrismaClient, Status } from "@prisma/client";
import { Response } from "express";
import bcrypt from "bcryptjs";
type CreateUserT = {
  firstName?: string;
  lastName?: string;
  username: string;
  password: string;
  email: string;
  accountType: AccountType;
};

export const simpleInputValidation = (res: Response, [...fields]) => {
  for (const field of fields) {
    if (!field) {
      return res.status(422).json({
        status: "error",
        message: "Fields required",
      });
    }
  }
};

export const getValidAccType = (accountType: string) => {
  if (accountType.toLocaleLowerCase() === "current") return AccountType.CURRENT;
  if (accountType.toLocaleLowerCase() === "fixed") return AccountType.FIXED;
  return AccountType.SAVING;
};

export const findUser = async (
  prisma: PrismaClient,
  options: {},
  select?: {}
) => {
  const user = await prisma.user.findFirst({
    where: options,
    select,
  });

  return user;
};

export const createUser = async (
  prisma: PrismaClient,
  options: CreateUserT
) => {
  await prisma.user.create({
    data: options,
  });
};

export const getOtp = () => {
  return Math.floor(Math.random() * 899999 + 100000);
};

export const createOtp = async (
  prisma: PrismaClient,
  data: {
    email: string;
    otp: number;
    type: OtpType;
  }
) => {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await prisma.otp.create({
    data: {
      ...data,
      expiresAt,
    },
  });
};

type otpDataT = {
  email: string;
  type: OtpType;
};
export const findOtp = async (prisma: PrismaClient, data: otpDataT) => {
  const otp = await prisma.otp.findFirst({
    where: data,
  });
  return otp;
};

export const verifyUserStatus = async (prisma: PrismaClient, email: string) => {
  await prisma.user.update({
    where: {
      email,
    },
    data: {
      status: Status.ACTIVE,
      isVerified: true,
    },
  });
};
export const deleteUser = async (prisma: PrismaClient, email: string) => {
  await prisma.user.update({
    where: {
      email,
    },
    data: {
      status: Status.CLOSED,
      isVerified: false,
      isDeleted: true,
    },
  });
};

export const deleteOtp = async (
  prisma: PrismaClient,
  type: OtpType,
  id: string
) => {
  await prisma.otp.delete({
    where: {
      type,
      id,
    },
  });
};

export const getUpdatedData = async (
  user: any,
  firstName: string,
  lastName: string,
  dateOfBirth: Date,
  transactionPin: string,
  password: string
) => {
  const updateData: any = {};
  if (firstName && firstName != user.firstName)
    updateData.firstName = firstName;
  if (lastName && user.lastName !== lastName) updateData.lastName = lastName;
  if (dateOfBirth && user.dateOfBirth !== dateOfBirth)
    updateData.dateOfBirth = new Date(dateOfBirth);

  if (transactionPin && user.transactionPin !== transactionPin) {
    const hashedPin = await bcrypt.hash(transactionPin, 12);
    updateData.transactionPin = hashedPin;
  }
  const isPasswordEqual = await bcrypt.compare(password, user.password);

  if (password && !isPasswordEqual) {
    const hashedPassword = await bcrypt.hash(password, 12);
    updateData.password = hashedPassword;
  }

  return updateData;
};

export const updateUser = async (
  res: Response,
  prisma: PrismaClient,
  where: any,
  data: {},
  select?: {}
) => {
  const user = await prisma.user.findFirst({
    where,
  });
  if (!user) {
    return res.json({
      status: "error",
      message: "Invalid action",
    });
  }
  await prisma.user.update({
    where: where,
    data,
    select,
  });
  if (!user) {
    console.log("HI THERE");
  }
};

export const validateType = (type: string): OtpType | null => {
  if (type == "password") return OtpType.CHANGE_PASSWORD;
  if (type == "pin") return OtpType.CHANGE_PIN;
  if (type == "delete") return OtpType.DELETE;
  if (type == "register") return OtpType.REGISTER;
  return null;
};

export const validateOtp = async (
  prisma: PrismaClient,
  type: OtpType,
  id: string
) => {
  await prisma.otp.update({
    where: {
      type,
      id,
    },
    data: {
      isUsed: true,
    },
  });
};
