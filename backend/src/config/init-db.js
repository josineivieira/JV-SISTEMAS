const { sequelize } = require('../config/database');
const { Company, User, Client, Product, Sale, SaleItem, Payable, Receivable } = require('../models');

const initializeDatabase = async () => {
  try {
    console.log('🔄 Sincronizando tabelas com o banco de dados...');

    // Força recriação das tabelas (apenas para desenvolvimento)
    await sequelize.sync({ force: false });

    console.log('✅ Tabelas sincronizadas com sucesso!');

    // Verificar se já existe uma empresa exemplo
    const existingCompany = await Company.findOne();
    if (!existingCompany) {
      console.log('📝 Criando empresa exemplo...');

      const company = await Company.create({
        name: 'JV Sistemas & Tecnologia Ltda',
        fantasyName: 'JV Sistemas',
        cnpj: '12.345.678/0001-90',
        email: 'contato@jvsistemas.com.br',
        phone: '(11) 99999-9999',
        address: 'Rua das Tecnologias, 123 - São Paulo/SP',
        primaryColor: '#3b82f6',
        secondaryColor: '#2dd4bf'
      });

      console.log('👤 Criando usuário admin...');
      await User.create({
        companyId: company.id,
        name: 'João Victor',
        email: 'admin@jvsistemas.com.br',
        password: 'password', // Será hashado pelo hook do modelo
        role: 'admin'
      });

      console.log('✅ Dados iniciais criados!');
      console.log('📧 Email do admin: admin@jvsistemas.com.br');
      console.log('🔑 Senha do admin: password');
    } else {
      console.log('ℹ️  Dados já existem no banco.');
    }

  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    process.exit(1);
  }
};

module.exports = { initializeDatabase };