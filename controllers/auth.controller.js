const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const {
  validateRegisterUser,
  User,
  validateLoginUser,
} = require("../models/User");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

/**
 * @description Register New User
 * @route /api/auth/register
 * @method POST
 * @access public
 */

module.exports.registerUserController = asyncHandler(async (req, res) => {
  //? validation
  const { error } = validateRegisterUser(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
    // state code 400 means bad request, the problem is from the user not the server, the data is invalid.
  }
  let user = await User.findOne({ email: req.body.email });

  //? is user already existing
  if (user) {
    return res.status(400).json({ message: "user already exists" });
  }

  //& Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  //* new user and save it to DB
  user = new User({
    username: req.body.username,
    email: req.body.email,
    password: hashedPassword,
  });

  await user.save();

  //TODO: - sending email (verify account)

  //* send Response to the client
  res.status(201).json({ message: "Registered successfully" });
});

/**
 * @description Login User
 * @route /api/auth/login
 * @method POST
 * @access public
 */

module.exports.loginUserController = asyncHandler(async (req, res) => {
  //? 1. validation
  const { error } = validateLoginUser(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
    // state code 400 means bad request, the problem is from the user not the server, the data is invalid.
  }

  //? 2. is user not exiting
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(400).json({ message: "invalid email or password" });
  }

  //? 3. check the password
  const isPasswordMatch = await bcrypt.compare(
    req.body.password,
    user.password
  );
  if (!isPasswordMatch) {
    return res.status(400).json({ message: "invalid email or password" });
  }

  //TODO: - sending email (verify account if not verified)

  //& 4. generate token (jwt)
  const token = user.generateAuthToken();

  //* send Response to the client
  res.status(200).json({
    message: "logged in successfully",
    username: user.username,
    _id: user._id,
    isAdmin: user.isAdmin,
    profilePhoto: user.profilePhoto,
    token,
  });
});

/**
 * @description forgot password
 * @route /api/auth/forgot-password
 * @method POST
 * @access public
 */

module.exports.forgotPasswordController = asyncHandler(
  async (req, res, next) => {
    //* 1. Get user based on posted email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      const error = new Error("we could not find the user with this email");
      next(error);
    }

    //* 2. Generate a random reset token

    const resetToken = user.generateResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Define Email Options
    const emailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "🔐 Reset Your Password",
      html: `
      <div style="background-color: #f4f4f4; padding: 40px; font-family: Arial, sans-serif; text-align: center;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); max-width: 500px; margin: auto;">
          <h2 style="color: #333;">🔑 Password Reset Request</h2>
          <p style="color: #555; font-size: 16px;">We received a request to reset your password. Use the code below to proceed:</p>
    
          <div style="background-color: #007bff; color: white; padding: 15px; border-radius: 5px; display: inline-block; font-size: 22px; font-weight: bold; letter-spacing: 2px; margin: 15px 0;">
            ${resetToken}
          </div>
    
          <p style="color: #777; font-size: 14px;">This code is valid for <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>
    
          <hr style="border: 0; height: 1px; background: #ddd; margin: 20px 0;">
    
          <p style="color: #444; font-size: 14px;"><strong>How to use this code:</strong></p>
          <p style="color: #555; font-size: 14px; line-height: 1.6;">
            1️⃣ Copy the code above.<br>
            2️⃣ Go to the password reset page.<br>
            3️⃣ Paste the code and set your new password.
          </p>
    
          <p style="color: #888; font-size: 13px; margin-top: 20px;">If you need help, contact our support team.</p>
        </div>
      </div>
      `,
    };

    await transporter.sendMail(emailOptions, (error, success) => {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + success.response);
      }
    });

    res.json({
      status: "success",
      message: "Email sent successfully",
    });
  }
);

/**
 * @description reset password
 * @route /api/auth/reset-password:token
 * @method PUT
 * @access public
 */
module.exports.resetPasswordController = asyncHandler(
  async (req, res, next) => {
    const token = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetTokenExpires: {
        $gt: Date.now(),
      },
    });
    if (!user) {
      const error = new Error(`Token is invalid or has expired!`);
      next(error);
    }
    if (req.body.password !== req.body.confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match!" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);

    user.confirmPassword = req.body.confirmPassword;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    user.passwordChangedAt = Date.now();

    await user.save();

    //* Login the user

    const loginToken = user.generateAuthToken();

    res.status(200).json({
      message: "logged in successfully",
      _id: user._id,
      isAdmin: user.isAdmin,
      profilePhoto: user.profilePhoto,
      token: loginToken,
    });
  }
);

/**
 * @description update password
 * @route /api/auth/update-password
 * @method PUT
 * @access private (only logged in user)
 */
module.exports.updatePasswordController = asyncHandler(
  async (req, res, next) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        status: "error",
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: "error",
        message: "New password and confirmation password do not match",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: "error",
        message: "Incorrect old password",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      status: "success",
      data: {
        user: {
          id: user._id,
          message: "Password updated successfully",
        },
      },
    });
  }
);
