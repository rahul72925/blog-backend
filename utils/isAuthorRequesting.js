import jwt from "jsonwebtoken";

export const isAuthorRequesting = (req, userId) => {
  let userIdInCookie;

  const { token } = req.cookies;
  if (token) {
    var decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    userIdInCookie = decoded.user_data.id;
  }

  return userIdInCookie == userId;
};
