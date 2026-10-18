const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Company } = require('../models');

class AuthController {
  // Login
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      const user = await User.findOne({
        where: { email, isActive: true },
        include: [{ model: Company, as: 'company' }]
      });

      if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const isValidPassword = await user.checkPassword(password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Update last login
      await user.update({ lastLogin: new Date() });

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          companyId: user.companyId
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          company: {
            id: user.company.id,
            name: user.company.name,
            fantasyName: user.company.fantasyName
          }
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Register company and first user
  async register(req, res) {
    try {
      const { companyName, companyCnpj, companyEmail, userName, userEmail, password } = req.body;

      // Validate required fields
      if (!companyName || !companyCnpj || !companyEmail || !userName || !userEmail || !password) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
      }

      // Check if company already exists
      const existingCompany = await Company.findOne({
        where: { cnpj: companyCnpj }
      });

      if (existingCompany) {
        return res.status(400).json({ error: 'CNPJ já cadastrado' });
      }

      // Check if user email already exists
      const existingUser = await User.findOne({
        where: { email: userEmail }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email já cadastrado' });
      }

      // Create company
      const company = await Company.create({
        name: companyName,
        cnpj: companyCnpj,
        email: companyEmail
      });

      // Create admin user
      const user = await User.create({
        companyId: company.id,
        name: userName,
        email: userEmail,
        password: password,
        role: 'admin'
      });

      // Generate token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          companyId: user.companyId
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.status(201).json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          company: {
            id: company.id,
            name: company.name
          }
        }
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Get current user profile
  async getProfile(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        include: [{ model: Company, as: 'company' }]
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: {
          id: user.company.id,
          name: user.company.name,
          fantasyName: user.company.fantasyName,
          cnpj: user.company.cnpj,
          email: user.company.email,
          phone: user.company.phone,
          address: user.company.address,
          logo: user.company.logo,
          primaryColor: user.company.primaryColor,
          secondaryColor: user.company.secondaryColor
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      const { name, email } = req.body;
      const user = await User.findByPk(req.user.id);

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      await user.update({ name, email });

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Change password
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
      }

      const user = await User.findByPk(req.user.id);

      const isValidPassword = await user.checkPassword(currentPassword);
      if (!isValidPassword) {
        return res.status(400).json({ error: 'Senha atual incorreta' });
      }

      await user.update({ password: newPassword });

      res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

module.exports = new AuthController();