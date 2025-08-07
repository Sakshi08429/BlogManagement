const { Blog, User, Sector } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const Joi = require('joi');


//creation....
exports.createBlogs = async (req, res) => {
   const sectors = await Sector.findAll();
  res.render('blogs/create',{sectors});
}


exports.createBlogRequest = async (req, res) => {
  const user= req.user;
  const schema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    sectorId: Joi.string().required(),
    isPublic: Joi.boolean().required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
const approved = false;
const status='pending';
  try {
    const blog = await Blog.create({
      title: value.title,
      description: value.description,
      sectorId: value.sectorId,
      isPublic: value.isPublic,
      image: req.file?.filename || null,
      approved: approved,
      status: status,

      createdBy: req.user.id,
      updatedBy: req.user.id,
    });
    

      const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const offset = (page - 1) * limit;
    const { count } = await Blog.findAndCountAll({
      where: { createdBy: req.user.id },
      include: [Sector],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
    


    const dbUser = await User.findByPk(req.user.id);
    const blogs = await Blog.findAll({
      where: { createdBy: req.user.id },
      include: [Sector],
      limit,
      order: [['createdAt', 'DESC']], 
      offset,
    });
   
   

    res.redirect('/dashboard'); 
   
    
  } 
  catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create blog request' });
  }
};

//  Approve blog 
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
    blog.status = 'approved';
    blog.updatedBy = req.user.id;
    await blog.save();
 const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const offset = (page - 1) * limit;
 
    const count= await Blog.count({
      where: { approved: false },
      include: [Sector, { model: User, as: 'author' }],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
  
  res.render('blogs/approval', {
      blogs: await Blog.findAll({
        where: { approved: false },
        include: [Sector, { model: User, as: 'author' }],
        limit,
        offset,
        order: [['createdAt', 'DESC']],
      }),
      user: dbUser,
      currentPage: page,
    totalPages: Math.ceil(count / limit),
    });
  }
  catch (err) {
    console.error('Error approving blog:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// current user's blogs
exports.getUserBlogs = async (req, res) => {

  try {
    const blogs = await Blog.findAll({
      where: { createdBy: req.user.id },
      include: [Sector],
    });
  const page = parseInt(req.query.page) || 1;
  const limit = 3;
  const offset = (page - 1) * limit;
   const currentPage=page;
   const { count, rows } = await Blog.findAndCountAll({
      where: { createdBy: req.user.id, },
      include: [Sector],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
  const totalPages= Math.ceil(count / limit);
 

    res.render('blogs/user', { blogs:rows , currentPage:currentPage, totalPages:totalPages,user: req.user });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch user blogs' });
    console.log(err);
  }
};


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
    const limit = 3;
    const offset = (page - 1) * limit;
   
    const { count, rows } = await Blog.findAndCountAll({
      where: { approved: true ,status: 'approved'},  
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



exports.getAdminBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 3;
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

    res.render('blogs/admin', {
      blogs: rows,
      user: req.user,
      currentPage: page,
      sectorId: adminSectorIds,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    console.error('Error fetching blogs for superadmin:', err);
    res.status(500).json({ error: 'Error fetching blogs for superadmin' });
  }
};





exports.getPublicBlogs = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 3;
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
      user: req.user,
      blogs: rows,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching blogs' });
  }
};



exports.getBlogForEdit = async (req, res) => {
  const blogId = req.params.id;

  try {
    const blog = await Blog.findByPk(blogId);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    const sectors = await Sector.findAll();
    res.render('blogs/edit', { blog, sectors, user: req.user });
  } catch (err) {
    console.error('Error fetching blog for edit:', err);
    res.status(500).json({ error: 'Error fetching blog for edit' });
  }
};


exports.updateBlog = async (req, res) => {
  const blogId = req.params.id;
  const { title, description, sectorId, isPublic } = req.body;

  try {
    const blog = await Blog.findByPk(blogId);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    blog.title = title;
    blog.description = description;
    blog.sectorId = sectorId;
    blog.isPublic = isPublic;
    blog.updatedBy = req.user.id;

    if (req.file) {
     
      if (blog.image) {
        const imagePath = path.join(__dirname, '..', 'public', 'uploads', blog.image);

        fs.unlinkSync(oldImagePath);
      }
      blog.image = req.file.filename;
    }

    await blog.save();
    res.redirect('/blogs/superadmin/all');
  } catch (err) {
    console.error('Error updating blog:', err);
    res.status(500).json({ error: 'Error updating blog' });
  }
}


exports.deleteBlog = async (req, res) => {
  const blogId = req.params.id;

  try {
    const blog = await Blog.findByPk(blogId);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    if (blog.image) {
     const imagePath = path.join(__dirname, '..', 'public', 'uploads', blog.image);

      fs.unlinkSync(imagePath);
    }

    await blog.destroy();
    if(req.user.role==='superadmin')
    res.redirect('/blogs/superadmin/all');
    else if(req.user.role==='admin')  
    res.redirect('/blogs/my');
    else  
    res.redirect('/blogs/user/all');
  } catch (err) {
    console.error('Error deleting blog:', err);
    res.status(500).json({ error: 'Error deleting blog' });
  }
};



exports.rejectBlog = async (req, res) => {
  const blogId=req.params.id;
  const blog = await Blog.findByPk(blogId);
  if (!blog) return res.status(404).json({ message: 'Blog not found' });  
  
  blog.approved=true;
  blog.status='rejected';

  blog.updatedBy = req.user.id;
  await blog.save();
  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const offset = (page - 1) * limit;
  const { count, rows } = await Blog.findAndCountAll({
    where: { approved: false },
    include: [Sector, { model: User, as: 'author' }],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });
  res.render('blogs/approval', {
    blogs: rows,
  
    user: req.user,
    currentPage: page,  
    totalPages: Math.ceil(count / limit),
  });


}



exports.getBlogForEditAdmin = async (req, res) => {
  const blogId = req.params.id;

  try {
    const blog = await Blog.findByPk(blogId);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    const sectors = await Sector.findAll();
    res.render('blogs/edit', { blog, sectors ,user: req.user});
  } catch (err) {
    console.error('Error fetching blog for edit:', err);
    res.status(500).json({ error: 'Error fetching blog for edit' });
  }
} 



exports.updateBlogForAdmin = async (req, res) => {
  const blogId = req.params.id;
  const { title, description, sectorId, isPublic } = req.body;

  try {
    const blog = await Blog.findByPk(blogId);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    blog.title = title;
    blog.description = description;
    blog.sectorId = sectorId;
    blog.isPublic = isPublic;
    blog.updatedBy = req.user.id;

    if (req.file) {
      if (blog.image) {
        const oldImagePath = path.join(__dirname, '..', 'public', 'uploads', blog.image);
        fs.unlinkSync(oldImagePath);
      }
      blog.image = req.file.filename;
    }

    await blog.save();
    res.redirect('/blogs/my');
  } catch (err) {
    console.error('Error updating blog:', err);
    res.status(500).json({ error: 'Error updating blog' });
  }
}


exports.getBlogForEditUser = async (req, res) => {
  const blogId = req.params.id;

  try {
    const blog = await Blog.findByPk(blogId);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    const sectors = await Sector.findAll();
    res.render('blogs/edit', { blog, sectors ,user: req.user});
  } catch (err) {
    console.error('Error fetching blog for edit:', err);
    res.status(500).json({ error: 'Error fetching blog for edit' });
  }
} 


exports.updateBlogForUser = async (req, res) => {
  const blogId = req.params.id;
  const { title, description, sectorId, isPublic } = req.body;

  try {
    const blog = await Blog.findByPk(blogId);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    blog.title = title;
    blog.description = description;
    blog.sectorId = sectorId;
    blog.isPublic = isPublic;
    blog.updatedBy = req.user.id;

    blog.approved = false;
    blog.status = 'pending';


    if (req.file) {
      if (blog.image) {
        const oldImagePath = path.join(__dirname, '..', 'public', 'uploads', blog.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      blog.image = req.file.filename;
    }

    await blog.save();
    res.redirect('/blogs/user/all');
  } catch (err) {
    console.error('Error updating blog:', err);
    res.status(500).json({ error: 'Error updating blog' });
  }
}
