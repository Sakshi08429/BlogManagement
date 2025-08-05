const express = require('express');
const router = express.Router();
const {  login,logout } = require('../controllers/authController');



router.get('/login', (req, res) => {
  res.render('login');
});


router.post('/login', login);


router.post('/logout', logout);

module.exports = router;
