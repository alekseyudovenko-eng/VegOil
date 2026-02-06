<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Oil Intelligence Terminal</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            background-color: #f8fafc; /* Светло-серый фон */
            color: #1e293b;
            font-family: 'Inter', sans-serif;
        }
        /* Стилизация текста отчета */
        .report-content h2 {
            color: #0369a1; /* Глубокий синий для заголовков */
            font-size: 1.4rem;
            font-weight: 700;
            margin-top: 2rem;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
        }
        .report-content h2::before {
            content: "";
            width: 4px;
            height: 1.5rem;
            background-color: #10b981; /* Зеленый акцент */
            margin-right: 12px;
            border-radius: 2px;
        }
        .report-content p {
            margin-bottom: 1rem;
            line-height: 1.7;
            color: #475569;
        }
        .card {
            background: white;
            border: 1px solid #e2e8f0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        /* Анимация загрузки */
        .loader-line {
            height: 3px;
            width: 100%;
            position: relative;
            overflow: hidden;
            background-color: #e2e8f0;
        }
        .loader-line:before {
            content: "";
            position: absolute;
            left: -50%;
            height: 3px;
            width: 40%;
            background-color: #10b981;
            animation: lineAnim 1.5s linear infinite;
        }
        @keyframes lineAnim {
            0% { left: -40%; }
            50% { left: 20%; width: 80%; }
            100% { left: 100%; width: 100%; }
        }
    </style>
</head>
<body class="p-4 md:p-10">

    <header class="max-w-6xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-end border-b border-slate-200 pb-6">
        <div>
            <div class="flex items-center gap-2 mb-1">
                <span class="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">Sector: Oilseeds</span>
                <span class="text-slate-400 text-xs font-medium uppercase tracking-widest">Market Intelligence</span>
            </div>
            <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">
                Agro<span class="text-emerald-600">Oil</span> Analysis
            </h1>
        </div>
        <div class="mt-6 md:mt-0">
            <button onclick="generateReport()" id="genBtn" class="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-8 rounded-lg shadow-lg shadow-slate-200 transition-all active:scale-95 flex items-center gap-2">
                <span>Generate Market Update</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </button>
        </div>
    </header>

    <main class="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        <aside class="lg:col-span-1 space-y-6">
            <div class="card rounded-xl p-5">
                <h3 class="text-slate-900 font-bold text-sm mb-4">Live Indicators</h3>
                <div class="space-y-4">
                    <div class="flex justify-between items-center">
                        <span class="text-slate-500 text-sm">Brent Crude</span>
                        <span class="text-slate-900 font-bold">$83.42</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-slate-500 text-sm">SFO Export</span>
                        <span class="text-slate-900 font-bold">$965.00</span>
                    </div>
                    <div class="flex justify-between items-center text-xs text-emerald-600 font-medium">
                        <span>● Black Sea Active</span>
                        <span>24/7</span>
                    </div>
                </div>
            </div>

            <div class="card rounded-xl p-5 bg-emerald-50 border-emerald-100">
                <h3 class="text-emerald-900 font-bold text-sm mb-2">Coverage</h3>
                <p class="text-emerald-700 text-xs leading-relaxed">
                    27 countries across CIS, EU and Central Asia are being monitored for oilseed market shifts.
                </p>
            </div>
        </aside>

        <section class="lg:col-span-3">
            <div id="loader" class="hidden mb-6">
                <div class="loader-line rounded-full"></div>
                <p class="text-xs text-slate-400 mt-2 font-medium animate-pulse">Consulting global databases and Google Search news...</p>
            </div>

            <div id="reportOutput" class="card rounded-2xl p-8 md:p-12 min-h-[500px] transition-all">
                <div class="text-center py-20">
                    <div class="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <h3 class="text-slate-400 font-medium">No active report</h3>
                    <p class="text-slate-300 text-sm">Click the button above to start the analytical engine.</p>
                </div>
            </div>
        </section>
    </main>

    <script>
        async function generateReport() {
            const btn = document.getElementById('genBtn');
            const output = document.getElementById('reportOutput');
            const loader = document.getElementById('loader');
            
            btn.disabled = true;
            btn.classList.add('opacity-50');
            loader.classList.remove('hidden');
            
            try {
                const res = await fetch('/api/get-prices');
                const data = await res.json();
                
                // Форматирование Markdown в HTML
                let text = data.report;
                text = text.replace(/## (.*)/g, '<h2>$1</h2>');
                text = text.replace(/\*\* (.*)/g, '<p><strong>$1</strong></p>');
                text = text.replace(/^\* (.*)/gm, '<p class="pl-4 border-l-2 border-slate-100 italic">• $1</p>');
                
                output.innerHTML = `<div class="report-content animate-in fade-in duration-700">${text}</div>`;
            } catch (e) {
                output.innerHTML = `<div class="p-4 bg-red-50 text-red-600 rounded-lg font-mono">System Error: ${e.message}</div>`;
            } finally {
                btn.disabled = false;
                btn.classList.remove('opacity-50');
                loader.classList.add('hidden');
            }
        }
    </script>
</body>
</html>
