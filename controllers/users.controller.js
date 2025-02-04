const asyncHandler = require("express-async-handler");
const { User, validateUpdateUser } = require("../models/User");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");
const {
  cloudinaryUploadImage,
  cloudinaryRemoveImage,
  cloudinaryRemoveMultipleImage,
} = require("../utils/cloudinary");
const { Post } = require("../models/Post");
const { Comment } = require("../models/Comment");

/**
 * @description Get All Users Profile
 * @route /api/users/profile
 * @method GET
 * @access private (only admin)
 */

module.exports.getAllUsersController = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password").populate("posts");

  res.status(200).json({
    message: "users recieved",
    users,
  });
});

/**
 * @description Get User Profile
 * @route /api/users/profile/:id
 * @method GET
 * @access public
 */

module.exports.getUserProfileController = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("-password")
    .populate("posts");

  if (!user) {
    return res.status(404).json({ message: "user not found!" });
  }

  res.status(200).json({
    message: "user data recieved",
    user,
  });
});

/**
 * @description Update User Profile
 * @route /api/users/profile/:id
 * @method PUT
 * @access private (only user himself)
 */
module.exports.updateUserProfileController = asyncHandler(async (req, res) => {
  const { error } = validateUpdateUser(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    req.body.password = bcrypt.hash(req.body.password, salt);
  }

  const updateUser = await User.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        username: req.body.username,
        password: req.body.password,
        bio: req.body.bio,
      },
      // $set will see which property is changed and update it's value
    },
    { new: true }
  ).select("-password");

  res.status(200).json({
    message: "user updated successfully",
    updateUser,
  });
});

/**
 * @description Get Users Count
 * @route /api/users/count
 * @method GET
 * @access private (only admin)
 */

module.exports.getUsersCountController = asyncHandler(async (req, res) => {
  const count = await User.countDocuments();

  res.status(200).json(count);
});

/**
 * @description Profile Photo Upload
 * @route /api/users/profile/profile-photo-upload
 * @method POST
 * @access private (only logged in user)
 */

module.exports.profilePhotoUploadController = asyncHandler(async (req, res) => {
  //? 1. Validation
  if (!req.file) {
    res.status(400).json({ message: "no file provided" });
  }

  //^ 2. Get the path of the image
  const imagePath = path.join(__dirname, `../images/${req.file.filename}`);

  //* 3. Upload to Cloudinary
  const result = await cloudinaryUploadImage(imagePath);

  //^ 4. Get the user from DB
  const user = await User.findById(req.user.id);

  //! 5. Delete the old profile photo if exists
  if (user.profilePhoto.publicId !== null) {
    await cloudinaryRemoveImage(user.profilePhoto.publicId);
  }

  //* 6. Change the profilePhoto field in the DB
  user.profilePhoto = {
    url: result.secure_url,
    publicId: result.public_id, //? we need the public_id in order to delete the image later
  };
  await user.save();

  //* 7. Send the response to the client
  res.status(200).json({
    message: "profile photo uploaded successfully",
    profilePhoto: {
      url: result.secure_url,
      publicId: result.public_id,
    },
  });

  //! 8. Remove images from the server (images folder)
  fs.unlinkSync(imagePath);
});

/**
 * @description Delete User Profile (Account)
 * @route /api/users/profile/:id
 * @method DELETE
 * @access private (only admin or user himself)
 */

module.exports.deleteUserProfileController = asyncHandler(async (req, res) => {
  //* 1. Get user from DB
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  //* 2. Get all Posts from DB
  const posts = await Post.find({ user: user._id });

  //* 3. Get the public ids from the Posts
  const publicIds = posts?.map((post) => post.image.publicId);

  //! 4. Delete all posts image from cloudinary that belong to this user
  //? check if the user posts have images
  if (publicIds?.length > 0) {
    await cloudinaryRemoveMultipleImage(publicIds);
  }

  //! 5. Delete the profile picture from clodinary
  await cloudinaryRemoveImage(user.profilePhoto.publicId);

  //! 6. Delete user posts and comments
  await Post.deleteMany({ user: user._id });
  await Comment.deleteMany({ user: user._id });

  //! 7. Delete the user himself
  await User.findByIdAndDelete(req.params.id);

  //* 8. Send response to the client
  return res.status(200).json({ message: "Account deleted successfully" });
});
