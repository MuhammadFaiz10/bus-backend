
import React, { useEffect, useState } from 'react'
import api from '../services/api'
import { showToast } from '../services/toast'

export default function Dashboard(){
  const [stats, setStats] = useState<any>({})
  useEffect(() => {
    api.get('/admin/bookings/stats')
      .then(r => setStats(r.data))
      .catch((err: any) => showToast(err.userMessage || 'Gagal memuat statistik', 'error'))
  },[])
  return (
    <div>
      <h2>Overview</h2>
      <div className="card">
        <strong>Total bookings:</strong> {stats.total ?? '-'}
      </div>
      <div className="card">
        <strong>Booking counts by status:</strong>
        <pre>{JSON.stringify(stats.counts, null, 2)}</pre>
      </div>
    </div>
  )
}
