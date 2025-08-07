const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/authMiddleware');
const { Blog, Sector, User } = require('../models'); // Import your models

router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 3;
    const offset = (page - 1) * limit;

    const { count, rows: blogs } = await Blog.findAndCountAll({
      limit,
      offset,
      include: [
        { model: Sector },
        { model: User, as: 'author', attributes: ['name'] }
      ]
    });

    const totalPages = Math.ceil(count / limit);

    

    //  Fetch all users except Superadmin 
    const users = await User.findAll({
      where: {
        role: ['admin', 'user']
      },
      raw: true
    });

    res.render('blogs/dashboard', {
      user: req.user,
      blogs,
      users, 
      currentPage: page,
      totalPages
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
