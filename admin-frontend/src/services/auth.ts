
export function setToken(token: string){ localStorage.setItem('token', token) }
export function getToken(){ return localStorage.getItem('token') }
export function setUser(u:any){ localStorage.setItem('user', JSON.stringify(u)) }
export function getUser(){ try{return JSON.parse(localStorage.getItem('user')||'null')}catch{return null} }
export function logout(){ localStorage.removeItem('token'); localStorage.removeItem('user') }
