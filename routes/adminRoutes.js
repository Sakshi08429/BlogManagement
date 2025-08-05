const express = require('express');
const router = express.Router();
const { ensureAuthenticated, checkRole } = require('../middlewares/authMiddleware');
const { renderAddUserForm, addUser, adminApproval } = require('../controllers/adminController');


const { assignSectorToAdmin } = require('../controllers/adminController');

router.post('/assign-sector', async (req, res) => {
  const { adminId, sectorId } = req.body;

  try {
    await assignSectorToAdmin(adminId, sectorId);
    res.send('Sector assigned to admin');
  } catch (err) {
    res.status(500).send('Failed to assign sector');
  }
});




// Show Add User form
router.get('/add-user', ensureAuthenticated, checkRole(['admin']), renderAddUserForm);
router.post('/add-user', ensureAuthenticated, checkRole(['admin']), addUser);

router.get('/approval',ensureAuthenticated,checkRole(['admin']),adminApproval); 

module.exports = router;
