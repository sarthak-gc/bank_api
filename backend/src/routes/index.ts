import express from "express";
import userRoutes from "./userRoutes.js";
import transactionRoutes from "./transactionRoutes.js";

const routes = express.Router();

routes.use("/user", userRoutes);
routes.use("/transactions", transactionRoutes);

export default routes;
