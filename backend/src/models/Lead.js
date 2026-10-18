const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Lead = sequelize.define('Lead', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'companies',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  projectType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  budgetRange: {
    type: DataTypes.STRING,
    allowNull: true
  },
  urgency: {
    type: DataTypes.STRING,
    allowNull: true
  },
  features: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  estimatedValue: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  source: {
    type: DataTypes.STRING,
    defaultValue: 'site'
  },
  status: {
    type: DataTypes.ENUM('new', 'contacted', 'proposal', 'won', 'lost'),
    defaultValue: 'new'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'leads',
  timestamps: true
});

module.exports = Lead;
