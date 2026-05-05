const { validationResult } = require("express-validator");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const User = require("../models/User");
const { checkToxicity } = require("../utils/toxicityChecker");

// Get personalized feed (followed users + own posts)
const getFeed = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const userId = req.user._id;

    // Get current user with following list
    const currentUser = await User.findById(userId).select("following");

    // Create filter: posts from followed users + current user's own posts
    const authorIds = [...(currentUser.following || []), userId];

    const posts = await Post.find({
      author: { $in: authorIds },
      isPublic: true,
    })
      .populate("author", "name username avatar profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Post.countDocuments({
      author: { $in: authorIds },
      isPublic: true,
    });

    res.json({
      status: "success",
      data: {
        posts,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Get feed error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Get user's posts
const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ author: userId })
      .populate("author", "name username avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Post.countDocuments({ author: userId });

    res.json({
      status: "success",
      data: {
        posts,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Get user posts error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Get single post by ID
const getPostById = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId).populate(
      "author",
      "name username avatar profilePicture"
    );

    if (!post) {
      return res.status(404).json({
        status: "error",
        message: "Post not found",
      });
    }

    res.json({
      status: "success",
      data: {
        post,
      },
    });
  } catch (error) {
    console.error("Get post by ID error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Create a new post
const createPost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    // Check if either content or images/videos are provided
    const hasContent = req.body.content && req.body.content.trim().length > 0;
    const hasMedia = req.files && req.files.length > 0;

    if (!hasContent && !hasMedia) {
      return res.status(400).json({
        status: "error",
        message: "Post must have either content or media",
      });
    }

    // Check for toxic content if post has text content
    if (hasContent) {
      const toxicityCheck = await checkToxicity(req.body.content);
      if (toxicityCheck.isToxic) {
        return res.status(400).json({
          status: "error",
          message:
            "Your post contains toxic or inappropriate content. Please revise your message.",
          isToxic: true,
          confidence: toxicityCheck.confidence,
        });
      }
    }

    const postData = {
      ...req.body,
      author: req.user._id,
    };

    // Handle uploaded files — separate images from videos by mimetype
    if (req.files && req.files.length > 0) {
      const imageFiles = req.files.filter((f) => f.mimetype.startsWith("image/"));
      const videoFiles = req.files.filter((f) => f.mimetype.startsWith("video/"));

      if (imageFiles.length > 0) {
        postData.images = imageFiles.map((file) => ({
          url: `/uploads/${file.filename}`,
          alt: file.originalname,
        }));
      }

      if (videoFiles.length > 0) {
        postData.videos = videoFiles.map((file) => ({
          url: `/uploads/${file.filename}`,
          alt: file.originalname,
        }));
      }
    }

    const post = new Post(postData);
    await post.save();
    await post.populate("author", "name username avatar");

    res.status(201).json({
      status: "success",
      message: "Post created successfully",
      data: {
        post,
        isToxic: false,
        confidence: 0,
      },
    });
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Like/Unlike a post
const toggleLike = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        status: "error",
        message: "Post not found",
      });
    }

    const existingLike = post.likes.find(
      (like) => like.user.toString() === userId.toString()
    );

    if (existingLike) {
      // Unlike
      post.likes = post.likes.filter(
        (like) => like.user.toString() !== userId.toString()
      );
    } else {
      // Like
      post.likes.push({ user: userId });
    }

    await post.save();
    await post.populate("author", "name username avatar");

    res.json({
      status: "success",
      message: existingLike ? "Post unliked" : "Post liked",
      data: {
        post,
        liked: !existingLike,
      },
    });
  } catch (error) {
    console.error("Toggle like error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Share a post
const sharePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        status: "error",
        message: "Post not found",
      });
    }

    // Check if already shared
    const existingShare = post.shares.find(
      (share) => share.user.toString() === userId.toString()
    );
    if (existingShare) {
      return res.status(400).json({
        status: "error",
        message: "Post already shared",
      });
    }

    post.shares.push({ user: userId });
    await post.save();

    res.json({
      status: "success",
      message: "Post shared successfully",
      data: {
        shareCount: post.shareCount,
      },
    });
  } catch (error) {
    console.error("Share post error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Add comment to post
const addComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { postId } = req.params;
    const { content, parentComment } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        status: "error",
        message: "Post not found",
      });
    }

    // Check for toxic content BEFORE posting
    const toxicityCheck = await checkToxicity(content);

    if (toxicityCheck.isToxic) {
      return res.status(400).json({
        status: "error",
        message: "Comment contains inappropriate content and cannot be posted",
        data: {
          isToxic: true,
          confidence: toxicityCheck.confidence,
        },
      });
    }

    // Create comment only if not toxic
    const comment = new Comment({
      content,
      author: req.user._id,
      post: postId,
      parentComment: parentComment || null,
    });

    await comment.save();
    await comment.populate("author", "name username avatar");

    // Add comment to post
    post.comments.push(comment._id);
    await post.save();

    // If it's a reply, add to parent comment
    if (parentComment) {
      await Comment.findByIdAndUpdate(parentComment, {
        $push: { replies: comment._id },
      });
    }

    res.status(201).json({
      status: "success",
      message: "Comment added successfully",
      data: {
        comment,
      },
    });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Get comments for a post
