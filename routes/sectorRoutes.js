const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const role = require('../middlewares/roleMiddleware');
const sectorController = require('../controllers/sectorController');


router.post('/create', auth.authenticateJWT, role(['superadmin']), sectorController.createSector);


router.post('/assign', auth.authenticateJWT, role(['superadmin']), sectorController.assignSectorToAdmin);

router.get('/', auth.authenticateJWT, sectorController.getAllSectors);

module.exports = router;
