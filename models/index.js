const sequelize = require('../config/db');
const User = require('./user');
const Sector = require('./sector');
const Blog = require('./blog');
const AdminSector = require('./adminSector');


// Associations

User.hasMany(Blog, { foreignKey: 'createdBy', as: 'blogs'});
Blog.belongsTo(User, { foreignKey: 'createdBy', as: 'author'  }); 



Sector.hasMany(Blog, { foreignKey: 'sectorId' });
Blog.belongsTo(Sector, { foreignKey: 'sectorId' });

// Admin-Sector many-to-many
User.belongsToMany(Sector, {
  through: AdminSector,
  foreignKey: 'adminId',
  as: 'assignedSectors'
});

Sector.belongsToMany(User, {
  through: AdminSector,
  foreignKey: 'sectorId',
  as: 'sectorAdmins'
});



module.exports = {
  sequelize,
  User,
  Sector,
  Blog,
  AdminSector
};

