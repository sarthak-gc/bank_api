-- CreateEnum
CREATE TYPE "Status" AS ENUM ('UNVERIFIED', 'ACTIVE', 'CLOSED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('SAVING', 'FIXED', 'CURRENT');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('FAILED', 'PENDING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TransferType" AS ENUM ('WALLET_TRANSFER', 'DEPOSIT', 'WITHDRAWAL', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('DEPOSITED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "CreatorType" AS ENUM ('SYSTEM', 'USER');

-- CreateTable
CREATE TABLE "User" (
    "userId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "accountType" TEXT NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" "Status" NOT NULL DEFAULT 'UNVERIFIED',
    "transactionPin" INTEGER,
    "dailyTransaction" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "monthlyTransaction" DECIMAL(65,30) NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Otp" (
    "email" TEXT NOT NULL,
    "otp" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "ScheduledTransaction" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sendAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "type" "TransferType" NOT NULL,
    "Status" "TransactionStatus" NOT NULL
);

-- CreateTable
CREATE TABLE "Transaction" (
    "transactionId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "balanceBefore" DECIMAL(65,30) NOT NULL,
    "balanceAfter" DECIMAL(65,30) NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fee" DECIMAL(65,30),
    "description" TEXT,
    "type" "TransferType" NOT NULL,
    "Status" "TransactionStatus" NOT NULL
);

-- CreateTable
CREATE TABLE "Notification" (
    "notificationId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "creator" "CreatorType" NOT NULL,
    "receiverId" TEXT NOT NULL,
    "balance" DECIMAL(65,30),
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "LoginHistory" (
    "loginId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_userId_key" ON "User"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Otp_email_key" ON "Otp"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledTransaction_id_key" ON "ScheduledTransaction"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_transactionId_key" ON "Transaction"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_notificationId_key" ON "Notification"("notificationId");

-- CreateIndex
CREATE UNIQUE INDEX "LoginHistory_loginId_key" ON "LoginHistory"("loginId");

-- AddForeignKey
ALTER TABLE "Otp" ADD CONSTRAINT "Otp_email_fkey" FOREIGN KEY ("email") REFERENCES "User"("email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledTransaction" ADD CONSTRAINT "ScheduledTransaction_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledTransaction" ADD CONSTRAINT "ScheduledTransaction_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
