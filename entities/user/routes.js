import express from "express";
import { getUser } from "./controller.js";
import jwt from "jsonwebtoken";

const userRouter = express.Router();

userRouter.get(
  "/",
  async (req, res, next) => {
    const { token } = req.cookies;

    if (!token) {
      next();
      return;
    }

    var decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    if (decoded) {
      req.userId = decoded.user_data.id;
    }
    next();
  },
  getUser
);

export { userRouter };
