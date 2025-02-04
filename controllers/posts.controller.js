const asyncHandler = require("express-async-handler");
const path = require("path");
const fs = require("fs");
const {
  validateCreatePost,
  Post,
  validateUpdatePost,
} = require("../models/Post");
const {
  cloudinaryUploadImage,
  cloudinaryRemoveImage,
} = require("../utils/cloudinary");
const { Comment } = require("../models/Comment");

/**
 * @description Create New Post
 * @route /api/posts
 * @method POST
 * @access private (only logged in users)
 */

module.exports.createPostController = asyncHandler(async (req, res) => {
  //? 1. Validation for the image
  if (!req.file) {
    return res.status(400).json({ message: "No image provided!" });
  }

  //? 2. Validation for data
  const { error } = validateCreatePost(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  //* 3. Upload photo
  const imagePath = path.join(__dirname, `../images/${req.file.filename}`);
  const result = await cloudinaryUploadImage(imagePath);

  //* 4. Create new post and save it to DB
  const post = await Post.create({
    title: req.body.title,
    description: req.body.description,
    category: req.body.category,
    user: req.user.id,
    image: {
      url: result.secure_url,
      publicId: result.public_id,
    },
  });

  //* 5. Send response to the client
  res.status(201).json({
    message: "Post created successfully",
    post,
  });

  //! 6. Delete image from the server
  fs.unlinkSync(imagePath);
});

/**
 * @description Get All Posts
 * @route /api/posts
 * @method GET
 * @access public
 */

module.exports.getAllPostsController = asyncHandler(async (req, res) => {
  const POST_PER_PAGE = 3;
  const { pageNumber, category } = req.query;

  let posts;
  if (pageNumber) {
    posts = await Post.find()
      .skip((pageNumber - 1) * POST_PER_PAGE)
      .limit(POST_PER_PAGE)
      .sort({ createdAt: -1 })
      .populate("user", ["-password"]);
  } else if (category) {
    posts = await Post.find({ category })
      .sort({ createdAt: -1 })
      .populate("user", ["-password"]);
  } else {
    posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("user", ["-password"]);
  }
  res.status(200).json(posts);
});

/**
 * @description Get Single Post
 * @route /api/posts/:id
 * @method GET
 * @access public
 */

module.exports.getSinglePostController = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id)
  .populate("user", ["-password"])
  .populate("comments");
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  res.status(200).json(post);
});

/**
 * @description Get Posts Count
 * @route /api/posts/count
 * @method GET
 * @access public
 */

module.exports.getPostsCountController = asyncHandler(async (req, res) => {
  const count = await Post.countDocuments();

  res.status(200).json(count);
});

/**
 * @description Delete Post
 * @route /api/posts/:id
 * @method DELETE
 * @access private (only admin or user himself)
 */

module.exports.deletePostController = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  if (req.user.isAdmin || req.user.id === post.user.toString()) {
    await Post.findByIdAndDelete(req.params.id);
    await cloudinaryRemoveImage(post.image.publicId);

    //! Delete all comments that belong to this post/
    await Comment.deleteMany({ postId: post._id })

    res
      .status(200)
      .json({ message: "Post deleted successfully", postId: post._id });
  } else {
    res.status(403).json({ message: "access denied, forbidded" });
  }
});

/**
 * @description Update Post
 * @route /api/posts/:id
 * @method PUT
 * @access private (only user himself)
 */

module.exports.updatePostController = asyncHandler(async (req, res) => {
  //? 1. Validation
  const { error } = validateUpdatePost(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  //? 2. Get the post from DB and check if it exists
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  //? 3. Check if this post belongs to logged in user
  if (req.user.id != post.user.toString()) {
    return res.status(403).json({
      status: "forbidded",
      message: "Access denied, you are not allowed",
    });
  }

  //* 4. Update post
  const updatedPost = await Post.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
      },
    },
    { new: true }
  ).populate("user", ["-password"]);

  //* 5. Send response to the client
  res.status(200).json({
    status: "success",
    updatedPost,
  });

  //! 6. Delete image from the server
  fs.unlinkSync(imagePath);
});

/**
 * @description Update Post Image
 * @route /api/posts/upload-image/:id
 * @method PUT
 * @access private (only user himself)
 */

module.exports.updatePostImageController = asyncHandler(async (req, res) => {
  //? 1. validation
  if (!req.file) {
    return res
      .status(400)
      .json({ status: "failed", message: "no image provided" });
  }

  //? 2. Get the post from DB and check if it exists
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: "Post not found" });
  }

  //? 3. Check if this post belongs to logged in user
  if (req.user.id != post.user.toString()) {
    return res.status(403).json({
      status: "forbidded",
      message: "Access denied, you are not allowed",
    });
  }

  //! 4. delete the old image
  await cloudinaryRemoveImage(post.image.publicId);

  //* 5. Update new post image
  const imagePath = path.join(__dirname, `../images/${req.file.filename}`);
  const result = await cloudinaryUploadImage(imagePath);

  //* 6. Update image path in DB
  const updatedPost = await Post.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        image: {
          url: result.secure_url,
          publicId: result.public_id,
        },
      },
    },
    { new: true }
  );

  //* 7. Send response to the client
  res.status(200).json({
    status: "success",
    updatedPost,
  });

  //! 8. Delete image from the server
  fs.unlinkSync(imagePath);
});

/**
 * @description Toggle Like
 * @route /api/posts/like/:id
 * @method PUT
 * @access private (only logged in use)
 */

module.exports.toggleLikeController = asyncHandler(async (req, res) => {
  const loggedInUser = req.user.id;
  const { id: postId } = req.params;

  let post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json({ status: "error", message: "post not found" });
  }
  const isPostAlreadyLiked = post.likes.find(
    (user) => user.toString() === loggedInUser
  );

  if (isPostAlreadyLiked) {
    post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { likes: loggedInUser },
      },
      { new: true }
    );
  } else {
    post = await Post.findByIdAndUpdate(
      postId,
      {
        $push: { likes: loggedInUser },
      },
      { new: true }
    );
  }
  
  //* Send response to the client
  res.status(200).json({
    status: "success",
    post,
  });
});
