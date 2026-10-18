const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StockMovement = sequelize.define('StockMovement', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, allowNull: false, references: { model: 'companies', key: 'id' } },
  operationalDocumentId: { type: DataTypes.UUID, allowNull: false, references: { model: 'operational_documents', key: 'id' } },
  materialCode: { type: DataTypes.STRING, allowNull: false },
  movementType: { type: DataTypes.STRING(4), allowNull: false },
  quantity: { type: DataTypes.DECIMAL(14, 3), allowNull: false },
  plant: { type: DataTypes.STRING, allowNull: false },
  storageLocation: { type: DataTypes.STRING, allowNull: false },
  destinationPlant: { type: DataTypes.STRING },
  destinationStorageLocation: { type: DataTypes.STRING },
  userName: { type: DataTypes.STRING, allowNull: false },
  text: { type: DataTypes.STRING }
}, { tableName: 'stock_movements', timestamps: true });

module.exports = StockMovement;
