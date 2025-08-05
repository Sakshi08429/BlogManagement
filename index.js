// server.js
require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const { sequelize } = require('./models');
const User = require('./models/user'); 
const authRoutes = require('./routes/authRoutes');
const blogRoutes = require('./routes/blogRoutes');
const sectorRoutes = require('./routes/sectorRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieParser());
// Routes
app.use('/', authRoutes);
app.use('/blogs', blogRoutes);
app.use('/sectors', sectorRoutes);

// Home
app.get('/', (req, res) => {
  res.redirect('/login');
});


const dashboardRoutes = require('./routes/dashboardRoutes');
app.use('/', dashboardRoutes); // or app.use('/dashboard', dashboardRoutes);

const adminRoutes = require('./routes/adminRoutes');
app.use('/admin', adminRoutes);


const superadminRoutes = require('./routes/superadminRoutes');
app.use('/', superadminRoutes);

const userRoutes = require('./routes/getUser');
app.use('/user', userRoutes);  



sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error(' Failed to connect to the database:', err);
});
