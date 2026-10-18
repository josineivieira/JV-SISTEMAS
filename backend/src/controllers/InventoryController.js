const { StockBalance, StockMovement, OperationalDocument } = require('../models');

class InventoryController {
  async balances(req, res) {
    try {
      const balances = await StockBalance.findAll({
        where: { companyId: req.user.companyId, isActive: true },
        order: [['materialCode', 'ASC'], ['plant', 'ASC'], ['storageLocation', 'ASC']]
      });
      res.json({ balances });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao consultar saldo de estoque' });
    }
  }

  async movements(req, res) {
    try {
      const movements = await StockMovement.findAll({
        where: { companyId: req.user.companyId },
        include: [{ model: OperationalDocument, as: 'document', attributes: ['documentNumber', 'transactionCode', 'status'] }],
        order: [['createdAt', 'DESC']], limit: 1000
      });
      res.json({ movements });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao consultar movimentos de estoque' });
    }
  }
}

module.exports = new InventoryController();
