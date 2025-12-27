import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const aggregate = Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
  ]);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  };

  // Using mongoose-aggregate-paginate-v2 plugin defined in the model
  const comments = await Comment.aggregatePaginate(aggregate, options);

  if (!comments || comments.totalDocs === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "No comments found for this video"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  // add a comment to a video
  const { content } = req.body;
  const { videoId } = req.params;

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Comment content is required");
  }

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user?._id, // owner comes from verifyJWT middleware
  });

  if (!comment) {
    throw new ApiError(500, "Something went wrong while adding the comment");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req.body;

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Content is required for update");
  }

  if (!mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  // Check if the user is the owner of the comment
  if (comment.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      403,
      "You do not have permission to update this comment"
    );
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;

  if (!mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  // Check if the user is the owner of the comment
  if (comment.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(
      403,
      "You do not have permission to delete this comment"
    );
  }

  await Comment.findByIdAndDelete(commentId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
