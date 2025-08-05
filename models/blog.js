const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Blog = sequelize.define('Blog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: DataTypes.STRING,
  description: DataTypes.TEXT,
  image: DataTypes.STRING,
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  approved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  sectorId: DataTypes.UUID,
  createdBy: DataTypes.UUID,
  updatedBy: DataTypes.UUID,
}, {
  timestamps: true,
});

module.exports = Blog;
