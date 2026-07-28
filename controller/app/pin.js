const userModel = require("../../models/user-model");
const postModel = require("../../models/post-model");
const pinModel = require("../../models/pin-model");

module.exports.savePin = async function (req) {
  const userId = req?.user?._id;
  try {
    let user = await userModel.findById(userId);

    if (!user) throw new Error("user not found");

    let { postId } = req.body;

    let existingPin = await pinModel.findOne({
      savedPost: postId,
      createdBy: user?._id,
    });

    if (existingPin) {
      if (
        user.pins.some((id) => id.toString() === existingPin._id.toString())
      ) {
        throw new Error("You PIned Image Already Saved!");
      }

      user.pins.push(existingPin._id);
      await user.save();
    }

    let pin = await pinModel.create({
      savedPost: postId,
      createdBy: user._id,
    });

    console.log("this is pin", pin);

    user.pins.push(pin._id);
    await user.save();
    let array = [pin];
    return array;
  } catch (err) {
    throw err;
  }
};

module.exports.deletePin = async function (req) {
  const pinId = req.params?.id;
  try {
    if (!pinId) throw new Error("No Id Found");
    let deletedPin = await pinModel.findByIdAndDelete(pinId);

    if (!deletedPin) {
      throw new Error("error", "Unable to delete your Pin");
    }

    let userDeletedPin = await userModel.updateOne(
      { _id: req.user._id },
      { $pull: { pins: deletedPin._id } },
    );
    console.log("deleted saved post");
    return ["success"];
  } catch (err) {
    throw err;
  }
};

module.exports.getSavedVideoPosts = async function (req) {
  const { limit, page } = req.query;
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 12;
  const skip = Number(pageNum - 1) * limitNum;
  const userId = req?.user?._id;
  try {
    if (!userId) throw new Error("No userId Found");

    const pins = await pinModel.aggregate([
      {
        $match: {
          createdBy: userId,
        },
      },
      {
        $lookup: {
          from: "posts",
          localField: "savedPost",
          foreignField: "_id",
          as: "savedPosts",
        },
      },
      { $unwind: "$savedPosts" },
      {
        $lookup: {
          from: "users",
          localField: "savedPosts.user",
          foreignField: "_id",
          as: "postUser",
        },
      },
      { $unwind: "$postUser" },
      {
        $project: {
          _id: 1,
          postOwner: "$postUser",
          postId: "$savedPosts._id",
          mediaType: "$savedPosts.mediaType",
          mediaUrl: "$savedPosts.mediaUrl",
          likes: "$savedPosts.likes",
          createdAt: "$savedPosts.createdAt",
          comments: "$savedPosts.comments",
          postdata: "$savedPosts.postdata",
        },
      },
      { $limit: limitNum + 1 },
      { $skip: skip },
    ]);

    let hasNextPage = false;

    if (pins.length >= limit) {
      hasNextPage = true;
      pins.pop();
    }
    console.log(pins.length);

    pins.reverse();

    return [pins, hasNextPage];
  } catch (err) {
    throw err;
  }
};

module.exports.getSavedImagePosts = async function (req) {
  const { limit, page } = req.query;
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 12;
  const skip = Number(pageNum - 1) * limitNum;
  const userId = req?.user?._id;
  try {
    if (!userId) throw new Error("No userId Found");

    const pins = await pinModel.aggregate([
      {
        $match: {
          createdBy: userId,
        },
      },
      {
        $lookup: {
          from: "posts",
          localField: "savedPost",
          foreignField: "_id",
          as: "savedPosts",
        },
      },
      { $unwind: "$savedPosts" },
      {
        $lookup: {
          from: "users",
          localField: "savedPosts.user",
          foreignField: "_id",
          as: "postUser", // Fixed: Removed '$' from here
        },
      },
      { $unwind: "$postUser" }, // This remains '$postUser' because it's a field path reference
      {
        $project: {
          _id: 1,
          postOwner: "$postUser",
          postId: "$savedPosts._id",
          mediaType: "$savedPosts.mediaType",
          mediaUrl: "$savedPosts.mediaUrl",
          likes: "$savedPosts.likes",
          createdAt: "$savedPosts.createdAt",
          comments: "$savedPosts.comments",
          postdata: "$savedPosts.postdata",
        },
      },
      { $limit: limitNum + 1 },
      { $skip: skip },
    ]);

    let hasNextPage = false;

    if (pins.length >= limit) {
      hasNextPage = true;
      pins.pop();
    }
    console.log(pins.length);

    pins.reverse();

    return [pins, hasNextPage];
  } catch (err) {
    throw err;
  }
};
