const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OperationalDocument = sequelize.define('OperationalDocument', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'companies', key: 'id' }
  },
  originDocumentId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'operational_documents', key: 'id' }
  },
  linkedDocumentIds: { type: DataTypes.JSON, defaultValue: [] },
  transactionCode: { type: DataTypes.STRING(12), allowNull: false },
  documentNumber: { type: DataTypes.STRING(40), allowNull: false },
  module: { type: DataTypes.STRING(30), allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  partner: { type: DataTypes.STRING },
  reference: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING(30), defaultValue: 'Criado' },
  data: { type: DataTypes.JSON, defaultValue: {} },
  history: { type: DataTypes.JSON, defaultValue: [] },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'operational_documents',
  timestamps: true,
  indexes: [
    { fields: ['companyId', 'transactionCode'] },
    { fields: ['originDocumentId'] },
    { unique: true, fields: ['companyId', 'documentNumber'] }
  ]
});

module.exports = OperationalDocument;
