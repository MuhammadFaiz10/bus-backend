
import React, { useEffect, useState } from 'react'
import api from '../services/api'
import { showToast } from '../services/toast'

export default function Buses(){
  const [buses, setBuses] = useState<any[]>([])
  const [form, setForm] = useState({name:'', plate:'', totalSeat:40})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/admin/buses')
      .then(r => setBuses(r.data))
      .catch((err: any) => showToast(err.userMessage || 'Gagal memuat buses', 'error'))
  }, [])

  async function createBus(){
    if (!form.name || !form.plate) {
      showToast('Nama dan plate harus diisi', 'error')
      return
    }

    setLoading(true)
    try {
      await api.post('/admin/buses', form)
      showToast('Bus berhasil dibuat', 'success')
      setForm({name:'', plate:'', totalSeat:40})
      const r = await api.get('/admin/buses')
      setBuses(r.data)
    } catch (err: any) {
      showToast(err.userMessage || 'Gagal membuat bus', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function del(id:string){
    if (!confirm('Apakah Anda yakin ingin menghapus bus ini?')) return

    try {
      await api.delete('/admin/buses/'+id)
      setBuses(buses.filter(b => b.id !== id))
      showToast('Bus berhasil dihapus', 'success')
    } catch (err: any) {
      showToast(err.userMessage || 'Gagal menghapus bus', 'error')
    }
  }
  return (
    <div>
      <h2>Buses</h2>
      <div className="card">
        <div className="form-row">
          <input className="input" placeholder="name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
          <input className="input" placeholder="plate" value={form.plate} onChange={e=>setForm({...form,plate:e.target.value})} />
          <input className="input" placeholder="totalSeat" value={String(form.totalSeat)} onChange={e=>setForm({...form,totalSeat:Number(e.target.value)})} />
          <button className="button" onClick={createBus} disabled={loading}>
            {loading ? 'Memproses...' : 'Create'}
          </button>
        </div>
      </div>
      <div className="card">
        <table className="table"><thead><tr><th>Name</th><th>Plate</th><th>Seats</th><th>Action</th></tr></thead>
          <tbody>
            {buses.map(b=>(
              <tr key={b.id}><td>{b.name}</td><td>{b.plate}</td><td>{b.totalSeat}</td><td><button onClick={()=>del(b.id)} className="button">Delete</button></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
