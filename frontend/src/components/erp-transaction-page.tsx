'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, Download, Eye, FilePlus2, Filter, Pencil, Play, Printer, RefreshCw, Save, Search, X } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import type { ErpTransaction } from '@/lib/erp-transactions'
import { transactionPredecessors } from '@/lib/erp-transactions'
import { getTransactionFields } from '@/lib/transaction-schemas'

type OperationalDocument = {
  id: string
  originDocumentId?: string
  transactionCode: string
  documentNumber: string
  module: string
  title: string
  partner?: string
  reference?: string
  status: string
  data?: Record<string, any>
  createdAt: string
  updatedAt: string
}

type ScreenMode = 'create' | 'change' | 'display'
const statuses = ['Criado', 'Em processamento', 'Conferido', 'Liberado', 'Bloqueado', 'Concluido', 'Cancelado']
const modeLabels: Record<ErpTransaction['mode'], string> = {
  create: 'Criar', change: 'Modificar', display: 'Exibir', list: 'Lista', process: 'Processar', monitor: 'Monitor',
}
const emptyForm = { originDocumentId: '', partner: '', reference: '', notes: '' }

export function ErpTransactionPage({ transaction }: { transaction: ErpTransaction }) {
  const requestedDocument = useSearchParams()?.get('document') || ''
  const [documents, setDocuments] = useState<OperationalDocument[]>([])
  const [origins, setOrigins] = useState<OperationalDocument[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [showEntry, setShowEntry] = useState(transaction.mode === 'create')
  const [showDocumentList, setShowDocumentList] = useState(transaction.mode !== 'create')
  const [screenMode, setScreenMode] = useState<ScreenMode>(transaction.mode === 'create' ? 'create' : transaction.mode === 'change' ? 'change' : 'display')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('Pronto')
  const [form, setForm] = useState<Record<string, string>>(emptyForm)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const fields = useMemo(() => getTransactionFields(transaction.code, transaction.module), [transaction.code, transaction.module])
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
  const headers = useCallback(() => ({ Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' }), [])

  const load = useCallback(async () => {
    const globalAudit = ['LOG01', 'LOG02'].includes(transaction.code)
    const moduleView = ['change', 'list', 'display', 'monitor'].includes(transaction.mode)
    const query = globalAudit ? 'all=true' : moduleView ? `module=${encodeURIComponent(transaction.module)}` : `transactionCode=${transaction.code}`
    const [documentsResponse, originsResponse] = await Promise.all([
      fetch(`${apiUrl}/operational-documents?${query}`, { headers: headers() }),
      fetch(`${apiUrl}/operational-documents/origins`, { headers: headers() }),
    ])
    if (documentsResponse.ok) {
      const data = await documentsResponse.json()
      const prefix = transaction.code.match(/^[A-Z]+/)?.[0]
      const relatedDocuments = globalAudit || !prefix
        ? data.documents || []
        : (data.documents || []).filter((item: OperationalDocument) => item.transactionCode.startsWith(prefix))
      setDocuments(relatedDocuments)
      setSelectedId((current) => requestedDocument || current || relatedDocuments[0]?.id || '')
    }
    if (originsResponse.ok) setOrigins((await originsResponse.json()).documents || [])

    if (transaction.code === 'MB52') {
      const response = await fetch(`${apiUrl}/inventory/balances`, { headers: headers() })
      if (response.ok) {
        const data = await response.json()
        setDocuments((data.balances || []).map((item: Record<string, string>) => ({
          id: item.id, transactionCode: 'MB52', documentNumber: item.materialCode, module: 'Estoque',
          title: item.materialDescription || 'Saldo material', partner: `${item.plant}/${item.storageLocation}`,
          status: 'Saldo', data: item, createdAt: item.createdAt, updatedAt: item.updatedAt,
        })))
      }
    }
    if (transaction.code === 'MB51') {
      const response = await fetch(`${apiUrl}/inventory/movements`, { headers: headers() })
      if (response.ok) {
        const data = await response.json()
        setDocuments((data.movements || []).map((item: Record<string, any>) => ({
          id: item.id, transactionCode: 'MB51', documentNumber: item.document?.documentNumber || item.id,
          module: 'Estoque', title: `Movimento ${item.movementType}`, partner: item.userName,
          status: item.document?.status || 'Lancado', data: item, createdAt: item.createdAt, updatedAt: item.updatedAt,
        })))
      }
    }
  }, [apiUrl, headers, requestedDocument, transaction.code, transaction.mode, transaction.module])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const save = () => document.querySelector<HTMLFormElement>('#erp-document-form')?.requestSubmit()
    window.addEventListener('sap-save', save)
    return () => window.removeEventListener('sap-save', save)
  }, [])

  const filtered = useMemo(() => documents.filter((item) => {
    const text = `${item.documentNumber} ${item.partner || ''} ${item.reference || ''} ${item.status}`.toLowerCase()
    return text.includes(search.toLowerCase()) && (statusFilter === 'Todos' || item.status === statusFilter)
  }), [documents, search, statusFilter])
  const selected = documents.find((item) => item.id === selectedId) || filtered[0]
  const allowedOriginCodes = transactionPredecessors[transaction.code]
  const compatibleOrigins = allowedOriginCodes?.length ? origins.filter((origin) => allowedOriginCodes.includes(origin.transactionCode)) : origins

  const selectOrigin = (originId: string) => {
    const origin = origins.find((item) => item.id === originId)
    setForm((current) => ({
      ...current,
      ...Object.fromEntries(Object.entries(origin?.data || {}).map(([key, value]) => [key, String(value ?? '')])),
      originDocumentId: originId, partner: origin?.partner || current.partner || '',
      reference: origin?.documentNumber || current.reference || '',
    }))
  }

  const openSelected = (mode: Extract<ScreenMode, 'change' | 'display'>) => {
    if (!selected) return setMessage('Selecione um documento na lista')
    setForm({
      ...Object.fromEntries(Object.entries(selected.data || {}).map(([key, value]) => [key, String(value ?? '')])),
      originDocumentId: selected.originDocumentId || '', partner: selected.partner || '',
      reference: selected.reference || '', notes: String(selected.data?.observacoes || ''),
    })
    setScreenMode(mode)
    setShowEntry(true)
    setShowDocumentList(false)
    setMessage(`${selected.documentNumber}: modo de ${mode === 'change' ? 'modificacao' : 'exibicao'}`)
  }

  const newDocument = () => {
    setForm(emptyForm)
    setSelectedId('')
    setScreenMode('create')
    setShowEntry(true)
    setShowDocumentList(false)
    setMessage('Criar novo documento')
  }

  const saveDocument = async (event: FormEvent) => {
    event.preventDefault()
    if (screenMode === 'display') return
    if (transaction.requiresOrigin && !form.originDocumentId) return setMessage('Informe o documento de referencia')
    setBusy(true)
    const payload = {
      transactionCode: transaction.code, module: transaction.module, title: transaction.title,
      originDocumentId: form.originDocumentId || null, partner: form.partner || form.name || form.supplierName,
      reference: form.reference, status: 'Criado',
      data: Object.fromEntries(fields.map((field) => [field.key, form[field.key] || '']).concat([['observacoes', form.notes || '']])),
      note: `${transaction.code}: documento gravado`,
    }
    const editing = screenMode === 'change' && selected
    const response = await fetch(editing ? `${apiUrl}/operational-documents/${selected.id}` : `${apiUrl}/operational-documents`, {
      method: editing ? 'PATCH' : 'POST', headers: headers(), body: JSON.stringify(payload),
    })
    const data = await response.json()
    setBusy(false)
    if (!response.ok) return setMessage(data.error || 'Erro ao gravar documento')
    setMessage(`${data.documentNumber || selected?.documentNumber} gravado com sucesso`)
    setScreenMode('display')
    setShowEntry(true)
    setShowDocumentList(false)
    await load()
    setSelectedId(data.id || selected?.id || '')
  }

  const updateStatus = async (status: string) => {
    if (!selected) return
    setBusy(true)
    const response = await fetch(`${apiUrl}/operational-documents/${selected.id}`, {
      method: 'PATCH', headers: headers(), body: JSON.stringify({ status, note: `${transaction.code}: status alterado para ${status}` }),
    })
    setBusy(false)
    if (response.ok) { setMessage(`${selected.documentNumber} atualizado`); await load() }
  }

  const exportExcel = async () => {
    const XLSX = await import('xlsx')
    const sheet = XLSX.utils.json_to_sheet(filtered.map((item) => ({
      Documento: item.documentNumber, Origem: item.reference, Parceiro: item.partner,
      Status: item.status, Criado: new Date(item.createdAt).toLocaleString('pt-BR'),
    })))
    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book, sheet, transaction.code)
    XLSX.writeFile(book, `${transaction.code}.xlsx`)
  }

  const cancel = () => {
    setForm(emptyForm)
    if (transaction.mode === 'create') {
      setScreenMode('create')
      setShowEntry(true)
      setShowDocumentList(false)
    } else {
      setShowEntry(false)
      setShowDocumentList(true)
    }
    setMessage('Operacao cancelada')
  }

  const showList = () => {
    setShowDocumentList(true)
    setShowEntry(false)
    setTimeout(() => searchInputRef.current?.focus(), 0)
  }

  const processSelected = async () => {
    if (!selected) return setMessage('Selecione um documento para processar')
    await updateStatus('Em processamento')
  }

  return (
    <main className={`sap-transaction erp-transaction-page erp-mode-${screenMode}`}>
      <section className="sap-transaction-title">
        <div><span>{transaction.module} / {transaction.phase}</span><h1>{transaction.code} - {transaction.title}</h1><p>{modeLabels[transaction.mode]} documento do processo empresarial.</p></div>
        <strong>{modeLabels[transaction.mode]}</strong>
      </section>

      <section className="sap-application-toolbar sap-document-toolbar" aria-label="Barra de aplicacao SAP">
        <button type="button" onClick={() => history.back()}><ArrowLeft size={13} /> Voltar</button>
        {transaction.mode === 'create' && <button type="button" onClick={newDocument}><FilePlus2 size={13} /> Novo</button>}
        {transaction.mode === 'change' && !showEntry && <button type="button" onClick={() => openSelected('change')} disabled={!selected}><Pencil size={13} /> Modificar</button>}
        {transaction.mode === 'display' && !showEntry && <button type="button" onClick={() => openSelected('display')} disabled={!selected}><Eye size={13} /> Exibir</button>}
        {transaction.mode === 'process' && <button type="button" onClick={processSelected} disabled={!selected || busy}><Play size={13} /> Processar</button>}
        {showEntry && screenMode !== 'display' && <button type="submit" form="erp-document-form" disabled={busy}><Save size={13} /> Salvar</button>}
        {showEntry && <button type="button" onClick={cancel}><X size={13} /> Cancelar</button>}
        <span className="sap-toolbar-separator" />
        {transaction.mode !== 'create' && <button type="button" onClick={showList}><Search size={13} /> Localizar</button>}
        {['list', 'process', 'monitor'].includes(transaction.mode) && <button type="button" onClick={load}><RefreshCw size={13} /> Atualizar</button>}
        {['display', 'list'].includes(transaction.mode) && <button type="button" onClick={() => window.print()}><Printer size={13} /> Imprimir</button>}
        {['list', 'monitor'].includes(transaction.mode) && <button type="button" onClick={exportExcel} disabled={!filtered.length}><Download size={13} /> Planilha</button>}
        <span>{message}</span>
      </section>

      {showEntry && <form id="erp-document-form" className="sap-selection-screen erp-transaction-entry" onSubmit={saveDocument}>
        <div className="sap-window-header"><strong>{screenMode === 'create' ? 'Criar documento' : screenMode === 'change' ? 'Modificar documento' : 'Exibir documento'}</strong><span>{selected?.documentNumber || 'Novo documento'}</span></div>
        <div className="sap-document-tabs"><button type="button" className="active">Dados do cabecalho</button><button type="button">Itens</button><button type="button">Condicoes</button><button type="button">Textos</button></div>
        <div className="sap-filter-grid">
          {transaction.requiresOrigin && <label className="wide"><span>Documento de referencia {allowedOriginCodes?.length ? `(${allowedOriginCodes.join(' / ')})` : ''}</span><select required disabled={screenMode !== 'create'} value={form.originDocumentId} onChange={(event) => selectOrigin(event.target.value)}><option value="">Selecione...</option>{compatibleOrigins.map((origin) => <option key={origin.id} value={origin.id}>{origin.documentNumber} - {origin.title} [{origin.status}]</option>)}</select></label>}
          {!['XD01', 'XK01'].includes(transaction.code) && <label><span>Parceiro</span><input disabled={screenMode === 'display'} value={form.partner || ''} onChange={(event) => setForm({ ...form, partner: event.target.value })} /></label>}
          <label><span>Referencia externa</span><input disabled={screenMode === 'display'} value={form.reference || ''} onChange={(event) => setForm({ ...form, reference: event.target.value })} /></label>
          {fields.map((field) => <label key={field.key} className={field.wide ? 'wide' : ''}><span>{field.label}{field.required ? ' *' : ''}</span>{field.type === 'select' ? <select disabled={screenMode === 'display'} required={field.required} value={form[field.key] || ''} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}><option value="">Selecione...</option>{field.options?.map((option) => <option key={option}>{option}</option>)}</select> : <input disabled={screenMode === 'display'} required={field.required} type={field.type || 'text'} value={form[field.key] || ''} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })} />}</label>)}
          <label className="wide"><span>Texto do documento</span><input disabled={screenMode === 'display'} value={form.notes || ''} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
        </div>
        <div className="sap-filter-actions"><span>{screenMode === 'display' ? 'Documento protegido contra alteracoes' : 'Campos com * sao obrigatorios'}</span><button type="submit" disabled={screenMode === 'display' || busy}><Save size={13} /> Salvar</button></div>
      </form>}

      {showDocumentList && <section className="sap-result-window">
        <div className="sap-window-header"><strong>Lista de documentos - {transaction.code} ({filtered.length})</strong><span>Duplo clique para abrir</span></div>
        <div className="sap-alv-toolbar">
          <label><Search size={13} /><input ref={searchInputRef} aria-label="Pesquisar documentos" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar..." /></label>
          <label><Filter size={13} /><select aria-label="Filtrar status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>Todos</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
          {selected && <label>Status <select value={selected.status} onChange={(event) => updateStatus(event.target.value)} disabled={busy}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>}
        </div>
        <div className="sap-table-wrap"><table className="sap-alv-table"><thead><tr><th>Sel.</th><th>Documento</th><th>Documento referencia</th><th>Parceiro</th>{fields.slice(0, 6).map((field) => <th key={field.key}>{field.label}</th>)}<th>Status</th><th>Atualizacao</th></tr></thead><tbody>
          {filtered.map((item) => <tr key={item.id} className={selected?.id === item.id ? 'selected' : ''} onClick={() => setSelectedId(item.id)} onDoubleClick={() => openSelected(transaction.mode === 'change' ? 'change' : 'display')}><td><input type="radio" checked={selected?.id === item.id} onChange={() => setSelectedId(item.id)} /></td><td><strong>{item.documentNumber}</strong></td><td>{item.originDocumentId ? item.data?.originDocumentNumber || item.originDocumentId.slice(0, 8) : '-'}</td><td>{item.partner || '-'}</td>{fields.slice(0, 6).map((field) => <td key={field.key}>{String(item.data?.[field.key] ?? '-')}</td>)}<td>{item.status}</td><td>{new Date(item.updatedAt).toLocaleString('pt-BR')}</td></tr>)}
          {!filtered.length && <tr><td colSpan={fields.slice(0, 6).length + 6} className="sap-empty-row">Nenhum documento encontrado.</td></tr>}
        </tbody></table></div>
      </section>}
    </main>
  )
}
