import express from "express";
import { createBlog } from "./controllers.js";
import { validateJWT } from "../../utils/index.js";

const blogRouter = express.Router();

blogRouter.post("/create-blog", validateJWT, createBlog);

export { blogRouter };
