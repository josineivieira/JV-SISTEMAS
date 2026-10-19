'use client'

import { useEffect, useState } from 'react'
import BuildText from './build-text'

const comment = '// A sua operação. A nossa próxima linha de código.'
const tokens = [
  { text: 'const', color: 'jv-purple' },
  { text: ' projeto = {\n  empresa: ' },
  { text: '"a sua"', color: 'jv-green' },
  { text: ',\n  solução: ' },
  { text: '"sob medida"', color: 'jv-green' },
  { text: ',\n  possibilidades: ' },
  { text: 'Infinity', color: 'jv-blue' },
  { text: '\n};' },
]
const codeStart = comment.length * 12 + 200
const codeEnd = codeStart + tokens.reduce((sum, token) => sum + token.text.length, 0) * 22
const output = ['$ jv iniciar --projeto', '> Entendendo a sua operação...', '> Conectando processos e pessoas...', '> Desenvolvendo novas possibilidades...', 'OK Pronto para o próximo passo.', '$ vamos construir juntos_']
const duration = codeEnd + 400 + output.length * 700

export default function TerminalBuild({ active }: { active: boolean }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!active) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setElapsed(duration); return }
    const started = performance.now()
    const timer = window.setInterval(() => {
      const next = Math.min(duration, performance.now() - started)
      setElapsed(next)
      if (next === duration) window.clearInterval(timer)
    }, 32)
    return () => window.clearInterval(timer)
  }, [active])

  let offset = codeStart
  return <div className="jv-terminal-body notranslate" translate="no" data-terminal-finished={elapsed >= duration}>
    <p className="jv-terminal-comment"><BuildText text={comment} elapsed={elapsed} speed={12} /></p>
    <pre>{tokens.map((token, index) => {
      const delay = offset
      offset += token.text.length * 22
      return <span className={token.color} key={index}><BuildText text={token.text} elapsed={elapsed} delay={delay} speed={22} /></span>
    })}</pre>
    <div className="jv-terminal-output" aria-hidden="true">{output.map((line, index) => <p key={line} className={index === 4 ? 'jv-green' : ''}><BuildText text={line} elapsed={elapsed} delay={codeEnd + 400 + index * 700} speed={14}/></p>)}</div>
  </div>
}
