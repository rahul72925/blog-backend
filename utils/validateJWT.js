import jwt from "jsonwebtoken";

export const validateJWT = async (req, res, next) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "token not available",
      });
    }

    var decoded = jwt.verify(token, process.env.TOKEN_SECRET);

    if (decoded) {
      req.userId = decoded.user_data.id;
      next();
    }
  } catch (err) {
    // err
    console.log("token err", err);
    return res.status(401).json({
      success: false,
      message: "invalid token",
    });
  }
};
