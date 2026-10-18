# JV Sistemas ERP Logistico Desktop

Aplicativo desktop em Electron para abrir o ERP como janela instalada no Windows, no estilo SAP GUI.

## Desenvolvimento local

1. Suba o ERP local:

```bash
node run-local.js
```

2. Em outro terminal, abra o desktop:

```bash
npm install --prefix desktop
npm run dev --prefix desktop
```

Nesse modo, o desktop usa a API local configurada em `frontend/.env.local`.

## Gerar EXE usando Render

O build desktop de producao usa a API publicada na Render:

```txt
https://jv-sistemas.onrender.com/api
```

Assim o app desktop abre localmente, mas login, clientes, financeiro e demais dados usam o backend e o banco PostgreSQL da Render.

1. Gere o pacote desktop:

```bash
npm run desktop:pack
```

O executavel fica em:

```txt
desktop/dist/win-unpacked/JV Sistemas ERP Logistico.exe
```

2. Para gerar instalador Windows:

```bash
npm run desktop:dist
```

O instalador fica em `desktop/dist`.

## Trocar API do Render

Se a URL do backend mudar, atualize os scripts `desktop:build`, `desktop:pack` e `desktop:dist` no `package.json`.

Login inicial quando o banco da Render estiver vazio:

```txt
Email: admin@jvsistemas.com.br
Senha: password
```
