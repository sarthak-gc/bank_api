import { AccountType, PrismaClient, Status } from "@prisma/client";
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
  prisma: PrismaClient,
  where: any,
  data: {},
  select: {}
) => {
  await prisma.user.update({
    where: where,
    data,
    select,
  });
};
