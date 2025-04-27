import { PrismaClient } from "@prisma/client";

export const getPrisma = () => {
  return new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  });
};
