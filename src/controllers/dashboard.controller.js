import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const userId = req.user?._id;

  // Aggregation to get Total Views, Total Videos, and Total Likes
  const stats = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $group: {
        _id: null,
        totalViews: { $sum: "$views" },
        totalVideos: { $sum: 1 },
        totalLikes: { $sum: { $size: "$likes" } },
      },
    },
  ]);

  // Fetch total subscribers count separately from Subscription model
  const subscriberCount = await Subscription.countDocuments({
    channel: userId,
  });

  const channelStats = {
    totalViews: stats[0]?.totalViews || 0,
    totalVideos: stats[0]?.totalVideos || 0,
    totalLikes: stats[0]?.totalLikes || 0,
    totalSubscribers: subscriberCount,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(200, channelStats, "Channel stats fetched successfully")
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const userId = req.user?._id;

  const videos = await Video.find({ owner: userId });

  if (!videos) {
    throw new ApiError(404, "No videos found for this channel");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
