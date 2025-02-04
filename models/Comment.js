const mongoose = require("mongoose");
const joi = require("joi");

const CommentSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.ObjectId,
      ref: "Post",
      required: true,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Comment = mongoose.model("Comment", CommentSchema);

//? VALIDATIONS FUNCTIONS

//? 1. validate create comment
function validateCreateComment(obj) {
  const schema = joi.object({
    postId: joi.string().required().label("Post ID"),
    text: joi.string().trim().required().label("Text"),
  });
  return schema.validate(obj);
}

//? 2. validate update comment
function validateUpdateComment(obj) {
  const schema = joi.object({
    text: joi.string().trim().required(),
  });
  return schema.validate(obj);
}

module.exports = {
  Comment,
  validateCreateComment,
  validateUpdateComment,
};
