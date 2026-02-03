import React, { useState, useEffect } from 'react';

function App() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/get-prices')
      .then(res => res.json()) // Мы теперь ВСЕГДА шлем JSON из API, даже при ошибке
      .then(data => {
        setReport(data);
        setLoading(false);
      })
      .catch(e => {
        setReport({ summary: "Критическая ошибка фронтенда: " + e.message });
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: '30px', fontFamily: 'sans-serif', backgroundColor: '#f4f4f4', minHeight: '100vh' }}>
      <h1 style={{ color: '#333' }}>Market Intelligence Report</h1>
      
      {loading ? (
        <p>Связываюсь с сервером Vercel...</p>
      ) : (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '14px', color: '#888', textTransform: 'uppercase' }}>Current Analysis:</h2>
          <p style={{ fontSize: '18px', fontWeight: 'bold', lineHeight: '1.4' }}>
            {report?.summary || "Нет данных в ответе"}
          </p>
          
          {/* Эта часть покажет нам все остальные данные, если они придут */}
          <pre style={{ fontSize: '10px', background: '#eee', padding: '10px', marginTop: '20px', overflow: 'auto' }}>
            {JSON.stringify(report, null, 2)}
          </pre>
        </div>
      )}
      
      <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}>
        Обновить данные
      </button>
    </div>
  );
}

export default App;
