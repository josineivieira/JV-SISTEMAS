'use client'

import type React from 'react'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { logisticsRows } from '@/lib/logistics-data'
import { useSearchParams } from 'next/navigation'
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  Filter,
  GitBranch,
  History,
  Link2,
  ListFilter,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  SplitSquareHorizontal,
} from 'lucide-react'

type LogisticsRow = {
  id: string
  status: string
  backendProcessId?: string
  [key: string]: string | number | undefined
}

type FlowDocument = {
  id: string
  type: string
  status: string
  owner: string
}

type ActivityLog = {
  time: string
  user: string
  action: string
}

type LogisticsColumn = {
  key: string
  label: string
}

type LogisticsVariant =
  | 'transport'
  | 'container'
  | 'freight'
  | 'fleet'
  | 'driver'
  | 'warehouse'
  | 'tracking'
  | 'maintenance'
  | 'billing'
  | 'planning'
  | 'yard'
  | 'report'
  | 'nfse'
  | 'cte'
  | 'mdfe'
  | 'boleto'
  | 'edi'
  | 'proof'
  | 'config'
  | 'inbound'
  | 'outbound'
  | 'wave'
  | 'picking'
  | 'packing'
  | 'inventory'
  | 'rf'
  | 'slotting'

type CockpitCard = {
  code: string
  title: string
  text: string
  artifactPrefix: string
  artifactStatus: string
}

type BackendLogisticsProcess = {
  id: string
  processNumber: string
  stage: string
  salesOrderNumber?: string
  freightOrderNumber?: string
  waveNumber?: string
  pickingTaskNumber?: string
  handlingUnit?: string
  shipmentNumber?: string
  podNumber?: string
  clientName: string
  productSummary?: string
  weight?: string
  deadline?: string
  route?: string
  carrier?: string
  dock?: string
  plate?: string
  driver?: string
  status: string
  documents?: Record<string, string>
}

interface LogisticsTransactionPageProps {
  code: string
  title: string
  description: string
  module: string
  rows: LogisticsRow[]
  columns: LogisticsColumn[]
  statuses: string[]
  kpis: Array<{ label: string; value: string; tone?: 'ok' | 'warn' | 'info' }>
  createLabel: string
  variant?: LogisticsVariant
}

const statusTone: Record<string, 'success' | 'warning' | 'info' | 'secondary' | 'destructive'> = {
  Planejado: 'secondary',
  Liberado: 'info',
  'Em transito': 'warning',
  'Em trânsito': 'warning',
  Coletado: 'info',
  Entregue: 'success',
  Atrasado: 'destructive',
  Disponivel: 'success',
  Disponível: 'success',
  Manutencao: 'warning',
  Manutenção: 'warning',
  Ocupado: 'info',
  Bloqueado: 'destructive',
  Conferencia: 'warning',
  Conferência: 'warning',
  Separacao: 'info',
  Separação: 'info',
  Emitido: 'success',
  Rejeitado: 'destructive',
  Autorizado: 'success',
  Pago: 'success',
  Vencido: 'destructive',
  Enviado: 'info',
  Recebido: 'success',
  Pendente: 'warning',
}

