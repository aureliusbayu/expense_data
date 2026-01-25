
import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell, PieChart as RePieChart, Pie
} from 'recharts';
import { 
  LayoutDashboard, 
  Wallet, 
  TrendingUp, 
  PieChart, 
  Calendar,
  Zap,
  RefreshCcw,
  CreditCard,
  AlertCircle,
  Plus,
  Loader2,
  CloudDownload,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { StatsCard } from './components/StatsCard';
import { Expense, AIAnalysis } from './types';
import { analyzeExpenses } from './services/geminiService';
import { fetchExpensesFromSheet } from './services/googleSheetsService';

const COLORS = ['#6366f1', '#818cf8', '#94a3b8', '#475569', '#cbd5e1', '#4f46e5', '#334155'];

/**
 * Standard Indonesian currency formatting.
 */
const formatRupiah = (amount: number) => {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
  return `Rp ${formatted}`;
};

/**
 * Formats values to "k" (thousands) shorthand.
 */
const formatRupiahK = (amount: number) => {
  const kValue = amount / 1000;
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(kValue);
  return `Rp ${formatted}k`;
};

const App: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [aiResult, setAiResult] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchExpensesFromSheet();
      setExpenses(data);
      if (data.length > 0) {
        setIsAnalyzing(true);
        const analysis = await analyzeExpenses(data);
        setAiResult(analysis);
        setIsAnalyzing(false);
      }
    } catch (err: any) {
      setError(err.message || "Gagal sinkronisasi dengan Google Sheets.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalSpending = useMemo(() => 
    expenses.reduce((sum, exp) => sum + exp.amount, 0), 
  [expenses]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach(exp => {
      map.set(exp.category, (map.get(exp.category) || 0) + exp.amount);
    });
    return Array.from(map.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  const paymentData = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach(exp => {
      map.set(exp.paymentMethod, (map.get(exp.paymentMethod) || 0) + exp.amount);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const timeSeriesData = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach(exp => {
      map.set(exp.date, (map.get(exp.date) || 0) + exp.amount);
    });
    return Array.from(map.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, amount]) => ({ date, amount }));
  }, [expenses]);

  const topPaymentMethod = useMemo(() => {
    if (paymentData.length === 0) return "N/A";
    return [...paymentData].sort((a, b) => b.value - a.value)[0].name;
  }, [paymentData]);

  const runAnalysis = async () => {
    if (expenses.length === 0) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeExpenses(expenses);
      setAiResult(result);
    } catch (error) {
      console.error("AI Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-10 h-10 text-slate-300 animate-spin" />
          <div className="text-center">
            <h2 className="text-lg font-semibold text-slate-700">Menyiapkan Dashboard...</h2>
            <p className="text-sm text-slate-400">Menghubungkan ke Catatan Pengeluaran Anda</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] selection:bg-indigo-100">
      <header className="bg-white border-b border-slate-200/60 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-slate-900 p-2 rounded-xl shadow-sm">
              <LayoutDashboard className="text-white w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">
              Catatan<span className="text-indigo-600">Pengeluaran</span>
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={runAnalysis}
              disabled={isAnalyzing || expenses.length === 0}
              className="hidden sm:flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 transition-all disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${isAnalyzing ? 'animate-pulse text-amber-500' : ''}`} />
              <span>{isAnalyzing ? 'Menganalisis...' : 'Minta Saran AI'}</span>
            </button>
            <button 
              onClick={loadData}
              className="p-2.5 text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded-lg transition-all shadow-sm"
              title="Refresh Data"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3 text-red-800 animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-bold">Gagal Memuat Data</p>
              <p className="opacity-80">{error}</p>
            </div>
          </div>
        )}

        {/* Primary Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatsCard 
            title="Total Pengeluaran" 
            value={formatRupiahK(totalSpending)} 
            icon={<Wallet />}
            color="bg-slate-900"
          />
          <StatsCard 
            title="Pembayaran Terbanyak" 
            value={topPaymentMethod} 
            icon={<CreditCard />}
            color="bg-indigo-500"
          />
          <StatsCard 
            title="Rata-rata Harian" 
            value={formatRupiahK(totalSpending / (timeSeriesData.length || 1))} 
            icon={<TrendingUp />}
            color="bg-slate-500"
          />
          <StatsCard 
            title="Jumlah Kategori" 
            value={categoryData.length} 
            icon={<PieChart />}
            color="bg-slate-400"
          />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Visuals Column */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/50 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Tren Pengeluaran</h3>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">Ringkasan Aktivitas Harian</p>
                </div>
                <div className="flex items-center space-x-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>AKTIF</span>
                </div>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeSeriesData}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.06}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10, fill: '#94a3b8' }} 
                      axisLine={false} 
                      tickLine={false} 
                      dy={10}
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: '#94a3b8' }} 
                      axisLine={false} 
                      tickLine={false} 
                      domain={['auto', 'auto']}
                      tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} 
                    />
                    <Tooltip 
                      formatter={(value: number) => formatRupiah(value)}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '11px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#6366f1" 
                      strokeWidth={2.5} 
                      fill="url(#colorAmount)"
                      dot={{ r: 0 }}
                      activeDot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/50 shadow-sm">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Alokasi Kategori</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis dataKey="category" type="category" width={80} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: '#f8fafc'}} formatter={(val: number) => formatRupiah(val)} contentStyle={{borderRadius: '10px', fontSize: '11px'}} />
                      <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={10}>
                        {categoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/50 shadow-sm">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Metode Pembayaran</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={paymentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {paymentData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: number) => formatRupiah(val)} contentStyle={{borderRadius: '10px', fontSize: '11px'}} />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Side Content Area */}
          <div className="lg:col-span-4 space-y-6">
            {/* AI Summary Card */}
            <div className="bg-slate-900 p-6 rounded-3xl shadow-xl shadow-indigo-100 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-28 h-28 bg-indigo-500/20 rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>
              <h3 className="text-xs font-bold mb-5 flex items-center gap-2 relative z-10 uppercase tracking-widest text-slate-400">
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                Gemini AI Analyst
              </h3>
              
              {isAnalyzing ? (
                <div className="space-y-4 animate-pulse relative z-10">
                  <div className="h-3 bg-white/10 rounded w-full"></div>
                  <div className="h-3 bg-white/10 rounded w-4/5"></div>
                  <div className="h-20 bg-white/10 rounded w-full mt-6"></div>
                </div>
              ) : aiResult ? (
                <div className="space-y-5 relative z-10">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                    <p className="text-xs text-slate-200 leading-relaxed italic">
                      "{aiResult.summary}"
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Saran Penghematan</h4>
                    {aiResult.recommendations.slice(0, 3).map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                        <p className="text-[11px] text-slate-300 leading-normal">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 relative z-10 border border-dashed border-white/10 rounded-2xl">
                  <p className="text-[11px] text-slate-500 italic">Sinkronkan data untuk mendapatkan analisis keuangan cerdas.</p>
                </div>
              )}
            </div>

            {/* Transactions Log */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/50 shadow-sm flex flex-col h-full max-h-[600px]">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Data Terakhir</h3>
                <a 
                  href="https://docs.google.com/spreadsheets/d/1IeWkcbIPNHa7BpmJeEIbk_SsKGT-1yXo7KJuWL-he5o/edit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors border border-slate-100"
                  title="Lihat Spreadsheet"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              
              <div className="overflow-y-auto flex-grow custom-scrollbar space-y-1">
                <div className="flex text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-2 mb-2 border-b border-slate-50">
                  <span className="flex-1">Detail</span>
                  <span className="w-24 text-right">Jumlah</span>
                </div>
                {expenses.length === 0 ? (
                  <p className="py-12 text-center text-slate-300 text-xs italic">Belum ada transaksi</p>
                ) : (
                  expenses.slice().reverse().slice(0, 20).map((exp) => (
                    <div key={exp.id} className="flex items-center p-2 rounded-xl hover:bg-slate-50 transition-colors group">
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold text-slate-800 truncate">{exp.category}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          {exp.date} <span className="w-0.5 h-0.5 rounded-full bg-slate-300"></span> {exp.paymentMethod}
                        </div>
                      </div>
                      <div className="w-24 text-right">
                        <span className="text-[11px] font-bold text-slate-900">{formatRupiah(exp.amount)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <button 
                onClick={() => window.open('https://docs.google.com/spreadsheets/d/1IeWkcbIPNHa7BpmJeEIbk_SsKGT-1yXo7KJuWL-he5o/edit', '_blank')}
                className="w-full py-3.5 mt-6 text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 hover:text-indigo-600 transition-all flex items-center justify-center gap-2 uppercase tracking-widest shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Input di Spreadsheet
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 mt-12 border-t border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em]">
              © 2024 Catatan Pengeluaran
            </p>
            <p className="text-[10px] text-slate-300 mt-1 uppercase tracking-widest font-medium">Dashboard Analisis Keuangan Personal</p>
          </div>
          <div className="flex items-center space-x-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span className="cursor-pointer hover:text-indigo-600 transition-colors">Bantuan</span>
            <span className="cursor-pointer hover:text-indigo-600 transition-colors">Panduan</span>
            <span className="cursor-pointer hover:text-indigo-600 transition-colors">Kebijakan Privasi</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
