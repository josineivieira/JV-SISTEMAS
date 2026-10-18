const express = require('express');
const router = express.Router();
const clientController = require('../controllers/ClientController');
const { authenticateToken } = require('../middleware/auth');

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);

// Rotas para clientes
router.get('/', clientController.index);           // Listar clientes
router.get('/search', clientController.search);    // Buscar clientes (autocomplete)
router.get('/:id', clientController.show);         // Buscar cliente por ID
router.post('/', clientController.store);          // Criar cliente
router.put('/:id', clientController.update);       // Atualizar cliente
router.delete('/:id', clientController.destroy);   // Remover cliente

module.exports = router;