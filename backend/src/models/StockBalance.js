const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StockBalance = sequelize.define('StockBalance', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false, references: { model: 'companies', key: 'id' } },
  materialCode: { type: DataTypes.STRING, allowNull: false },
  materialDescription: { type: DataTypes.STRING },
  plant: { type: DataTypes.STRING, allowNull: false, defaultValue: '1000' },
  storageLocation: { type: DataTypes.STRING, allowNull: false, defaultValue: '0001' },
  unrestricted: { type: DataTypes.DECIMAL(14, 3), defaultValue: 0 },
  reserved: { type: DataTypes.DECIMAL(14, 3), defaultValue: 0 },
  blocked: { type: DataTypes.DECIMAL(14, 3), defaultValue: 0 },
  unit: { type: DataTypes.STRING, defaultValue: 'UN' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'stock_balances', timestamps: true,
  indexes: [{ unique: true, fields: ['companyId', 'materialCode', 'plant', 'storageLocation'] }]
});

module.exports = StockBalance;
