const express= require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { AdminSector } = require('../models');
const { Blog, Sector, User } = require('../models');


exports.EditUser= async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).send('User not found');
    }

    const sectors = await Sector.findAll();
        let sectorId = null;
    if (user.role === 'admin') {
      const adminSector = await AdminSector.findOne({ where: { adminId: userId } });
      if (adminSector) {
        sectorId = adminSector.sectorId;
      }
    }


    res.render('users/editUser', {
      user: req.user,
      sectors: sectors,
        sectorId: sectorId,
      u: user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
}


exports.SaveEditUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, password,  sectorId } = req.body; 

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).send('User not found');
    }

    user.name = name;
    user.email = email;

    if (password && password.trim() !== '') {
      const saltRounds = 10;
      user.password = await bcrypt.hash(password, saltRounds);
    }

    if(user.role=='user'){
        
    await user.save();
    }
    else{
    const existingEntry = await AdminSector.findOne({ where: { adminId: userId } });

if (existingEntry) {
  await AdminSector.update(
    { sectorId },
    { where: { adminId: userId } }
  );
} else {
  await AdminSector.create({ adminId: userId, sectorId });
}

    }

    res.redirect('/user');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};

exports.DeleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).send('User not found');
    }

    await user.destroy();
    res.redirect('/user');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
}


