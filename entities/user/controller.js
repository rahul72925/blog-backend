import { sql } from "../../database.js";
import { isAuthorRequesting } from "../../utils/isAuthorRequesting.js";

export const getUser = async (req, res) => {
  try {
    const { userId, withBlogs = false } = req.query;

    const isAuthorAccessingData = isAuthorRequesting(req, userId);
    const userIdInCookie = req.userId; // isUserAuthorized

    // send draft data for author user (person accessing there own blogs)
    if (!userId) {
      return res.status(422).json({
        success: false,
        message: "userId not available",
      });
    }

    const userData =
      await sql`select id, name,username, profile_picture, email, (select count(*) from blogs where user_id = ${userId} and is_archived = false)::int as total_blogs from users where id = ${userId}`;

    let blogs = null;

    const sqlForDraftBlogs = userIdInCookie
      ? sql``
      : sql`and is_draft = false and is_published = true`;
    const sqlForLiked =
      userIdInCookie && isAuthorAccessingData
        ? sql`, 
    (select count(*) from likes where blog_id = blg.id and user_id = ${userIdInCookie})::int as is_liked `
        : sql``;

    if (withBlogs) {
      blogs = await sql`select blg.*, uu.name, uu.username,uu.profile_picture, 
      (select count(*) from comments where blog_id = blg.id and is_archived = false)::int as comments_count, 
      (select count(*) from likes where blog_id = blg.id)::int as likes_count 
      ${sqlForLiked}
      from blogs blg 
      LEFT JOIN users uu on blg."user_id"  = uu.id  
      where blg.is_archived = false and uu.id = ${userId} ${sqlForDraftBlogs} order by blg.created_at desc`;
    }

    res.status(200).json({
      success: true,
      message: "data get successfully",
      data: { userData, ...(withBlogs && { blogs }) },
    });
  } catch (error) {
    console.log("user get error", error);
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
      error,
    });
  }
};
