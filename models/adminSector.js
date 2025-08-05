const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AdminSector = sequelize.define('AdminSector', {
  adminId: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true
  },
  sectorId: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true
  }
}, {
  timestamps: false,
  tableName: 'AdminSectors' 
});




module.exports = AdminSector;
