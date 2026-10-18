const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

const root = __dirname

const services = [
  {
    name: 'backend',
    cwd: path.join(root, 'backend'),
    command: process.execPath,
    args: ['src/server.js'],
    out: path.join(root, 'backend-server.out.log'),
    err: path.join(root, 'backend-server.err.log'),
  },
  {
    name: 'frontend',
    cwd: path.join(root, 'frontend'),
    command: process.execPath,
    args: ['node_modules/next/dist/bin/next', 'start', '-p', '3003'],
    out: path.join(root, 'frontend-server.out.log'),
    err: path.join(root, 'frontend-server.err.log'),
  },
]

const children = new Map()

function start(service) {
  const out = fs.createWriteStream(service.out, { flags: 'a' })
  const err = fs.createWriteStream(service.err, { flags: 'a' })
  const child = spawn(service.command, service.args, {
    cwd: service.cwd,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  children.set(service.name, child)
  child.stdout.pipe(out)
  child.stderr.pipe(err)

  child.on('exit', (code, signal) => {
    children.delete(service.name)
    fs.appendFileSync(
      service.err,
      `[runner] ${service.name} exited code=${code} signal=${signal}. Restarting in 2s.\n`
    )
    setTimeout(() => start(service), 2000)
  })
}

for (const service of services) {
  fs.writeFileSync(service.out, '')
  fs.writeFileSync(service.err, '')
  start(service)
}

process.on('SIGINT', () => {
  for (const child of children.values()) child.kill()
  process.exit(0)
})

setInterval(() => {}, 60_000)
