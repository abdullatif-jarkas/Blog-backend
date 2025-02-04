const {
  createCommentController,
  getAllCommentsController,
  deleteCommentController,
  updateCommentController,
} = require("../controllers/comments.controller");
const validateObjectId = require("../middlewares/validateObjectId");
const {
  verifyToken,
  verifyTokenAndAdmin,
} = require("../middlewares/verifyToken");

const router = require("express").Router();

//* /api/comments
router
  .route("/")
  .post(verifyToken, createCommentController)
  .get(verifyTokenAndAdmin, getAllCommentsController);

//* /api/comments/:id
router
  .route("/:id")
  .delete(validateObjectId, verifyToken, deleteCommentController)
  .put(validateObjectId, verifyToken, updateCommentController);

module.exports = router;
