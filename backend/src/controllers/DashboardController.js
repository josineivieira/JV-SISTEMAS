const { Op } = require('sequelize');
const { Sale, Client, Product, Payable, Receivable, User, Project, Contract, Lead } = require('../models');

class DashboardController {
  // Get dashboard summary
  async getSummary(req, res) {
    try {
      const companyId = req.user.companyId;
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const nextMonth = new Date(currentMonth);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const monthlyRevenue = await Receivable.sum('amount', {
        where: {
          companyId,
          status: 'paid',
          paymentDate: {
            [Op.gte]: currentMonth,
            [Op.lt]: nextMonth
          }
        }
      }) || 0;

      const monthlyPaidCosts = await Payable.sum('amount', {
        where: {
          companyId,
          status: 'paid',
          paymentDate: {
            [Op.gte]: currentMonth,
            [Op.lt]: nextMonth
          }
        }
      }) || 0;

      // Pending payables
      const pendingPayables = await Payable.sum('amount', {
        where: {
          companyId,
          status: 'pending'
        }
      }) || 0;

      // Pending receivables
      const pendingReceivables = await Receivable.sum('amount', {
        where: {
          companyId,
          status: 'pending'
        }
      }) || 0;

      // Total clients
      const totalClients = await Client.count({
        where: { companyId, isActive: true }
      });

      // Total sales this month
      const totalSales = await Sale.count({
        where: {
          companyId,
          saleDate: {
            [Op.gte]: currentMonth,
            [Op.lt]: nextMonth
          }
        }
      });

      const openProjects = await Project.count({
        where: {
          companyId,
          isActive: true,
          status: { [Op.notIn]: ['delivered', 'support'] }
        }
      });

      const activeContracts = await Contract.count({
        where: {
          companyId,
          isActive: true,
          status: 'active'
        }
      });

      const newLeads = await Lead.count({
        where: {
          companyId,
          isActive: true,
          status: { [Op.in]: ['new', 'contacted', 'proposal'] }
        }
      });

      // Low stock products
      const lowStockProducts = await Product.count({
        where: {
          companyId,
          isActive: true,
          stockQuantity: {
            [Op.lte]: Product.sequelize.col('minStock')
          },
          minStock: {
            [Op.gt]: 0
          }
        }
      });

      // Recent sales
      const recentSales = await Sale.findAll({
        where: { companyId },
        include: [
          { model: Client, as: 'client', attributes: ['name'] },
          { model: User, as: 'user', attributes: ['name'] }
        ],
        order: [['createdAt', 'DESC']],
        limit: 5,
        attributes: ['id', 'total', 'status', 'saleDate']
      });

      res.json({
        monthlyRevenue: parseFloat(monthlyRevenue),
        monthlyCosts: parseFloat(monthlyPaidCosts),
        netCash: parseFloat(monthlyRevenue) - parseFloat(monthlyPaidCosts),
        pendingPayables: parseFloat(pendingPayables),
        pendingReceivables: parseFloat(pendingReceivables),
        totalClients,
        totalSales,
        openProjects,
        activeContracts,
        newLeads,
        lowStockProducts,
        recentSales: recentSales.map(sale => ({
          id: sale.id,
          total: parseFloat(sale.total),
          status: sale.status,
          saleDate: sale.saleDate,
          clientName: sale.client?.name || 'Cliente não informado',
          userName: sale.user?.name
        }))
      });
    } catch (error) {
      console.error('Dashboard summary error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Get sales chart data
  async getSalesChart(req, res) {
    try {
      const companyId = req.user.companyId;
      const { period = 'month' } = req.query;

      let dateFormat, groupBy;
      if (period === 'month') {
        dateFormat = 'YYYY-MM';
        groupBy = 'month';
      } else if (period === 'week') {
        dateFormat = 'YYYY-WW';
        groupBy = 'week';
      } else {
        dateFormat = 'YYYY-MM-DD';
        groupBy = 'day';
      }

      const dateExpression =
        period === 'week'
          ? "to_char(\"saleDate\", 'IYYY-IW')"
          : period === 'day'
          ? "to_char(\"saleDate\", 'YYYY-MM-DD')"
          : "to_char(\"saleDate\", 'YYYY-MM')";

      const salesData = await Sale.findAll({
        where: {
          companyId,
          status: { [Op.in]: ['confirmed', 'shipped', 'delivered'] }
        },
        attributes: [
          [Product.sequelize.literal(dateExpression), 'period'],
          [Product.sequelize.fn('SUM', Product.sequelize.col('total')), 'total']
        ],
        group: [Product.sequelize.literal(dateExpression)],
        order: [[Product.sequelize.literal(dateExpression), 'ASC']],
        raw: true
      });

      res.json(salesData.map(item => ({
        period: item.period,
        total: parseFloat(item.total)
      })));
    } catch (error) {
      console.error('Sales chart error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Get alerts
  async getAlerts(req, res) {
    try {
      const companyId = req.user.companyId;
      const alerts = [];

      // Overdue payables
      const overduePayables = await Payable.findAll({
        where: {
          companyId,
          status: 'pending',
          dueDate: { [Op.lt]: new Date() }
        },
        order: [['dueDate', 'ASC']],
        limit: 5
      });

      overduePayables.forEach(payable => {
        alerts.push({
          type: 'warning',
          title: 'Conta a pagar vencida',
          message: `${payable.description} - R$ ${payable.amount}`,
          date: payable.dueDate
        });
      });

      // Overdue receivables
      const overdueReceivables = await Receivable.findAll({
        where: {
          companyId,
          status: 'pending',
          dueDate: { [Op.lt]: new Date() }
        },
        order: [['dueDate', 'ASC']],
        limit: 5
      });

      overdueReceivables.forEach(receivable => {
        alerts.push({
          type: 'danger',
          title: 'Conta a receber vencida',
          message: `${receivable.description} - R$ ${receivable.amount}`,
          date: receivable.dueDate
        });
      });

      // Low stock products
      const lowStockProducts = await Product.findAll({
        where: {
          companyId,
          isActive: true,
          stockQuantity: {
            [Op.lte]: Product.sequelize.col('minStock')
          },
          minStock: {
            [Op.gt]: 0
          }
        },
        order: [['stockQuantity', 'ASC']],
        limit: 5
      });

      lowStockProducts.forEach(product => {
        alerts.push({
          type: 'info',
          title: 'Estoque baixo',
          message: `${product.name} - ${product.stockQuantity} unidades`,
          date: new Date()
        });
      });

      // Sort alerts by date (most recent first)
      alerts.sort((a, b) => new Date(b.date) - new Date(a.date));

      res.json(alerts.slice(0, 10));
    } catch (error) {
      console.error('Alerts error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

module.exports = new DashboardController();
