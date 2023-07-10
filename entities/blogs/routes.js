import express from "express";
import {
  commentOnBlog,
  createBlog,
  deleteBlog,
  deleteComment,
  getBlogs,
  getComments,
  likeBlog,
  updateBlog,
} from "./controllers.js";
import { validateJWT } from "../../utils/index.js";
import jwt from "jsonwebtoken";

const blogRouter = express.Router();

blogRouter.post("/create-blog", validateJWT, createBlog);
blogRouter.post("/update-blog", validateJWT, updateBlog);

blogRouter.post("/like", validateJWT, likeBlog);
blogRouter.post("/comment", validateJWT, commentOnBlog);

blogRouter.delete("/", validateJWT, deleteBlog);
blogRouter.delete("/comment/delete", validateJWT, deleteComment);

blogRouter.get(
  "/get",
  async (req, res, next) => {
    try {
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
    } catch (err) {
      console.log("blog get error", err);
    }
  },
  getBlogs
);
blogRouter.get("/comments/get", getComments);

export { blogRouter };
