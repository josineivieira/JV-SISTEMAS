const { Client } = require('../models');
const { Op } = require('sequelize');

class ClientController {
  // Listar todos os clientes da empresa
  async index(req, res) {
    try {
      const { page = 1, limit = 10, search = '' } = req.query;
      const offset = (page - 1) * limit;

      const where = {
        companyId: req.user.companyId,
        isActive: true
      };

      // Adicionar busca por nome, email ou CPF/CNPJ
      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { cpfCnpj: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows: clients } = await Client.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['name', 'ASC']]
      });

      res.json({
        clients,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit),
          limit: parseInt(limit)
        }
      });
    } catch (error) {
      console.error('Erro ao listar clientes:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Buscar cliente por ID
  async show(req, res) {
    try {
      const { id } = req.params;

      const client = await Client.findOne({
        where: {
          id,
          companyId: req.user.companyId,
          isActive: true
        }
      });

      if (!client) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      res.json(client);
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Criar novo cliente
  async store(req, res) {
    try {
      const {
        name,
        cpfCnpj: rawCpfCnpj,
        document,
        email,
        phone,
        address,
        city,
        state,
        zipCode,
        notes
      } = req.body;
      const cpfCnpj = rawCpfCnpj || document || null;

      if (!name) {
        return res.status(400).json({ error: 'Nome do cliente e obrigatorio' });
      }

      // Verificar se CPF/CNPJ já existe
      const existingClient = cpfCnpj ? await Client.findOne({
        where: {
          cpfCnpj,
          companyId: req.user.companyId,
          isActive: true
        }
      }) : null;

      if (existingClient) {
        return res.status(400).json({ error: 'CPF/CNPJ já cadastrado' });
      }

      const client = await Client.create({
        companyId: req.user.companyId,
        name,
        cpfCnpj,
        email,
        phone,
        address,
        city,
        state,
        zipCode,
        notes,
        totalPurchases: 0
      });

      res.status(201).json(client);
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: error.errors.map(e => e.message)
        });
      }
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Atualizar cliente
  async update(req, res) {
    try {
      const { id } = req.params;
      const {
        name,
        cpfCnpj: rawCpfCnpj,
        document,
        email,
        phone,
        address,
        city,
        state,
        zipCode,
        notes
      } = req.body;
      const cpfCnpj = rawCpfCnpj || document || null;

      if (!name) {
        return res.status(400).json({ error: 'Nome do cliente e obrigatorio' });
      }

      const client = await Client.findOne({
        where: {
          id,
          companyId: req.user.companyId,
          isActive: true
        }
      });

      if (!client) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      // Verificar se CPF/CNPJ já existe em outro cliente
      if (cpfCnpj && cpfCnpj !== client.cpfCnpj) {
        const existingClient = await Client.findOne({
          where: {
            cpfCnpj,
            companyId: req.user.companyId,
            isActive: true,
            id: { [Op.ne]: id }
          }
        });

        if (existingClient) {
          return res.status(400).json({ error: 'CPF/CNPJ já cadastrado' });
        }
      }

      await client.update({
        name,
        cpfCnpj,
        email,
        phone,
        address,
        city,
        state,
        zipCode,
        notes
      });

      res.json(client);
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          error: 'Dados inválidos',
          details: error.errors.map(e => e.message)
        });
      }
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Desativar cliente (soft delete)
  async destroy(req, res) {
    try {
      const { id } = req.params;

      const client = await Client.findOne({
        where: {
          id,
          companyId: req.user.companyId,
          isActive: true
        }
      });

      if (!client) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      await client.update({ isActive: false });

      res.json({ message: 'Cliente removido com sucesso' });
    } catch (error) {
      console.error('Erro ao remover cliente:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Buscar clientes para autocomplete
  async search(req, res) {
    try {
      const { q } = req.query;

      if (!q || q.length < 2) {
        return res.json([]);
      }

      const clients = await Client.findAll({
        where: {
          companyId: req.user.companyId,
          isActive: true,
          [Op.or]: [
            { name: { [Op.iLike]: `%${q}%` } },
            { email: { [Op.iLike]: `%${q}%` } },
            { cpfCnpj: { [Op.iLike]: `%${q}%` } }
          ]
        },
        limit: 10,
        attributes: ['id', 'name', 'email', 'cpfCnpj', 'phone'],
        order: [['name', 'ASC']]
      });

      res.json(clients);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

module.exports = new ClientController();
