const express = require('express');
const controller = require('../controllers/OperationalDocumentController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);
router.get('/origins', controller.origins);
router.get('/', controller.index);
router.post('/', controller.create);
router.get('/:id/trace', controller.trace);
router.patch('/:id', controller.update);
router.delete('/:id', controller.archive);

module.exports = router;
