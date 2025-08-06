const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const Joi = require('joi');



const login = async (req, res) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).render('login', { error: error.details[0].message });

  try {
    const user = await User.findOne({ where: { email: value.email } });
    if (!user) return res.status(401).render('login', { error: 'Invalid credentials' });

    const match = await bcrypt.compare(value.password, user.password);
    if (!match) return res.status(401).render('login', { error: 'Invalid credentials' });

     

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email,
        name: user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '2d' }
    );

  
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, 
      maxAge: 2 * 24 * 60 * 60 * 1000 
    });

    res.redirect('/dashboard');
  } catch (err) {
    res.status(500).render('login', { error: 'Server error' });
  }
};

const logout = (req, res) => {
  
   
    res.clearCookie('token');
    res.redirect('/login');
  
};


module.exports = {
  
  login,
  logout
};
