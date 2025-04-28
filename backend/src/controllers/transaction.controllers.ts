import { Request, Response } from "express";
import { getPrisma } from "../utils/getPrisma";
import { TransactionStatus, TransferType } from "@prisma/client";
import {
  createTransaction,
  getAll,
  getAllScheduledPayments,
  getTransaction,
} from "../utils/transactions";
import { findUser } from "../utils/users";

export const getAllTransactions = async (req: Request, res: Response) => {
  // no infinite scrolling just pages
  const userId = req.userId;

  const prisma = getPrisma();

  const page = parseInt(req.query.page as string) || 1;
  const pageSize = 10;

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const filter = {
    OR: [{ senderId: userId }, { receiverId: userId }],
  };

  try {
    const transactions = await getAll(prisma, filter, skip, take);

    if (transactions.length === 0) {
      res.json({
        status: "success",
        message: "no transaction found",
        data: {
          transactions: [],
        },
      });
      return;
    }

    res.json({
      status: "success",
      message: "transactions retrieved",
      data: {
        transactions,
      },
    });
    return;
  } catch (e) {
    if (e instanceof Error) {
      console.error(e.message);
      res.status(500).json({
        status: "error",
        message: e.message,
      });
    }
  }
};

export const getScheduledPayments = async (req: Request, res: Response) => {
  const userId = req.userId;
  const prisma = getPrisma();

  const filter = {
    senderId: userId,
  };
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = 10;

  const skip = (page - 1) * pageSize;
  const take = pageSize;
  try {
    const transactions = await getAllScheduledPayments(
      prisma,
      filter,
      skip,
      take
    );

    if (transactions.length === 0) {
      res.json({
        status: "success",
        message: "No scheduled Payments",
        data: {
          scheduledPayments: [],
        },
      });
      return;
    }

    res.json({
      status: "success",
      message: " Scheduled Payments retrieved",
      data: {
        scheduledPayments: transactions,
      },
    });
    return;
  } catch (e) {
    if (e instanceof Error) {
      console.error(e.message);
      res.status(500).json({
        status: "error",
        message: e.message,
      });
    }
  }
};

// export const scheduledPayment = async (req: Request, res: Response) => {
//   const prisma = getPrisma();

//   const userId = req.userId;
//   const receiverId = req.params.receiverId;
//   let { balance = "", time = "", description = "", type = "" } = req.body;

//   const sendAt = new Date(time);

//   if (isNaN(sendAt.getTime())) {
//     res.status(400).json({
//       status: "error",
//       message: "Invalid Date",
//     });
//     return;
//   }
//   if (sendAt.getTime() < Date.now()) {
//     res.status(400).json({
//       status: "error",
//       message: "Invalid Date",
//     });
//     return;
//   }
//   balance = parseFloat(balance);
//   if (isNaN(balance) || balance <= 0) {
//     res.status(400).json({
//       status: "error",
//       message: "Invalid balance amount",
//     });
//     return;
//   }

//   const receiverExists = await prisma.user.findUnique({
//     where: { userId: receiverId },
//   });

//   if (!receiverExists) {
//     res.status(400).json({
//       status: "error",
//       message: "Receiver not found",
//     });
//     return;
//   }

//   const user = await findUser(prisma, { userId });

//   if (!user) {
//     return;
//   }
//   const userBalance = Number(user.balance);
//   await prisma.$transaction(async () => {
//     let fee = 0;
//     if (balance > 10000) {
//       fee = 0.0001 * balance;
//     }

//     if (balance + fee > userBalance) {
//       res.json({
//         status: "error",
//         message: "Insufficient balance",
//       });
//       return;
//     }

//     const balanceAfter = userBalance - balance - fee;

//     await prisma.scheduledTransaction.create({
//       data: {
//         senderId: userId,
//         receiverId,
//         balance: parseFloat(balance),
//         sendAt: new Date(sendAt),
//         description,
//         type: TransferType.DEPOSIT,
//         Status: TransactionStatus.PENDING,
//       },
//     });
//   });

//   res.json({
//     status: "success",
//     message: "Transaction Scheduled successfully",
//   });
//   return;
// };

export const getTransactionDetails = async (req: Request, res: Response) => {
  const userId = req.userId;
  const transactionId = req.params.transactionId;

  const prisma = getPrisma();

  const filter = {
    transactionId,
  };
  const include = {
    receiver: {
      select: {
        username: true,
        firstName: true,
        lastName: true,
      },
    },
    sender: {
      select: {
        username: true,
        firstName: true,
        lastName: true,
      },
    },
  };
  try {
    const transaction = await getTransaction(prisma, filter, include);

    if (!transaction) {
      res.status(400).json({
        status: "error",
        message: "No transaction found",
      });
      return;
    }

    if (
      !(transaction.senderId === userId && transaction.receiverId === userId)
    ) {
      res.status(403).json({
        status: "error",
        message: "Unauthorized Access",
      });
      return;
    }

    res.json({
      status: "success",
      message: "Transaction detailed retrieved",
      data: {
        transaction,
      },
    });

    return;
  } catch (e) {
    if (e instanceof Error) {
      console.error(e.message);
      res.status(500).json({
        status: "error",
        message: e.message,
      });
    }
  }
};

export const transferBalance = async (req: Request, res: Response) => {
  const userId = req.userId;

  const { receiverId, balance = 0, description = "", type = "" } = req.body;

  if (userId === receiverId || !receiverId) {
    res
      .status(400)
      .json({ status: "error", message: "Invalid receiver or balance." });
    return;
  }
  if (balance < 100) {
    res.status(400).json({ error: "Min of 100 should be transferred" });
    return;
  }

  const prisma = getPrisma();

  const filter = {
    userId,
  };
  try {
    const user = await findUser(prisma, filter);

    if (!user) {
      return;
    }

    await prisma.$transaction(async () => {
      const balanceBefore = Number(user.balance);

      let fee = 0;
      if (balance > 10000) {
        fee = 0.0001 * balance;
      }

      if (balance + fee > balanceBefore) {
        res.json({
          status: "error",
          message: "Insufficient balance",
        });
        return;
      }

      const balanceAfter = balanceBefore - balance - fee;

      let transferType =
        type === "wallet"
          ? TransferType.WALLET_TRANSFER
          : TransferType.BANK_TRANSFER;

      const data = {
        senderId: userId,
        receiverId,
        balanceAfter,
        balance,
        balanceBefore,
        fee,
        description,
        type: transferType,
        Status: TransactionStatus.COMPLETED,
      };

      await createTransaction(prisma, data);

      await prisma.user.update({
        where: { userId },
        data: { balance: balanceAfter },
      });
      await prisma.user.update({
        where: { userId: receiverId },
        data: {
          balance: { increment: balance },
        },
      });

      res.json("transferBalance");
      return;
    });
  } catch (e) {
    if (e instanceof Error) {
      console.error(e.message);
      res.status(500).json({
        status: "error",
        message: e.message,
      });
    }
  }
};
