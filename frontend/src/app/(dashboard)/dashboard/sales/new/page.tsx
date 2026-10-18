'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import {
  CalendarDays,
  CheckCircle2,
  FileText,
  GitBranch,
  Plus,
  Save,
  Search,
  Trash2,
} from 'lucide-react'

interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  cpfCnpj?: string
}

interface Service {
  id: string
  name: string
  description?: string
  salePrice?: number
  price?: number
  category?: string
  code?: string
  sku?: string
}

interface SalesItem {
  productId: string
  material: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  plant: string
  itemCategory: string
}

const paymentOptions = [
  'Z001 - 50% aprovacao / 50% entrega',
  'Z002 - Entrada 40% / saldo parcelado',
  'Z003 - Recorrente mensal apos implantacao',
  'Z004 - Pagamento unico Pix/transferencia',
]

export default function Va01CreateSalesDocumentPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [soldToId, setSoldToId] = useState('')
  const [shipToId, setShipToId] = useState('')
  const [items, setItems] = useState<SalesItem[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'partners' | 'conditions' | 'texts' | 'flow'>('overview')
  const [salesOrg, setSalesOrg] = useState('JV01')
  const [distributionChannel, setDistributionChannel] = useState('01')
  const [division, setDivision] = useState('01')
  const [orderType, setOrderType] = useState('ZOR')
  const [requestedDate, setRequestedDate] = useState('2026-05-31')
  const [validity, setValidity] = useState('7 dias')
  const [paymentTerms, setPaymentTerms] = useState(paymentOptions[0])
  const [incoterm, setIncoterm] = useState('CIF')
  const [headerText, setHeaderText] = useState('Escopo sujeito a briefing, aprovacao comercial e disponibilidade de agenda.')
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchMasterData()
  }, [])

  const fetchMasterData = async () => {
    try {
      const token = localStorage.getItem('token')
      const [clientsResponse, productsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, { headers: { Authorization: `Bearer ${token}` } }),
      ])

      if (clientsResponse.ok && productsResponse.ok) {
        const clientsData = await clientsResponse.json()
        const productsData = await productsResponse.json()
        setClients(clientsData.clients || [])
        setServices(productsData.products || [])
      } else if (clientsResponse.status === 401 || productsResponse.status === 401) {
        router.push('/login')
      } else {
        setError('Nao consegui carregar clientes e servicos.')
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setError('Erro de conexao ao carregar dados.')
    } finally {
      setFetchLoading(false)
    }
  }

  const soldTo = clients.find((client) => client.id === soldToId)
  const shipTo = clients.find((client) => client.id === (shipToId || soldToId))
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.total, 0), [items])
  const tax = subtotal * 0.05
  const total = subtotal + tax

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

  const addItem = () => {
    setItems((current) => [
      ...current,
      {
        productId: '',
        material: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        total: 0,
        plant: 'JV01',
        itemCategory: 'TAD',
      },
    ])
  }

  const removeItem = (index: number) => {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  const updateItem = (index: number, patch: Partial<SalesItem>) => {
    setItems((current) => {
      const updated = [...current]
      const next = { ...updated[index], ...patch }

      if (patch.productId) {
        const service = services.find((item) => item.id === patch.productId)
        if (service) {
          next.material = service.code || service.sku || service.name.slice(0, 18).toUpperCase()
          next.description = service.description || service.category || service.name
          next.unitPrice = Number(service.salePrice ?? service.price ?? 0)
        }
      }

      next.total = Number(next.quantity || 0) * Number(next.unitPrice || 0)
      updated[index] = next
      return updated
    })
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    if (!soldToId) {
      setError('Informe o emissor da ordem na aba Parceiros.')
      setLoading(false)
      return
    }

    if (items.length === 0 || items.some((item) => !item.productId || item.total <= 0)) {
      setError('Informe pelo menos um item valido na sintese de itens.')
      setLoading(false)
      return
    }

    const sapNotes = [
      `Tipo documento: ${orderType}`,
      `Org.vendas/canal/setor: ${salesOrg}/${distributionChannel}/${division}`,
      `Emissor ordem: ${soldTo?.name || soldToId}`,
      `Recebedor mercadoria: ${shipTo?.name || shipTo?.id || soldToId}`,
      `Data solicitada: ${requestedDate}`,
      `Validade proposta: ${validity}`,
      `Cond.pagamento: ${paymentTerms}`,
      `Incoterm: ${incoterm}`,
      `Texto cabecalho: ${headerText}`,
    ].join('\n')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sales`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: soldToId,
          status: 'pending',
          paymentStatus: 'pending',
          tax,
          notes: sapNotes,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        }),
      })

      if (response.ok) {
        const sale = await response.json()
        window.dispatchEvent(new CustomEvent('sap-message', { detail: `VA01: documento ${sale.saleNumber || ''} gravado` }))
        router.push(`/dashboard/sales/${sale.id}`)
      } else {
        const data = await response.json()
        setError(data.error || 'Erro ao salvar ordem de venda.')
      }
    } catch {
      setError('Erro de conexao ao salvar ordem de venda.')
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando VA01...</p>
        </div>
      </div>
    )
  }

  return (
    <form className="sap-transaction" onSubmit={handleSubmit}>
      <section className="sap-transaction-title">
        <div>
          <span>SD - Vendas e Distribuicao</span>
          <h1>Criar ordem de venda</h1>
          <p>VA01 - documento comercial com parceiros, itens, condicoes, textos e fluxo subsequente.</p>
        </div>
        <div className="sap-ewm-header-tools">
          <div className="sap-traffic-summary">
            <span className="sap-light green" />
            <strong>{items.filter((item) => item.productId).length}</strong>
            <span className="sap-light yellow" />
            <strong>{soldToId ? 0 : 1}</strong>
            <span className="sap-light red" />
            <strong>{items.filter((item) => item.total <= 0).length}</strong>
          </div>
          <strong>VA01</strong>
        </div>
      </section>

      <section className="sap-application-toolbar">
        <button type="submit" disabled={loading}><Save size={14} />Gravar</button>
        <button type="button" onClick={() => router.push('/dashboard/sales')}>VA05</button>
        <button type="button" onClick={() => router.push('/dashboard/clients')}>XD03</button>
        <button type="button" onClick={() => router.push('/dashboard/products')}>MM03</button>
        <button type="button" onClick={addItem}><Plus size={14} />Item</button>
        <span>{loading ? 'Gravando...' : 'Documento nao gravado'} | Tipo {orderType}</span>
      </section>

      {error && <section className="sap-error-line">{error}</section>}

      <section className="sap-selection-screen">
        <div className="sap-window-header">
          <strong>Dados organizacionais</strong>
          <div><span>Area de vendas</span></div>
        </div>
        <div className="sap-selection-layout">
          <div className="sap-filter-grid">
            <label><span>Tipo ordem</span><select value={orderType} onChange={(event) => setOrderType(event.target.value)}><option>ZOR</option><option>OR</option><option>ZCTR</option><option>ZSER</option></select></label>
            <label><span>Org. vendas</span><input value={salesOrg} onChange={(event) => setSalesOrg(event.target.value)} /></label>
            <label><span>Canal distr.</span><input value={distributionChannel} onChange={(event) => setDistributionChannel(event.target.value)} /></label>
            <label><span>Setor atividade</span><input value={division} onChange={(event) => setDivision(event.target.value)} /></label>
          </div>
        </div>
      </section>

      <section className="sap-detail-dock">
        <div className="sap-tab-strip">
          {[
            ['overview', 'Sintese'],
            ['partners', 'Parceiros'],
            ['conditions', 'Condicoes'],
            ['texts', 'Textos'],
            ['flow', 'Fluxo'],
          ].map(([key, label]) => (
            <button
              type="button"
              key={key}
              className={activeTab === key ? 'active' : ''}
              onClick={() => setActiveTab(key as typeof activeTab)}
            >
              {key === 'flow' ? <GitBranch size={14} /> : <FileText size={14} />}
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'partners' && (
          <div className="sap-detail-grid">
            <label>
              <span>AG Emissor ordem</span>
              <select value={soldToId} onChange={(event) => { setSoldToId(event.target.value); if (!shipToId) setShipToId(event.target.value) }} required>
                <option value="">Selecione</option>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.name} - {client.email || 'sem e-mail'}</option>)}
              </select>
            </label>
            <label>
              <span>WE Recebedor merc.</span>
              <select value={shipToId || soldToId} onChange={(event) => setShipToId(event.target.value)}>
                <option value="">Mesmo emissor</option>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
            </label>
            <label><span>RE Recebedor fatura</span><input value={soldTo?.name || ''} readOnly /></label>
            <label><span>RG Pagador</span><input value={soldTo?.name || ''} readOnly /></label>
          </div>
        )}

        {activeTab === 'conditions' && (
          <div className="sap-detail-grid">
            <label><span>Cond.pagamento</span><select value={paymentTerms} onChange={(event) => setPaymentTerms(event.target.value)}>{paymentOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
            <label><span>Incoterms</span><select value={incoterm} onChange={(event) => setIncoterm(event.target.value)}><option>CIF</option><option>FOB</option><option>EXW</option></select></label>
            <label><span>Validade</span><input value={validity} onChange={(event) => setValidity(event.target.value)} /></label>
            <label><span>Data solicitada</span><div className="sap-input-icon"><CalendarDays size={14} /><input value={requestedDate} onChange={(event) => setRequestedDate(event.target.value)} /></div></label>
            <label><span>Subtotal PR00</span><input value={formatCurrency(subtotal)} readOnly /></label>
            <label><span>Imposto MWST</span><input value={formatCurrency(tax)} readOnly /></label>
            <label><span>Total documento</span><input value={formatCurrency(total)} readOnly /></label>
          </div>
        )}

        {activeTab === 'texts' && (
          <div className="sap-detail-grid">
            <label className="span-4"><span>Texto cabecalho Z001</span><textarea value={headerText} onChange={(event) => setHeaderText(event.target.value)} rows={5} /></label>
          </div>
        )}

        {activeTab === 'flow' && (
          <div className="sap-chain-grid sap-chain-grid-compact">
            {[
              ['VA01', 'Ordem venda', 'Criacao'],
              ['VA02', 'Modificar', 'Negociacao'],
              ['VA03', 'Exibir', 'Consulta'],
              ['VA41', 'Contrato', 'Aprovacao'],
              ['VF01', 'Fatura', 'Financeiro'],
            ].map(([step, id, text]) => (
              <article key={step} className={step === 'VA01' ? 'current' : ''}>
                <span>{step}</span>
                <strong>{id}</strong>
                <p>{text}</p>
                <small>{step === 'VA01' ? 'Atual' : 'Proximo'}</small>
              </article>
            ))}
          </div>
        )}

        {activeTab === 'overview' && (
          <>
            <div className="sap-alv-toolbar">
              <button type="button" onClick={addItem}><Plus size={14} />Inserir linha</button>
              <button type="button" onClick={() => setActiveTab('conditions')}>Condicoes</button>
              <button type="button" onClick={() => setActiveTab('partners')}>Parceiros</button>
            </div>
            <div className="sap-table-wrap">
              <table className="sap-alv-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Material/Servico</th>
                    <th>Descricao</th>
                    <th>Qtd.</th>
                    <th>Centro</th>
                    <th>Cat.item</th>
                    <th>Preco PR00</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>{String((index + 1) * 10).padStart(6, '0')}</td>
                      <td>
                        <select value={item.productId} onChange={(event) => updateItem(index, { productId: event.target.value })} required>
                          <option value="">Selecionar</option>
                          {services.map((service) => (
                            <option key={service.id} value={service.id}>
                              {service.code || service.sku || service.name} - {formatCurrency(Number(service.salePrice ?? service.price ?? 0))}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td><input value={item.description} onChange={(event) => updateItem(index, { description: event.target.value })} /></td>
                      <td><input type="number" min="1" value={item.quantity} onChange={(event) => updateItem(index, { quantity: Number(event.target.value) })} /></td>
                      <td><input value={item.plant} onChange={(event) => updateItem(index, { plant: event.target.value })} /></td>
                      <td><input value={item.itemCategory} onChange={(event) => updateItem(index, { itemCategory: event.target.value })} /></td>
                      <td><input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(event) => updateItem(index, { unitPrice: Number(event.target.value) })} /></td>
                      <td>{formatCurrency(item.total)}</td>
                      <td><button className="sap-icon-button" type="button" onClick={() => removeItem(index)}><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={9}>Nenhum item informado. Use Inserir linha para montar a ordem.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="sap-kpi-strip">
        <article className="sap-kpi sap-kpi-info"><span>Emissor</span><strong>{soldTo?.name || 'Nao informado'}</strong></article>
        <article className="sap-kpi sap-kpi-ok"><span>Itens</span><strong>{items.length}</strong></article>
        <article className="sap-kpi sap-kpi-warn"><span>Imposto</span><strong>{formatCurrency(tax)}</strong></article>
        <article className="sap-kpi sap-kpi-info"><span>Total</span><strong>{formatCurrency(total)}</strong></article>
      </section>

      <section className="sap-document-chain">
        <div className="sap-window-header">
          <strong>Fluxo de documentos previsto</strong>
          <div><span>SD-FI-PS</span></div>
        </div>
        <div className="sap-chain-grid sap-chain-grid-compact">
          {[
            ['VA01', 'Ordem venda', 'Nao gravado'],
            ['VA41', 'Contrato', 'Apos aprovacao'],
            ['CJ20N', 'Projeto', 'Execucao'],
            ['VF01', 'Fatura', 'Faturamento'],
            ['FBL5N', 'Recebimento', 'Baixa'],
          ].map(([step, id, status]) => (
            <article key={step} className={step === 'VA01' ? 'current' : ''}>
              <span>{step}</span>
              <strong>{id}</strong>
              <p>{status}</p>
              <small>{step === 'VA01' ? 'Atual' : 'Pendente'}</small>
            </article>
          ))}
        </div>
      </section>
    </form>
  )
}
