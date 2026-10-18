const { Product } = require('../models');
const { Op } = require('sequelize');

class ProductController {
  // Listar todos os servicos da empresa
  async index(req, res) {
    try {
      const { page = 1, limit = 10, search = '', category = '' } = req.query;
      const offset = (page - 1) * limit;

      const where = {
        companyId: req.user.companyId,
        isActive: true
      };

      // Adicionar busca por nome, código ou categoria
      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { code: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      // Filtrar por categoria
      if (category) {
        where.category = category;
      }

      const { count, rows: products } = await Product.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['name', 'ASC']]
      });

      res.json({
        products,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Erro ao listar servicos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Buscar servico por ID
  async show(req, res) {
    try {
      const { id } = req.params;

      const product = await Product.findOne({
        where: {
          id,
          companyId: req.user.companyId,
          isActive: true
        }
      });

      if (!product) {
        return res.status(404).json({ error: 'Servico nao encontrado' });
      }

      res.json(product);
    } catch (error) {
      console.error('Erro ao buscar servico:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Criar novo servico
  async store(req, res) {
    try {
      const {
        code: rawCode,
        sku,
        name,
        description,
        category,
        costPrice,
        salePrice: rawSalePrice,
        price,
        unit,
        notes
      } = req.body;
      const code = rawCode || sku || null;
      const salePrice = rawSalePrice ?? price;
      if (!code || !name) {
        return res.status(400).json({ error: 'Codigo e nome do servico sao obrigatorios' });
      }

      // Verificar se código já existe
      const existingProduct = await Product.findOne({
        where: {
          code,
          companyId: req.user.companyId,
          isActive: true
        }
      });

      if (existingProduct) {
        return res.status(400).json({ error: 'Codigo do servico ja existe' });
      }

      const product = await Product.create({
        companyId: req.user.companyId,
        code,
        sku,
        name,
        description,
        category,
        costPrice: parseFloat(costPrice || 0),
        salePrice: parseFloat(salePrice || 0),
        stockQuantity: 0,
        minStock: 0,
        unit: unit || 'servico',
        notes
      });

      res.status(201).json(product);
    } catch (error) {
      console.error('Erro ao criar servico:', error);
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: error.errors.map(e => e.message)
        });
      }
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Atualizar servico
  async update(req, res) {
    try {
      const { id } = req.params;
      const {
        code: rawCode,
        sku,
        name,
        description,
        category,
        costPrice,
        salePrice: rawSalePrice,
        price,
        unit,
        notes
      } = req.body;
      const code = rawCode || sku || null;
      const salePrice = rawSalePrice ?? price;
      if (!code || !name) {
        return res.status(400).json({ error: 'Codigo e nome do servico sao obrigatorios' });
      }

      const product = await Product.findOne({
        where: {
          id,
          companyId: req.user.companyId,
          isActive: true
        }
      });

      if (!product) {
        return res.status(404).json({ error: 'Servico nao encontrado' });
      }

      // Verificar se codigo ja existe em outro servico
      if (code !== product.code) {
        const existingProduct = await Product.findOne({
          where: {
            code,
            companyId: req.user.companyId,
            isActive: true,
            id: { [Op.ne]: id }
          }
        });

        if (existingProduct) {
          return res.status(400).json({ error: 'Codigo do servico ja existe' });
        }
      }

      await product.update({
        code,
        name,
        description,
        category,
        costPrice: parseFloat(costPrice || 0),
        salePrice: parseFloat(salePrice || 0),
        stockQuantity: 0,
        minStock: 0,
        unit: unit || product.unit || 'servico',
        notes
      });

      res.json(product);
    } catch (error) {
      console.error('Erro ao atualizar servico:', error);
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: error.errors.map(e => e.message)
        });
      }
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Desativar servico (soft delete)
  async destroy(req, res) {
    try {
      const { id } = req.params;

      const product = await Product.findOne({
        where: {
          id,
          companyId: req.user.companyId,
          isActive: true
        }
      });

      if (!product) {
        return res.status(404).json({ error: 'Servico nao encontrado' });
      }

      await product.update({ isActive: false });

      res.json({ message: 'Servico removido com sucesso' });
    } catch (error) {
      console.error('Erro ao remover servico:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Buscar servicos para autocomplete/proposta
  async search(req, res) {
    try {
      const { q } = req.query;

      if (!q || q.length < 2) {
        return res.json([]);
      }

      const products = await Product.findAll({
        where: {
          companyId: req.user.companyId,
          isActive: true,
          [Op.or]: [
            { name: { [Op.iLike]: `%${q}%` } },
            { code: { [Op.iLike]: `%${q}%` } },
            { description: { [Op.iLike]: `%${q}%` } }
          ]
        },
        limit: 10,
        attributes: ['id', 'code', 'name', 'description', 'salePrice', 'unit'],
        order: [['name', 'ASC']]
      });

      res.json(products);
    } catch (error) {
      console.error('Erro ao buscar servicos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Servicos digitais nao usam alerta de quantidade
  async lowStock(req, res) {
    try {
      res.json([]);
    } catch (error) {
      console.error('Erro ao consultar alerta de quantidade:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Buscar categorias disponíveis
  async categories(req, res) {
    try {
      const categories = await Product.findAll({
        where: {
          companyId: req.user.companyId,
          isActive: true
        },
        attributes: [
          [Product.sequelize.fn('DISTINCT', Product.sequelize.col('category')), 'category']
        ],
        raw: true
      });

      const categoryList = categories
        .map(c => c.category)
        .filter(c => c) // Remove null/undefined
        .sort();

      res.json(categoryList);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

module.exports = new ProductController();
