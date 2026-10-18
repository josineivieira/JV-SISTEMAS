const Company = require('./Company');
const User = require('./User');
const Client = require('./Client');
const Product = require('./Product');
const Sale = require('./Sale');
const SaleItem = require('./SaleItem');
const Payable = require('./Payable');
const Receivable = require('./Receivable');
const Lead = require('./Lead');
const Project = require('./Project');
const Contract = require('./Contract');
const LogisticsProcess = require('./LogisticsProcess');
const OperationalDocument = require('./OperationalDocument');
const StockBalance = require('./StockBalance');
const StockMovement = require('./StockMovement');

// Company associations
Company.hasMany(User, { foreignKey: 'companyId', as: 'users' });
Company.hasMany(Client, { foreignKey: 'companyId', as: 'clients' });
Company.hasMany(Product, { foreignKey: 'companyId', as: 'products' });
Company.hasMany(Sale, { foreignKey: 'companyId', as: 'sales' });
Company.hasMany(Payable, { foreignKey: 'companyId', as: 'payables' });
Company.hasMany(Receivable, { foreignKey: 'companyId', as: 'receivables' });
Company.hasMany(Lead, { foreignKey: 'companyId', as: 'leads' });
Company.hasMany(Project, { foreignKey: 'companyId', as: 'projects' });
Company.hasMany(Contract, { foreignKey: 'companyId', as: 'contracts' });
Company.hasMany(LogisticsProcess, { foreignKey: 'companyId', as: 'logisticsProcesses' });
Company.hasMany(OperationalDocument, { foreignKey: 'companyId', as: 'operationalDocuments' });
Company.hasMany(StockBalance, { foreignKey: 'companyId', as: 'stockBalances' });
Company.hasMany(StockMovement, { foreignKey: 'companyId', as: 'stockMovements' });

// User associations
User.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
User.hasMany(Sale, { foreignKey: 'userId', as: 'sales' });

// Client associations
Client.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Client.hasMany(Sale, { foreignKey: 'clientId', as: 'sales' });
Client.hasMany(Receivable, { foreignKey: 'clientId', as: 'receivables' });

// Product associations
Product.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Product.hasMany(SaleItem, { foreignKey: 'productId', as: 'saleItems' });

// Sale associations
Sale.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Sale.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Sale.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });
Sale.hasMany(SaleItem, { foreignKey: 'saleId', as: 'items' });
Sale.hasMany(Receivable, { foreignKey: 'saleId', as: 'receivables' });
Sale.hasMany(LogisticsProcess, { foreignKey: 'saleId', as: 'logisticsProcesses' });

// SaleItem associations
SaleItem.belongsTo(Sale, { foreignKey: 'saleId', as: 'sale' });
SaleItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Payable associations
Payable.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// Receivable associations
Receivable.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Receivable.belongsTo(Sale, { foreignKey: 'saleId', as: 'sale' });
Receivable.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });

// Lead associations
Lead.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Lead.hasOne(Project, { foreignKey: 'leadId', as: 'project' });

// Project associations
Project.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Project.belongsTo(Lead, { foreignKey: 'leadId', as: 'lead' });
Project.hasMany(Contract, { foreignKey: 'projectId', as: 'contracts' });

// Contract associations
Contract.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Contract.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// Logistics process associations
LogisticsProcess.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
LogisticsProcess.belongsTo(Sale, { foreignKey: 'saleId', as: 'sale' });
OperationalDocument.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
OperationalDocument.belongsTo(OperationalDocument, { foreignKey: 'originDocumentId', as: 'origin' });
OperationalDocument.hasMany(OperationalDocument, { foreignKey: 'originDocumentId', as: 'children' });
OperationalDocument.hasMany(StockMovement, { foreignKey: 'operationalDocumentId', as: 'stockMovements' });
StockMovement.belongsTo(OperationalDocument, { foreignKey: 'operationalDocumentId', as: 'document' });

module.exports = {
  Company,
  User,
  Client,
  Product,
  Sale,
  SaleItem,
  Payable,
  Receivable,
  Lead,
  Project,
  Contract,
  LogisticsProcess,
  OperationalDocument,
  StockBalance,
  StockMovement
};
