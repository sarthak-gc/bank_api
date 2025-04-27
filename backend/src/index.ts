import express from "express";
import routes from "./routes/index.js";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin:
      process.env.ENVIRONMENT === "production" ? process.env.FRONTEND_URL : "*",
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(routes);
app.listen(3000);

export default app;
