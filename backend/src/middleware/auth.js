const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Token de acesso não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Token inválido ou usuário inativo' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado. Permissões insuficientes' });
    }

    next();
  };
};

const checkCompanyAccess = (req, res, next) => {
  const companyId = req.params.companyId || req.body.companyId || req.query.companyId;

  if (!companyId) {
    return res.status(400).json({ error: 'ID da empresa é obrigatório' });
  }

  if (req.user.companyId !== companyId) {
    return res.status(403).json({ error: 'Acesso negado. Empresa não autorizada' });
  }

  next();
};

module.exports = {
  authenticateToken,
  authorizeRoles,
  checkCompanyAccess
};