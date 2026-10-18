const express = require('express');
const router = express.Router();
const saleController = require('../controllers/SaleController');
const { authenticateToken } = require('../middleware/auth');

// All sales routes require authentication
router.use(authenticateToken);

// Get sales statistics
router.get('/stats', saleController.getStats);

// Get all sales
router.get('/', saleController.getAll);

// Get sale by ID
router.get('/:id', saleController.getById);

// Convert proposal to operational records
router.post('/:id/contract', saleController.createContract);
router.post('/:id/project', saleController.createProject);

// Create new sale
router.post('/', saleController.create);

// Update sale
router.put('/:id', saleController.update);

// Delete sale
router.delete('/:id', saleController.delete);

module.exports = router;
