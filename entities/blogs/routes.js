import express from "express";
import {
  commentOnBlog,
  createBlog,
  likeBlog,
  updateBlog,
} from "./controllers.js";
import { validateJWT } from "../../utils/index.js";

const blogRouter = express.Router();

blogRouter.post("/create-blog", validateJWT, createBlog);
blogRouter.post("/update-blog", validateJWT, updateBlog);

blogRouter.post("/like", validateJWT, likeBlog);
blogRouter.post("/comment", validateJWT, commentOnBlog);

export { blogRouter };