const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        status: "error",
        message: "Post not found",
      });
    }

    const comments = await Comment.find({
      post: postId,
      parentComment: null, // Get only top-level comments
    })
      .populate("author", "name username avatar")
      .populate({
        path: "replies",
        populate: {
          path: "author",
          select: "name username avatar",
        },
        options: { limit: 5, sort: { createdAt: 1 } },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Comment.countDocuments({
      post: postId,
      parentComment: null,
    });

    res.json({
      status: "success",
      data: {
        comments,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};
// Update a post
const updatePost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        errors: errors.array(),
      });
    }

    const { postId } = req.params;
    const { content, keepImages, keepVideos } = req.body;
    const userId = req.user._id;

    // Find the post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        status: "error",
        message: "Post not found",
      });
    }

    // Check if user is the post author
    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to update this post",
      });
    }

    // Update text content
    if (content !== undefined) {
      post.content = content;
    }

    // --- Handle images ---
    // Start with images the user chose to keep (sent as JSON string)
    let updatedImages = [];
    if (keepImages) {
      try {
        updatedImages = JSON.parse(keepImages);
      } catch (_) {}
    }
    // Append newly uploaded image files
    if (req.files && req.files.length > 0) {
      const newImageFiles = req.files.filter((f) => f.mimetype.startsWith("image/"));
      updatedImages = [
        ...updatedImages,
        ...newImageFiles.map((file) => ({
          url: `/uploads/${file.filename}`,
          alt: file.originalname,
        })),
      ];
    }
    post.images = updatedImages;

    // --- Handle videos ---
    let updatedVideos = [];
    if (keepVideos) {
      try {
        updatedVideos = JSON.parse(keepVideos);
      } catch (_) {}
    }
    if (req.files && req.files.length > 0) {
      const newVideoFiles = req.files.filter((f) => f.mimetype.startsWith("video/"));
      updatedVideos = [
        ...updatedVideos,
        ...newVideoFiles.map((file) => ({
          url: `/uploads/${file.filename}`,
          alt: file.originalname,
        })),
      ];
    }
    post.videos = updatedVideos;

    await post.save();
    await post.populate("author", "name username profilePicture");

    // Check for toxic content AFTER updating
    const toxicityCheck = content ? await checkToxicity(content) : { isToxic: false, confidence: 0 };

    res.json({
      status: "success",
      message: "Post updated successfully",
      data: {
        post,
        isToxic: toxicityCheck.isToxic,
        confidence: toxicityCheck.confidence,
      },
    });
  } catch (error) {
    console.error("Update post error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};
// Delete post
const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        status: "error",
        message: "Post not found",
      });
    }

    // Check if user owns the post or is admin
    if (
      post.author.toString() !== userId.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to delete this post",
      });
    }

    // Delete all comments associated with the post
    await Comment.deleteMany({ post: postId });

    // Delete the post
    await Post.findByIdAndDelete(postId);

    res.json({
      status: "success",
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Toggle like on a comment
const toggleLikeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        status: "error",
        message: "Comment not found",
      });
    }

    const existingLike = comment.likes.find(
      (like) => like.user.toString() === userId.toString()
    );

    if (existingLike) {
      comment.likes = comment.likes.filter(
        (like) => like.user.toString() !== userId.toString()
      );
    } else {
      comment.likes.push({ user: userId });
    }

    await comment.save();
    await comment.populate("author", "name username avatar");

    res.json({
      status: "success",
      message: existingLike ? "Comment unliked" : "Comment liked",
      data: {
        comment,
        liked: !existingLike,
        likeCount: comment.likes.length,
      },
    });
  } catch (error) {
    console.error("Toggle like comment error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Update a comment
const updateComment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        status: "error",
        message: "Comment not found",
      });
    }

    // Check if user is the comment author
    if (comment.author.toString() !== userId.toString()) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to update this comment",
      });
    }

    // Update comment content
    comment.content = content;
    await comment.save();
    await comment.populate("author", "name username avatar");

    // Check for toxic content AFTER updating
    const toxicityCheck = await checkToxicity(content);

    res.json({
      status: "success",
      message: "Comment updated successfully",
      data: {
        comment,
        isToxic: toxicityCheck.isToxic,
        confidence: toxicityCheck.confidence,
      },
    });
  } catch (error) {
    console.error("Update comment error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

// Delete a comment
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        status: "error",
        message: "Comment not found",
      });
    }

    // Check if user is the comment author or post owner
    const post = await Post.findById(comment.post);
    const isAuthor = comment.author.toString() === userId.toString();
    const isPostOwner = post.author.toString() === userId.toString();

    if (!isAuthor && !isPostOwner) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to delete this comment",
      });
    }

    // Remove comment from post
    await Post.findByIdAndUpdate(comment.post, {
      $pull: { comments: commentId },
    });

    // Delete the comment
    await Comment.findByIdAndDelete(commentId);

    res.json({
      status: "success",
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({
      status: "error",
      message: "Server error",
    });
  }
};

module.exports = {
  getFeed,
  getUserPosts,
  getPostById,
  createPost,
  toggleLike,
  sharePost,
  addComment,
  getComments,
  updateComment,
  deleteComment,
  updatePost,
  deletePost,
  toggleLikeComment,
};
