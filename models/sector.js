const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Sector = sequelize.define('Sector', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    unique: true,
  },
  createdBy: DataTypes.UUID,
  updatedBy: DataTypes.UUID,
}, {
  timestamps: true,
});

module.exports = Sector;
