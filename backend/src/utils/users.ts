import { AccountType, PrismaClient, Status } from "@prisma/client";
import { Response } from "express";

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

export const findUser = async (prisma: PrismaClient, options: {}) => {
  const user = await prisma.user.findFirst({
    where: options,
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
  }
) => {
  await prisma.otp.create({
    data,
  });
};
export const findOtp = async (prisma: PrismaClient, data: {}) => {
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

export const deleteOtp = async (prisma: PrismaClient, email: string) => {
  await prisma.otp.delete({
    where: {
      email,
    },
  });
};
