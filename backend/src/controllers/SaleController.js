const { Sale, SaleItem, Client, Product, User, Receivable, Contract, Project, LogisticsProcess } = require('../models');
const logisticsProcessController = require('./LogisticsProcessController');
const { Op } = require('sequelize');

class SaleController {
  constructor() {
    this.getAll = this.getAll.bind(this);
    this.getById = this.getById.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
    this.getStats = this.getStats.bind(this);
    this.createContract = this.createContract.bind(this);
    this.createProject = this.createProject.bind(this);
  }

  // Get all sales with pagination and filters
  async getAll(req, res) {
    try {
      const companyId = req.user.companyId;
      const {
        page = 1,
        limit = 10,
        status,
        clientId,
        startDate,
        endDate,
        search
      } = req.query;

      const offset = (page - 1) * limit;
      const where = { companyId };

      // Apply filters
      if (status) where.status = status;
      if (clientId) where.clientId = clientId;
      if (startDate && endDate) {
        where.saleDate = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }
      if (search) {
        where[Op.or] = [
          { saleNumber: { [Op.iLike]: `%${search}%` } },
          { '$client.name$': { [Op.iLike]: `%${search}%` } }
        ];
      }

      const sales = await Sale.findAndCountAll({
        where,
        include: [
          {
            model: Client,
            as: 'client',
            attributes: ['id', 'name', 'cpfCnpj', 'email', 'phone'],
            required: false
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
        distinct: true
      });

      res.json({
        sales: sales.rows.map(sale => ({
          id: sale.id,
          saleNumber: sale.saleNumber,
          total: parseFloat(sale.total),
          status: sale.status,
          paymentStatus: sale.paymentStatus,
          saleDate: sale.saleDate,
          notes: sale.notes,
          clientName: sale.client?.name || 'Cliente nao informado',
          clientEmail: sale.client?.email || '',
          clientPhone: sale.client?.phone || '',
          userName: sale.user?.name || 'JV Sistemas',
          client: sale.client,
          user: sale.user
        })),
        total: sales.count,
        page: parseInt(page),
        totalPages: Math.ceil(sales.count / limit)
      });
    } catch (error) {
      console.error('Get sales error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Get sale by ID
  async getById(req, res) {
    try {
      const companyId = req.user.companyId;
      const { id } = req.params;

      const sale = await Sale.findOne({
        where: { id, companyId },
        include: [
          {
            model: Client,
            as: 'client',
            attributes: ['id', 'name', 'cpfCnpj', 'email', 'phone']
          },
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name']
          },
          {
            model: SaleItem,
            as: 'items',
            include: [{
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'code', 'salePrice']
            }]
          },
          {
            model: Receivable,
            as: 'receivables',
            attributes: ['id', 'amount', 'dueDate', 'status']
          },
          {
            model: LogisticsProcess,
            as: 'logisticsProcesses',
            attributes: ['id', 'processNumber', 'stage', 'status', 'salesOrderNumber', 'freightOrderNumber', 'waveNumber', 'pickingTaskNumber', 'handlingUnit', 'shipmentNumber', 'podNumber']
          }
        ]
      });

      if (!sale) {
        return res.status(404).json({ error: 'Venda não encontrada' });
      }

      res.json(sale);
    } catch (error) {
      console.error('Get sale error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Create new sale
  async create(req, res) {
    const transaction = await Sale.sequelize.transaction();

    try {
      const companyId = req.user.companyId;
      const {
        clientId,
        items,
        discount = 0,
        tax = 0,
        notes,
        paymentMethod,
        paymentStatus = 'pending',
        dueDate,
        status = 'pending'
      } = req.body;

      if (!Array.isArray(items) || items.length === 0) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Adicione pelo menos um servico na proposta' });
      }

      // Validate client
      if (clientId) {
        const client = await Client.findOne({
          where: { id: clientId, companyId },
          transaction
        });
        if (!client) {
          await transaction.rollback();
          return res.status(400).json({ error: 'Cliente não encontrado' });
        }
      }

      // Validate and calculate items
      let subtotal = 0;
      const validatedItems = [];

      for (const item of items) {
        const product = await Product.findOne({
          where: { id: item.productId, companyId, isActive: true },
          transaction
        });

        if (!product) {
          await transaction.rollback();
          return res.status(400).json({ error: `Servico ${item.productId} nao encontrado` });
        }

        const unitPrice = item.unitPrice || product.salePrice;
        const itemTotal = unitPrice * item.quantity;
        subtotal += itemTotal;

        validatedItems.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice,
          total: itemTotal
        });
      }

      const total = subtotal - discount + tax;

      // Generate sale number
      const lastSale = await Sale.findOne({
        where: { companyId },
        order: [['createdAt', 'DESC']],
        transaction
      });
      const lastSaleNumber = Number((lastSale?.saleNumber || '').replace(/\D/g, '')) || 0;
      const saleNumber = `VA-${String(lastSaleNumber + 1).padStart(4, '0')}`;

      // Create sale
      const sale = await Sale.create({
        companyId,
        clientId,
        userId: req.user.id,
        saleNumber,
        status,
        paymentMethod,
        paymentStatus,
        subtotal,
        discount,
        tax,
        total,
        notes
      }, { transaction });

      // Create sale/proposal items. Services do not use inventory.
      for (const item of validatedItems) {
        await SaleItem.create({
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total
        }, { transaction });

      }

      await logisticsProcessController.createFromSale(sale.id, companyId, req.user.name, transaction);

      // Create receivable if payment is pending
      if (status !== 'pending' && paymentStatus === 'pending' && total > 0) {
        await Receivable.create({
          companyId,
          saleId: sale.id,
          clientId,
          description: `Recebimento venda ${saleNumber}`,
          amount: total,
          dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          status: 'pending'
        }, { transaction });
      }

      await transaction.commit();

      try {
        const completeSale = await this.getSaleWithDetails(sale.id, companyId);
        return res.status(201).json(completeSale || sale);
      } catch (detailsError) {
        console.error('Get created sale details error:', detailsError);
        return res.status(201).json(sale);
      }
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      console.error('Create sale error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Update sale
  async update(req, res) {
    try {
      const companyId = req.user.companyId;
      const { id } = req.params;
      const updates = req.body;

      const sale = await Sale.findOne({ where: { id, companyId } });
      if (!sale) {
        return res.status(404).json({ error: 'Venda não encontrada' });
      }

      const allowedUpdates = ['status', 'paymentStatus', 'notes'];
      const filteredUpdates = {};

      for (const field of allowedUpdates) {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field];
        }
      }

      if (updates.note) {
        const stampedNote = `[${new Date().toLocaleString('pt-BR')}] ${updates.note}`;
        filteredUpdates.notes = [sale.notes, stampedNote].filter(Boolean).join('\n\n');
      }

      await sale.update(filteredUpdates);

      const updatedSale = await this.getSaleWithDetails(id, companyId);
      res.json(updatedSale);
    } catch (error) {
      console.error('Update sale error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Delete sale
  async delete(req, res) {
    const transaction = await Sale.sequelize.transaction();

    try {
      const companyId = req.user.companyId;
      const { id } = req.params;

      const sale = await Sale.findOne({
        where: { id, companyId },
        include: [{ model: SaleItem, as: 'items' }],
        transaction
      });

      if (!sale) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Venda não encontrada' });
      }

      if (sale.status !== 'pending') {
        await transaction.rollback();
        return res.status(400).json({ error: 'Não é possível excluir venda confirmada' });
      }

      await Receivable.update({
        status: 'cancelled',
        notes: `[AUDITORIA ${new Date().toISOString()}] Pedido ${sale.saleNumber} cancelado por ${req.user.name}`
      }, { where: { saleId: id, companyId }, transaction });

      await sale.update({
        status: 'cancelled',
        notes: [sale.notes, `[AUDITORIA ${new Date().toISOString()}] Cancelado por ${req.user.name}`].filter(Boolean).join('\n')
      }, { transaction });

      await transaction.commit();
      res.json({ message: 'Venda cancelada sem exclusão física' });
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      console.error('Delete sale error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Get sales statistics
  async getStats(req, res) {
    try {
      const companyId = req.user.companyId;
      const { period = 'month' } = req.query;

      const currentDate = new Date();
      let startDate;

      switch (period) {
        case 'week':
          startDate = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(currentDate.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      const stats = await Sale.findAll({
        where: {
          companyId,
          status: { [Op.in]: ['confirmed', 'shipped', 'delivered'] },
          saleDate: { [Op.gte]: startDate }
        },
        attributes: [
          [Sale.sequelize.fn('COUNT', Sale.sequelize.col('id')), 'totalSales'],
          [Sale.sequelize.fn('SUM', Sale.sequelize.col('total')), 'totalRevenue'],
          [Sale.sequelize.fn('AVG', Sale.sequelize.col('total')), 'averageSale']
        ],
        raw: true
      });

      res.json({
        period,
        totalSales: parseInt(stats[0]?.totalSales || 0),
        totalRevenue: parseFloat(stats[0]?.totalRevenue || 0),
        averageSale: parseFloat(stats[0]?.averageSale || 0)
      });
    } catch (error) {
      console.error('Get sales stats error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async createContract(req, res) {
    try {
      const companyId = req.user.companyId;
      const { id } = req.params;
      const { recurrence = 'one_time', nextBillingDate } = req.body;

      const sale = await this.getSaleWithDetails(id, companyId);
      if (!sale) {
        return res.status(404).json({ error: 'Proposta nao encontrada' });
      }

      const clientName = sale.client?.name || 'Cliente sem cadastro';
      const contract = await Contract.create({
        companyId,
        clientName,
        title: `Contrato ${sale.saleNumber} - ${clientName}`,
        recurrence,
        amount: sale.total,
        nextBillingDate: nextBillingDate || new Date(),
        status: 'active',
        notes: `Gerado a partir da proposta ${sale.saleNumber}. ${sale.notes || ''}`.trim()
      });

      await sale.update({ status: 'confirmed' });

      res.status(201).json({ contract, sale });
    } catch (error) {
      console.error('Create contract from sale error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async createProject(req, res) {
    try {
      const companyId = req.user.companyId;
      const { id } = req.params;

      const sale = await this.getSaleWithDetails(id, companyId);
      if (!sale) {
        return res.status(404).json({ error: 'Proposta nao encontrada' });
      }

      const clientName = sale.client?.name || 'Cliente sem cadastro';
      const firstItem = sale.items?.[0]?.product?.name || 'Projeto sob medida';
      const project = await Project.create({
        companyId,
        title: `${sale.saleNumber} - ${firstItem}`,
        clientName,
        projectType: firstItem,
        status: 'briefing',
        progress: 10,
        value: sale.total,
        nextStep: 'Confirmar briefing, alinhar escopo final e iniciar cronograma.',
        notes: `Gerado a partir da proposta ${sale.saleNumber}. ${sale.notes || ''}`.trim()
      });

      await sale.update({ status: 'shipped' });

      res.status(201).json({ project, sale });
    } catch (error) {
      console.error('Create project from sale error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Helper method to get sale with all details
  async getSaleWithDetails(saleId, companyId) {
    return await Sale.findOne({
      where: { id: saleId, companyId },
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'cpfCnpj', 'email', 'phone']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name']
        },
        {
          model: SaleItem,
          as: 'items',
          include: [{
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'code', 'salePrice']
          }]
        },
          {
            model: Receivable,
            as: 'receivables',
            attributes: ['id', 'amount', 'dueDate', 'status']
          },
          {
            model: LogisticsProcess,
            as: 'logisticsProcesses',
            attributes: ['id', 'processNumber', 'stage', 'status', 'salesOrderNumber', 'freightOrderNumber', 'waveNumber', 'pickingTaskNumber', 'handlingUnit', 'shipmentNumber', 'podNumber']
          }
        ]
      });
  }
}

module.exports = new SaleController();
