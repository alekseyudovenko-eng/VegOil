// Добавляем состояние для разделов
const [sections, setSections] = useState({
  summary: '',
  prices: '',
  policy: ''
});

const fetchSection = async (type) => {
  setLoading(type); // Фиксируем, какой именно раздел грузится
  try {
    const res = await fetch(`/api/get-prices?section=${type}`);
    const data = await res.json();
    setSections(prev => ({ ...prev, [type]: data.report }));
  } catch (e) {
    console.error(e);
  } finally {
    setLoading(null);
  }
};

// В верстке (JSX):
<div className="flex gap-4 mb-8">
  <button onClick={() => fetchSection('summary')} className="...">Обзор рынка</button>
  <button onClick={() => fetchSection('prices')} className="...">Цены и Brent</button>
  <button onClick={() => fetchSection('policy')} className="...">Пошлины и законы</button>
</div>

{/* В контенте выводим блоки по отдельности */}
<div className="grid grid-cols-1 gap-6">
  {sections.summary && <div className="card">...</div>}
  {sections.prices && <div className="card">...</div>}
  {sections.policy && <div className="card">...</div>}
</div>
