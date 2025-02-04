const mongoose = require("mongoose");
const joi = require("joi");

const CategorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Category = mongoose.model("Category", CategorySchema);

//? VALIDATIONS FUNCTIONS

//? 1. validate create Category
function validateCreateCategory(obj) {
  const schema = joi.object({
    title: joi.string().trim().required().label("Title"),
  });
  return schema.validate(obj);
}

module.exports = {
  Category,
  validateCreateCategory
};
