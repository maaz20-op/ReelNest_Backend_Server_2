const userModel = require("../../models/user-model");
const postModel = require("../../models/post-model");
const pinModel = require("../../models/pin-model");
const cloudinary = require("../../config/cloudinary");
const upload = require("../../config/multerConfig");
const mongoose = require("mongoose");
const redis = require("../../config/redisClient");

module.exports.editprofpic = async function (req) {
  try {
    const user = await userModel.findById(req?.user?._id);
    if (!user) {
      throw new Error("Failed to Upload Profile Image");
    }

    user.profileImage = req?.file?.path;
    await user.save();

    return [user?.profileImage];
  } catch (err) {
    throw err;
  }
};

module.exports.updateAccountSettings = async function (req) {
  try {
    let dbuser = await userModel.findById(req.user?._id);
    let updatedData = {};
    console.log(req.body);
    for (let key in req.body) {
      const newValue = req.body[key];
      const oldValue = dbuser[key];

      if (newValue && newValue !== oldValue) {
        updatedData[key] = newValue; // build updated data
      }
    }

    if (Object.keys(updatedData).length === 0)
      throw new Error("You did'nt make any Changes!");
    const updatedUser = await userModel.findByIdAndUpdate(
      req.user?._id,
      updatedData,
      { new: true },
    );
    console.log(updatedUser);
    console.log(updatedUser.accountVisibility);
    return [updatedUser];
  } catch (err) {
    throw err;
  }
};

module.exports.blockOtherUser = async function (req) {
  try {
    // blocked user
    let blockedUser = await userModel.findById(req.body.id);
    if (!blockedUser) {
      throw new Error("error", "Error to Block the User");
    }
    // logged in user
    let user = await userModel.findById(req.user._id);

    /* remove blocked user form following list*/
    if (
      user.following.includes(blockedUser._id) ||
      blockedUser.followers.includes(user._id)
    ) {
      blockedUser.followers = blockedUser.followers.filter((id) => {
        return id.toString() !== user._id.toString();
      });

      user.following = user.following.filter((id) => {
        return id.toString() !== blockedUser._id.toString();
      });
    }
    if (!user.blockedUserId.includes(blockedUser?._id)) {
      user.blockedUserId.push(blockedUser._id);
      blockedUser.blockedBy.push(user._id);
      await Promise.all([user.save(), blockedUser.save()]);
    }

    return [blockedUser];
  } catch (err) {
    throw err;
  }
};

module.exports.getBlockedUser = async function (req) {
  try {
    const user = await userModel
      .findById(req.user?._id)
      .populate("blockedUserId", "fullname _id profileImage username");
    console.log("hihhi", user.blockedUserId);
    return [user?.blockedUserId];
  } catch (err) {
    throw err;
  }
};

module.exports.unblockUser = async function (req) {
  try {
    let blockedUser = await userModel.findById(req.body?.id);

    if (!blockedUser) return;

    let user = await userModel.findById(req.user?._id);

    user.blockedUserId = user.blockedUserId.filter((id) => {
      return id.toString() !== blockedUser._id.toString();
    });
    blockedUser.blockedBy = blockedUser.blockedBy.filter((id) => {
      return id.toString() !== user.id.toString();
    });

    await Promise.all([user.save(), blockedUser.save()]);

    return [blockedUser, user];
  } catch (err) {
    throw err;
  }
};

module.exports.deleteAccount = async function (req) {
  // start transaction for atomicity in Datsabase and keep db consistent
  try {
    let deletedUser = await userModel.findOne({ _id: req.user?.id });

    await Promise.all([
      userModel.findByIdAndDelete(req.user.id),
      postModel.findOneAndDelete({ user: req.user.id }),
      pinModel.findOneAndDelete({ createdBy: req.user.id }),
    ]);

    return [deletedUser];
  } catch (err) {
    throw new Error("Error, can't delete Acccount Try Again!");
  }
};

module.exports.followOtherUser = async function (req) {
  try {
    let followedUser = await userModel.findById(req.body.id);
    console.log(req.body);
    let loggedInUser = await userModel.findById(req.user?._id);

    if (
      !followedUser ||
      !loggedInUser ||
      followedUser?._id.toString() === loggedInUser?._id.toString()
    ) {
      throw new Error("Something went wrong!");
    }

    if (
      !followedUser.followers.includes(loggedInUser._id.toString()) &&
      !loggedInUser.following.includes(followedUser._id.toString())
    ) {
      followedUser.followers.push(loggedInUser._id);
      loggedInUser.following.push(followedUser._id);
      await Promise.all([followedUser.save(), loggedInUser.save()]);
    }
    let followingCount = followedUser.following.length;

    let followersCount = followedUser.followers.length;
    console.log("user followed successfully");
    return [followingCount, followersCount];
  } catch (err) {
    throw err;
  }
};

