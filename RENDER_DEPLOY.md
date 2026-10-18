# Deploy na Render

Este projeto sobe na Render com 3 recursos:

- PostgreSQL: banco de dados
- Web Service: backend Node/Express
- Web Service: frontend Next.js

## 1. Banco PostgreSQL

Crie um PostgreSQL na Render e copie a `Internal Database URL` ou `External Database URL`.

Use essa URL como `DATABASE_URL` no backend.

## 2. Backend

Crie um Web Service para a pasta `backend`.

Config:

```txt
Root Directory: backend
Build Command: npm install
Start Command: npm start
```

Variaveis de ambiente:

```env
NODE_ENV=production
PORT=10000
DATABASE_URL=cole_a_url_do_postgres_aqui
JWT_SECRET=gere_uma_chave_grande_e_segura
JWT_EXPIRES_IN=24h
FRONTEND_URL=https://seu-frontend.onrender.com
```

Se aparecer `SequelizeConnectionRefusedError` tentando conectar no banco, quase sempre e porque
`DATABASE_URL` nao foi adicionada no backend ou foi copiada errada. Sem `DATABASE_URL`, o Node
tenta usar `localhost`, mas o banco local do seu computador nao existe dentro da Render.

Depois de publicado, teste:

```txt
https://seu-backend.onrender.com/api/health
```

## 3. Frontend

Crie outro Web Service para a pasta `frontend`.

Config:

```txt
Root Directory: frontend
Build Command: npm install && npm run build
Start Command: npm run start -- -p $PORT
```

Variaveis de ambiente:

```env
NEXT_PUBLIC_API_URL=https://seu-backend.onrender.com/api
NEXT_PUBLIC_APP_NAME=JV Sistemas & Tecnologia
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## 4. Ajuste final do CORS

Depois que o frontend tiver URL definitiva, volte no backend e ajuste:

```env
FRONTEND_URL=https://seu-frontend.onrender.com
```

Redeploy no backend.

## 5. Login inicial

O backend cria dados iniciais automaticamente quando o banco estiver vazio.

```txt
Email: admin@jvsistemas.com.br
Senha: password
```

Troque essa senha depois do primeiro acesso.

## Observacoes

- Nao suba `backend/.env` nem `frontend/.env.local` para o GitHub.
- A Render fornece a porta pelo ambiente. No frontend, por isso o start usa `-p $PORT`.
- Em producao, o backend usa `DATABASE_URL` com SSL.
