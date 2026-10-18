const express = require('express');
const router = express.Router();
const contractController = require('../controllers/ContractController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);
router.get('/', contractController.index);
router.post('/', contractController.store);
router.get('/:id/document', contractController.document);
router.post('/:id/receivable', contractController.createReceivable);
router.patch('/:id', contractController.update);

module.exports = router;
