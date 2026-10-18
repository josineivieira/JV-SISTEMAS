'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save } from 'lucide-react'

export default function EditServicePage() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    salePrice: '',
    costPrice: '',
    code: '',
    category: '',
    isActive: true,
  })
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const params = useParams()
  const serviceId = params?.id as string

  useEffect(() => {
    fetchService()
  }, [serviceId])

  const fetchService = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${serviceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const service = await response.json()
        setFormData({
          name: service.name || '',
          description: service.description || '',
          salePrice: (service.salePrice ?? service.price ?? '').toString(),
          costPrice: service.costPrice?.toString() || '',
          code: service.code || service.sku || '',
          category: service.category || '',
          isActive: service.isActive,
        })
      } else {
        router.push('/dashboard/products')
      }
    } catch (error) {
      console.error('Erro ao carregar servico:', error)
      router.push('/dashboard/products')
    } finally {
      setFetchLoading(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const serviceData = {
        ...formData,
        salePrice: parseFloat(formData.salePrice),
        costPrice: parseFloat(formData.costPrice || '0'),
        stockQuantity: 0,
        minStock: 0,
        unit: 'servico',
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(serviceData),
      })

      if (response.ok) {
        router.push('/dashboard/products')
      } else {
        const data = await response.json()
        setError(data.error || 'Erro ao atualizar servico')
      }
    } catch {
      setError('Erro de conexao')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = event.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (event.target as HTMLInputElement).checked : value,
    })
  }

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando servico...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="btn btn-secondary btn-icon" type="button">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar servico</h1>
          <p className="text-gray-600">Atualize escopo, valor e categoria do servico.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informacoes comerciais</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="site-form-error">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="md:col-span-2">
                <span className="auth-label">Nome do servico *</span>
                <input name="name" required value={formData.name} onChange={handleChange} className="auth-input" placeholder="Ex: Site profissional" />
              </label>

              <label className="md:col-span-2">
                <span className="auth-label">Descricao</span>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="auth-input" placeholder="Descreva escopo, entregas, prazo medio e suporte." />
              </label>

              <label>
                <span className="auth-label">Valor de venda (R$) *</span>
                <input type="number" name="salePrice" required step="0.01" min="0" value={formData.salePrice} onChange={handleChange} className="auth-input" />
              </label>

              <label>
                <span className="auth-label">Custo estimado (R$)</span>
                <input type="number" name="costPrice" step="0.01" min="0" value={formData.costPrice} onChange={handleChange} className="auth-input" />
              </label>

              <label>
                <span className="auth-label">Codigo interno *</span>
                <input type="text" name="code" required value={formData.code} onChange={handleChange} className="auth-input" placeholder="Ex: SITE-PRO" />
              </label>

              <label>
                <span className="auth-label">Categoria *</span>
                <select name="category" required value={formData.category} onChange={handleChange} className="auth-input">
                  <option value="">Selecione uma categoria</option>
                  <option value="Sites">Sites</option>
                  <option value="Sistemas">Sistemas</option>
                  <option value="Aplicativos">Aplicativos</option>
                  <option value="Automacoes">Automacoes</option>
                  <option value="Manutencao">Manutencao</option>
                  <option value="Consultoria">Consultoria</option>
                  <option value="Outros">Outros</option>
                </select>
              </label>

              <label className="md:col-span-2 flex items-center gap-2">
                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} />
                <span className="text-sm font-medium text-gray-700">Servico ativo</span>
              </label>
            </div>

            <div className="flex justify-end gap-4">
              <button type="button" onClick={() => router.back()} className="btn btn-secondary">Cancelar</button>
              <button type="submit" disabled={loading} className="btn btn-primary">
                <Save className="h-4 w-4" />
                {loading ? 'Salvando...' : 'Salvar alteracoes'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
