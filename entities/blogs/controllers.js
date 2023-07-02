import { v4 as uuidv4 } from "uuid";
import { sql } from "../../database.js";

export const createBlog = async (req, res) => {
  try {
    const { title, tags, categories, post, isDraft, isAllowComments } =
      req.body;

    const returning = await sql`
    insert into blogs (id,user_id,likes, title, tags,categories,post, is_draft, is_published, is_archived, created_at, updated_at, is_allow_comments) values(${uuidv4()},${
      req.userId
    },0,${title},${tags},${categories},${post},${isDraft},false,false, now(), now(), ${isAllowComments}) returning id;
    `;

    return res.status(200).json({
      success: true,
      message: "blog created successfully",
      data: returning[0],
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({
      success: false,
      message: "something went wrong",
    });
  }
};

export const updateBlog = async (req, res) => {
  try {
    const userId = req.userId;
    const blogId = req.query.blogId;

    const {
      title,
      tags,
      categories,
      post,
      isDraft,
      isAllowComments,
      isPublished,
      isArchived,
    } = req.body;

    const returning = await sql`
  UPDATE blogs set title = ${title}, 
                  tags = ${tags} , 
                  categories = ${categories}, 
                  post = ${post}, 
                  is_draft = ${isDraft}, 
                  is_allow_comments = ${isAllowComments},
                  is_published = ${isPublished},
                  is_archived = ${isArchived} where id = ${blogId} and user_id = ${userId};
  `;

    res.status(200).json({
      success: true,
      message: "Updated successfully",
    });
  } catch (error) {
    console.log("update blog error", error);

    res.status(500).json({
      success: false,
      message: error,
    });
  }
};

export const likeBlog = async (req, res) => {
  try {
    const { blogId } = req.query;

    await sql`update blogs set likes = likes + 1 where id = ${blogId};`;

    return res.status(200).json({
      success: true,
      message: "Like successfully",
    });
  } catch (error) {
    console.log("like blog error", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
};
