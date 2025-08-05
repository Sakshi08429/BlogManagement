const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: DataTypes.STRING,
  email: {
    
    type: DataTypes.STRING,
    unique: true,
  },
  password: DataTypes.STRING,
  role: {
    type: DataTypes.ENUM('superadmin', 'admin', 'user'),
    defaultValue: 'user',
  },
  createdBy: DataTypes.UUID,
  updatedBy: DataTypes.UUID,
}, {
  timestamps: true,
  tableName: 'users',
});

module.exports = User;
