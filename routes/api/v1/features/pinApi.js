const express = require("express");
const router = express.Router();
const userModel = require("../../../../models/user-model");
const pinModel = require("../../../../models/pin-model");
const isLoggedIn = require("../../../../middlewares/isLoggedIn");
const {
  savePin,
  deletePin,
  getSavedPosts,
  getSavedVideoPosts,
  getSavedImagePosts,
} = require("../../../../controller/app/pin");
const apiRouteResFormate = require("../../../../utils/ApiRoute");

router.post("/", isLoggedIn, apiRouteResFormate(savePin));

router.delete("/:id", isLoggedIn, apiRouteResFormate(deletePin));

router.get("/video", isLoggedIn, apiRouteResFormate(getSavedVideoPosts));

router.get("/image", isLoggedIn, apiRouteResFormate(getSavedImagePosts));

module.exports = router;
