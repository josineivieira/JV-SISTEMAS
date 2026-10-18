# JV Sistemas & Tecnologia - ERP SaaS

ERP SaaS multiempresa para pequenas e médias empresas controlarem operação, financeiro, clientes, vendas, estoque, usuários e configurações.

## Stack

- Frontend: Next.js 14, React, TypeScript, CSS responsivo e Lucide Icons
- Backend: Node.js, Express, JWT, Helmet, CORS e Sequelize
- Banco: PostgreSQL
- Deploy: frontend pronto para Vercel; backend pronto para Render

## Funcionalidades

- Login e cadastro de empresa com autenticação JWT
- Separação de dados por empresa via `companyId`
- Dashboard executivo com KPIs, vendas recentes e alertas
- Clientes com busca, status e dados de contato
- Produtos e estoque com alerta de estoque baixo
- Vendas, pedidos e detalhe de venda
- Financeiro com contas a pagar e receber
- Usuários e permissões por perfil
- Perfil da empresa para dados comerciais e documentos

## Rodando Localmente

Instale as dependências:

```bash
npm install --prefix backend
npm install --prefix frontend
```

Configure `backend/.env`:

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=jvtec_erp
DB_USER=postgres
DB_PASSWORD=sua_senha
JWT_SECRET=troque_por_uma_chave_segura
```

Configure `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Inicie:

```bash
npm run dev:backend
npm run dev:frontend
```

Acesse:

- Frontend: http://localhost:3000
- Login: http://localhost:3000/login
- API health: http://localhost:5000/api/health

## Build

```bash
npm run build:frontend
```

## Deploy

Vercel:

- Root directory: `frontend`
- Build command: `npm run build`
- Output: `.next`
- Variável: `NEXT_PUBLIC_API_URL=https://sua-api.onrender.com/api`

Render:

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Variáveis: `PORT`, `FRONTEND_URL`, `DB_*`, `JWT_SECRET`

## Dados Iniciais

O backend inicializa tabelas e dados de exemplo ao subir, usando `backend/src/config/init-db.js` e `backend/sample-data.sql`.

## Scripts Úteis

- `npm run dev:frontend`
- `npm run dev:backend`
- `npm run build:frontend`
- `npm run typecheck`

