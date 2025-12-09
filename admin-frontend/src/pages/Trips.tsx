
import React, { useEffect, useState } from 'react'
import api from '../services/api'
import { showToast } from '../services/toast'

export default function Trips(){
  const [trips, setTrips] = useState<any[]>([])
  const [form, setForm] = useState({busId:'', routeId:'', departureTime:'', arrivalTime:'', price:120000, generateSeats:true, rows:10, cols:4})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/admin/trips')
      .then(r => setTrips(r.data))
      .catch((err: any) => showToast(err.userMessage || 'Gagal memuat trips', 'error'))
  }, [])

  async function create(){
    if (!form.busId || !form.routeId || !form.departureTime || !form.arrivalTime) {
      showToast('Semua field harus diisi', 'error')
      return
    }

    setLoading(true)
    try {
      await api.post('/admin/trips', form)
      showToast('Trip berhasil dibuat', 'success')
      setForm({...form, departureTime:'', arrivalTime:''})
      const r = await api.get('/admin/trips')
      setTrips(r.data)
    } catch (err: any) {
      showToast(err.userMessage || 'Gagal membuat trip', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function del(id:string){
    if (!confirm('Apakah Anda yakin ingin menghapus trip ini?')) return

    try {
      await api.delete('/admin/trips/'+id)
      setTrips(trips.filter(t => t.id !== id))
      showToast('Trip berhasil dihapus', 'success')
    } catch (err: any) {
      showToast(err.userMessage || 'Gagal menghapus trip', 'error')
    }
  }
  return (
    <div>
      <h2>Trips</h2>
      <div className="card">
        <div className="form-row">
          <input className="input" placeholder="busId" value={form.busId} onChange={e=>setForm({...form,busId:e.target.value})} />
          <input className="input" placeholder="routeId" value={form.routeId} onChange={e=>setForm({...form,routeId:e.target.value})} />
        </div>
        <div className="form-row">
          <input className="input" placeholder="departureTime (ISO)" value={form.departureTime} onChange={e=>setForm({...form,departureTime:e.target.value})} />
          <input className="input" placeholder="arrivalTime (ISO)" value={form.arrivalTime} onChange={e=>setForm({...form,arrivalTime:e.target.value})} />
          <input className="input" placeholder="price" value={String(form.price)} onChange={e=>setForm({...form,price:Number(e.target.value)})} />
          <button className="button" onClick={create} disabled={loading}>
            {loading ? 'Memproses...' : 'Create'}
          </button>
        </div>
      </div>
      <div className="card">
        <table className="table"><thead><tr><th>Trip</th><th>Bus</th><th>Route</th><th>Departure</th><th>Action</th></tr></thead>
          <tbody>
            {trips.map(t=>(
              <tr key={t.id}><td>{t.id}</td><td>{t.bus?.name}</td><td>{t.route?.origin} → {t.route?.destination}</td><td>{new Date(t.departureTime).toLocaleString()}</td><td><button onClick={()=>del(t.id)} className="button">Delete</button></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
