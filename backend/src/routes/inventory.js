const express = require('express');
const controller = require('../controllers/InventoryController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);
router.get('/balances', controller.balances);
router.get('/movements', controller.movements);
module.exports = router;
