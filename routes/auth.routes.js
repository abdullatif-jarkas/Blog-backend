const router = require('express').Router();
const { registerUserController, loginUserController, forgotPasswordController, resetPasswordController } = require('../controllers/auth.controller');



//* /api/auth/register
router.post('/register', registerUserController)

//* /api/auth/login
router.post('/login', loginUserController)

//* /api/auth/forgot-password
router.post('/forgot-password', forgotPasswordController)

//* /api/auth/reset-password:token
router.put('/reset-password/:token', resetPasswordController)

module.exports= router