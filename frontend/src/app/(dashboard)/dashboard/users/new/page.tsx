'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'

export default function NewUserPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
  })

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push('/dashboard/users')
        return
      }

      const data = await response.json()
      setError(data.error || 'Erro ao criar usuario')
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
          <h1 className="text-3xl font-bold text-gray-900">Novo Usuario</h1>
          <p className="text-gray-600">Cadastre um acesso para a equipe</p>
        </div>
      </div>

      <div className="sap-card panel">
        <div className="panel-header">
          <h2 className="panel-title">Dados do usuario</h2>
        </div>
        <div className="panel-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="bg-red-50 border border-gray-300 text-red-700 px-4 py-3 rounded-md">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label>
                <span className="auth-label">Nome *</span>
                <input name="name" required value={formData.name} onChange={handleChange} className="auth-input" />
              </label>

              <label>
                <span className="auth-label">Email *</span>
                <input type="email" name="email" required value={formData.email} onChange={handleChange} className="auth-input" />
              </label>

              <label>
                <span className="auth-label">Senha *</span>
                <input type="password" name="password" required value={formData.password} onChange={handleChange} className="auth-input" />
              </label>

              <label>
                <span className="auth-label">Perfil *</span>
                <select name="role" required value={formData.role} onChange={handleChange} className="auth-input">
                  <option value="admin">Dono/Admin</option>
                  <option value="employee">Funcionario</option>
                  <option value="finance">Financeiro</option>
                  <option value="sales">Vendedor</option>
                </select>
              </label>
            </div>

            <div className="flex justify-end gap-4">
              <button type="button" onClick={() => router.back()} className="btn btn-secondary">Cancelar</button>
              <button type="submit" disabled={loading} className="btn btn-primary">
                <Save className="h-4 w-4" />
                {loading ? 'Salvando...' : 'Salvar Usuario'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
