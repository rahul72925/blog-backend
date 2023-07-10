import express from "express";
import { sql } from "./database.js";
import { authRouter, blogRouter, userRouter } from "./entities/index.js";
import bodyParser from "body-parser";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/blog", blogRouter);
app.use("/api/user", userRouter);

app.listen(4002, () => {
  console.log("server connected");
});
