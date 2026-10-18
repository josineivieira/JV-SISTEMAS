-- Exemplo de dados iniciais para JV ERP
-- Execute este script após criar as tabelas

-- Inserir empresa exemplo
INSERT INTO companies (id, name, fantasy_name, cnpj, email, phone, address, primary_color, secondary_color, is_active, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'JV Sistemas & Tecnologia Ltda',
  'JV Sistemas',
  '12.345.678/0001-90',
  'contato@jvsistemas.com.br',
  '(11) 99999-9999',
  'Rua das Tecnologias, 123 - São Paulo/SP',
  '#3b82f6',
  '#2dd4bf',
  true,
  NOW(),
  NOW()
);

-- Inserir usuário admin
INSERT INTO users (id, company_id, name, email, password, role, is_active, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  'João Victor',
  'admin@jvsistemas.com.br',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- senha: password
  'admin',
  true,
  NOW(),
  NOW()
);

-- Inserir alguns clientes exemplo
INSERT INTO clients (id, company_id, name, cpf_cnpj, email, phone, address, city, state, zip_code, total_purchases, is_active, created_at, updated_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Empresa ABC Ltda', '23.456.789/0001-12', 'contato@empresaabc.com.br', '(11) 88888-8888', 'Av. Paulista, 1000', 'São Paulo', 'SP', '01310-100', 15000.00, true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'João Silva', '123.456.789-00', 'joao.silva@email.com', '(11) 77777-7777', 'Rua das Flores, 456', 'São Paulo', 'SP', '01234-567', 2500.00, true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 'Maria Santos', '987.654.321-00', 'maria.santos@email.com', '(11) 66666-6666', 'Rua do Comércio, 789', 'São Paulo', 'SP', '04567-890', 3200.00, true, NOW(), NOW());

-- Inserir alguns produtos exemplo
INSERT INTO products (id, company_id, code, name, description, category, cost_price, sale_price, stock_quantity, min_stock, unit, is_active, created_at, updated_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', 'PROD001', 'Sistema ERP Básico', 'Sistema de gestão empresarial básico', 'Software', 500.00, 1200.00, 50, 10, 'licença', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440000', 'PROD002', 'App Mobile Personalizado', 'Aplicativo móvel sob medida', 'Desenvolvimento', 2000.00, 5000.00, 25, 5, 'un', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440000', 'PROD003', 'Site Institucional', 'Website responsivo para empresas', 'Web', 800.00, 2000.00, 30, 8, 'un', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440000', 'PROD004', 'Consultoria em TI', 'Consultoria especializada em tecnologia', 'Serviços', 150.00, 300.00, 100, 20, 'hora', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440000', 'PROD005', 'Manutenção de Sistemas', 'Serviços de manutenção e suporte', 'Serviços', 100.00, 200.00, 75, 15, 'hora', true, NOW(), NOW());

-- Inserir algumas vendas exemplo
INSERT INTO sales (id, company_id, client_id, user_id, sale_number, status, payment_method, payment_status, subtotal, discount, tax, total, notes, sale_date, created_at, updated_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'V001/2024', 'confirmed', 'bank_transfer', 'paid', 3200.00, 0.00, 0.00, 3200.00, 'Sistema ERP + Consultoria', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  ('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'V002/2024', 'delivered', 'pix', 'paid', 2000.00, 0.00, 0.00, 2000.00, 'Site institucional', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  ('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'V003/2024', 'confirmed', 'credit_card', 'paid', 5000.00, 500.00, 0.00, 4500.00, 'App mobile personalizado com desconto', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- Inserir itens das vendas
INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, discount, total, created_at, updated_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440005', 1, 1200.00, 0.00, 1200.00, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  ('550e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440004', 20, 300.00, 0.00, 6000.00, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  ('550e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440007', 1, 2000.00, 0.00, 2000.00, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  ('550e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440006', 1, 5000.00, 500.00, 4500.00, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- Inserir contas a pagar
INSERT INTO payables (id, company_id, description, category, amount, due_date, status, supplier, notes, created_at, updated_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440000', 'Aluguel do escritório', 'Infraestrutura', 2500.00, NOW() + INTERVAL '15 days', 'pending', 'Imobiliária XYZ', 'Aluguel mensal', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440000', 'Servidor de hospedagem', 'Tecnologia', 800.00, NOW() + INTERVAL '30 days', 'pending', 'HostGator', 'Hospedagem anual', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440000', 'Energia elétrica', 'Infraestrutura', 450.00, NOW() + INTERVAL '10 days', 'pending', 'CPFL Energia', 'Conta do mês', NOW(), NOW());

-- Inserir contas a receber
INSERT INTO receivables (id, company_id, sale_id, client_id, description, amount, due_date, status, notes, created_at, updated_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440002', 'Pagamento Sistema ERP', 3200.00, NOW() + INTERVAL '30 days', 'pending', 'Parcela única', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440003', 'Pagamento Site Institucional', 2000.00, NOW() + INTERVAL '15 days', 'pending', 'Parcela única', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440004', 'Pagamento App Mobile', 4500.00, NOW() + INTERVAL '45 days', 'pending', 'Parcela única com desconto', NOW(), NOW());

-- Atualizar totais de compras dos clientes
UPDATE clients SET total_purchases = 3200.00, last_purchase = NOW() - INTERVAL '5 days' WHERE id = '550e8400-e29b-41d4-a716-446655440002';
UPDATE clients SET total_purchases = 2000.00, last_purchase = NOW() - INTERVAL '3 days' WHERE id = '550e8400-e29b-41d4-a716-446655440003';
UPDATE clients SET total_purchases = 4500.00, last_purchase = NOW() - INTERVAL '1 day' WHERE id = '550e8400-e29b-41d4-a716-446655440004';