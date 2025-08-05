const { Blog, User, Sector } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const Joi = require('joi');


//create a blog
exports.createBlogs = async (req, res) => {
   const sectors = await Sector.findAll();
  res.render('blogs/create',{sectors});
}


// Create blog request by user
exports.createBlogRequest = async (req, res) => {
  const schema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    sectorId: Joi.string().required(),
    isPublic: Joi.boolean().required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const blog = await Blog.create({
      title: value.title,
      description: value.description,
      sectorId: value.sectorId,
      isPublic: value.isPublic,
      image: req.file?.filename || null,
      approved: false,
      createdBy: req.user.id,
      updatedBy: req.user.id,
    });
    
    //res.status(201).json({ message: 'Blog request created successfully', blog });
    const dbUser = await User.findByPk(req.user.id);
    const blogs = await Blog.findAll({
      where: { createdBy: req.user.id },
      include: [Sector],
    });

    res.render('blogs/dashboard', {
      user: dbUser,
      blogs: blogs,
      currentPage: 1,
      totalPages: 1,
    });
   
    //res.render('blogs/public',{user:dbUser,blogs:blogs, currentPage: 1, totalPages: 1});
  } 
  catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create blog request' });
  }
};

//  Approve blog (admin/superadmin)
exports.approveBlog = async (req, res) => {
  const blogId = req.params.id;

  try {
    const blog = await Blog.findByPk(blogId);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    const dbUser = await User.findByPk(req.user.id);
    if (!dbUser) return res.status(404).json({ message: 'User not found' });

    if (req.user.role === 'admin') {
      const sectors = await dbUser.getAssignedSectors();
      const sectorIds = sectors.map(s => s.id);
      if (!sectorIds.includes(blog.sectorId)) {
        return res.status(403).json({ message: 'You are not authorized to approve this blog' });
      }
    }

    blog.approved = true;
    blog.updatedBy = req.user.id;
    await blog.save();

    // res.json({ message: 'Blog approved successfully' }
  
  res.render('blogs/approval', {
      blogs: await Blog.findAll({
        where: { approved: false },
        include: [Sector, { model: User, as: 'author' }],
      }),
      user: dbUser,
      currentPage: 1,
      totalPages: 1,
    });
  }
  catch (err) {
    console.error('Error approving blog:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// Get current user's blogs
exports.getUserBlogs = async (req, res) => {
  try {
    const blogs = await Blog.findAll({
      where: { createdBy: req.user.id , approved:true},
      include: [Sector],
    });
  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const offset = (page - 1) * limit;
   const currentPage=page;
   const { count, rows } = await Blog.findAndCountAll({
      where: { createdBy: req.user.id, approved: true },
      include: [Sector],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
  const totalPages= Math.ceil(count / limit);


    // res.json({ blogs });
    res.render('blogs/public', { blogs:rows , currentPage:currentPage, totalPages:totalPages });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch user blogs' });
    console.log(err);
  }
};


// // Render edit form
// exports.getEditBlog = async (req, res) => {
//   try {
//     const blog = await Blog.findByPk(req.params.id);
//     if (!blog) return res.status(404).json({ message: 'Blog not found' });

//     if (blog.createdBy !== req.user.id && req.user.role !== 'superadmin') {
//       return res.status(403).json({ message: 'Not authorized to edit this blog' });
//     }

//     const sectors = await Sector.findAll();
//     res.render('blogs/edit', { blog, sectors });
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to fetch blog' });
//   }
// };

// // Update blog
// exports.updateBlog = async (req, res) => {
//   try {
//     const blog = await Blog.findByPk(req.params.id);
//     if (!blog) return res.status(404).json({ message: 'Blog not found' });

//     if (blog.createdBy !== req.user.id && req.user.role !== 'superadmin') {
//       return res.status(403).json({ message: 'Not authorized to update this blog' });
//     }

//     blog.title = req.body.title;
//     blog.description = req.body.description;
//     blog.sectorId = req.body.sectorId;
//     blog.isPublic = req.body.isPublic === 'true' || req.body.isPublic === true;
//     blog.updatedBy = req.user.id;
//     blog.approved = false;

//     if (req.file) {
//       if (blog.image) {
//         const oldPath = path.join(__dirname, '../public/uploads', blog.image);
//         if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
//       }
//       blog.image = req.file.filename;
//     }

//     await blog.save();

//     res.json({ message: 'Blog updated successfully', blog });
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to update blog' });
//   }
// };

// // Delete blog
// exports.deleteBlog = async (req, res) => {
//   try {
//     const blog = await Blog.findByPk(req.params.id);
//     if (!blog) return res.status(404).json({ message: 'Blog not found' });

//     if (blog.createdBy !== req.user.id && req.user.role !== 'superadmin') {
//       return res.status(403).json({ message: 'Not authorized to delete this blog' });
//     }

//     if (blog.image) {
//       const imagePath = path.join(__dirname, '../public/uploads', blog.image);
//       if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
//     }

//     await blog.destroy();
//     res.json({ message: 'Blog deleted successfully' });
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to delete blog' });
//   }
// };

//  Dashboard for superadmin/admin
exports.getDashboard = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const offset = (page - 1) * limit;

    let blogs = [];
    let adminSectorIds = [];

    if (req.user.role === 'superadmin') {
      const { count, rows } = await Blog.findAndCountAll({
        include: [
          { model: User, as: 'author' },
          { model: Sector }
        ],
        limit,
        offset,
        order: [['createdAt', 'DESC']],
      });

      return res.render('dashboard', {
        blogs: rows,
        user: req.user,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        adminSectorIds: [],
      });
    }

    if (req.user.role === 'admin') {
      const admin = await User.findByPk(req.user.id);
      const sectors = await admin.getAssignedSectors();
      adminSectorIds = sectors.map(s => s.id);

      const { count, rows } = await Blog.findAndCountAll({
        where: {
          sectorId: { [Op.in]: adminSectorIds },
        },
        include: [
          { model: User, as: 'author' },
          { model: Sector }
        ],
        limit,
        offset,
        order: [['createdAt', 'DESC']],
      });

      return res.render('dashboard', {
        blogs: rows,
        user: req.user,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        adminSectorIds,
      });
    }

    res.redirect('/blogs/my');
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Error loading dashboard' });
  }

};


exports.getAllBlogsForSuperAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const offset = (page - 1) * limit;

    const { count, rows } = await Blog.findAndCountAll({
      where: { approved: true },  
      include: [
        { model: User, as: 'author' },
        { model: Sector }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.render('blogs/public', {
      blogs: rows,
      user: req.user,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    console.error('Error fetching blogs for superadmin:', err);
    res.status(500).json({ error: 'Error fetching blogs for superadmin' });
  }
};


//for admin to view his blogs
exports.getAdminBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const offset = (page - 1) * limit;
 let adminSectorIds = [];

    if (req.user.role === 'admin') {
    
      const admin = await User.findByPk(req.user.id);
      if (!admin) {
        return res.status(404).send('Admin not found');
      }

      const sectors = await admin.getAssignedSectors();
      adminSectorIds = sectors.map(s => s.id);
    }
    console.log('Admin Sector IDs:', adminSectorIds);


    const { count, rows } = await Blog.findAndCountAll({
      where: {
        approved: true,
        sectorId: { [Op.in]: adminSectorIds },
      },
      include: [
        { model: User, as: 'author' },
        { model: Sector }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.render('blogs/public', {
      blogs: rows,
      user: req.user,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    console.error('Error fetching blogs for superadmin:', err);
    res.status(500).json({ error: 'Error fetching blogs for superadmin' });
  }
};





exports.getPublicBlogs = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const offset = (page - 1) * limit;

  try {
    const { count, rows } = await Blog.findAndCountAll({
      where: { approved: true, isPublic: true },
      include: [Sector, { model: User, as: 'author' }],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.render('blogs/public',{
      blogs: rows,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching blogs' });
  }
};



