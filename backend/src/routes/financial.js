const express = require('express');
const router = express.Router();
const { Payable, Receivable, Client, Sale } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// All financial routes require authentication
router.use(authenticateToken);

// === PAYABLES ===

// Get all payables
router.get('/payables', async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;

    const offset = (page - 1) * limit;
    const where = { companyId };

    if (status) where.status = status;
    if (startDate && endDate) {
      where.dueDate = {
        [require('sequelize').Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const payables = await Payable.findAndCountAll({
      where,
      order: [['dueDate', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      payables: payables.rows,
      total: payables.count,
      page: parseInt(page),
      totalPages: Math.ceil(payables.count / limit)
    });
  } catch (error) {
    console.error('Get payables error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Create payable
router.post('/payables', async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { description, category, amount, dueDate, supplier, notes, paymentMethod } = req.body;

    const payable = await Payable.create({
      companyId,
      description,
      category,
      amount,
      dueDate,
      supplier,
      notes,
      paymentMethod: paymentMethod || null,
      status: 'pending'
    });

    res.status(201).json(payable);
  } catch (error) {
    console.error('Create payable error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Update payable
router.put('/payables/:id', async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { id } = req.params;
    const updates = req.body;

    const payable = await Payable.findOne({ where: { id, companyId } });
    if (!payable) {
      return res.status(404).json({ error: 'Conta a pagar não encontrada' });
    }

    await payable.update(updates);
    res.json(payable);
  } catch (error) {
    console.error('Update payable error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.patch('/payables/:id', async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { id } = req.params;
    const payable = await Payable.findOne({ where: { id, companyId } });

    if (!payable) {
      return res.status(404).json({ error: 'Conta a pagar nao encontrada' });
    }

    await payable.update(req.body);
    res.json(payable);
  } catch (error) {
    console.error('Patch payable error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.post('/payables/:id/pay', async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { id } = req.params;
    const { paymentMethod = 'pix', paymentDate = new Date(), notes } = req.body;
    const payable = await Payable.findOne({ where: { id, companyId } });

    if (!payable) {
      return res.status(404).json({ error: 'Conta a pagar nao encontrada' });
    }

    await payable.update({
      status: 'paid',
      paymentMethod,
      paymentDate,
      notes: notes || payable.notes
    });

    res.json(payable);
  } catch (error) {
    console.error('Pay payable error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Delete payable
router.delete('/payables/:id', async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { id } = req.params;

    const payable = await Payable.findOne({ where: { id, companyId } });
    if (!payable) {
      return res.status(404).json({ error: 'Conta a pagar não encontrada' });
    }

    await payable.update({
      status: 'cancelled',
      notes: [payable.notes, `[AUDITORIA ${new Date().toISOString()}] Cancelado por ${req.user.name}`].filter(Boolean).join('\n')
    });
    res.json({ message: 'Conta a pagar cancelada sem exclusão física' });
  } catch (error) {
    console.error('Delete payable error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// === RECEIVABLES ===

// Get all receivables
router.get('/receivables', async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { page = 1, limit = 10, status, startDate, endDate } = req.query;

    const offset = (page - 1) * limit;
    const where = { companyId };

    if (status) where.status = status;
    if (startDate && endDate) {
      where.dueDate = {
        [require('sequelize').Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const receivables = await Receivable.findAndCountAll({
      where,
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['name'],
          required: false
        },
        {
          model: Sale,
          as: 'sale',
          attributes: ['saleNumber'],
          required: false
        }
      ],
      order: [['dueDate', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      receivables: receivables.rows,
      total: receivables.count,
      page: parseInt(page),
      totalPages: Math.ceil(receivables.count / limit)
    });
  } catch (error) {
    console.error('Get receivables error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Create receivable
router.post('/receivables', async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { saleId, clientId, description, amount, dueDate, notes, paymentMethod } = req.body;

    const receivable = await Receivable.create({
      companyId,
      saleId,
      clientId,
      description,
      amount,
      dueDate,
      notes,
      paymentMethod: paymentMethod || null,
      status: 'pending'
    });

    res.status(201).json(receivable);
  } catch (error) {
    console.error('Create receivable error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Update receivable
router.put('/receivables/:id', async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { id } = req.params;
    const updates = req.body;

    const receivable = await Receivable.findOne({ where: { id, companyId } });
    if (!receivable) {
      return res.status(404).json({ error: 'Conta a receber não encontrada' });
    }

    await receivable.update(updates);
    res.json(receivable);
  } catch (error) {
    console.error('Update receivable error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.patch('/receivables/:id', async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { id } = req.params;
    const receivable = await Receivable.findOne({ where: { id, companyId } });

    if (!receivable) {
      return res.status(404).json({ error: 'Conta a receber nao encontrada' });
    }

    await receivable.update(req.body);
    res.json(receivable);
  } catch (error) {
    console.error('Patch receivable error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.post('/receivables/:id/receive', async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { id } = req.params;
    const { paymentMethod = 'pix', paymentDate = new Date(), notes } = req.body;
    const receivable = await Receivable.findOne({ where: { id, companyId } });

    if (!receivable) {
      return res.status(404).json({ error: 'Conta a receber nao encontrada' });
    }

    await receivable.update({
      status: 'paid',
      paymentMethod,
      paymentDate,
      notes: notes || receivable.notes
    });

    res.json(receivable);
  } catch (error) {
    console.error('Receive receivable error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Delete receivable
router.delete('/receivables/:id', async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { id } = req.params;

    const receivable = await Receivable.findOne({ where: { id, companyId } });
    if (!receivable) {
      return res.status(404).json({ error: 'Conta a receber não encontrada' });
    }

    await receivable.update({
      status: 'cancelled',
      notes: [receivable.notes, `[AUDITORIA ${new Date().toISOString()}] Cancelado por ${req.user.name}`].filter(Boolean).join('\n')
    });
    res.json({ message: 'Conta a receber cancelada sem exclusão física' });
  } catch (error) {
    console.error('Delete receivable error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// === FINANCIAL SUMMARY ===
router.get('/summary', async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // Monthly payables
    const monthlyPayables = await Payable.sum('amount', {
      where: {
        companyId,
        status: 'pending',
        dueDate: {
          [require('sequelize').Op.gte]: currentMonth,
          [require('sequelize').Op.lt]: nextMonth
        }
      }
    }) || 0;

    // Monthly receivables
    const monthlyReceivables = await Receivable.sum('amount', {
      where: {
        companyId,
        status: 'pending',
        dueDate: {
          [require('sequelize').Op.gte]: currentMonth,
          [require('sequelize').Op.lt]: nextMonth
        }
      }
    }) || 0;

    // Overdue payables
    const overduePayables = await Payable.sum('amount', {
      where: {
        companyId,
        status: 'pending',
        dueDate: { [require('sequelize').Op.lt]: new Date() }
      }
    }) || 0;

    // Overdue receivables
    const overdueReceivables = await Receivable.sum('amount', {
      where: {
        companyId,
        status: 'pending',
        dueDate: { [require('sequelize').Op.lt]: new Date() }
      }
    }) || 0;

    res.json({
      monthlyPayables: parseFloat(monthlyPayables),
      monthlyReceivables: parseFloat(monthlyReceivables),
      overduePayables: parseFloat(overduePayables),
      overdueReceivables: parseFloat(overdueReceivables)
    });
  } catch (error) {
    console.error('Financial summary error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
