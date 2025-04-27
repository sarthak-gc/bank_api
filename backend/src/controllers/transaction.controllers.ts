import { Request, Response } from "express";

export const getAllTransactions = async (req: Request, res: Response) => {
  res.json("all");
  return;
};
export const getScheduledPayments = async (req: Request, res: Response) => {
  res.json("scheduledPayments");
  return;
};
export const scheduledPayment = async (req: Request, res: Response) => {
  res.json("scheduledPayment");
  return;
};
export const qrPayments = async (req: Request, res: Response) => {
  res.json("qrPayments");
  return;
};

export const getTransactionDetails = async (req: Request, res: Response) => {
  res.json("download");
  return;
};
export const transferBalance = async (req: Request, res: Response) => {
  res.json("transferBalance");
  return;
};
