const express = require('express');
const router = express.Router();
const leadController = require('../controllers/LeadController');
const { authenticateToken } = require('../middleware/auth');

router.post('/public', leadController.publicStore);

router.use(authenticateToken);
router.get('/', leadController.index);
router.post('/:id/project', leadController.createProject);
router.patch('/:id', leadController.update);
router.delete('/:id', leadController.delete);

module.exports = router;
