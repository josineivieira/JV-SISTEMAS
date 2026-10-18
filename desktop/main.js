const { app, BrowserWindow, Menu, dialog } = require('electron')
const http = require('http')
const https = require('https')
const path = require('path')

const APP_NAME = 'JV Sistemas ERP Logistico'
const PORT = process.env.JV_ERP_DESKTOP_PORT || '3003'
const HOST = 'localhost'
const LOGIN_URL = process.env.JV_ERP_URL || `http://${HOST}:${PORT}/login`

let mainWindow
let nextServerStarted = false

function resolveAppPath(...segments) {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, ...segments)
  }
  return path.join(__dirname, '..', ...segments)
}

function resolveIcon() {
  const filename = 'jv-sistemas-logo-transparent.png'
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'frontend', 'public', filename)
  }
  return path.join(__dirname, '..', 'frontend', 'public', filename)
}

function appUrl(pathname) {
  const url = new URL(LOGIN_URL)
  url.pathname = pathname
  url.search = ''
  url.hash = ''
  return url.toString()
}

function waitForServer(url, attempts = 80) {
  return new Promise((resolve, reject) => {
    const probe = (remaining) => {
      const client = url.startsWith('https:') ? https : http
      const request = client.get(url, (response) => {
        response.resume()
        resolve()
      })

      request.on('error', () => {
        if (remaining <= 0) {
          reject(new Error(`Servidor nao respondeu em ${url}`))
          return
        }
        setTimeout(() => probe(remaining - 1), 350)
      })

      request.setTimeout(1500, () => {
        request.destroy()
      })
    }

    probe(attempts)
  })
}

function startPackagedNextServer() {
  if (nextServerStarted || !app.isPackaged || process.env.JV_ERP_URL) return

  const candidates = [
    path.join(process.resourcesPath, 'frontend', 'server.js'),
    path.join(process.resourcesPath, 'frontend', 'frontend', 'server.js'),
  ]
  const serverPath = candidates.find((candidate) => {
    try {
      return require('fs').existsSync(candidate)
    } catch {
      return false
    }
  })

  if (!serverPath) {
    dialog.showErrorBox(
      'Build desktop incompleto',
      'Nao foi encontrado o servidor standalone do ERP. Rode npm run build --prefix frontend antes de gerar o instalador.'
    )
    return
  }

  process.env.NODE_ENV = 'production'
  process.env.PORT = PORT
  process.env.HOSTNAME = HOST
  process.chdir(path.dirname(serverPath))
  require(serverPath)
  nextServerStarted = true
}

function createMenu() {
  const template = [
    {
      label: 'Sistema',
      submenu: [
        { label: 'Tela inicial', click: () => mainWindow?.loadURL(appUrl('/dashboard')) },
        { label: 'Login', click: () => mainWindow?.loadURL(LOGIN_URL) },
        { type: 'separator' },
        { label: 'Sair da sessao', click: () => mainWindow?.webContents.send('jv-logout') },
        { label: 'Fechar', role: 'quit' },
      ],
    },
    {
      label: 'Editar',
      submenu: [
        { label: 'Desfazer', role: 'undo' },
        { label: 'Refazer', role: 'redo' },
        { type: 'separator' },
        { label: 'Copiar', role: 'copy' },
        { label: 'Colar', role: 'paste' },
        { label: 'Selecionar tudo', role: 'selectAll' },
      ],
    },
    {
      label: 'Favoritos',
      submenu: [
        { label: 'Painel comercial', click: () => mainWindow?.loadURL(appUrl('/dashboard')) },
        { label: 'Monitor EWM', click: () => mainWindow?.loadURL(appUrl('/dashboard/warehouse')) },
        { label: 'Transportes', click: () => mainWindow?.loadURL(appUrl('/dashboard/shipments')) },
        { label: 'Tracking', click: () => mainWindow?.loadURL(appUrl('/dashboard/tracking')) },
        { label: 'Fiscal', click: () => mainWindow?.loadURL(appUrl('/dashboard/nfse')) },
      ],
    },
    {
      label: 'Ambiente',
      submenu: [
        { label: 'Recarregar', role: 'reload' },
        { label: 'Forcar recarga', role: 'forceReload' },
        { label: 'Tela cheia', role: 'togglefullscreen' },
        { type: 'separator' },
        { label: 'Ferramentas do desenvolvedor', role: 'toggleDevTools' },
      ],
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Sobre',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: `Sobre ${APP_NAME}`,
              message: APP_NAME,
              detail: 'ERP logistico desktop no estilo SAP GUI.\nMandante 100 - Producao',
            })
          },
        },
      ],
    },
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

function createWindow() {
  mainWindow = new BrowserWindow({
    title: APP_NAME,
    minWidth: 1280,
    minHeight: 720,
    width: 1366,
    height: 768,
    show: false,
    icon: resolveIcon(),
    backgroundColor: '#d7e0e8',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize()
    mainWindow.show()
  })

  waitForServer(LOGIN_URL)
    .then(() => mainWindow.loadURL(LOGIN_URL))
    .catch((error) => {
      dialog.showErrorBox('ERP indisponivel', error.message)
      mainWindow.loadURL(LOGIN_URL)
    })
}

app.whenReady().then(() => {
  startPackagedNextServer()
  createMenu()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
