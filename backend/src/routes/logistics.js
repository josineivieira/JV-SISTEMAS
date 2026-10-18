const express = require('express');
const router = express.Router();
const logisticsProcessController = require('../controllers/LogisticsProcessController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/processes', logisticsProcessController.getAll);
router.post('/processes', logisticsProcessController.create);
router.get('/processes/:id', logisticsProcessController.getById);
router.patch('/processes/:id', logisticsProcessController.update);
router.post('/processes/:id/actions', logisticsProcessController.runAction);
router.post('/processes/:id/advance', logisticsProcessController.advance);

module.exports = router;
