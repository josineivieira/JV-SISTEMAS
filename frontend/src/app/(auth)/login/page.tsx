'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { ArrowRight, BarChart3, Building2, LockKeyhole, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyName: '',
    companyCnpj: '',
    companyEmail: '',
    userName: '',
    userEmail: '',
    userPassword: '',
  })

  const router = useRouter()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register'
      const payload = isLogin
        ? {
            email: formData.email,
            password: formData.password,
          }
        : {
            companyName: formData.companyName,
            companyCnpj: formData.companyCnpj,
            companyEmail: formData.companyEmail,
            userName: formData.userName,
            userEmail: formData.userEmail,
            password: formData.userPassword,
          }

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        toast.success(isLogin ? 'Login realizado com sucesso!' : 'Empresa cadastrada com sucesso!')
        router.push('/dashboard')
        return
      }

      toast.error(data.error || 'Nao foi possivel processar a solicitacao')
    } catch {
      toast.error('Erro de conexao. Confira a API e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <Toaster position="top-right" />

      <section className="auth-shell">
        <div className="auth-showcase">
          <div className="auth-branding">
            <span className="auth-brand-logo auth-brand-logo-image">
              <img src="/jv-sistemas-mark-transparent.png" alt="JV Sistemas" />
            </span>
            <div>
              <p className="eyebrow">Acesso interno</p>
              <p className="sidebar-title">JV Sistemas & Tecnologia</p>
            </div>
          </div>

          <div>
            <h1 className="auth-title">ERP Logistico JV.</h1>
            <p className="auth-description">
              Controle pedidos, entregas, picking WM, saida de mercadoria, POD, faturamento,
              fiscal, EDI e operacao no estilo SAP ECC.
            </p>
          </div>

          <div className="auth-kpis">
            <div className="auth-kpi">
              <strong>ECC</strong>
              <span>SD e LE-WM</span>
            </div>
            <div className="auth-kpi">
              <strong>TMS</strong>
              <span>Transportes e frota</span>
            </div>
            <div className="auth-kpi">
              <strong>Fiscal</strong>
              <span>NFS-e, CT-e e MDF-e</span>
            </div>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-branding">
            <span className="metric-icon">
              {isLogin ? <LockKeyhole size={18} /> : <Building2 size={18} />}
            </span>
            <div>
              <h2 className="panel-title">{isLogin ? 'Acessar ERP logistico' : 'Cadastrar operacao'}</h2>
              <p className="panel-subtitle">
                {isLogin ? 'Entre no mandante operacional.' : 'Crie o primeiro usuario administrador.'}
              </p>
            </div>
          </div>

          <div className="auth-switch">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={isLogin ? 'auth-switch-button active' : 'auth-switch-button'}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={!isLogin ? 'auth-switch-button active' : 'auth-switch-button'}
            >
              Cadastrar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {isLogin ? (
              <>
                <label className="auth-field">
                  <span className="auth-label">E-mail</span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="auth-input"
                    placeholder="admin@jvsistemas.com.br"
                    required
                  />
                </label>

                <label className="auth-field">
                  <span className="auth-label">Senha</span>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="auth-input"
                    placeholder="********"
                    required
                  />
                </label>
              </>
            ) : (
              <>
                <label className="auth-field">
                  <span className="auth-label">Nome da empresa</span>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="auth-input"
                    placeholder="JV Sistemas & Tecnologia"
                    required
                  />
                </label>

                <label className="auth-field">
                  <span className="auth-label">CNPJ</span>
                  <input
                    type="text"
                    name="companyCnpj"
                    value={formData.companyCnpj}
                    onChange={handleInputChange}
                    className="auth-input"
                    placeholder="00.000.000/0000-00"
                    required
                  />
                </label>

                <label className="auth-field">
                  <span className="auth-label">E-mail da empresa</span>
                  <input
                    type="email"
                    name="companyEmail"
                    value={formData.companyEmail}
                    onChange={handleInputChange}
                    className="auth-input"
                    placeholder="contato@jvsistemas.com.br"
                    required
                  />
                </label>

                <label className="auth-field">
                  <span className="auth-label">Nome do administrador</span>
                  <input
                    type="text"
                    name="userName"
                    value={formData.userName}
                    onChange={handleInputChange}
                    className="auth-input"
                    placeholder="Josinei"
                    required
                  />
                </label>

                <label className="auth-field">
                  <span className="auth-label">E-mail do administrador</span>
                  <input
                    type="email"
                    name="userEmail"
                    value={formData.userEmail}
                    onChange={handleInputChange}
                    className="auth-input"
                    placeholder="admin@jvsistemas.com.br"
                    required
                  />
                </label>

                <label className="auth-field">
                  <span className="auth-label">Senha</span>
                  <input
                    type="password"
                    name="userPassword"
                    value={formData.userPassword}
                    onChange={handleInputChange}
                    className="auth-input"
                    placeholder="********"
                    required
                  />
                </label>
              </>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary auth-submit">
              {loading ? 'Processando...' : isLogin ? 'Entrar no ERP' : 'Criar operacao'}
              {loading ? <ShieldCheck size={17} /> : <ArrowRight size={17} />}
            </button>
          </form>

          <div className="metric-note mt-4">
            <BarChart3 size={16} />
            <span>Ambiente privado para operacao logistica JV Sistemas.</span>
          </div>
        </div>
      </section>
    </main>
  )
}
