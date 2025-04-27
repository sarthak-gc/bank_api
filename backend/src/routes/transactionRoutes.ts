import express from "express";
import {
  getAllTransactions,
  getScheduledPayments,
  scheduledPayment,
  qrPayments,
  getTransactionDetails,
  transferBalance,
} from "../controllers/transaction.controllers";

const transactionRoutes = express.Router();

transactionRoutes.get("/all", getAllTransactions);
transactionRoutes.get("/scheduled-payments", getScheduledPayments);
transactionRoutes.post("/scheduled-payment", scheduledPayment);
transactionRoutes.post("/qr-payments", qrPayments);
transactionRoutes.get("/download", getTransactionDetails);
transactionRoutes.post("/transfer/:userId/balance", transferBalance);
export default transactionRoutes;
