const express = require("express");
const router = express.Router();
const isLoggedIn = require("../../../../middlewares/isLoggedIn.js");
const {
  editprofpic,
  updateAccountSettings,
  blockOtherUser,
  unblockUser,
  deleteAccount,
  followOtherUser,
  unfollowOtherUser,
  followersList,
  getUserById,
  getUserConnectionsById,
  getLoggedInUserConnections,
  getBlockedUser,
} = require("../../../../controller/app/user.js");
const upload = require("../../../../config/multerConfig.js");
const apiRouteResFormate = require("../../../../utils/ApiRoute");

// user profile features

router.delete("/", isLoggedIn, apiRouteResFormate(deleteAccount));

router.get(
  "/connection/:id",
  isLoggedIn,
  apiRouteResFormate(getUserConnectionsById),
);

router.get(
  "/connection",
  isLoggedIn,
  apiRouteResFormate(getLoggedInUserConnections),
);

router.patch("/block", isLoggedIn, apiRouteResFormate(blockOtherUser));

router.patch("/unblock", isLoggedIn, apiRouteResFormate(unblockUser));

router.get("/block", isLoggedIn, apiRouteResFormate(getBlockedUser));

router.get("/:id", isLoggedIn, apiRouteResFormate(getUserById));

router.patch(
  "/profile-pic",
  isLoggedIn,
  upload.single("profileImage"),
  apiRouteResFormate(editprofpic),
);

//update user
router.patch("/update", isLoggedIn, apiRouteResFormate(updateAccountSettings));

router.patch("/follow", isLoggedIn, apiRouteResFormate(followOtherUser));

router.patch("/unfollow", isLoggedIn, apiRouteResFormate(unfollowOtherUser));

module.exports = router;
