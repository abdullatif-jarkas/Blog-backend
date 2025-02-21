const asyncHandler = require("express-async-handler");
const { validateCreateCategory, Category } = require("../models/Category");

/**
 * @description Create new Category
 * @route /api/categories/
 * @method POST
 * @access private (only admin)
 */
module.exports.createCategoryController = asyncHandler(async (req, res) => {
  const { error } = validateCreateCategory(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  const category = await Category.create({
    title: req.body.title,
    user: req.user.id,
  });

  res.status(201).json({ status: "success", category });
});

/**
 * @description Get all Categories
 * @route /api/categories/
 * @method GET
 * @access public
 */
module.exports.getAllCategoriesController = asyncHandler(async (req, res) => {
  const categories = await Category.find();
  res.status(200).json({ status: "success", categories });
});

/**
 * @description Delete Category
 * @route /api/categories/:id
 * @method DELETE
 * @access private (only admin)
 */
module.exports.deleteCategoryController = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res
      .status(404)
      .json({ status: "failes", message: "category not found" });
  }

  await Category.findByIdAndDelete(req.params.id);
  res
    .status(200)
    .json({
      status: "success",
      message: "category deleted successfully",
      categoryId: category._id,
    });
});