export function LogisticsTransactionPage({
  code,
  title,
  description,
  module,
  rows,
  columns,
  statuses,
  kpis,
  createLabel,
  variant = 'transport',
}: LogisticsTransactionPageProps) {
  const searchParams = useSearchParams()
  const transactionCode = searchParams?.get('tx') || code
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [records, setRecords] = useState(rows)
  const [selectedId, setSelectedId] = useState(rows[0]?.id || '')
  const [activeTab, setActiveTab] = useState<'details' | 'flow' | 'history'>('details')
  const [selectionTab, setSelectionTab] = useState<'basic' | 'advanced' | 'output'>('basic')
  const [displayMode, setDisplayMode] = useState<'display' | 'change'>('display')
  const [onlyExceptions, setOnlyExceptions] = useState(false)
  const [sortAscending, setSortAscending] = useState(true)
  const [groupBy, setGroupBy] = useState('')
  const [compactAlv, setCompactAlv] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [logs, setLogs] = useState<ActivityLog[]>([
    { time: '08:12', user: 'SISTEMA', action: `${transactionCode} inicializada` },
    { time: '08:14', user: 'JOSINEI', action: 'Layout ALV JV_LOG aplicado' },
  ])
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; row: LogisticsRow } | null>(null)

  const fetchProcesses = useCallback(async () => {
    const stage = getBackendStageForVariant(variant, transactionCode)
    if (!stage) return

    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({ stage, tx: transactionCode })
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logistics/processes?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) return
      const data = await response.json()
      const processRows = (data.processes || []).map((process: BackendLogisticsProcess) =>
        mapProcessToRow(process, variant, transactionCode)
      )

      setRecords(processRows)
      setSelectedId((current) =>
        processRows.some((row: LogisticsRow) => row.id === current) ? current : processRows[0]?.id || ''
      )
    } catch (error) {
      console.error('Erro ao carregar processos logisticos:', error)
    }
  }, [transactionCode, variant])

  useEffect(() => {
    const storedRecords = localStorage.getItem(`jv_${code}_records`)
    const storedLogs = localStorage.getItem(`jv_${code}_logs`)

    if (storedRecords) {
      setRecords(JSON.parse(storedRecords))
    }
    if (storedLogs) {
      setLogs(JSON.parse(storedLogs))
    }
  }, [code])

  useEffect(() => {
    fetchProcesses()
  }, [fetchProcesses])

  useEffect(() => {
    const handleSave = () => {
      const now = new Date()
      const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      const nextLogs = [{ time, user: 'JOSINEI', action: `${code} gravada pelo icone salvar` }, ...logs].slice(0, 12)
      localStorage.setItem(`jv_${code}_records`, JSON.stringify(records))
      localStorage.setItem(`jv_${code}_logs`, JSON.stringify(nextLogs))
      setLogs(nextLogs)
      setDirty(false)
      window.dispatchEvent(new CustomEvent('sap-message', { detail: `${code}: dados gravados com sucesso` }))
    }

    window.addEventListener('sap-save', handleSave)
    return () => window.removeEventListener('sap-save', handleSave)
  }, [code, logs, records])

  useEffect(() => {
    const handleExport = () => exportCsv()
    const handleShowFlow = () => setActiveTab('flow')
    const handleCopyRow = () => {
      if (!selectedRow) return
      navigator.clipboard?.writeText(JSON.stringify(selectedRow, null, 2))
      window.dispatchEvent(new CustomEvent('sap-message', { detail: `${selectedRow.id}: linha copiada` }))
    }

    window.addEventListener('sap-export', handleExport)
    window.addEventListener('sap-show-flow', handleShowFlow)
    window.addEventListener('sap-copy-row', handleCopyRow)
    return () => {
      window.removeEventListener('sap-export', handleExport)
      window.removeEventListener('sap-show-flow', handleShowFlow)
      window.removeEventListener('sap-copy-row', handleCopyRow)
    }
  })

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    const result = records.filter((row) => {
      const matchesSearch =
        !normalizedSearch ||
        Object.values(row).some((value) => String(value).toLowerCase().includes(normalizedSearch))
      const matchesStatus = statusFilter === 'Todos' || row.status === statusFilter
      const matchesExceptions = !onlyExceptions || getTrafficLight(row.status) !== 'green'

      return matchesSearch && matchesStatus && matchesExceptions
    })

    return result.sort((a, b) => {
      if (groupBy) {
        const grouped = String(a[groupBy] || '').localeCompare(String(b[groupBy] || ''))
        if (grouped !== 0) return grouped
      }
      return sortAscending
        ? String(a.id).localeCompare(String(b.id))
        : String(b.id).localeCompare(String(a.id))
    })
  }, [groupBy, onlyExceptions, records, searchTerm, sortAscending, statusFilter])

  const trafficSummary = useMemo(() => {
    return records.reduce(
      (summary, row) => {
        const light = getTrafficLight(row.status)
        return { ...summary, [light]: summary[light] + 1 }
      },
      { green: 0, yellow: 0, red: 0 }
    )
  }, [records])

  const selectedRow = useMemo(
    () => records.find((row) => row.id === selectedId) || filteredRows[0] || records[0],
    [filteredRows, records, selectedId]
  )

  const documentFlow = useMemo<FlowDocument[]>(() => {
    if (!selectedRow) return []

    const base = String(selectedRow.id).replace(/[^0-9]/g, '').slice(-4) || '0001'
    return [
      { id: `SO-${base}`, type: 'Pedido comercial', status: 'Aprovado', owner: String(selectedRow.cliente || 'Cliente') },
      { id: `OF-${base}`, type: 'Ordem de frete', status: String(selectedRow.status), owner: 'Operacao' },
      { id: `TR-${base}`, type: 'Transporte', status: String(selectedRow.status), owner: String(selectedRow.motorista || selectedRow.responsavel || 'Torre') },
      { id: `NF-${base}`, type: 'Documento fiscal', status: selectedRow.status === 'Entregue' ? 'Emitido' : 'Pendente', owner: 'Financeiro' },
    ]
  }, [selectedRow])

  const connectedProcess = useMemo(() => getConnectedProcess(selectedRow, variant), [selectedRow, variant])
  const logisticsSapStages = useMemo(() => getLogisticsSapStages(selectedRow, variant), [selectedRow, variant])

  const addLog = (action: string) => {
    const now = new Date()
    const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    setLogs((current) => [{ time, user: 'JOSINEI', action }, ...current].slice(0, 12))
    setDirty(true)
    window.dispatchEvent(new CustomEvent('sap-message', { detail: `${code}: alteracao pendente de gravacao` }))
  }

  const handleCreate = () => {
    const primaryAction = getPrimaryActionForVariant(variant, transactionCode)
    if (selectedRow?.backendProcessId && primaryAction) {
      runOperationalAction(primaryAction.title, {
        actionCode: primaryAction.code,
        artifactPrefix: primaryAction.artifactPrefix,
        artifactStatus: primaryAction.status,
      })
      return
    }

    const nextNumber = String(records.length + 1).padStart(4, '0')
    const template = rows[0] || { id: `${code}-${nextNumber}`, status: statuses[0] || 'Planejado' }
    const nextRecord: LogisticsRow = {
      ...template,
      id: `${code}-${nextNumber}`,
      status: statuses[0] || 'Planejado',
      origem: 'Manaus/AM',
      destino: 'A definir',
      responsavel: 'JOSINEI',
    }

    setRecords((current) => [nextRecord, ...current])
    setSelectedId(nextRecord.id)
    addLog(`${nextRecord.id} criado via ${code}`)
  }

  const updateSelectedStatus = (nextStatus: string) => {
    if (!selectedRow) return
    setRecords((current) =>
      current.map((row) => (row.id === selectedRow.id ? { ...row, status: nextStatus } : row))
    )
    addLog(`${selectedRow.id} alterado para ${nextStatus}`)
  }

  const advanceStatus = async () => {
    if (!selectedRow) return
    if (selectedRow.backendProcessId) {
      const nextStage = getNextBackendStage(variant)
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logistics/processes/${selectedRow.backendProcessId}/advance`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage: nextStage }),
        })

        if (response.ok) {
          const data = await response.json()
          const nextRow = mapProcessToRow(data.process, variant, code)
          setRecords((current) => [nextRow, ...current.filter((row) => row.backendProcessId !== data.process.id)])
          setSelectedId(nextRow.id)
          addLog(`${selectedRow.id} avancou para ${data.process.stage}`)
          window.dispatchEvent(new CustomEvent('sap-message', { detail: `${selectedRow.id}: proxima etapa criada no backend` }))
          return
        }
      } catch (error) {
        console.error('Erro ao avancar processo logistico:', error)
      }
    }

    const currentIndex = statuses.indexOf(selectedRow.status)
    const nextStatus = statuses[(currentIndex + 1) % statuses.length] || statuses[0] || 'Liberado'
    updateSelectedStatus(nextStatus)
  }

  const duplicateSelected = () => {
    if (!selectedRow) return
    const nextNumber = String(records.length + 1).padStart(4, '0')
    const nextRecord = {
      ...selectedRow,
      id: `${code}-CP${nextNumber}`,
      status: 'Planejado',
    }
    setRecords((current) => [nextRecord, ...current])
    setSelectedId(nextRecord.id)
    addLog(`${selectedRow.id} copiado para ${nextRecord.id}`)
  }

  const createLinkedDocument = () => {
    if (!selectedRow) return
    const linkedId = `DOC-${String(records.length + 1).padStart(4, '0')}`
    const nextRecord = {
      ...selectedRow,
      id: linkedId,
      status: 'Liberado',
      responsavel: 'Torre',
      documentoOrigem: selectedRow.id,
    }
    setRecords((current) => [nextRecord, ...current])
    setSelectedId(nextRecord.id)
    addLog(`Documento ligado ${linkedId} criado a partir de ${selectedRow.id}`)
  }

  const runOperationalAction = async (
    actionTitle: string,
    options: Partial<CockpitCard> & { actionCode?: string; artifactPrefix?: string; artifactStatus?: string } = {}
  ) => {
    if (!selectedRow) return

    const nextNumber = String(records.length + 1).padStart(4, '0')
    const artifactPrefix = options.artifactPrefix || getArtifactPrefixForAction(actionTitle)
    const artifactId = `${artifactPrefix}-${nextNumber}`
    const nextStatus = options.artifactStatus || getStatusForAction(actionTitle)

    if (selectedRow.backendProcessId) {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/logistics/processes/${selectedRow.backendProcessId}/actions`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actionCode: options.actionCode || options.code || getActionCode(actionTitle),
            actionTitle,
            artifactPrefix,
            status: nextStatus,
          }),
        })

        if (response.ok) {
          await response.json()
          await fetchProcesses()
          addLog(`${selectedRow.id}: ${actionTitle} gravado no backend`)
          window.dispatchEvent(new CustomEvent('sap-message', { detail: `${selectedRow.id}: ${actionTitle} executado; proxima transacao atualizada` }))
          return
        }
      } catch (error) {
        console.error('Erro ao executar acao logistica:', error)
      }
    }

    setRecords((current) =>
      current.map((row) =>
        row.id === selectedRow.id
          ? {
              ...row,
              status: nextStatus,
              ...getLocalActionFields(actionTitle, row, artifactId),
              ultimoProcesso: actionTitle,
              documentoGerado: artifactId,
              transacaoExecutada: options.actionCode || options.code || getActionCode(actionTitle),
              processadoEm: new Date().toLocaleString('pt-BR'),
            }
          : row
      )
    )
    addLog(`${options.actionCode || options.code || getActionCode(actionTitle)} processou ${selectedRow.id} e gravou ${artifactId}`)
    window.dispatchEvent(new CustomEvent('sap-message', { detail: `${selectedRow.id}: ${actionTitle} executado; clique salvar para gravar` }))
  }

  const createArtifact = (card: CockpitCard) => {
    runOperationalAction(card.title, {
      actionCode: card.code,
      artifactPrefix: card.artifactPrefix,
      artifactStatus: card.artifactStatus,
    })
  }

  const exportCsv = () => {
    const header = [...columns.map((column) => column.label), 'Status']
    const lines = filteredRows.map((row) =>
      [...columns.map((column) => row[column.key]), row.status].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(';')
    )
    const csv = `\uFEFF${[header.join(';'), ...lines].join('\n')}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${code}.csv`
    link.click()
    URL.revokeObjectURL(url)
    addLog(`Lista ${code} exportada em CSV`)
  }

  const executeSelection = () => {
    if (!selectedRow && filteredRows[0]) {
      setSelectedId(filteredRows[0].id)
      window.dispatchEvent(new CustomEvent('sap-message', { detail: `${code}: linha ${filteredRows[0].id} selecionada` }))
      return
    }

    const primaryAction = getPrimaryActionForVariant(variant, transactionCode)
    if (selectedRow && primaryAction) {
      runOperationalAction(primaryAction.title, {
        actionCode: primaryAction.code,
        artifactPrefix: primaryAction.artifactPrefix,
        artifactStatus: primaryAction.status,
      })
      return
    }

    window.dispatchEvent(new CustomEvent('sap-message', { detail: `${code}: lista executada com ${filteredRows.length} registros` }))
  }

  const openContextMenu = (event: React.MouseEvent, row: LogisticsRow) => {
    event.preventDefault()
    setSelectedId(row.id)
    setContextMenu({ x: event.clientX, y: event.clientY, row })
  }

  const resetSelection = () => {
    setSearchTerm('')
    setStatusFilter('Todos')
    setOnlyExceptions(false)
    window.dispatchEvent(new CustomEvent('sap-message', { detail: `${code}: parametros limpos` }))
  }

  return (
    <main className="sap-transaction">
      <section className="sap-transaction-title">
        <div>
          <span>{module}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <div className="sap-ewm-header-tools">
          <div className="sap-traffic-summary" aria-label="Semaforos da transacao">
            <span className="sap-light green" />
            <strong>{trafficSummary.green}</strong>
            <span className="sap-light yellow" />
            <strong>{trafficSummary.yellow}</strong>
            <span className="sap-light red" />
            <strong>{trafficSummary.red}</strong>
          </div>
          <strong>{transactionCode}</strong>
        </div>
      </section>

      <section className="sap-transaction-totals" aria-label="Totais da transacao">
        {kpis.map((kpi) => (
          <span key={kpi.label}><strong>{kpi.label}:</strong> {kpi.value}</span>
        ))}
      </section>

      <section className="sap-application-toolbar" aria-label="Barra de aplicacao SAP">
        <button type="button" onClick={executeSelection}>Executar F8</button>
        <button type="button" onClick={handleCreate}>Criar</button>
        <button type="button" onClick={() => setDisplayMode(displayMode === 'display' ? 'change' : 'display')}>
          {displayMode === 'display' ? 'Modificar' : 'Exibir'}
        </button>
        <button type="button" onClick={advanceStatus}>Avancar status</button>
        <button type="button" onClick={createLinkedDocument}>Doc. ligado</button>
        <button type="button" onClick={() => setOnlyExceptions((current) => !current)}>
          Excecoes
        </button>
        <button type="button" onClick={exportCsv}>Exportar</button>
        <span>{displayMode === 'display' ? 'Modo exibicao' : 'Modo modificacao'} | {dirty ? 'Nao gravado' : 'Gravado'}</span>
      </section>

      <section className="sap-selection-screen">
        <div className="sap-window-header">
          <strong>Tela de selecao</strong>
          <div>
            <Filter size={15} aria-hidden="true" />
            <RefreshCw size={14} aria-hidden="true" />
          </div>
        </div>

        <div className="sap-selection-tabs">
          {[
            ['basic', 'Selecao basica'],
            ['advanced', 'Parametros avancados'],
            ['output', 'Saida ALV'],
          ].map(([key, label]) => (
            <button
              type="button"
              key={key}
              className={selectionTab === key ? 'active' : ''}
              onClick={() => setSelectionTab(key as typeof selectionTab)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="sap-selection-layout">
          <div className="sap-filter-grid">
            <label className="wide">
              <span>Pesquisa livre</span>
              <div className="sap-input-icon">
                <Search size={15} aria-hidden="true" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Documento, cliente, placa, rota..."
                />
              </div>
            </label>

            <label>
              <span>Status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option>Todos</option>
                {statuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Data inicial</span>
              <div className="sap-input-icon">
                <CalendarDays size={15} aria-hidden="true" />
                <input defaultValue="01/05/2026" />
              </div>
            </label>

            <label>
              <span>Data final</span>
              <div className="sap-input-icon">
                <CalendarDays size={15} aria-hidden="true" />
                <input defaultValue="31/05/2026" />
              </div>
            </label>

            {getSelectionFields(variant).map((field) => (
              <label key={field.label} className={selectionTab === 'basic' && field.advanced ? 'hidden-field' : ''}>
                <span>{field.label}</span>
                {field.options ? (
                  <select defaultValue={field.value}>
                    {field.options.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <input defaultValue={field.value} />
                )}
              </label>
            ))}

            {selectionTab === 'output' && (
              <>
                <label>
                  <span>Layout ALV</span>
                  <input defaultValue="JV_ECC_MON" />
                </label>
                <label>
                  <span>Max. hits</span>
                  <input defaultValue="500" />
                </label>
                <label>
                  <span>Semaforo</span>
                  <select defaultValue="Ativo">
                    <option>Ativo</option>
                    <option>Oculto</option>
                  </select>
                </label>
              </>
            )}
          </div>

          <div className="sap-filter-actions">
            <button type="button" onClick={executeSelection}>
              <Search size={15} aria-hidden="true" />
              Executar
            </button>
            <button type="button" onClick={handleCreate}>
              <Plus size={15} aria-hidden="true" />
              {createLabel}
            </button>
            <button type="button" onClick={advanceStatus}>
              <CheckCircle2 size={15} aria-hidden="true" />
              Avancar status
            </button>
            <button type="button" onClick={createLinkedDocument}>
              <Link2 size={15} aria-hidden="true" />
              Doc. ligado
            </button>
            <button type="button" onClick={duplicateSelected}>
              <SplitSquareHorizontal size={15} aria-hidden="true" />
              Copiar
            </button>
            <button type="button" onClick={() => updateSelectedStatus('Bloqueado')}>
              <ShieldAlert size={15} aria-hidden="true" />
              Bloquear
            </button>
            <button type="button" onClick={resetSelection}>
              <RefreshCw size={15} aria-hidden="true" />
              Limpar
            </button>
            <button type="button" onClick={exportCsv}>
              <Download size={15} aria-hidden="true" />
              Exportar
            </button>
          </div>
        </div>
      </section>

      <section className="sap-workbench-stack">
        <section className="sap-document-chain">
          <div className="sap-window-header">
            <strong>Fluxo de documentos</strong>
            <div>
              <span>VA03 / VL03N - {selectedRow?.id || transactionCode}</span>
            </div>
          </div>
          <div className="sap-document-flow-table">
            <table>
              <thead>
                <tr>
                  <th>Modulo</th>
                  <th>Documento</th>
                  <th>Descricao</th>
                  <th>Status</th>
                  <th>Seq.</th>
                </tr>
              </thead>
              <tbody>
                {connectedProcess.map((document, index) => (
                  <tr key={`${document.label}-${document.id}`} className={document.current ? 'current' : ''}>
                    <td>{document.step}</td>
                    <td><strong>{document.id}</strong></td>
                    <td>{document.label}</td>
                    <td>{document.status}</td>
                    <td>{index < connectedProcess.length - 1 ? `${index + 1} -> ${index + 2}` : 'Fim'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="sap-logistics-flow">
          <div className="sap-window-header">
            <strong>Status de processamento da entrega</strong>
            <div>
              <span>SD | LE-SHP | LE-WM | PGI | POD | SD-BIL</span>
            </div>
          </div>
          <div className="sap-status-overview">
            <table>
              <thead>
                <tr>
                  <th>Etapa</th>
                  <th>Processo</th>
                  <th>Campo principal</th>
                  <th>Status / pendencia</th>
                  <th>Transacoes</th>
                </tr>
              </thead>
              <tbody>
                {logisticsSapStages.map((stage) => {
                  const mainField = stage.fields[0]
                  const statusField = stage.fields[stage.fields.length - 1]
                  return (
                    <tr key={stage.step} className={stage.current ? 'current' : ''}>
                      <td>{stage.step}</td>
                      <td>
                        <strong>{stage.title}</strong>
                        <span>{stage.description}</span>
                      </td>
                      <td>{mainField.label}: <strong>{mainField.value}</strong></td>
                      <td>{statusField.label}: <strong>{statusField.value}</strong></td>
                      <td>
                        <div className="sap-stage-actions">
                          {stage.actions.map((action) => (
                            <button type="button" key={action} onClick={() => runOperationalAction(action)}>
                              {action}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="sap-result-window">
          <div className="sap-window-header">
            <strong>Lista ALV - {filteredRows.length} registros</strong>
            <div>
              <CheckCircle2 size={15} aria-hidden="true" />
              <span>Layout: JV_LOG</span>
            </div>
          </div>

          <div className="sap-alv-toolbar" aria-label="Ferramentas ALV">
            <button type="button" onClick={() => setSortAscending((current) => !current)}>Ordenar</button>
            <button type="button" onClick={() => setOnlyExceptions((current) => !current)}>
              <ListFilter size={14} aria-hidden="true" />
              {onlyExceptions ? 'Todos' : 'Excecoes'}
            </button>
            <button type="button" onClick={() => setCompactAlv((current) => !current)}>
              <SlidersHorizontal size={14} aria-hidden="true" />
              {compactAlv ? 'Normal' : 'Compacto'}
            </button>
            <label className="sap-alv-grouping">
              Agrupar
              <select value={groupBy} onChange={(event) => setGroupBy(event.target.value)}>
                <option value="">Sem agrupamento</option>
                <option value="cliente">Cliente</option>
                <option value="centro">Centro</option>
                <option value="rota">Rota</option>
                <option value="status">Status</option>
              </select>
            </label>
            <button type="button" onClick={() => setActiveTab('details')}>Detalhe</button>
            <button type="button" onClick={() => setActiveTab('flow')}>Fluxo</button>
            <button type="button" onClick={exportCsv}>Planilha</button>
          </div>

          <div className="sap-table-wrap">
            <table className={compactAlv ? 'sap-alv-table compact' : 'sap-alv-table'}>
              <thead>
                <tr>
                  <th>Sel.</th>
                  <th>Sem.</th>
                  {columns.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, index) => {
                  const currentGroup = groupBy ? String(row[groupBy] || 'Nao informado') : ''
                  const previousGroup = index > 0 && groupBy ? String(filteredRows[index - 1][groupBy] || 'Nao informado') : ''
                  return (
                    <Fragment key={row.id}>
                      {groupBy && currentGroup !== previousGroup && (
                        <tr className="sap-alv-group-row">
                          <td colSpan={columns.length + 3}>{currentGroup}</td>
                        </tr>
                      )}
                      <tr
                        className={selectedId === row.id ? 'selected' : ''}
                        onClick={() => setSelectedId(row.id)}
                        onContextMenu={(event) => openContextMenu(event, row)}
                      >
                        <td>
                          <input
                            type="radio"
                            aria-label={`Selecionar ${row.id}`}
                            checked={selectedId === row.id}
                            onChange={() => setSelectedId(row.id)}
                          />
                        </td>
                        <td><span className={`sap-light ${getTrafficLight(row.status)}`} title={row.status} /></td>
                        {columns.map((column) => <td key={column.key}>{row[column.key]}</td>)}
                        <td><Badge variant={statusTone[row.status] || 'secondary'}>{row.status}</Badge></td>
                      </tr>
                    </Fragment>
                  )
                })}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={columns.length + 3} className="sap-empty-row">
                      Nenhum documento encontrado para esta transacao. Execute a etapa anterior do fluxo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="sap-lower-workbench">
          {selectedRow && (
            <section className="sap-detail-dock">
              <div className="sap-tab-strip" role="tablist" aria-label="Detalhes do documento">
                <button
                  type="button"
                  className={activeTab === 'details' ? 'active' : ''}
                  onClick={() => setActiveTab('details')}
                >
                  <ClipboardList size={14} aria-hidden="true" />
                  Dados
                </button>
                <button
                  type="button"
                  className={activeTab === 'flow' ? 'active' : ''}
                  onClick={() => setActiveTab('flow')}
                >
                  <GitBranch size={14} aria-hidden="true" />
                  Fluxo
                </button>
                <button
                  type="button"
                  className={activeTab === 'history' ? 'active' : ''}
                  onClick={() => setActiveTab('history')}
                >
                  <History size={14} aria-hidden="true" />
                  Log
                </button>
              </div>

              {activeTab === 'details' && (
                <div className="sap-detail-grid">
                  {Object.entries(selectedRow).map(([key, value]) => (
                    <label key={key}>
                      <span>{key}</span>
                      <input
                        value={String(value)}
                        onChange={(event) => {
                          const nextValue = event.target.value
                          setRecords((current) =>
                            current.map((row) => (row.id === selectedRow.id ? { ...row, [key]: nextValue } : row))
                          )
                          setDirty(true)
                        }}
                      />
                    </label>
                  ))}
                </div>
              )}

              {activeTab === 'flow' && (
                <div className="sap-flow-grid">
                  {documentFlow.map((document, index) => (
                    <article key={document.id}>
                      <strong>{document.id}</strong>
                      <span>{document.type}</span>
                      <Badge variant={statusTone[document.status] || 'secondary'}>{document.status}</Badge>
                      <small>{document.owner}</small>
                      {index < documentFlow.length - 1 && <i aria-hidden="true" />}
                    </article>
                  ))}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="sap-history-list">
                  {logs.map((log) => (
                    <div key={`${log.time}-${log.action}`}>
                      <strong>{log.time}</strong>
                      <span>{log.user}</span>
                      <p>{log.action}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="sap-process-cockpit">
            <div className="sap-window-header">
              <strong>Cockpit - {variant.toUpperCase()}</strong>
              <div>
                <span>{dirty ? 'Nao gravado' : 'Sincronizado'}</span>
              </div>
            </div>
            <div className="sap-cockpit-grid">
              {getCockpitCards(variant, selectedRow).map((card) => (
                <article key={card.title}>
                  <span>{card.code}</span>
                  <strong>{card.title}</strong>
                  <p>{card.text}</p>
                  <button type="button" onClick={() => createArtifact(card)}>
                    Executar
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="sap-ewm-process-map">
            <div className="sap-window-header">
              <strong>Cadeia de processo ECC</strong>
              <div>
                <span>{selectedRow?.id || code}</span>
              </div>
            </div>
            <div className="sap-process-steps">
              {getProcessSteps(variant).map((step, index) => (
                <article key={step.title} className={index <= getActiveStepIndex(selectedRow?.status || '') ? 'done' : ''}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{step.title}</strong>
                  <p>{step.text}</p>
                </article>
              ))}
            </div>
          </section>
        </section>
      </section>

      {contextMenu && (
        <div
          className="sap-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button type="button" onClick={() => { setActiveTab('details'); setContextMenu(null) }}>
            Exibir detalhe
          </button>
          <button type="button" onClick={() => { setActiveTab('flow'); setContextMenu(null) }}>
            Fluxo de documentos
          </button>
          <button type="button" onClick={() => { duplicateSelected(); setContextMenu(null) }}>
            Copiar documento
          </button>
          <button type="button" onClick={() => { createLinkedDocument(); setContextMenu(null) }}>
            Criar documento ligado
          </button>
          <button type="button" onClick={() => { updateSelectedStatus('Bloqueado'); setContextMenu(null) }}>
            Bloquear processamento
          </button>
        </div>
      )}
    </main>
  )
}

function getConnectedProcess(row: LogisticsRow | undefined, variant: string) {
  const rowId = String(row?.id || 'DOC-0001')
  const digits = rowId.replace(/[^0-9]/g, '').slice(-4) || '0001'
  const customer = String(row?.cliente || row?.remetente || row?.destinatario || 'Cliente')
  const transport = findByAny(logisticsRows.transportes, [rowId, row?.documento, row?.ordem]) || logisticsRows.transportes[0]
  const freight = findByAny(logisticsRows.fretes, [rowId, row?.ordem, transport?.id]) || logisticsRows.fretes[0]
  const cte = findByAny(logisticsRows.cte, [rowId, freight?.id, row?.ordem]) || logisticsRows.cte[0]
  const mdfe = findByAny(logisticsRows.mdfe, [rowId, transport?.placa, row?.veiculo]) || logisticsRows.mdfe[0]
  const nfse = findByAny(logisticsRows.nfse, [rowId, row?.documento, customer]) || logisticsRows.nfse[0]
  const boleto = findByAny(logisticsRows.boletos, [rowId, nfse?.id, customer]) || logisticsRows.boletos[0]
  const pod = findByAny(logisticsRows.comprovantes, [rowId, transport?.id, freight?.id]) || logisticsRows.comprovantes[0]
  const edi = findByAny(logisticsRows.integracoes, [rowId, freight?.id, transport?.id]) || logisticsRows.integracoes[0]

  return [
    { step: 'SD', id: `VA-${digits}`, label: 'Pedido de venda', status: variant === 'planning' ? 'Planejado' : 'Aprovado', current: ['planning', 'wave'].includes(variant) },
    { step: 'LE-SHP', id: row?.entrega ? String(row.entrega) : `8000${digits}`, label: 'Entrega de saida', status: row?.status || 'Aberta', current: ['wave', 'warehouse', 'packing', 'yard'].includes(variant) },
    { step: 'LE-WM', id: row?.id && variant === 'picking' ? rowId : `TO-${digits}`, label: 'Ordem de transferencia', status: variant === 'picking' ? String(row?.status || 'Aberta') : 'Pendente', current: variant === 'picking' },
    { step: 'LE', id: transport?.id || `TR-${digits}`, label: 'Saida de mercadoria', status: ['transport', 'tracking'].includes(variant) ? String(row?.status || 'Em transito') : 'Pendente', current: ['transport', 'tracking'].includes(variant) },
    { step: 'POD', id: pod?.id || `POD-${digits}`, label: 'Proof of Delivery', status: pod?.status || 'Pendente', current: variant === 'proof' },
    { step: 'SD-BIL', id: `VF-${digits}`, label: 'Fatura', status: variant === 'billing' ? 'Emitido' : 'Pendente', current: variant === 'billing' },
    { step: 'FI-AR', id: boleto?.id || `BOL-${digits}`, label: 'Titulo cliente', status: boleto?.status || 'Aberto', current: variant === 'boleto' },
    { step: 'EDI', id: edi?.id || `INT-${digits}`, label: 'Saida IDoc/API', status: edi?.status || 'Enviado', current: variant === 'edi' },
  ]
}

function getLogisticsSapStages(row: LogisticsRow | undefined, variant: string) {
  const documentId = String(row?.id || 'TR-250001')
  const salesOrder = String(row?.pedido || row?.ordem || `VA-${documentId.replace(/[^0-9]/g, '').slice(-4) || '0001'}`)
  const customer = String(row?.cliente || row?.remetente || row?.destinatario || 'Cliente')
  const product = String(row?.produto || row?.material || row?.tipo || 'Produto / servico')
  const weight = String(row?.peso || row?.quantidade || 'Peso pendente')
  const deadline = String(row?.prazo || row?.previsao || row?.entrega || 'Prazo nao definido')
  const route = String(row?.rota || `${row?.origem || 'Origem'} > ${row?.destino || 'Destino'}`)
  const carrier = String(row?.transportadora || row?.responsavel || 'Transportadora a definir')
  const dock = String(row?.doca || 'Doca a definir')
  const plate = String(row?.placa || row?.veiculo || 'Placa a definir')
  const driver = String(row?.motorista || 'Motorista a definir')
  const status = String(row?.status || 'Planejado')

  return [
    {
      step: '1. SD',
      title: 'Pedido do cliente',
      description: 'VA01/VA02 registra o pedido, valida cliente, material, preco, credito e disponibilidade.',
      current: ['planning', 'freight', 'wave'].includes(variant),
      fields: [
        { label: 'Pedido', value: salesOrder },
        { label: 'Cliente', value: customer },
        { label: 'Produto', value: product },
        { label: 'Prazo', value: deadline },
      ],
      actions: ['VA03 Exibir pedido', 'VL10A Due list'],
    },
    {
      step: '2. LE-SHP',
      title: 'Entrega de saida',
      description: 'VL01N/VL10A cria a entrega; VL02N altera picking, embalagem, peso, rota e bloqueios.',
      current: ['wave', 'warehouse', 'packing', 'yard'].includes(variant),
      fields: [
        { label: 'Entrega', value: String(row?.entrega || row?.id || `8000${salesOrder.replace(/[^0-9]/g, '').slice(-4) || '0001'}`) },
        { label: 'Peso', value: weight },
        { label: 'Rota', value: route },
        { label: 'Transportadora', value: carrier },
      ],
      actions: ['Criar entrega VL01N', 'Alterar entrega VL02N', 'Monitor VL06O'],
    },
    {
      step: '3. LE-WM',
      title: 'Picking por ordem de transferencia',
      description: 'LT03 cria a ordem de transferencia para a entrega e LT12 confirma o picking no deposito.',
      current: ['warehouse', 'picking', 'inventory'].includes(variant),
      fields: [
        { label: 'OT', value: String(row?.id && variant === 'picking' ? row.id : `TO-${salesOrder.replace(/[^0-9]/g, '').slice(-4) || '0001'}`) },
        { label: 'Deposito', value: String(row?.deposito || '001') },
        { label: 'Bin origem', value: String(row?.posicaoOrigem || 'A-01-01') },
        { label: 'Status picking', value: ['Entregue', 'Liberado', 'Conferencia'].includes(status) ? 'Confirmado' : 'Pendente' },
      ],
      actions: ['Criar OT LT03', 'Confirmar OT LT12', 'LT24 Monitor OT'],
    },
    {
      step: '4. PGI',
      title: 'Saida de mercadoria',
      description: 'Depois do picking/packing, VL02N registra PGI e movimenta estoque contabilmente.',
      current: ['yard', 'transport', 'cte', 'mdfe'].includes(variant),
      fields: [
        { label: 'Placa', value: plate },
        { label: 'Motorista', value: driver },
        { label: 'Area staging', value: dock },
        { label: 'Docs', value: 'Remessa / NF / CT-e / MDF-e' },
      ],
      actions: ['Registrar embalagem', 'Post Goods Issue', 'Criar transporte VT01N'],
    },
    {
      step: '5. POD',
      title: 'POD e faturamento',
      description: 'VLPOD confirma recebimento e diferencas; VF01/VF04 cria a fatura apos entrega/POD.',
      current: ['tracking', 'proof', 'transport', 'billing'].includes(variant),
      fields: [
        { label: 'Entrega', value: String(row?.documento || row?.entrega || documentId) },
        { label: 'Status', value: status },
        { label: 'Ocorrencia', value: status === 'Atrasado' ? 'SLA critico' : 'Sem bloqueio' },
        { label: 'POD', value: status === 'Entregue' ? 'Recebido' : 'Pendente' },
      ],
      actions: ['Confirmar POD VLPOD', 'Criar fatura VF01', 'Exibir fluxo VA03'],
    },
  ]
}

function getBackendStageForVariant(variant: string, code?: string) {
  if (code === 'LT03') return 'wave'
  if (['LT12', 'LT24'].includes(code || '')) return 'picking'

  const stageByVariant: Record<string, string> = {
    planning: 'sales_order',
    freight: 'freight_order',
    wave: 'sales_order',
    picking: 'picking',
    packing: 'picking',
    yard: 'packing',
    warehouse: 'wave',
    transport: 'transport',
    tracking: 'transport',
    proof: 'expedition',
    billing: 'pod',
  }

  return stageByVariant[variant]
}

function getNextBackendStage(variant: string) {
  const nextByVariant: Record<string, string> = {
    planning: 'wave',
    freight: 'wave',
    wave: 'wave',
    warehouse: 'picking',
    picking: 'packing',
    packing: 'expedition',
    yard: 'transport',
    transport: 'pod',
    tracking: 'pod',
    proof: 'billing',
  }

  return nextByVariant[variant] || 'planning'
}

function getPrimaryActionForVariant(variant: string, code: string) {
  const byVariant: Record<string, { title: string; code: string; artifactPrefix: string; status: string }> = {
    wave: { title: 'Criar entrega VL01N', code: 'VL01N', artifactPrefix: '800', status: 'Liberado' },
    planning: { title: 'Criar entrega VL01N', code: 'VL01N', artifactPrefix: '800', status: 'Liberado' },
    warehouse: { title: 'Criar OT LT03', code: 'LT03', artifactPrefix: 'TO', status: 'Separacao' },
    picking: { title: 'Confirmar OT LT12', code: 'LT12', artifactPrefix: 'TO', status: 'Conferencia' },
    packing: { title: 'Registrar embalagem', code: 'VL02N', artifactPrefix: 'PKG', status: 'Conferencia' },
    yard: { title: 'Post Goods Issue', code: 'VL02N', artifactPrefix: 'PGI', status: 'Entregue' },
    proof: { title: 'Confirmar POD VLPOD', code: 'VLPOD', artifactPrefix: 'POD', status: 'Recebido' },
    billing: { title: 'Criar fatura VF01', code: 'VF01', artifactPrefix: 'FAT', status: 'Emitido' },
  }

  if (code === 'LT03') return { title: 'Criar OT LT03', code: 'LT03', artifactPrefix: 'TO', status: 'Separacao' }
  if (code === 'LT12') return { title: 'Confirmar OT LT12', code: 'LT12', artifactPrefix: 'TO', status: 'Conferencia' }
  if (code === 'LT24') return { title: 'LT24 Monitor OT', code: 'LT24', artifactPrefix: 'TO', status: 'Conferencia' }
  return byVariant[variant]
}

function getActionCode(actionTitle: string) {
  const codeByAction: Record<string, string> = {
    'VL10A Due list': 'VL10A',
    'Criar entrega VL01N': 'VL01N',
    'Alterar entrega VL02N': 'VL02N',
    'Monitor VL06O': 'VL06O',
    'Criar OT LT03': 'LT03',
    'Confirmar OT LT12': 'LT12',
    'LT24 Monitor OT': 'LT24',
    'Registrar embalagem': 'VL02N',
    'Post Goods Issue': 'VL02N',
    'Criar transporte VT01N': 'VT01N',
    'Confirmar POD VLPOD': 'VLPOD',
    'Criar fatura VF01': 'VF01',
    'Exibir fluxo VA03': 'VA03',
    'Criar onda': 'VL10A',
    'Confirmar picking': 'LT12',
    'Confirmar WT': 'LT12',
    'RF picking': 'LT12',
    'Criar HU': 'VL02N',
    'Gate-in': 'VL02N',
    'Entrada patio': 'VL02N',
    'Anexar POD': 'VLPOD',
  }

  return codeByAction[actionTitle] || 'ZLOG'
}

function getArtifactPrefixForAction(actionTitle: string) {
  const prefixByAction: Record<string, string> = {
    'VL10A Due list': 'DUE',
    'Criar entrega VL01N': '800',
    'Alterar entrega VL02N': '800',
    'Monitor VL06O': 'MON',
    'Criar OT LT03': 'TO',
    'Confirmar OT LT12': 'TO',
    'LT24 Monitor OT': 'TO',
    'Registrar embalagem': 'PKG',
    'Post Goods Issue': 'PGI',
    'Criar transporte VT01N': 'TR',
    'Confirmar POD VLPOD': 'POD',
    'Criar fatura VF01': 'FAT',
    'Exibir fluxo VA03': 'DOC',
    'Criar onda': '800',
    'Confirmar picking': 'TO',
    'Confirmar WT': 'TO',
    'RF picking': 'TO',
    'Criar HU': 'PKG',
    'Gate-in': 'PGI',
    'Entrada patio': 'PGI',
    'Anexar POD': 'POD',
  }

  return prefixByAction[actionTitle] || 'DOC'
}

function getStatusForAction(actionTitle: string) {
  const statusByAction: Record<string, string> = {
    'VL10A Due list': 'Planejado',
    'Criar entrega VL01N': 'Liberado',
    'Alterar entrega VL02N': 'Conferencia',
    'Monitor VL06O': 'Conferencia',
    'Criar OT LT03': 'Separacao',
    'Confirmar OT LT12': 'Conferencia',
    'LT24 Monitor OT': 'Conferencia',
    'Registrar embalagem': 'Conferencia',
    'Post Goods Issue': 'Entregue',
    'Criar transporte VT01N': 'Em transito',
    'Confirmar POD VLPOD': 'Recebido',
    'Criar fatura VF01': 'Emitido',
    'Exibir fluxo VA03': 'Liberado',
    'Criar onda': 'Liberado',
    'Confirmar picking': 'Conferencia',
    'Confirmar WT': 'Conferencia',
    'RF picking': 'Separacao',
    'Criar HU': 'Conferencia',
    'Gate-in': 'Conferencia',
    'Entrada patio': 'Conferencia',
    'Anexar POD': 'Recebido',
  }

  return statusByAction[actionTitle] || 'Liberado'
}

function getLocalActionFields(actionTitle: string, row: LogisticsRow, artifactId: string): Partial<LogisticsRow> {
  const now = new Date().toLocaleString('pt-BR')
  const digits = artifactId.replace(/[^0-9]/g, '').slice(-4) || '0001'

  if (['VL10A Due list', 'Criar entrega VL01N', 'Criar onda'].includes(actionTitle)) {
    return {
      entrega: artifactId.replace('DUE-', '800'),
      bloqueio: 'Livre',
      centro: String(row.centro || 'LAM'),
      dtRemessa: new Date().toLocaleDateString('pt-BR'),
      liberadoEm: now,
    }
  }

  if (['Criar OT LT03', 'Confirmar OT LT12', 'LT24 Monitor OT', 'Confirmar picking', 'Confirmar WT', 'RF picking'].includes(actionTitle)) {
    return {
      ordemTransferencia: artifactId,
      entrega: String(row.entrega || row.id),
      deposito: String(row.deposito || '001'),
      operador: String(row.operador || 'WM-01'),
      quantidadeConfirmada: String(row.quantidade || '1'),
      posicaoOrigem: String(row.posicaoOrigem || 'A-01-01'),
      posicaoDestino: String(row.posicaoDestino || row.doca || 'STAGE'),
      confirmadoEm: now,
    }
  }

  if (['Registrar embalagem', 'Criar HU'].includes(actionTitle)) {
    return {
      volumeDocumento: artifactId,
      volume: String(row.volume || '1 volume'),
      pesoBruto: String(row.peso || 'Peso pendente'),
      lacre: String(row.lacre === 'Pendente' || !row.lacre ? `LAC-${digits}` : row.lacre),
      embalagem: String(row.embalagem || 'PALLET'),
      embaladoEm: now,
    }
  }

  if (['Post Goods Issue', 'Gate-in', 'Entrada patio'].includes(actionTitle)) {
    return {
      documentoMaterial: artifactId,
      saidaMercadoria: now,
      placa: String(row.placa || 'Placa a definir'),
      motorista: String(row.motorista || 'Motorista a definir'),
      lacre: String(row.lacre === 'Pendente' || !row.lacre ? `LAC-${digits}` : row.lacre),
    }
  }

  if (['Confirmar POD VLPOD', 'Anexar POD'].includes(actionTitle)) {
    return {
      podNumber: artifactId,
      documento: String(row.documento || row.id),
      tipo: 'POD',
      recebedor: String(row.recebedor === 'A confirmar' || !row.recebedor ? row.cliente || 'Cliente' : row.recebedor),
      data: new Date().toLocaleDateString('pt-BR'),
      portal: 'Publicado',
      arquivoPOD: `${artifactId}.pdf`,
    }
  }

  if (actionTitle === 'Criar fatura VF01') {
    return {
      fatura: artifactId,
      faturadoEm: now,
      bloqueioFaturamento: 'Livre',
    }
  }

  return {}
}

function mapProcessToRow(process: BackendLogisticsProcess, variant: string, fallbackCode: string): LogisticsRow {
  const common = {
    backendProcessId: process.id,
    id: getDisplayIdForStage(process) || process.processNumber || `${fallbackCode}-${process.id.slice(0, 6)}`,
    pedido: process.salesOrderNumber || process.documents?.salesOrder || '-',
    cliente: process.clientName,
    produto: process.productSummary || 'Itens do pedido',
    peso: process.weight || '-',
    prazo: process.deadline ? new Date(process.deadline).toLocaleDateString('pt-BR') : '-',
    rota: process.route || 'Origem > Destino',
    transportadora: process.carrier || 'A definir',
    doca: process.dock || 'A definir',
    motorista: process.driver || 'A definir',
    placa: process.plate || 'A definir',
    previsao: process.deadline ? new Date(process.deadline).toLocaleDateString('pt-BR') : '-',
    status: process.status,
  }

  if (variant === 'freight') {
    return {
      ...common,
      id: process.freightOrderNumber || common.id,
      valor: 'A calcular',
      coleta: common.previsao,
      entrega: common.previsao,
      responsavel: process.carrier || 'LE-TRA',
    }
  }

  if (variant === 'wave') {
    return {
      ...common,
      id: process.documents?.deliveryDue || process.salesOrderNumber || common.id,
      material: process.productSummary || 'Material',
      centro: 'LAM',
      dtRemessa: common.previsao,
      bloqueio: process.status === 'Bloqueado' ? 'Credito/estoque' : 'Livre',
      entrega: process.documents?.outboundDelivery || process.documents?.delivery || process.shipmentNumber || '-',
      liberadoEm: process.documents?.waveReleasedAt
        ? new Date(process.documents.waveReleasedAt).toLocaleString('pt-BR')
        : undefined,
    }
  }

  if (variant === 'warehouse') {
    return {
      ...common,
      id: process.documents?.outboundDelivery || process.shipmentNumber || process.waveNumber || common.id,
      material: process.productSummary || 'Material',
      pickingStatus: process.pickingTaskNumber ? 'OT criada' : 'Pendente',
      pgiStatus: process.documents?.materialDocument ? 'Lancada' : 'Pendente',
      bloqueio: process.status === 'Bloqueado' ? 'Bloqueado' : 'Livre',
      doca: process.dock || 'STAGE',
    }
  }

  if (variant === 'picking') {
    return {
      ...common,
      id: process.pickingTaskNumber || process.documents?.transferOrder || common.id,
      entrega: process.documents?.outboundDelivery || process.documents?.delivery || process.shipmentNumber || '-',
      deposito: process.documents?.warehouseNumber || '001',
      material: process.productSummary || 'Material',
      posicaoOrigem: 'A-01-01',
      posicaoDestino: process.dock || 'STAGE',
      quantidade: 1,
      operador: process.documents?.pickingOperator || 'WM',
      quantidadeConfirmada: process.documents?.pickedQuantity,
      confirmadoEm: process.documents?.pickingConfirmedAt
        ? new Date(process.documents.pickingConfirmedAt).toLocaleString('pt-BR')
        : undefined,
    }
  }

  if (variant === 'packing') {
    return {
      ...common,
      id: process.documents?.outboundDelivery || process.documents?.delivery || process.shipmentNumber || common.id,
      volume: process.documents?.volume || '1 volume',
      conferencia: process.status,
      lacre: process.documents?.seal || 'Pendente',
      embalagem: process.documents?.packagingMaterial || 'PALLET',
      pesoBruto: process.documents?.grossWeight || process.weight || '-',
    }
  }

  if (variant === 'yard') {
    return {
      ...common,
      id: process.shipmentNumber || common.id,
      entrada: process.documents?.goodsIssueAt
        ? new Date(process.documents.goodsIssueAt).toLocaleString('pt-BR')
        : 'Aguardando',
      lacre: process.documents?.seal || 'Pendente',
      documentoMaterial: process.documents?.materialDocument,
      operacao: 'Saida mercadoria',
    }
  }

  if (variant === 'proof') {
    return {
      ...common,
      id: process.podNumber || common.id,
      documento: process.shipmentNumber || process.processNumber,
      tipo: 'POD',
      recebedor: process.documents?.podReceiver || 'A confirmar',
      data: process.status === 'Recebido' ? new Date().toLocaleDateString('pt-BR') : 'Pendente',
      portal: process.documents?.portalStatus || (process.status === 'Recebido' ? 'Publicado' : 'Pendente'),
      arquivoPOD: process.documents?.podAttachment,
    }
  }

  return {
    ...common,
    origem: 'Origem SD',
    destino: process.route?.split('>').pop()?.trim() || 'Destino',
  }
}

function getDisplayIdForStage(process: BackendLogisticsProcess) {
  if (process.stage === 'freight_order') return process.freightOrderNumber
  if (process.stage === 'wave') return process.waveNumber
  if (process.stage === 'picking') return process.pickingTaskNumber
  if (process.stage === 'packing') return process.handlingUnit
  if (process.stage === 'transport') return process.shipmentNumber
  if (process.stage === 'pod') return process.podNumber
  return process.processNumber
}

function findByAny<T extends Record<string, string | number | undefined>>(rows: T[], values: unknown[]) {
  const needles = values.filter(Boolean).map((value) => String(value).toLowerCase())
  return rows.find((row) =>
    Object.values(row).some((field) =>
      needles.some((needle) => String(field).toLowerCase().includes(needle) || needle.includes(String(field).toLowerCase()))
    )
  )
}

function getTrafficLight(status: string) {
  if (['Atrasado', 'Bloqueado', 'Rejeitado', 'Vencido'].includes(status)) return 'red'
  if (['Pendente', 'Conferencia', 'Conferência', 'Manutencao', 'Manutenção', 'Separacao', 'Separação', 'Em transito'].includes(status)) return 'yellow'
  return 'green'
}

function getMonitorTransaction(variant: string) {
  const transactions: Record<string, string> = {
    wave: 'VL10A - Due List',
    warehouse: 'VL06O - Outbound Delivery Monitor',
    picking: 'LT24 - Transfer Order Monitor',
    packing: 'VL02N - Change Outbound Delivery',
    yard: 'VL02N - Post Goods Issue',
    proof: 'VLPOD / VLPODL - Proof of Delivery',
    billing: 'VF04 - Billing Due List',
    transport: 'VT01N / VT02N - LE-TRA Shipment',
  }

  return transactions[variant] || 'SAP ECC Logistics Monitor'
}

function getEccMonitorItems(variant: string, summary: { green: number; yellow: number; red: number }) {
  const common = [
    { label: 'Documentos OK', value: String(summary.green), light: 'green' },
    { label: 'Pendencias operacionais', value: String(summary.yellow), light: 'yellow' },
    { label: 'Bloqueios/atrasos', value: String(summary.red), light: 'red' },
  ]

  const specific: Record<string, Array<{ label: string; value: string; light: string }>> = {
    warehouse: [
      { label: 'Entregas abertas', value: '18', light: 'yellow' },
      { label: 'PGI prontas', value: '6', light: 'green' },
      { label: 'Bloqueios entrega', value: '2', light: 'red' },
    ],
    wave: [
      { label: 'Pedidos na due list', value: '9', light: 'yellow' },
      { label: 'Entregas criadas', value: '27', light: 'green' },
      { label: 'Bloqueio credito/estoque', value: '2', light: 'red' },
    ],
    picking: [
      { label: 'OT abertas', value: '18', light: 'yellow' },
      { label: 'OT confirmadas', value: '42', light: 'green' },
      { label: 'Diferencas picking', value: '3', light: 'red' },
    ],
    packing: [
      { label: 'Volumes registrados', value: '16', light: 'green' },
      { label: 'Aguardando lacre', value: '4', light: 'yellow' },
      { label: 'Bloqueio embalagem', value: '1', light: 'red' },
    ],
    yard: [
      { label: 'Entregas para PGI', value: '17', light: 'yellow' },
      { label: 'PGI concluido', value: '4', light: 'green' },
      { label: 'Bloqueio saida', value: '3', light: 'red' },
    ],
    transport: [
      { label: 'Viagens monitoradas', value: '24', light: 'green' },
      { label: 'Janelas em risco', value: '5', light: 'yellow' },
      { label: 'Ocorrencias criticas', value: '1', light: 'red' },
    ],
    container: [
      { label: 'Free time seguro', value: '19', light: 'green' },
      { label: 'Vence em 48h', value: '4', light: 'yellow' },
      { label: 'Demurrage', value: '1', light: 'red' },
    ],
    nfse: [
      { label: 'Autorizadas', value: '18', light: 'green' },
      { label: 'RPS na fila', value: '3', light: 'yellow' },
      { label: 'Rejeitadas', value: '1', light: 'red' },
    ],
    cte: [
      { label: 'Protocolos SEFAZ', value: '31', light: 'green' },
      { label: 'Lotes pendentes', value: '6', light: 'yellow' },
      { label: 'Rejeicoes', value: '2', light: 'red' },
    ],
  }

  return specific[variant] || common
}

function getCockpitCards(variant: string, row?: LogisticsRow): CockpitCard[] {
  const documentId = row?.id || 'documento'
  const card = (code: string, title: string, text: string, artifactPrefix: string, artifactStatus: string): CockpitCard => ({
    code,
    title,
    text,
    artifactPrefix,
    artifactStatus,
  })
  const cardsByVariant: Record<string, CockpitCard[]> = {
    transport: [
      card('VT01N', 'Criar remessa', `Gera remessa ligada a ${documentId}.`, 'REM', 'Liberado'),
      card('VL02N', 'Registrar ocorrencia', 'Atualiza evento operacional e SLA.', 'OCO', 'Pendente'),
      card('MIRO', 'Conferir custo', 'Valida frete, pedagio e adicionais.', 'CST', 'Conferencia'),
    ],
    container: [
      card('ZFREE', 'Calcular free time', 'Calcula risco de demurrage.', 'DEM', 'Pendente'),
      card('ZTERM', 'Agendar terminal', 'Gera slot de retirada/devolucao.', 'SLOT', 'Liberado'),
      card('ZDOCS', 'Checklist documental', 'BL, DI, invoice e liberacao.', 'CHK', 'Conferencia'),
    ],
    freight: [
      card('ZCOT', 'Cotacao automatica', 'Compara tabela de frete por rota.', 'COT', 'Liberado'),
      card('VF01', 'Faturar ordem', 'Prepara documento financeiro.', 'FAT', 'Pendente'),
      card('ZPOD', 'Comprovante entrega', 'Anexa baixa operacional.', 'POD', 'Recebido'),
    ],
    fleet: [
      card('IE03', 'Ficha tecnica', 'Consulta equipamento e KM.', 'EQP', 'Autorizado'),
      card('IW31', 'Ordem manutencao', 'Abre manutencao preventiva/corretiva.', 'OM', 'Manutencao'),
      card('ZABAST', 'Abastecimento', 'Registra consumo e media.', 'ABS', 'Conferencia'),
    ],
    driver: [
      card('PA20', 'Dados do condutor', 'Consulta cadastro e documentos.', 'RH', 'Autorizado'),
      card('ZCNH', 'Validar CNH', 'Controle de vencimento e categoria.', 'CNH', 'Conferencia'),
      card('ZESCALA', 'Escala', 'Reserva motorista para viagem.', 'ESC', 'Liberado'),
    ],
    warehouse: [
      card('VL06O', 'Monitor VL06O', 'Lista entregas por picking, PGI e bloqueio.', 'MON', 'Conferencia'),
      card('VL02N', 'Alterar entrega VL02N', 'Ajusta dados de entrega, peso, rota e bloqueios.', '800', 'Conferencia'),
      card('LT03', 'Criar OT LT03', 'Cria ordem de transferencia WM para picking.', 'TO', 'Separacao'),
    ],
    wave: [
      card('VL10A', 'VL10A Due list', 'Seleciona pedidos vencidos para remessa.', 'DUE', 'Planejado'),
      card('VL01N', 'Criar entrega VL01N', `Cria entrega de saida para ${documentId}.`, '800', 'Liberado'),
      card('VL06O', 'Monitor VL06O', 'Acompanha entregas criadas e pendencias.', 'MON', 'Conferencia'),
    ],
    picking: [
      card('LT03', 'Criar OT LT03', 'Cria ordem de transferencia para a entrega.', 'TO', 'Separacao'),
      card('LT12', 'Confirmar OT LT12', 'Confirma picking e quantidade separada.', 'TO', 'Conferencia'),
      card('LT24', 'LT24 Monitor OT', 'Exibe status e diferencas das OTs.', 'TO', 'Conferencia'),
    ],
    packing: [
      card('VL02N', 'Registrar embalagem', 'Registra volume, peso, embalagem e lacre.', 'PKG', 'Conferencia'),
      card('VL02N', 'Alterar entrega VL02N', 'Confere picking/packing antes do PGI.', '800', 'Conferencia'),
      card('VL03N', 'Exibir entrega VL03N', 'Consulta dados finais da entrega.', 'DOC', 'Liberado'),
    ],
    tracking: [
      card('ZGPS', 'Atualizar posicao', 'Registra evento de rastreamento.', 'GPS', 'Em transito'),
      card('ZALERTA', 'Alerta SLA', 'Abre pendencia na torre.', 'SLA', 'Atrasado'),
      card('ZOCORR', 'Ocorrencia', 'Classifica motivo e responsavel.', 'OCO', 'Pendente'),
    ],
    maintenance: [
      card('IW32', 'Executar ordem', 'Aponta servico e material aplicado.', 'EXE', 'Manutencao'),
      card('ME51N', 'Requisitar peca', 'Cria requisicao de compra.', 'RC', 'Pendente'),
      card('ZOS', 'Checklist oficina', 'Valida seguranca e liberacao.', 'CKO', 'Conferencia'),
    ],
    billing: [
      card('VF04', 'Criar fatura', 'Fatura ordens entregues.', 'FT', 'Emitido'),
      card('FBL5N', 'Conta cliente', 'Consulta em aberto e baixas.', 'CC', 'Pendente'),
      card('ZCUSTO', 'Rateio custo', 'Distribui custos por viagem.', 'RT', 'Conferencia'),
    ],
    planning: [
      card('ZMRP', 'Planejar capacidade', 'Cruza demanda, veiculo e motorista.', 'CAP', 'Planejado'),
      card('ZROTA', 'Otimizar rota', 'Sequencia entregas por janela.', 'ROT', 'Liberado'),
      card('ZAGENDA', 'Agenda docas', 'Reserva horario de carga/descarga.', 'AGE', 'Pendente'),
    ],
    yard: [
      card('VL02N', 'Post Goods Issue', 'Registra saida de mercadoria da entrega.', 'PGI', 'Entregue'),
      card('VT01N', 'Criar transporte VT01N', 'Cria shipment LE-TRA quando aplicavel.', 'TR', 'Em transito'),
      card('VL03N', 'Exibir entrega VL03N', 'Consulta fluxo e documento material.', 'DOC', 'Liberado'),
    ],
    report: [
      card('S_ALR', 'Indicadores', 'KPIs operacionais consolidados.', 'KPI', 'Emitido'),
      card('ZBI', 'Painel BI', 'Analise de custo, SLA e produtividade.', 'BI', 'Emitido'),
      card('ZEXCEL', 'Exportar lote', 'Extrai relatorio gerencial.', 'EXP', 'Emitido'),
    ],
    nfse: [
      card('ZEMIT_NFSE', 'Emitir NFS-e', 'Gera RPS e simula autorizacao municipal.', 'NFSE', 'Emitido'),
      card('ZCANC_NFSE', 'Cancelar NFS-e', 'Gera solicitacao de cancelamento.', 'CNFSE', 'Pendente'),
      card('ZPDF_NFSE', 'PDF e XML', 'Disponibiliza espelho fiscal e XML.', 'XML', 'Autorizado'),
    ],
    cte: [
      card('ZEMIT_CTE', 'Emitir CT-e', 'Cria CT-e simulado para transporte.', 'CTE', 'Autorizado'),
      card('ZENV_SEFAZ', 'Enviar SEFAZ', 'Valida lote e protocolo de autorizacao.', 'SEFAZ', 'Enviado'),
      card('ZDACTE', 'Gerar DACTE', 'Gera documento auxiliar do CT-e.', 'DACTE', 'Emitido'),
    ],
    mdfe: [
      card('ZEMIT_MDFE', 'Emitir MDF-e', 'Agrupa CT-es e veiculo em manifesto.', 'MDFE', 'Autorizado'),
      card('ZENC_MDFE', 'Encerrar MDF-e', 'Registra encerramento de viagem.', 'ENC', 'Entregue'),
      card('ZVALE', 'Vale pedagio', 'Gera controle de pedagio vinculado.', 'VP', 'Liberado'),
    ],
    boleto: [
      card('F-28', 'Registrar baixa', 'Baixa titulo recebido do cliente.', 'BX', 'Pago'),
      card('FB70', 'Emitir boleto', 'Cria cobranca simulada com vencimento.', 'BOL', 'Emitido'),
      card('FBL5N', 'Conciliacao', 'Confere titulos por cliente.', 'CONC', 'Conferencia'),
    ],
    edi: [
      card('ZEDI204', 'Enviar EDI 204', 'Envia ordem de carga para parceiro.', 'EDI204', 'Enviado'),
      card('ZEDI214', 'Receber EDI 214', 'Recebe evento de tracking.', 'EDI214', 'Recebido'),
      card('ZWEBHOOK', 'Reprocessar API', 'Reenvia payload para integracao.', 'API', 'Pendente'),
    ],
    proof: [
      card('VLPOD', 'Confirmar POD VLPOD', 'Confirma recebimento e diferencas da entrega.', 'POD', 'Recebido'),
      card('VLPODL', 'Lista POD VLPODL', 'Monitora entregas pendentes de POD.', 'PODL', 'Conferencia'),
      card('VF01', 'Criar fatura VF01', 'Gera faturamento apos POD confirmado.', 'FAT', 'Emitido'),
    ],
    config: [
      card('SPRO', 'IMG configuracao', 'Abre estrutura de customizing por modulo.', 'IMG', 'Conferencia'),
      card('SM59', 'Destino RFC/API', 'Valida conexao simulada com parceiro.', 'RFC', 'Liberado'),
      card('SNRO', 'Intervalo numeracao', 'Atualiza faixa de documentos.', 'NR', 'Liberado'),
    ],
  }

  return cardsByVariant[variant] || cardsByVariant.transport
}

function getSelectionFields(variant: string) {
  const fieldsByVariant: Record<string, Array<{ label: string; value: string; options?: string[]; advanced?: boolean }>> = {
    transport: [
      { label: 'Tipo transporte', value: 'Rodoviario', options: ['Rodoviario', 'Fluvial', 'Aereo'] },
      { label: 'Centro log.', value: 'LAM' },
      { label: 'Incoterm', value: 'CIF', options: ['CIF', 'FOB', 'EXW'], advanced: true },
    ],
    container: [
      { label: 'Terminal', value: 'Todos', options: ['Todos', 'Chibatao', 'Super Terminais', 'Porto Seco'] },
      { label: 'Free time ate', value: '5 dias' },
      { label: 'Armador', value: 'MSC', options: ['MSC', 'Maersk', 'CMA CGM', 'Hapag'], advanced: true },
    ],
    freight: [
      { label: 'Tabela frete', value: 'JV-AM-2026' },
      { label: 'Tipo carga', value: 'Geral', options: ['Geral', 'Container', 'Refrigerada', 'Perigosa'] },
      { label: 'Moeda', value: 'BRL', options: ['BRL', 'USD'] },
    ],
    fleet: [
      { label: 'Base', value: 'Manaus', options: ['Manaus', 'Oficina', 'Porto'] },
      { label: 'Categoria', value: 'Todos', options: ['Todos', 'Truck', 'Cavalo', 'Carreta'] },
      { label: 'KM maior que', value: '0' },
    ],
    driver: [
      { label: 'Base', value: 'Manaus' },
      { label: 'Categoria CNH', value: 'Todos', options: ['Todos', 'D', 'E'] },
      { label: 'Documento', value: 'Valido', options: ['Valido', 'Vencendo', 'Vencido'] },
    ],
    warehouse: [
      { label: 'Ponto expedicao', value: 'LAM', options: ['LAM', 'SP01', 'PA01'] },
      { label: 'Status picking', value: 'Todos', options: ['Todos', 'Nao iniciado', 'Parcial', 'Completo'] },
      { label: 'Status SM', value: 'Pendente', options: ['Pendente', 'Lancada', 'Bloqueada'] },
    ],
    wave: [
      { label: 'Ponto expedicao', value: 'LAM', options: ['LAM', 'SP01', 'PA01'] },
      { label: 'Regra due list', value: 'Pedidos vencidos', options: ['Pedidos vencidos', 'Por rota', 'Por cliente'] },
      { label: 'Bloqueio entrega', value: 'Todos', options: ['Todos', 'Livre', 'Credito', 'Estoque'] },
    ],
    picking: [
      { label: 'Deposito', value: '001', options: ['001', '002', '003'] },
      { label: 'Operador', value: 'Todos' },
      { label: 'Status OT', value: 'Aberta', options: ['Aberta', 'Confirmada', 'Diferenca'] },
    ],
    packing: [
      { label: 'Tipo embalagem', value: 'PALLET', options: ['PALLET', 'CAIXA', 'CONTAINER'] },
      { label: 'Lacre', value: 'Todos', options: ['Todos', 'Pendente', 'Validado'] },
      { label: 'Picking', value: 'Pendente', options: ['Pendente', 'Completo', 'Divergente'] },
    ],
    tracking: [
      { label: 'Origem evento', value: 'Todos', options: ['Todos', 'GPS', 'Motorista', 'Terminal', 'Cliente'] },
      { label: 'SLA', value: 'Aberto', options: ['Aberto', 'Critico', 'Normalizado'] },
      { label: 'Severidade', value: 'Todas', options: ['Todas', 'Alta', 'Media', 'Baixa'] },
    ],
    nfse: [
      { label: 'Municipio', value: 'Manaus' },
      { label: 'Servico', value: 'Transporte logistico' },
      { label: 'Serie RPS', value: 'JV1' },
    ],
    cte: [
      { label: 'UF emissao', value: 'AM', options: ['AM', 'PA', 'RO', 'RR'] },
      { label: 'Modelo', value: '57' },
      { label: 'Ambiente', value: 'Homologacao', options: ['Homologacao', 'Producao'] },
    ],
    mdfe: [
      { label: 'UF inicio', value: 'AM' },
      { label: 'UF fim', value: 'PA' },
      { label: 'Tipo emitente', value: 'Transportador', options: ['Transportador', 'Carga propria'] },
    ],
    boleto: [
      { label: 'Banco', value: '001', options: ['001', '237', '341', '104'] },
      { label: 'Carteira', value: '17' },
      { label: 'Vencimento ate', value: '30/05/2026' },
    ],
    edi: [
      { label: 'Parceiro', value: 'Todos', options: ['Todos', 'Cliente EDI', 'Terminal', 'Rastreador'] },
      { label: 'Mensagem', value: 'Todas', options: ['Todas', '204', '214', 'XML CT-e', 'Webhook'] },
      { label: 'Tentativas', value: '>= 0' },
    ],
    proof: [
      { label: 'Relevante POD', value: 'Sim', options: ['Sim', 'Nao', 'Todos'] },
      { label: 'Recebedor', value: 'Todos' },
      { label: 'Status POD', value: 'Pendente', options: ['Pendente', 'Confirmado', 'Diferenca'] },
    ],
    config: [
      { label: 'Mandante', value: '100', options: ['100', '200', '300'] },
      { label: 'Modulo', value: 'Todos', options: ['Todos', 'Fiscal', 'Logistica', 'Integracao'] },
      { label: 'Ambiente', value: 'Homologacao', options: ['Homologacao', 'Producao'] },
    ],
  }

  return fieldsByVariant[variant] || fieldsByVariant.transport
}

function getActiveStepIndex(status: string) {
  if (['Planejado', 'Pendente'].includes(status)) return 0
  if (['Liberado', 'Conferencia', 'Separacao'].includes(status)) return 1
  if (['Coletado', 'Em transito', 'Manutencao', 'Enviado'].includes(status)) return 2
  if (['Entregue', 'Emitido', 'Autorizado', 'Pago', 'Recebido'].includes(status)) return 4
  if (['Atrasado', 'Bloqueado', 'Rejeitado', 'Vencido'].includes(status)) return 2
  return 1
}

function getProcessSteps(variant: string) {
  const stepsByVariant: Record<string, Array<{ title: string; text: string }>> = {
    warehouse: [
      { title: 'Entrega', text: 'Documento 8xxxxxxx' },
      { title: 'Picking', text: 'Status WM' },
      { title: 'Packing', text: 'Peso e volumes' },
      { title: 'PGI', text: 'Movimento 601' },
      { title: 'Fatura', text: 'VF01/VF04' },
    ],
    wave: [
      { title: 'Pedido SD', text: 'Demanda de entrega' },
      { title: 'Due list', text: 'VL10A' },
      { title: 'Entrega', text: 'VL01N' },
      { title: 'Monitor', text: 'VL06O' },
      { title: 'Picking', text: 'LT03/LT12' },
    ],
    picking: [
      { title: 'Entrega', text: 'VL02N' },
      { title: 'OT criada', text: 'LT03' },
      { title: 'Separacao', text: 'Bin origem' },
      { title: 'Confirmacao', text: 'LT12' },
      { title: 'Packing', text: 'Pronto PGI' },
    ],
    packing: [
      { title: 'Entrega', text: 'VL02N' },
      { title: 'Volume', text: 'Embalagem' },
      { title: 'Lacre', text: 'Controle de seguranca' },
      { title: 'Peso', text: 'Bruto/liquido' },
      { title: 'PGI', text: 'Saida liberada' },
    ],
    transport: [
      { title: 'Planejar', text: 'Rota e capacidade' },
      { title: 'Liberar', text: 'Veiculo e motorista' },
      { title: 'Monitorar', text: 'Tracking e ocorrencias' },
      { title: 'Comprovar', text: 'POD e canhoto' },
      { title: 'Faturar', text: 'Fiscal e cobranca' },
    ],
    yard: [
      { title: 'Picking OK', text: 'OT confirmada' },
      { title: 'Packing OK', text: 'Peso e lacre' },
      { title: 'PGI', text: 'Mov. 601' },
      { title: 'Transporte', text: 'VT01N' },
      { title: 'POD/Fatura', text: 'VLPOD/VF01' },
    ],
    nfse: [
      { title: 'RPS', text: 'Geracao do RPS' },
      { title: 'Validar', text: 'Regras municipais' },
      { title: 'Transmitir', text: 'Envio prefeitura' },
      { title: 'Autorizar', text: 'Protocolo recebido' },
      { title: 'XML/PDF', text: 'Documento disponivel' },
    ],
    cte: [
      { title: 'Dados CT-e', text: 'Tomador e percurso' },
      { title: 'Validar', text: 'Regras fiscais' },
      { title: 'SEFAZ', text: 'Lote transmitido' },
      { title: 'DACTE', text: 'Auxiliar gerado' },
      { title: 'Encerrar', text: 'Fiscal finalizado' },
    ],
  }

  return stepsByVariant[variant] || stepsByVariant.transport
}
