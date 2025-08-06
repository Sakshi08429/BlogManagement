const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const {authenticateJWT} = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const upload = require('../middlewares/upload');

//  blog request 
router.post(
  '/create',
  authenticateJWT,
  roleMiddleware(['user','admin', 'superadmin']),
  upload.single('image'),
  blogController.createBlogRequest
);

// Approve blog 
router.get(
  '/approve/:id',
  authenticateJWT,
  roleMiddleware(['admin', 'superadmin']),
  blogController.approveBlog
);




//get all blogs for superadmin
router.get('/superadmin/all', authenticateJWT, roleMiddleware(['superadmin','admin','user']), blogController.getAllBlogsForSuperAdmin);

// Dashboard view
router.get('/dashboard', authenticateJWT, blogController.getDashboard);




router.get('/myBlogs',authenticateJWT,blogController.createBlogs);

//for guests

router.get('/guest', blogController.getPublicBlogs);

// for user to view his blogs
router.get('/user/all', authenticateJWT, roleMiddleware(['user']), blogController.getUserBlogs)

//for admin to view his blogs
router.get('/my', authenticateJWT, roleMiddleware(['admin']), blogController.getAdminBlogs);



router.get('/public', blogController.getAllBlogsForSuperAdmin);
module.exports = router;
