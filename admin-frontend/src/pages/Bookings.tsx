
import React, { useEffect, useState } from 'react'
import api from '../services/api'

export default function Bookings(){
  const [bookings, setBookings] = useState<any[]>([])
  useEffect(()=>{ api.get('/admin/bookings').then(r=>setBookings(r.data.data).catch(()=>{})) },[])
  return (
    <div>
      <h2>Bookings</h2>
      <div className="card">
        <table className="table"><thead><tr><th>ID</th><th>User</th><th>Trip</th><th>Status</th><th>Price</th></tr></thead>
          <tbody>
            {bookings.map(b=>(
              <tr key={b.id}><td>{b.id}</td><td>{b.user?.email}</td><td>{b.trip?.route?.origin}→{b.trip?.route?.destination}</td><td>{b.status}</td><td>{b.totalPrice}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
