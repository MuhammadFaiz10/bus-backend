
import React, { useEffect, useState } from 'react'
import api from '../services/api'

export default function RoutesPage(){
  const [routes, setRoutes] = useState<any[]>([])
  const [form, setForm] = useState({origin:'', destination:'', distanceKm:150})
  useEffect(()=>{ api.get('/admin/routes').then(r=>setRoutes(r.data)).catch(()=>{}) },[])
  async function createRoute(){
    await api.post('/admin/routes', form)
    setForm({origin:'',destination:'',distanceKm:150})
    const r = await api.get('/admin/routes'); setRoutes(r.data)
  }
  async function del(id:string){ await api.delete('/admin/routes/'+id); setRoutes(routes.filter(b=>b.id!==id)) }
  return (
    <div>
      <h2>Routes</h2>
      <div className="card">
        <div className="form-row">
          <input className="input" placeholder="origin" value={form.origin} onChange={e=>setForm({...form,origin:e.target.value})} />
          <input className="input" placeholder="destination" value={form.destination} onChange={e=>setForm({...form,destination:e.target.value})} />
          <input className="input" placeholder="distanceKm" value={String(form.distanceKm)} onChange={e=>setForm({...form,distanceKm:Number(e.target.value)})} />
          <button className="button" onClick={createRoute}>Create</button>
        </div>
      </div>
      <div className="card">
        <table className="table"><thead><tr><th>Origin</th><th>Destination</th><th>Distance</th><th>Action</th></tr></thead>
          <tbody>
            {routes.map(r=>(
              <tr key={r.id}><td>{r.origin}</td><td>{r.destination}</td><td>{r.distanceKm}</td><td><button onClick={()=>del(r.id)} className="button">Delete</button></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
