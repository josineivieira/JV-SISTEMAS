const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LogisticsProcess = sequelize.define('LogisticsProcess', {
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
  saleId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'sales',
      key: 'id'
    }
  },
  processNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  stage: {
    type: DataTypes.ENUM('sales_order', 'planning', 'freight_order', 'wave', 'picking', 'packing', 'expedition', 'transport', 'pod', 'billing'),
    defaultValue: 'sales_order'
  },
  salesOrderNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  freightOrderNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  waveNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  pickingTaskNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  handlingUnit: {
    type: DataTypes.STRING,
    allowNull: true
  },
  shipmentNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  podNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  clientName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  productSummary: {
    type: DataTypes.STRING,
    allowNull: true
  },
  weight: {
    type: DataTypes.STRING,
    allowNull: true
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: true
  },
  route: {
    type: DataTypes.STRING,
    allowNull: true
  },
  carrier: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dock: {
    type: DataTypes.STRING,
    allowNull: true
  },
  plate: {
    type: DataTypes.STRING,
    allowNull: true
  },
  driver: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Planejado', 'Liberado', 'Separacao', 'Conferencia', 'Em transito', 'Entregue', 'Pendente', 'Bloqueado', 'Atrasado', 'Recebido', 'Emitido'),
    defaultValue: 'Planejado'
  },
  documents: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  events: {
    type: DataTypes.JSON,
    defaultValue: []
  }
}, {
  tableName: 'logistics_processes',
  timestamps: true,
  indexes: [
    { fields: ['companyId'] },
    { fields: ['saleId'] },
    { fields: ['stage'] },
    { unique: true, fields: ['companyId', 'processNumber'] }
  ]
});

module.exports = LogisticsProcess;
