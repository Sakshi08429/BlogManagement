const { Sector, AdminSector, User } = require('../models');
const Joi = require('joi');

// Superadmin: Create Sector
exports.createSector = async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const sector = await Sector.create({
      name: value.name,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    res.status(201).json({ message: 'Sector created', sector });
  } catch (err) {
    res.status(500).json({ error: 'Error creating sector' });
  }
};

// Superadmin: Assign Sector to Admin
exports.assignSectorToAdmin = async (req, res) => {
  const schema = Joi.object({
    adminId: Joi.string().required(),
    sectorId: Joi.string().required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const admin = await User.findByPk(value.adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(400).json({ error: 'Invalid admin' });
    }

    await AdminSector.findOrCreate({
      where: { adminId: value.adminId, sectorId: value.sectorId }
    });

    res.json({ message: 'Sector assigned to admin' });
  } catch (err) {
    res.status(500).json({ error: 'Error assigning sector' });
  }
};

// Get All Sectors
exports.getAllSectors = async (req, res) => {
  try {
    const sectors = await Sector.findAll();
    res.json({ sectors });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching sectors' });
  }
};
