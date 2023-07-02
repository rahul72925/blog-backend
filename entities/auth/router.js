import express from "express";
import { createUser, loginUser } from "./controllers.js";

const authRouter = express.Router();

authRouter.post("/register", createUser);
authRouter.post("/login", loginUser);

export { authRouter };
