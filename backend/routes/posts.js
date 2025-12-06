import express from 'express';
import Post from '../models/Post.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * Get all posts
 * GET /api/posts
 */
router.get('/', async (req, res) => {
  try {
    const { category, limit = 20, page = 1 } = req.query;
    
    let query = {};
    if (category) {
      query.category = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const posts = await Post.find(query)
      .populate('postedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Post.countDocuments(query);

    res.json({
      count: posts.length,
      total,
      page: parseInt(page),
      posts
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Get single post
 * GET /api/posts/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('postedBy', 'name')
      .populate('likes', 'name')
      .populate('comments.userId', 'name');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json({ post });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Create post
 * POST /api/posts
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, content, imageUrl, category } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const post = new Post({
      title,
      content,
      imageUrl,
      category: category || 'general',
      postedBy: req.user.userId
    });

    await post.save();
    await post.populate('postedBy', 'name');

    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Like/Unlike post
 * POST /api/posts/:id/like
 */
router.post('/:id/like', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user.userId;
    const likeIndex = post.likes.indexOf(userId);

    if (likeIndex > -1) {
      // Unlike
      post.likes.splice(likeIndex, 1);
    } else {
      // Like
      post.likes.push(userId);
    }

    await post.save();

    res.json({
      message: likeIndex > -1 ? 'Post unliked' : 'Post liked',
      post
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Add comment to post
 * POST /api/posts/:id/comment
 */
router.post('/:id/comment', authenticate, async (req, res) => {
  try {
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({ message: 'Comment is required' });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.comments.push({
      userId: req.user.userId,
      comment: comment.trim()
    });

    await post.save();
    await post.populate('comments.userId', 'name');

    res.json({
      message: 'Comment added successfully',
      post
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Update post (only by author)
 * PATCH /api/posts/:id
 */
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.postedBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updates = req.body;
    Object.assign(post, updates);
    await post.save();

    res.json({
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Delete post (only by author or admin)
 * DELETE /api/posts/:id
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.postedBy.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await post.deleteOne();

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

