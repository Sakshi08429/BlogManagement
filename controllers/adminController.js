const { User, Sector,Blog} = require('../models');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');




const AdminSector = require('../models/adminSector');


exports.assignSectorToAdmin = async (adminId, sectorId) => {
  try {
    await AdminSector.create({ adminId, sectorId });
  } catch (err) {
    console.error('Error assigning sector to admin:', err);
    throw err;
  }
};



exports.renderAddUserForm = async (req, res) => {
  const sectors = await Sector.findAll();
  res.render('superadmin/addUser', { sectors });
};

exports.addUser = async (req, res) => {
  try {
    const { name, email, password, role, sectorId } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      sectorId: role === 'admin' ? sectorId : null
    });

  res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to add user');
  }
};


//admin approval for its sector
exports.adminApproval = async (req, res) => {
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
        approved: false,
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
 
    // console.log('Blogs Count:', count);

    if (adminSectorIds.length === 0) {
  return res.render('blogs/approval', {
    blogs: [],
    user: req.user,
    currentPage: page,
    totalPages: 0,
    adminSectorIds,
  });
}


    res.render('blogs/approval', {
      blogs: rows,
      user: req.user,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      adminSectorIds,
    });

  } catch (err) {
    console.error('Error fetching blogs for approval:', err);
    res.status(500).json({ error: 'Error fetching blogs for approval' });
  }
};
