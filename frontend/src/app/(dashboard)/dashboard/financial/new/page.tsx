'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'

export default function NewFinancialPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialType = searchParams?.get('type') === 'receivables' ? 'receivables' : 'payables'
  const [type, setType] = useState<'payables' | 'receivables'>(initialType)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    description: '',
    category: '',
    amount: '',
    dueDate: '',
    supplier: '',
    clientId: '',
    notes: '',
  })

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const payload = {
        ...formData,
        amount: Number(formData.amount),
        clientId: formData.clientId || null,
      }
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/financial/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        router.push('/dashboard/financial')
        return
      }

      const data = await response.json()
      setError(data.error || 'Erro ao salvar lancamento')
    } catch {
      setError('Erro de conexao')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="btn btn-secondary btn-icon" type="button">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Novo Financeiro</h1>
          <p className="text-gray-600">Registre uma conta a pagar ou receber</p>
        </div>
      </div>

      <div className="sap-card panel">
        <div className="panel-header">
          <div className="auth-switch" style={{ margin: 0, maxWidth: '28rem' }}>
            <button type="button" onClick={() => setType('payables')} className={type === 'payables' ? 'auth-switch-button active' : 'auth-switch-button'}>
              A pagar
            </button>
            <button type="button" onClick={() => setType('receivables')} className={type === 'receivables' ? 'auth-switch-button active' : 'auth-switch-button'}>
              A receber
            </button>
          </div>
        </div>
        <div className="panel-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="bg-red-50 border border-gray-300 text-red-700 px-4 py-3 rounded-md">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="md:col-span-2">
                <span className="auth-label">Descricao *</span>
                <input name="description" required value={formData.description} onChange={handleChange} className="auth-input" />
              </label>

              <label>
                <span className="auth-label">Valor *</span>
                <input type="number" step="0.01" min="0" name="amount" required value={formData.amount} onChange={handleChange} className="auth-input" />
              </label>

              <label>
                <span className="auth-label">Vencimento *</span>
                <input type="date" name="dueDate" required value={formData.dueDate} onChange={handleChange} className="auth-input" />
              </label>

              {type === 'payables' ? (
                <>
                  <label>
                    <span className="auth-label">Categoria</span>
                    <input name="category" value={formData.category} onChange={handleChange} className="auth-input" />
                  </label>
                  <label>
                    <span className="auth-label">Fornecedor</span>
                    <input name="supplier" value={formData.supplier} onChange={handleChange} className="auth-input" />
                  </label>
                </>
              ) : (
                <label>
                  <span className="auth-label">ID do cliente</span>
                  <input name="clientId" value={formData.clientId} onChange={handleChange} className="auth-input" />
                </label>
              )}

              <label className="md:col-span-2">
                <span className="auth-label">Observacoes</span>
                <textarea name="notes" rows={3} value={formData.notes} onChange={handleChange} className="auth-input" />
              </label>
            </div>

            <div className="flex justify-end gap-4">
              <button type="button" onClick={() => router.back()} className="btn btn-secondary">Cancelar</button>
              <button type="submit" disabled={loading} className="btn btn-primary">
                <Save className="h-4 w-4" />
                {loading ? 'Salvando...' : 'Salvar Lancamento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
