# Configuração do Banco de Dados PostgreSQL

## 1. Instalar PostgreSQL

### Windows
- Baixe e instale o PostgreSQL do site oficial: https://www.postgresql.org/download/windows/
- Durante a instalação, anote a senha do usuário `postgres`

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### macOS
```bash
brew install postgresql
brew services start postgresql
```

## 2. Criar Banco de Dados

Abra o terminal/psql e execute:

```sql
-- Conectar como superusuário
psql -U postgres

-- Criar banco de dados
CREATE DATABASE jvtec_erp;

-- Criar usuário (opcional, mas recomendado)
CREATE USER jvtec_user WITH PASSWORD 'sua_senha_segura';
GRANT ALL PRIVILEGES ON DATABASE jvtec_erp TO jvtec_user;

-- Sair
\q
```

## 3. Configurar Sequelize

O projeto usa Sequelize como ORM. As tabelas serão criadas automaticamente quando você executar o servidor pela primeira vez.

## 4. Executar Dados de Exemplo

Após iniciar o servidor uma vez (para criar as tabelas), execute o script `sample-data.sql`:

```bash
psql -U postgres -d jvtec_erp -f sample-data.sql
```

Ou copie e cole o conteúdo do arquivo no pgAdmin/DBeaver.

## 5. Verificar Instalação

Para verificar se tudo está funcionando:

```sql
-- Conectar ao banco
psql -U postgres -d jvtec_erp

-- Ver tabelas criadas
\dt

-- Ver dados de exemplo
SELECT * FROM companies;
SELECT * FROM users;
SELECT * FROM clients LIMIT 5;
```

## 6. Configuração do .env

Edite o arquivo `backend/.env` com suas configurações:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=jvtec_erp
DB_USER=postgres  # ou jvtec_user se criou
DB_PASSWORD=sua_senha_aqui
```

## 7. Testar Conexão

Execute o servidor backend:

```bash
cd backend
npm install
npm run dev
```

Se aparecer "✅ Database connection established successfully", está tudo certo!

## 🔐 Segurança

- Nunca use a senha `password` em produção
- Use senhas fortes e únicas
- Considere usar variáveis de ambiente para produção
- Configure backup regular do banco de dados

## 📊 Monitoramento

Para monitorar o banco em produção, considere:
- pg_stat_statements (para queries lentas)
- pgBadger (para análise de logs)
- Ferramentas como pgAdmin ou DBeaver para administração visual