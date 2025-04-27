import express from "express";
import routes from "./routes/index.js";
import cookieParser from "cookie-parser";
const cors = require("cors");

const app = express();
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(routes);

app.listen(3000);

export default app;
