import { PrismaClient, TransactionStatus, TransferType } from "@prisma/client";

export const getAll = async (
  prisma: PrismaClient,
  where: {},
  skip: number,
  take: number
) => {
  try {
    return await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });
  } catch (e) {
    throw new Error("Database Error");
  }
};

export const getAllScheduledPayments = async (
  prisma: PrismaClient,
  where: {},
  skip: number,
  take: number
) => {
  try {
    return await prisma.scheduledTransaction.findMany({
      where,
      skip,
      take,
    });
  } catch (e) {
    throw new Error("Database Error");
  }
};

export const getTransaction = async (
  prisma: PrismaClient,
  where: {},
  include: {}
) => {
  try {
    return await prisma.transaction.findFirst({
      where,
      include,
    });
  } catch (e) {
    throw new Error("Database Error");
  }
};

type TransactionDataT = {
  senderId: string;
  receiverId: string;
  balanceAfter: number;
  balance: number;
  balanceBefore: number;
  fee: number;
  description: string;
  type: TransferType;
  Status: TransactionStatus;
};
export const createTransaction = async (
  prisma: PrismaClient,
  data: TransactionDataT
) => {
  try {
    await prisma.transaction.create({
      data,
    });
  } catch (e) {
    throw new Error("Database Error");
  }
};
