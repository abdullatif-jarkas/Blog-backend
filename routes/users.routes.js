const {
  getAllUsersController,
  getUserProfileController,
  updateUserProfileController,
  getUsersCountController,
  profilePhotoUploadController,
  deleteUserProfileController,
} = require("../controllers/users.controller");
const {
  verifyTokenAndAdmin,
  verifyTokenAndOnlyUser,
  verifyToken,
  verifyTokenAndAuthorization,
} = require("../middlewares/verifyToken");
const validateObjectId = require("../middlewares/validateObjectId");
const photoUpload = require("../middlewares/photoUpload");

const router = require("express").Router();

// api/users/profile
router.route("/profile").get(verifyTokenAndAdmin, getAllUsersController);

// api/users/profile/:id
router
  .route("/profile/:id")
  .get(validateObjectId, getUserProfileController)
  .put(validateObjectId, verifyTokenAndOnlyUser, updateUserProfileController)
  .delete(
    validateObjectId,
    verifyTokenAndAuthorization,
    deleteUserProfileController
  );

// api/users/profile/profile-photo-upload
router
  .route("/profile/profile-photo-upload")
  .post(verifyToken, photoUpload.single("image"), profilePhotoUploadController);

// api/users/count
router.route("/count").get(verifyTokenAndAdmin, getUsersCountController);

module.exports = router;