module.exports.unfollowOtherUser = async function (req) {
  try {
    // loggedIn User
    let user = await userModel.findById(req.user?._id);

    let followingUser = await userModel.findById(req.body.id);
    console.log(followingUser);

    if (!followingUser || !user) {
      throw new Error("No user Found");
    }

    /* delete user id from loggedIn User ki following List */
    user.following = user.following.filter((id) => {
      return id.toString() !== followingUser._id.toString();
    });

    // removing logged In user from followers list of other user
    followingUser.followers = followingUser.followers.filter((id) => {
      return id.toString() !== user._id.toString();
    });

    await Promise.all([followingUser.save(), user.save()]);
    console.log("follow user found");
    return [followingUser];
  } catch (err) {
    throw err;
  }
};

module.exports.getUserConnectionsById = async function (req) {
  try {
    const userIdStr = req?.params?.id;

    if (!userIdStr) throw Error("Not Valid Request");

    const userId = new mongoose.Types.ObjectId(userIdStr);
    const userfollowers = await userModel.aggregate([
      {
        $match: {
          _id: userId,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "followers",
          foreignField: "_id",
          as: "data",
        },
      },
      { $unwind: "$data" },
      {
        $match: {
          $expr: {
            $not: {
              $in: ["$data._id", "$following"],
            },
          },
        },
      },

      {
        $project: {
          _id: "$data._id",
          fullname: "$data.fullname",
          username: "$data.username",
          profileImage: "$data.profileImage",
        },
      },
    ]);

    const userfollowing = await userModel.aggregate([
      {
        $match: {
          _id: userId,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "following",
          foreignField: "_id",
          as: "data",
        },
      },
      { $unwind: "$data" },
      {
        $match: {
          $expr: {
            $not: {
              $in: ["$data._id", "$followers"],
            },
          },
        },
      },

      {
        $project: {
          _id: 0,
          _id: "$data._id",
          fullname: "$data.fullname",
          username: "$data.username",
          profileImage: "$data.profileImage",
        },
      },
    ]);
    const user = await userModel
      .findById(userId)
      .populate("followers", "fullname")
      .populate("following", "fullname");

    const friendsIds =
      user?.following?.filter((followingUser) => {
        // Convert the current ID to a plain string
        const followingIdStr =
          followingUser._id?.toString() || String(followingUser);

        // Check against stringified versions of the followers array
        return user.followers.some((follower) => {
          const followerIdStr = follower._id?.toString() || String(follower);
          return followingIdStr === followerIdStr;
        });
      }) || [];

    const friends = await userModel
      .find({
        _id: { $in: friendsIds },
      })
      .select("fullname username _id profileImage");

    console.log(friends.length, userfollowers.length, userfollowing.length);
    return [userfollowers, userfollowing, friends];
  } catch (err) {
    return null;
  }
};

module.exports.getLoggedInUserConnections = async function (req) {
  try {
    const userId = req?.user?._id;

    if (!userId) throw Error("Not Valid Request");

    const userfollowers = await userModel.aggregate([
      {
        $match: {
          _id: userId,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "followers",
          foreignField: "_id",
          as: "data",
        },
      },
      { $unwind: "$data" },
      {
        $match: {
          $expr: {
            $not: {
              $in: ["$data._id", "$following"],
            },
          },
        },
      },

      {
        $project: {
          "data._id": 1,
          "data.fullname": 1,
          "data.username": 1,
          "data.profileImage": 1,
        },
      },
    ]);

    const userfollowing = await userModel.aggregate([
      {
        $match: {
          _id: userId,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "following",
          foreignField: "_id",
          as: "data",
        },
      },
      { $unwind: "$data" },
      {
        $match: {
          $expr: {
            $not: {
              $in: ["$data._id", "$followers"],
            },
          },
        },
      },

      {
        $project: {
          _id: 0,
          _id: "$data._id",
          fullname: "$data.fullname",
          username: "$data.username",
          profileImage: "$data.profileImage",
        },
      },
    ]);
    const user = await userModel
      .findById(userId)
      .populate("followers", "fullname")
      .populate("following", "fullname");

    const friendsIds =
      user?.following?.filter((followingUser) => {
        // Convert the current ID to a plain string
        const followingIdStr =
          followingUser._id?.toString() || String(followingUser);

        // Check against stringified versions of the followers array
        return user.followers.some((follower) => {
          const followerIdStr = follower._id?.toString() || String(follower);
          return followingIdStr === followerIdStr;
        });
      }) || [];

    const friends = await userModel
      .find({
        _id: { $in: friendsIds },
      })
      .select("fullname username _id profileImage");

    console.log(friends.length, userfollowers.length, userfollowing.length);
    return [userfollowers, userfollowing, friends];
  } catch (err) {
    return null;
  }
};

module.exports.getUserById = async function (req) {
  try {
    const userId = req.params.id;

    if (!userId) throw new Error("No user Id Found");

    const user = await userModel
      .findById(userId)
      .select("fullname _id username profileImage bio followers following");

    return [user];
  } catch (err) {
    throw err;
  }
};
