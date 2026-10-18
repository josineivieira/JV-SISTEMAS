const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Project = sequelize.define('Project', {
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
  leadId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'leads',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  clientName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  projectType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('briefing', 'development', 'client_waiting', 'testing', 'delivered', 'support'),
    defaultValue: 'briefing'
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  value: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  deadline: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  nextStep: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
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
  tableName: 'projects',
  timestamps: true
});

module.exports = Project;
