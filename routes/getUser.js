const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/authMiddleware');
const { Blog, Sector, User } = require('../models');
const userController= require('../controllers/userController');

router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
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

   
    const users = await User.findAll({
      where: {
        role: ['admin', 'user']
      },
      raw: true
    });

    res.render('users/user', {
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


router.get('/edit/:id', ensureAuthenticated, userController.EditUser);

router.post('/edit/:id', ensureAuthenticated, userController.SaveEditUser);

 router.post('/delete/:id', ensureAuthenticated, userController.DeleteUser);


module.exports = router;
