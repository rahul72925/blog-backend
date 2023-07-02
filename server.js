import express from "express";
import { sql } from "./database.js";
import { authRouter, blogRouter } from "./entities/index.js";
import bodyParser from "body-parser";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/blog", blogRouter);

app.listen(4002, () => {
  console.log("server connected");
});
