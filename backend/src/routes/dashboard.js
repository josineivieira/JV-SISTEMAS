const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/DashboardController');
const { authenticateToken } = require('../middleware/auth');

// All dashboard routes require authentication
router.use(authenticateToken);

router.get('/summary', dashboardController.getSummary);
router.get('/sales-chart', dashboardController.getSalesChart);
router.get('/alerts', dashboardController.getAlerts);

module.exports = router;