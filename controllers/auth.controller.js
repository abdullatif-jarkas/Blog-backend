const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const {
  validateRegisterUser,
  User,
  validateLoginUser,
} = require("../models/User");
const sendEmail = require("./../utils/email.js");

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
 * @access private only logged in users
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

    //* 3. Send The Token back to the user email
    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/auth/reset-password/${resetToken}`;
    const message = `we have recieved a password reset request. Please use the below link to reset your password\n\n${resetUrl}\n\nThis reset password link will be valid only for 10 minutes.`;

    try {
      await sendEmail({
        email: user.email,
        subject: `Password change request recieved`,
        message,
      });
      res.status(200).json({
        status: "success",
        message: "password reset link sent to the user's email",
      });
    } catch (error) {
        console.log(error);
        user.passwordResetToken = undefined;
        user.passwordResetTokenExpires = undefined;
        user.save({ validateBeforeSave: false });
      
        return next(new Error("There was an error sending password reset email. Please try again later."));
    }
  }
);
module.exports.resetPasswordController = asyncHandler((req, res, next) => {});
