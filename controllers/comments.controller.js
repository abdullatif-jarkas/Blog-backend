const asyncHandler = require("express-async-handler");
const {
  validateCreateComment,
  Comment,
  validateUpdateComment,
} = require("../models/Comment");
const { User } = require("../models/User");
const { Post } = require("../models/Post"); // Import Post model if needed for validation

/**
 * @description Create new comment
 * @route /api/comments
 * @method POST
 * @access private (only logged in users)
 */
module.exports.createCommentController = asyncHandler(async (req, res) => {
  // Validation
  const { error } = validateCreateComment(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  // Check if user exists
  const profile = await User.findById(req.user.id);
  if (!profile) {
    return res.status(404).json({ message: "User not found" });
  }

  // Optional: Check if post exists (if required)
  const post = await Post.findById(req.body.postId);
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  // Create comment
  const comment = await Comment.create({
    postId: req.body.postId,
    text: req.body.text,
    user: req.user.id,
    username: profile.username,
  });

  // Send 201 status for successful creation
  res.status(201).json({ status: "success", comment });
});

/**
 * @description Get all comments
 * @route /api/comments
 * @method GET
 * @access private (only admin)
 */

module.exports.getAllCommentsController = asyncHandler(async (req, res) => {
  const comments = await Comment.find().populate("user");
  res.status(200).json({ status: "success", comments });
});

/**
 * @description Delete comment
 * @route /api/comments/:id
 * @method DELETE
 * @access private (only admin or owner of the comment)
 */

module.exports.deleteCommentController = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    return res.status(404).json({ message: "comment not found" });
  }

  if (req.user.isAdmin || req.user.id === comment.user.toString()) {
    await Comment.findOneAndDelete(req.params.id);
    res
      .status(200)
      .json({ status: "success", message: "comment has been deleted" });
  } else {
    res
      .status(403)
      .json({ status: "failed", message: "access denied, not allowed" });
  }
});

/**
 * @description Update comment
 * @route /api/comments/:id
 * @method PUT
 * @access private (only owner of the comment)
 */

module.exports.updateCommentController = asyncHandler(async (req, res) => {
  // Validation
  const { error } = validateUpdateComment(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    return res.status(400).json({ message: "comment not found" });
  }

  if (req.user.id !== comment.user.toString()) {
    return res
      .status(403)
      .json({
        message: "access denied, only user himself can edit this comment",
      });
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        text: req.body.text,
      },
    },
    {
      new: true,
    }
  );

  return res.status(200).json({ status: "success", message: "comment updated successfully", updatedComment });
});
