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
