const express = require('express');
const router = express.Router();
const { Company, User } = require('../models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// All company routes require authentication
router.use(authenticateToken);

// Get current company info
router.get('/me', async (req, res) => {
  try {
    const company = await Company.findByPk(req.user.companyId);
    if (!company) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    res.json(company);
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Update company info
router.put('/me', authorizeRoles('admin'), async (req, res) => {
  try {
    const company = await Company.findByPk(req.user.companyId);
    if (!company) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    const {
      name,
      fantasyName,
      cnpj,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      website,
      description
    } = req.body;

    await company.update({
      name,
      fantasyName,
      cnpj,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      website,
      description
    });

    res.json(company);
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Create new company (for super admin or registration)
router.post('/', async (req, res) => {
  try {
    const {
      name,
      fantasyName,
      cnpj,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      website,
      description,
      adminName,
      adminEmail,
      adminPassword
    } = req.body;

    // Check if CNPJ already exists
    const existingCompany = await Company.findOne({ where: { cnpj } });
    if (existingCompany) {
      return res.status(400).json({ error: 'CNPJ já cadastrado' });
    }

    // Check if admin email already exists
    const existingUser = await User.findOne({ where: { email: adminEmail } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email do administrador já cadastrado' });
    }

    // Create company
    const company = await Company.create({
      name,
      fantasyName,
      cnpj,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      website,
      description,
      isActive: true
    });

    // Create admin user
    const adminUser = await User.create({
      companyId: company.id,
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      isActive: true
    });

    // Return company and admin user (without password)
    const response = {
      company,
      adminUser: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        isActive: adminUser.isActive
      }
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Get company statistics
router.get('/me/stats', async (req, res) => {
  try {
    const companyId = req.user.companyId;

    // Get user count
    const userCount = await User.count({ where: { companyId, isActive: true } });

    // Get company info
    const company = await Company.findByPk(companyId, {
      attributes: ['createdAt', 'isActive']
    });

    res.json({
      userCount,
      createdAt: company.createdAt,
      isActive: company.isActive
    });
  } catch (error) {
    console.error('Get company stats error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
