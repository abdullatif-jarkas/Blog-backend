const {
  createCategoryController,
  getAllCategoriesController,
  deleteCategoryController,
} = require("../controllers/categories.controller");
const validateObjectId = require("../middlewares/validateObjectId");
const { verifyTokenAndAdmin } = require("../middlewares/verifyToken");

const router = require("express").Router();

//* /api/categories/
router
  .route("/")
  .post(verifyTokenAndAdmin, createCategoryController)
  .get(getAllCategoriesController);

//* /api/categories/:id
router
  .route("/:id")
  .delete(validateObjectId, verifyTokenAndAdmin, deleteCategoryController);

module.exports = router;
