const userModel = require("../../models/user-model");
const postModel = require("../../models/post-model");
const commentModel = require("../../models/comment-model");
const mongoose = require("mongoose");
module.exports.createComment = async function (req) {
  let input = req.body.inputText;
  let id = req.body.postId;
  console.log("yeeh", input, id);
  if (!input || !id) throw new Error("Invalid data Cant perform operation");
  try {
    let post = await postModel.findById(id);
    if (!post) throw new Error("not valid post");
    let loggedInUser = await userModel.findById(req.user._id);

    let comment = await commentModel.create({
      text: input,
      postId: post._id,
      userId: loggedInUser._id,
    });

    post.comments.push(comment._id);
    loggedInUser.userCommented.push(comment._id);

    await Promise.all([post.save(), loggedInUser.save()]);
    console.log("comment pushed");
    return [comment, loggedInUser];
  } catch (err) {
    throw err;
  }
};

module.exports.showAllComments = async function (req) {
  let { postId: id, limit, page } = req.query;
  console.log("show all comments id post", id);

  // Parse and normalize numbers with fallbacks
  const limitNum = Number(limit) || 20;
  const pageNum = Number(page) || 1;
  const skipNum = (pageNum - 1) * limitNum;

  try {
    if (!id) throw new Error("No ID Received!");

    const comments = await commentModel.aggregate([
      {
        $match: {
          postId: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "commentOwner",
        },
      },
      { $unwind: "$commentOwner" },
      { $skip: skipNum },
      { $limit: limitNum + 1 },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);

    console.log(comments.length);

    let nextPage = false;
    if (comments.length > limit) {
      nextPage = true;
      comments.pop();
    }

    return [comments, nextPage];
  } catch (err) {
    throw err;
  }
};

module.exports.deleteComment = async function (req) {
  const { commentId, postId } = req.body;
  try {
    const user = await userModel.findById(req.user?._id);
    const comment = await commentModel.findById(commentId);
    if (!commentId || !comment || !postId || !user)
      throw new Error("something went wrong!");

    const post = await postModel.findById(postId);

    if (!post) throw new Error("something went wrong!");

    post.comments = post.comments.filter(
      (c) => c?._id.toString() !== commentId.toString(),
    );

    user.userCommented = user.userCommented.filter(
      (c) => c?._id.toString() !== commentId.toString(),
    );

    const deletedComment = await commentModel.findByIdAndDelete(commentId);

    await Promise.all([user.save(), post.save()]);

    return ["Success"];
  } catch (err) {
    throw err;
  }
};
