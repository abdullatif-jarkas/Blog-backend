const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const {
  validateRegisterUser,
  User,
  validateLoginUser,
} = require("../models/User");

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
