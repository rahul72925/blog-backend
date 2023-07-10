import validator from "validator";
import { sql } from "../../database.js";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";

export const createUser = async (req, res) => {
  try {
    const { username, password, email } = req.body;
    console.log(username, password, email);
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Email",
      });
    }

    if (!validator.matches(username, "^[a-zA-Z0-9_.-]*$")) {
      return res.status(400).json({
        success: false,
        message: "Invalid Username",
      });
    }

    const isUsernameAlreadyAvailable =
      await sql`select count(*) from users where username = ${username};`;
    const isEmailAlreadyAvailable =
      await sql`select count(*) from users where email = ${email};`;

    if (
      +isUsernameAlreadyAvailable[0].count !== 0 ||
      +isEmailAlreadyAvailable[0].count !== 0
    ) {
      return res.status(400).json({
        success: false,
        message: `${
          isUsernameAlreadyAvailable !== 0 ? "Username" : "Email"
        } already in use`,
      });
    }

    // Hash the Password using bcrypt library and store it into database
    let hashedPassword;
    bcrypt.hash(password, 10, async function (err, hash) {
      if (err) {
        console.log("error in generating hash", err);
        return res.status(500).json({
          success: false,
          message: err,
        });
      }

      hashedPassword = hash;

      await sql`INSERT INTO users (id, username,name,  email, password,registration_type, created_at, updated_at) values(${uuidv4()}, ${username}, ${""}, ${email}, ${hashedPassword}, ${"username_password"}, now(), now()) returning id;`;

      // [ { id: '6ba105c0-a5ac-4968-94b9-8de2b10f9634' } ]
      return res.status(200).json({
        success: true,
        message: "User successfully registered",
      });
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({
      success: false,
      message: error,
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if ((!username && !email) || !password) {
      let message = !username ? "username" : !password ? "password" : "email";
      return res.status(400).json({
        success: false,
        message: `${message} not available`,
      });
    }

    if (email && !validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Email not valid",
      });
    }

    // const user = await sql`select * from users where ${
    //   username ? `username = ${username}` : `email = ${email}`
    // };`;
    let users = username
      ? await sql`select * from users where username = ${username}`
      : await sql`select * from user where email=${email}`;

    if (users.length == 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const [user] = users;

    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        console.log("password error");
        return res.status(500).json({
          success: false,
          message: err,
        });
      }
      if (!result) {
        return res.status(406).json({
          success: false,
          message: "Incorrect password",
        });
      }
      const { id, username, name, profile_picture, email } = user;
      const token = jwt.sign(
        {
          user_data: { id, username, name, profile_picture, email },
          iat: Math.floor(Date.now() / 1000) - 30,
        },
        process.env.TOKEN_SECRET,
        { expiresIn: 356 * 60 * 60 * 24 }
      );

      res.cookie("token", token, {
        httpOnly: true,
        sameSite: "strict",
        // path: "/",
        maxAge: 30 * 24 * 3600 * 1000,
      });

      res.status(200).json({
        success: true,
        message: "User login",
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          token,
        },
      });
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({
      success: false,
      message: error,
    });
  }
};

export const logoutUser = async (req, res) => {
  try {
    res.clearCookie("token");
    res.status(200).json({
      success: true,
      message: "Logout success fully",
    });
  } catch (error) {
    console.log("logout error", error);
    return res.status(500).json({
      success: false,
      message: "something went wrong",
      error,
    });
  }
};
