import express from "express";
import { sql } from "./database.js";
import { authRouter } from "./entities/index.js";
import bodyParser from "body-parser";
import cors from "cors";
const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use("/api/auth", authRouter);

app.listen(4002, () => {
  console.log("server connected");
});
