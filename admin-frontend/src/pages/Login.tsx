
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { setToken, setUser } from '../services/auth'
import { showToast } from '../services/toast'

export default function LoginPage(){
  const [email, setEmail] = useState('admin@test.com')
  const [password, setPassword] = useState('password123')
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  async function submit(e: React.FormEvent){
    e.preventDefault()
    setErr(null)
    setLoading(true)

    try{
      const res = await api.post('/auth/login', { email, password })
      const token = res.data.token
      setToken(token)
      setUser(res.data.user)
      showToast('Login berhasil', 'success')
      nav('/')
    }catch(err:any){
      const errorMessage = err?.userMessage || err?.response?.data?.error || 'Login gagal'
      setErr(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{display:'flex',height:'100vh',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:360,background:'#fff',padding:20,borderRadius:8}}>
        <h3>Admin Login</h3>
        <form onSubmit={submit}>
          <div className="form-row"><input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email" /></div>
          <div className="form-row"><input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="password" /></div>
          {err && <div style={{color:'red',marginBottom:8}}>{err}</div>}
          <button className="button" type="submit" disabled={loading}>
            {loading ? 'Memproses...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
