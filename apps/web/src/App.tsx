import { useEffect, useState } from 'react'

function App() {
  const [status, setStatus] = useState('loading...');
  useEffect(() => {
    fetch('http://localhost:3000/api/health')
      .then(r => r.json()).then(d => setStatus(d.status)).catch(()=>setStatus('error'));
  }, []);
  return <h1>VitaVet – API health: {status}</h1>;
}
export default App;
