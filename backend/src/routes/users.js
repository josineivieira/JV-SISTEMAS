const express = require('express');
const router = express.Router();
const { User, Company } = require('../models');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// All user routes require authentication
router.use(authenticateToken);

// Get all users (company users)
router.get('/', authorizeRoles('admin'), async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    const users = await User.findAndCountAll({
      where: { companyId },
      attributes: ['id', 'name', 'email', 'role', 'isActive', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      users: users.rows,
      total: users.count,
      page: parseInt(page),
      totalPages: Math.ceil(users.count / limit)
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Get user by ID
router.get('/:id', authorizeRoles('admin'), async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { id } = req.params;

    const user = await User.findOne({
      where: { id, companyId },
      attributes: ['id', 'name', 'email', 'role', 'isActive', 'createdAt', 'updatedAt']
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Create new user
router.post('/', authorizeRoles('admin'), async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { name, email, password, role = 'employee' } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const user = await User.create({
      companyId,
      name,
      email,
      password,
      role,
      isActive: true
    });

    // Return user without password
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt
    };

    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Update user
router.put('/:id', authorizeRoles('admin'), async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { id } = req.params;
    const { name, email, role, isActive, password } = req.body;

    const user = await User.findOne({ where: { id, companyId } });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }
    }

    const updates = { name, email, role, isActive };

    // Hash new password if provided
    if (password) {
      updates.password = password;
    }

    await user.update(updates);

    // Return updated user without password
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      updatedAt: user.updatedAt
    };

    res.json(userResponse);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Delete user
router.delete('/:id', authorizeRoles('admin'), async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { id } = req.params;

    // Prevent deleting self
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Não é possível excluir seu próprio usuário' });
    }

    const user = await User.findOne({ where: { id, companyId } });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    await user.update({ isActive: false });
    res.json({ message: 'Usuário inativado sem exclusão física' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Get current user profile
router.get('/profile/me', async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{
        model: Company,
        as: 'company',
        attributes: ['id', 'name', 'fantasyName', 'cnpj']
      }],
      attributes: ['id', 'name', 'email', 'role', 'isActive', 'createdAt']
    });

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Update current user profile
router.put('/profile/me', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }
    }

    const updates = { name, email };

    // Hash new password if provided
    if (password) {
      updates.password = password;
    }

    await user.update(updates);

    // Return updated user without password
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      updatedAt: user.updatedAt
    };

    res.json(userResponse);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
