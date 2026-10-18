const express = require('express');
const router = express.Router();
const productController = require('../controllers/ProductController');
const { authenticateToken } = require('../middleware/auth');

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);

// Rotas para produtos
router.get('/', productController.index);           // Listar produtos
router.get('/search', productController.search);    // Buscar produtos (autocomplete)
router.get('/low-stock', productController.lowStock); // Produtos com estoque baixo
router.get('/categories', productController.categories); // Categorias disponíveis
router.get('/:id', productController.show);         // Buscar produto por ID
router.post('/', productController.store);          // Criar produto
router.put('/:id', productController.update);       // Atualizar produto
router.delete('/:id', productController.destroy);   // Remover produto

module.exports = router;