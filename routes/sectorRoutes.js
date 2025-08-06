const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');
const sectorController = require('../controllers/sectorController');

//  creates new sector
router.post('/create', auth.authenticateJWT, role(['superadmin']), sectorController.createSector);

//  sector to admin
router.post('/assign', auth.authenticateJWT, role(['superadmin']), sectorController.assignSectorToAdmin);

//  all sectors in form 
router.get('/', auth.authenticateJWT, sectorController.getAllSectors);

module.exports = router;
