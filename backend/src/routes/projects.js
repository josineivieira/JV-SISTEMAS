const express = require('express');
const router = express.Router();
const projectController = require('../controllers/ProjectController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);
router.get('/', projectController.index);
router.post('/', projectController.store);
router.patch('/:id', projectController.update);

module.exports = router;
