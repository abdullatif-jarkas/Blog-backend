const router = require("express").Router();
const {
  registerUserController,
  loginUserController,
  forgotPasswordController,
  resetPasswordController,
  updatePasswordController,
} = require("../controllers/auth.controller");
const { verifyToken } = require("../middlewares/verifyToken");

//* /api/auth/register
router.post("/register", registerUserController);

//* /api/auth/login
router.post("/login", loginUserController);

//* /api/auth/forgot-password
router.post("/forgot-password", forgotPasswordController);

//* /api/auth/reset-password:token
router.put("/reset-password/:token", resetPasswordController);

//* /api/auth/update-password
router.put("/update-password", verifyToken, updatePasswordController);

module.exports = router;
