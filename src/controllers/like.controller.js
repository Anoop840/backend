import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  // toggle like on video

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const likedAlready = await Like.findOne({
    video: videoId,
    likedBy: req.user?._id,
  });

  if (likedAlready) {
    await Like.findByIdAndDelete(likedAlready._id);

    return res
      .status(200)
      .json(
        new ApiResponse(200, { isLiked: false }, "Like removed successfully")
      );
  }

  await Like.create({
    video: videoId,
    likedBy: req.user?._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { isLiked: true }, "Like added successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  // toggle like on comment

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }

  const likedAlready = await Like.findOne({
    comment: commentId,
    likedBy: req.user?._id,
  });

  if (likedAlready) {
    await Like.findByIdAndDelete(likedAlready._id);

    return res
      .status(200)
      .json(
        new ApiResponse(200, { isLiked: false }, "Like removed successfully")
      );
  }

  await Like.create({
    comment: commentId,
    likedBy: req.user?._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { isLiked: true }, "Like added successfully"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  // toggle like on tweet

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id");
  }

  const likedAlready = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  if (likedAlready) {
    await Like.findByIdAndDelete(likedAlready._id);

    return res
      .status(200)
      .json(
        new ApiResponse(200, { isLiked: false }, "Like removed successfully")
      );
  }

  await Like.create({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { isLiked: true }, "Like added successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  // get all liked videos
  const likedVideosAggregate = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user?._id),
        video: { $exists: true },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideo",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "ownerDetails",
            },
          },
          {
            $unwind: "$ownerDetails",
          },
          {
            $project: {
              videoFile: 1,
              thumbnail: 1,
              title: 1,
              description: 1,
              views: 1,
              duration: 1,
              createdAt: 1,
              ownerDetails: {
                username: 1,
                fullName: 1,
                avatar: 1,
              },
            },
          },
        ],
      },
    },
    {
      $unwind: "$likedVideo",
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        _id: 1,
        likedVideo: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        likedVideosAggregate,
        "Liked videos fetched successfully"
      )
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
