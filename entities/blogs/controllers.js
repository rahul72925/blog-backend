import { v4 as uuidv4 } from "uuid";
import { sql } from "../../database.js";
import jwt from "jsonwebtoken";
import { isAuthorRequesting } from "../../utils/isAuthorRequesting.js";

export const createBlog = async (req, res) => {
  try {
    const { title, tags, post, isDraft, isAllowComments } = req.body;
    console.log(req);
    const returning = await sql`
    insert into blogs (id,user_id, title, tags,post, is_draft, is_published, is_archived, created_at, updated_at, is_allow_comments) values(${uuidv4()},${
      req.userId
    },${title},${tags},${post},${isDraft},false,false, now(), now(), ${isAllowComments}) returning id;
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
      post,
      isDraft,
      isAllowComments,
      isPublished,
      isArchived,
    } = req.body;

    const returning = await sql`
  UPDATE blogs set title = ${title}, 
                  tags = ${tags} , 
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

    const userId = req.userId;

    const isAlreadyLiked =
      await sql`select * from likes where blog_id =${blogId} and user_id = ${userId};`;

    if (isAlreadyLiked.length === 0) {
      await sql`insert into likes (blog_id, user_id, created_at) values(${blogId}, ${userId}, now());`;
    } else {
      await sql`delete from likes where blog_id =${blogId} and user_id = ${userId}`;
    }

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

export const commentOnBlog = async (req, res) => {
  try {
    const commenterUserId = req.userId;
    const { blogId } = req.query;

    const { comment, parentCommentId = null } = req.body;

    const returningComment = await sql`
    insert into comments (id, comment, parent_comment_id, blog_id, user_id, created_at, updated_at, is_archived) 
    values(${uuidv4()}, ${comment}, ${parentCommentId}, ${blogId}, ${commenterUserId}, now(), now(), false) 
    returning id, comment, parent_comment_id, blog_id, user_id, created_at, (select username from users where id = user_id),(select profile_picture from users where id = user_id);
    `;

    res.status(200).json({
      success: true,
      message: "comment successfully",
      comment: returningComment[0],
    });
  } catch (error) {
    console.log("comment error", error);
    return res.status(500).json({
      success: false,
      message: "something went wrong",
      error,
    });
  }
};

export const deleteBlog = async (req, res) => {
  try {
    const userId = req.userId;
    const { blogId } = req.query;

    if (!blogId) {
      return res.status(422).json({
        success: false,
        message: "blog id not available",
      });
    }

    await sql`update blogs set is_archived = true where id =${blogId} and user_id=${userId};`;

    res.status(200).json({
      success: true,
      message: "blog deleted successfully",
    });
  } catch (error) {
    console.log("delete Blog Error", error);

    return res.status(500).json({
      success: false,
      message: "Something Went Wrong ",
      error,
    });
  }
};

export const deleteComment = async (req, res) => {
  try {
    // comment can be delete by blog author or commenter
    const userId = req.userId;

    const { blogId, commentId } = req.query;

    if (!blogData || !commentId) {
      return res.status(422).json({
        success: false,
        message: "blogId or commentId is not available",
      });
    }

    const blogData =
      await sql`select count(*) from blogs where id = ${blogId} and user_id = ${userId}`;

    if (+blogData[0].count == 0) {
      await sql`update comments set is_archived = true where id = ${commentId} and user_id = ${userId} or parent_comment_id = ${commentId} and `;
    } else {
      await sql`update comments set is_archived = true where id = ${commentId}`;
    }

    return res.status(200).json({
      success: true,
      message: "comment delete success fully",
    });
  } catch (error) {
    console.log("delete comment error", error);
    return res.status(500).json({
      success: false,
      message: "something wend wrong",
      error,
    });
  }
};

export const getBlogs = async (req, res) => {
  try {
    const {
      blogId = null,
      limit = 10,
      offset = 0,
      userId = null,
      search = null,
    } = req.query;

    const isAuthorAccessingData = isAuthorRequesting(req, userId);
    const userIdInCookie = req.userId;

    let data;
    if (blogId) {
      // send a particular blog
      data = await sql`select blg.*, uu.name, uu.username,uu.profile_picture ,
         (select count(*) from comments where blog_id = blg.id and is_archived = false) as comments_count,
         (select count(*) from likes where blog_id = blg.id)::int as likes_count 
         from blogs blg 
                  LEFT JOIN users uu on blg."user_id"  = uu.id  
                      where blg.id =${blogId} and blg.is_archived = false order by blg.created_at desc;`;
    } else if (userId && !isAuthorAccessingData) {
      // send all blogs of another user with requested user's like
      // like will only send when user is authenticate

      const userIdForFetchIsLikedSql = sql`, 
      (select count(*) from likes where blog_id = blogs.id and user_id = ${userIdInCookie})::int as is_liked`;
      data = await sql`select * ${
        userIdInCookie ? userIdForFetchIsLikedSql : sql``
      } from blogs where user_id = ${userId} and is_archived = false and is_published = true and is_draft = false order by created_at desc;`;
    } else {
      // if user is logged in and accessing there blogs
      const userIdForFetchIsLikedSql = sql`, 
      (select count(*) from likes where blog_id = blg.id and user_id = ${userIdInCookie})::int as is_liked`;

      const searchSql = search
        ? sql`and blg.title like ${"%" + search + "%"} or blg.tags::text like ${
            "%" + search + "%"
          }`
        : sql``;

      data = await sql`select blg.*, uu.name, uu.username,uu.profile_picture, 
                        (select count(*) from comments where blog_id = blg.id and is_archived = false)::int as comments_count,
                        (select count(*) from likes where blog_id = blg.id)::int as likes_count
                        ${
                          userIdInCookie ? userIdForFetchIsLikedSql : sql``
                        } from blogs blg 
                      LEFT JOIN users uu on blg."user_id"  = uu.id  
                      where blg.is_archived = false 
                            and blg.is_draft = false ${searchSql}
                      order by blg.created_at desc limit ${limit} offset  ${offset};`;
    }

    return res.status(200).json({
      success: true,
      blogs: data,
    });
  } catch (error) {
    console.log("get blogs error", error);
    return res.status(500).json({
      success: false,
      message: "Something went Wrong!",
    });
  }
};

export const getComments = async (req, res) => {
  try {
    const { blogId, parentCommentId = null } = req.query;
    if (!blogId) {
      return res.status(422).json({
        success: false,
        message: "blogId is not available",
      });
    }

    const sqlForParentCommentId = parentCommentId
      ? sql`and cc.parent_comment_id = ${parentCommentId}`
      : sql`and cc.parent_comment_id is null `;
    const data =
      await sql`select cc.*, uu.username, uu.profile_picture, (select count(*) from comments where parent_comment_id = cc.id)::int as child_comment_count from comments cc LEFT JOIN users uu on cc.user_id = uu.id where cc.blog_id = ${blogId} and cc.is_archived = false ${sqlForParentCommentId} order by cc.created_at desc;`;

    return res.status(200).json({
      success: true,
      comments: data,
    });
  } catch (error) {
    console.log("comment error", error);
    return res.status(500).json({
      success: false,
      message: "something went wrong",
    });
  }
};
