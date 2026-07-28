const express = require("express");
const router = express.Router();
const {
  signupUser,
  loginUser,
  logoutUser,
  verifyOtp,
  sendOTP,
  getEmailForVerification,
  getAccessToken,
  sendLoggedInUser,
} = require("../../../../controller/auth/localController.js");
const loginLimiter = require("../../../../middlewares/loginRequestLimiter.js");
const registerLimiter = require("../../../../middlewares/registerRequestLimiter.js");
const apiRouteResFormate = require("../../../../utils/ApiRoute");
const isLoggedIn = require("../../../../middlewares/isLoggedIn.js");

// for authentication & authorization
router.post("/signup", apiRouteResFormate(signupUser));

router.post("/login", apiRouteResFormate(loginUser));

// send loggedIn in user to frontend
router.get("/me", isLoggedIn, apiRouteResFormate(sendLoggedInUser));

router.post("/get-otp", apiRouteResFormate(sendOTP));

router.post("/verify-otp", apiRouteResFormate(verifyOtp));

router.post("/logout", apiRouteResFormate(logoutUser));

module.exports = router;
