
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
  ExternalLink
} from 'lucide-react';
import { StatsCard } from './components/StatsCard';
import { Expense, AIAnalysis } from './types';
import { analyzeExpenses } from './services/geminiService';
import { fetchExpensesFromSheet } from './services/googleSheetsService';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4'];

/**
 * Formats values to standard Indonesian currency with "Rp" prefix 
 * and comma thousand separators (equivalent to Streamlit's NumberColumn formatting).
 */
const formatRupiah = (amount: number) => {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
  return `Rp ${formatted}`;
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
      setError(err.message || "Failed to sync with Google Sheets.");
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="relative">
          <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
          <CloudDownload className="w-6 h-6 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <h2 className="mt-6 text-xl font-bold text-slate-800">Syncing Google Sheets...</h2>
        <p className="mt-2 text-slate-500 italic">"Processing Amount, Category, and Payment Method..."</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 bg-[#F0F2F6]">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-indigo-200 shadow-md">
              <LayoutDashboard className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Sheet<span className="text-indigo-600">Insights</span></h1>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={runAnalysis}
              disabled={isAnalyzing || expenses.length === 0}
              className="hidden sm:flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-50 text-indigo-600 font-semibold hover:bg-indigo-100 transition-all disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${isAnalyzing ? 'animate-pulse text-amber-500' : ''}`} />
              <span>{isAnalyzing ? 'Analyzing...' : 'AI Advice'}</span>
            </button>
            <button 
              onClick={loadData}
              className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-lg transition-all"
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">Auth/Connection Error</p>
              <p className="text-xs opacity-90">{error}</p>
            </div>
          </div>
        )}

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard 
            title="Total Spending" 
            value={formatRupiah(totalSpending)} 
            icon={<Wallet className="w-5 h-5" />}
            color="bg-indigo-600"
          />
          <StatsCard 
            title="Primary Payment" 
            value={topPaymentMethod} 
            icon={<CreditCard className="w-5 h-5" />}
            color="bg-pink-500"
          />
          <StatsCard 
            title="Daily Average" 
            value={formatRupiah(totalSpending / (timeSeriesData.length || 1))} 
            icon={<TrendingUp className="w-5 h-5" />}
            color="bg-emerald-500"
          />
          <StatsCard 
            title="Total Categories" 
            value={categoryData.length} 
            icon={<PieChart className="w-5 h-5" />}
            color="bg-amber-500"
          />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200">
              <h3 className="text-md font-bold text-slate-800 flex items-center gap-2 mb-6">
                <Calendar className="w-4 h-4 text-indigo-500" />
                Spending History
              </h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeSeriesData}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                      axisLine={false} 
                      tickLine={false} 
                      domain={['auto', 'auto']}
                      tickFormatter={(val) => `Rp${(val/1000).toFixed(0)}k`} 
                    />
                    <Tooltip 
                      formatter={(value: number) => formatRupiah(value)}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#6366f1" 
                      strokeWidth={2} 
                      fill="url(#colorAmount)"
                      dot={{ r: 3, fill: '#6366f1', strokeWidth: 1.5, stroke: '#fff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200">
                <h3 className="text-md font-bold text-slate-800 mb-4">By Category</h3>
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis dataKey="category" type="category" width={80} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(val: number) => formatRupiah(val)} />
                      <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                        {categoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200">
                <h3 className="text-md font-bold text-slate-800 mb-4">Payment Methods</h3>
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={paymentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {paymentData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: number) => formatRupiah(val)} />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-md font-bold text-slate-800 mb-4 flex items-center justify-between">
                <span>Recent Transactions</span>
                <a 
                  href="https://docs.google.com/spreadsheets/d/1IeWkcbIPNHa7BpmJeEIbk_SsKGT-1yXo7KJuWL-he5o/edit"
                  target="_blank"
                  className="text-indigo-600 hover:text-indigo-700"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </h3>
              
              {/* DataFrame Style Table */}
              <div className="overflow-x-auto border rounded-lg border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b">
                    <tr>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {expenses.length === 0 ? (
                      <tr><td colSpan={3} className="p-4 text-center text-slate-400">No data</td></tr>
                    ) : (
                      expenses.slice().reverse().slice(0, 8).map((exp) => (
                        <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2 whitespace-nowrap text-slate-400">{exp.date}</td>
                          <td className="px-3 py-2 font-medium text-slate-700">{exp.category}</td>
                          <td className="px-3 py-2 text-right font-bold text-slate-900">{formatRupiah(exp.amount)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              <button className="w-full py-2.5 mt-4 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                Add Record
              </button>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
              <h3 className="text-md font-bold mb-4 flex items-center gap-2 relative z-10">
                <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
                Gemini AI Analyst
              </h3>
              
              {isAnalyzing ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-2 bg-white/10 rounded w-full"></div>
                  <div className="h-2 bg-white/10 rounded w-4/5"></div>
                  <div className="h-12 bg-white/10 rounded w-full mt-4"></div>
                </div>
              ) : aiResult ? (
                <div className="space-y-4 relative z-10">
                  <p className="text-xs text-slate-300 leading-relaxed italic border-l-2 border-indigo-500 pl-3">
                    "{aiResult.summary}"
                  </p>

                  <div className="space-y-2">
                    <h4 className="text-indigo-400 text-[10px] font-bold uppercase tracking-wider">Recommendations</h4>
                    {aiResult.recommendations.slice(0, 2).map((rec, idx) => (
                      <div key={idx} className="bg-white/5 p-2 rounded-lg text-[11px] text-slate-200">
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">Sync data to unlock AI tips.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
