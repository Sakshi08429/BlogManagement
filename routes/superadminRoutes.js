const express = require('express');
const router = express.Router();
const { ensureAuthenticated, checkRole } = require('../middlewares/authMiddleware');
const { Sector, User,Blog,AdminSector } = require('../models');
const bcrypt = require('bcryptjs');

router.get('/superadmin/add-user', ensureAuthenticated, checkRole(['superadmin']), async (req, res) => {
  try {
    const sectors = await Sector.findAll();
    res.render('superadmin/addUser', { sectors });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading add user page');
  }
});

//  Add User 
router.post('/superadmin/add-user', ensureAuthenticated, checkRole(['superadmin']), async (req, res) => {
  const { name, email, password, role, sectorId } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
      role:'user',
      sectorId: role === 'superadmin' ? sectorId : null
    });

    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding user');
  }
});

//add admin 
router.get('/superadmin/add-admin', ensureAuthenticated, checkRole(['superadmin']), async (req, res) => {
  try {
    const sectors = await Sector.findAll();
    res.render('superadmin/addAdmin', { sectors });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading add user page');
  }
});

//  Add admin
router.post('/superadmin/add-admin', ensureAuthenticated, checkRole(['superadmin']), async (req, res) => {
  const { name, email, password, sectorIds } = req.body; 

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    
    const sectors = Array.isArray(sectorIds) ? sectorIds : [sectorIds];

    const adminSectorMappings = sectors.map(sectorId => ({
      adminId: user.id,
      sectorId
    }));

    await AdminSector.bulkCreate(adminSectorMappings);

    res.redirect('/dashboard');
  } catch (err) {
    console.error('Error adding admin:', err);
    res.status(500).send('Error adding admin');
  }
});



//add sector
router.get('/superadmin/add-sector', ensureAuthenticated, async (req, res) => {
  try {
    const sectors = await Sector.findAll();
    res.render('superadmin/addSector');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading add sector page');
  }
});


router.post('/superadmin/add-sector', ensureAuthenticated, async (req, res) => {
  const { name } = req.body;
  try {
   

    await Sector.create({
      name,
     createdBy: req.user.id ,
      updatedBy: req.user.id
    });

    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding sector');
  }
});



// all blogs for approval
router.get('/superadmin/approval', ensureAuthenticated, async (req, res) => {
  
  const page = parseInt(req.query.page) || 1;
  const limit = 2;
  const offset = (page - 1) * limit;   
  try {
    const { count, rows } = await Blog.findAndCountAll({
      where: { approved: false , status: 'pending' }, 
      include: [Sector, { model: User, as: 'author' }],
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.render('blogs/approval', {
      user: req.user,
      blogs: rows,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    console.error('Error fetching blogs for approval:', err);
    res.status(500).json({ error: 'Error fetching blogs for approval' });
  } 
});





module.exports = router;
