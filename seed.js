require('dotenv').config();
const bcrypt = require('bcrypt');
const { sequelize, User } = require('./models');

const seed = async () => {
  try {
    await sequelize.sync({ alter: true }); // Use force: true if you want to reset all tables

    // Check if superadmin already exists
    const existing = await User.findOne({
      where: { role: 'superadmin' }
    });

    if (existing) {
      console.log('❗ Superadmin already exists');
      return;
    }

    const hashedPassword = await bcrypt.hash('superadmin123', 10);

    const superadmin = await User.create({
      name: 'Super Admin',
      email: 'superadmin@example.com',
      password: hashedPassword,
      role: 'superadmin'
    });

    console.log('✅ Superadmin seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding superadmin:', err);
    process.exit(1);
  }
};

seed();
