import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  LayoutDashboard,
  Upload,
  Filter,
  DollarSign,
  Scale,
  ShoppingBag,
  MapPin,
  Calendar,
  TrendingUp,
  FileText
} from 'lucide-react';

// --- Types ---
type SalesData = {
  Date: string;
  Meat_Cut: string;
  Weight_kg: number;
  KG_Price: number;
  Region: string;
  Sales_Channel: string;
  Customer_Type: string;
  Promo_Applied: string;
  Revenue: number;
};

// --- Mock Data (from snippet) ---
const INITIAL_DATA: SalesData[] = [
  { Date: '2024-04-12', Meat_Cut: 'Liver', Weight_kg: 24.73, KG_Price: 194.32, Region: 'Cairo', Sales_Channel: 'Retail', Customer_Type: 'Supermarket', Promo_Applied: 'No', Revenue: 4805.53 },
  { Date: '2024-12-14', Meat_Cut: 'Flank', Weight_kg: 4.78, KG_Price: 163.35, Region: 'Delta', Sales_Channel: 'Retail', Customer_Type: 'Supermarket', Promo_Applied: 'No', Revenue: 780.81 },
  { Date: '2024-09-27', Meat_Cut: 'Ribeye', Weight_kg: 5.59, KG_Price: 251.62, Region: 'Alexandria', Sales_Channel: 'Butcher Shop', Customer_Type: 'Distributor', Promo_Applied: 'No', Revenue: 1406.55 },
  { Date: '2024-04-16', Meat_Cut: 'Short Ribs', Weight_kg: 42.92, KG_Price: 424.47, Region: 'Upper Egypt', Sales_Channel: 'HoReCa', Customer_Type: 'Restaurant', Promo_Applied: 'No', Revenue: 18218.25 },
  { Date: '2024-03-12', Meat_Cut: 'Round', Weight_kg: 49.53, KG_Price: 275.78, Region: 'Cairo', Sales_Channel: 'Online', Customer_Type: 'End Consumer', Promo_Applied: 'Yes', Revenue: 13659.38 },
  { Date: '2024-07-07', Meat_Cut: 'Kidney', Weight_kg: 34.45, KG_Price: 124.42, Region: 'Giza', Sales_Channel: 'Retail', Customer_Type: 'End Consumer', Promo_Applied: 'No', Revenue: 4286.27 },
  { Date: '2024-01-21', Meat_Cut: 'Sirloin', Weight_kg: 23.41, KG_Price: 213.31, Region: 'Alexandria', Sales_Channel: 'Wholesale', Customer_Type: 'Supermarket', Promo_Applied: 'No', Revenue: 4993.59 },
  { Date: '2024-09-11', Meat_Cut: 'Short Ribs', Weight_kg: 35.49, KG_Price: 371.08, Region: 'Upper Egypt', Sales_Channel: 'Online', Customer_Type: 'Distributor', Promo_Applied: 'Yes', Revenue: 13169.63 },
  { Date: '2024-10-29', Meat_Cut: 'Sirloin', Weight_kg: 46.62, KG_Price: 300.46, Region: 'Giza', Sales_Channel: 'Wholesale', Customer_Type: 'End Consumer', Promo_Applied: 'No', Revenue: 14007.44 },
  { Date: '2024-07-25', Meat_Cut: 'Flank', Weight_kg: 39.56, KG_Price: 179.50, Region: 'Alexandria', Sales_Channel: 'Online', Customer_Type: 'Distributor', Promo_Applied: 'Yes', Revenue: 7101.02 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

// --- Components ---

const KPICard = ({ title, value, icon, subValue }: { title: string; value: string; icon: React.ReactNode, subValue?: string }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
    </div>
    <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
      {icon}
    </div>
  </div>
);

export default function App() {
  const [rawData, setRawData] = useState<SalesData[]>(INITIAL_DATA);
  const [filteredData, setFilteredData] = useState<SalesData[]>(INITIAL_DATA);
  
  // Filters
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedChannel, setSelectedChannel] = useState<string>('All');

  // --- CSV Parser ---
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const parsedData: SalesData[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); // Regex to handle commas inside quotes
        
        // Simple mapping based on expected columns
        // 0: Date, 1: Meat_Cut, 2: Weight_kg, 3: KG_Price, 4: Region, 5: Sales_Channel, 6: Customer_Type, 7: Promo, 8: Avg...
        if (values.length >= 8) {
          const weight = parseFloat(values[2]);
          const price = parseFloat(values[3]);
          parsedData.push({
            Date: values[0],
            Meat_Cut: values[1],
            Weight_kg: weight || 0,
            KG_Price: price || 0,
            Region: values[4],
            Sales_Channel: values[5],
            Customer_Type: values[6],
            Promo_Applied: values[7],
            Revenue: (weight || 0) * (price || 0)
          });
        }
      }
      setRawData(parsedData);
      setFilteredData(parsedData);
    };
    reader.readAsText(file);
  };

  // --- Filtering Logic ---
  useEffect(() => {
    let data = rawData;
    if (selectedRegion !== 'All') {
      data = data.filter(d => d.Region === selectedRegion);
    }
    if (selectedChannel !== 'All') {
      data = data.filter(d => d.Sales_Channel === selectedChannel);
    }
    setFilteredData(data);
  }, [selectedRegion, selectedChannel, rawData]);

  // --- Aggregations for Charts ---
  
  const totalRevenue = useMemo(() => filteredData.reduce((acc, curr) => acc + curr.Revenue, 0), [filteredData]);
  const totalWeight = useMemo(() => filteredData.reduce((acc, curr) => acc + curr.Weight_kg, 0), [filteredData]);
  const avgPrice = useMemo(() => totalWeight > 0 ? totalRevenue / totalWeight : 0, [totalRevenue, totalWeight]);
  const transactionCount = filteredData.length;

  const salesByCut = useMemo(() => {
    const acc: Record<string, number> = {};
    filteredData.forEach(d => {
      acc[d.Meat_Cut] = (acc[d.Meat_Cut] || 0) + d.Revenue;
    });
    return Object.keys(acc).map(k => ({ name: k, value: acc[k] })).sort((a, b) => b.value - a.value);
  }, [filteredData]);

  const salesByRegion = useMemo(() => {
    const acc: Record<string, number> = {};
    filteredData.forEach(d => {
      acc[d.Region] = (acc[d.Region] || 0) + d.Revenue;
    });
    return Object.keys(acc).map(k => ({ name: k, value: acc[k] }));
  }, [filteredData]);

  // Parse dates for time trend
  const salesOverTime = useMemo(() => {
    const acc: Record<string, number> = {};
    filteredData.forEach(d => {
      // Assuming date format YYYY-MM-DD
      const dateKey = d.Date.substring(0, 7); // YYYY-MM
      acc[dateKey] = (acc[dateKey] || 0) + d.Revenue;
    });
    return Object.keys(acc).sort().map(k => ({ date: k, Revenue: acc[k] }));
  }, [filteredData]);

  // Unique values for dropdowns
  const regions = ['All', ...Array.from(new Set(rawData.map(d => d.Region)))];
  const channels = ['All', ...Array.from(new Set(rawData.map(d => d.Sales_Channel)))];

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-10">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="text-blue-600 w-6 h-6" />
            <h1 className="text-xl font-bold text-slate-800">Mansour's Meat Sales Analysis</h1>
          </div>
          <div className="flex items-center gap-4">
            <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
              <Upload className="w-4 h-4" />
              Upload Full CSV
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Filters Bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-8 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 text-slate-500 mr-2">
            <Filter className="w-4 h-4" />
            <span className="font-medium text-sm">Filters:</span>
          </div>
          
          <select 
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 min-w-[150px]"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
          >
            <option disabled>Select Region</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          <select 
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 min-w-[150px]"
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
          >
            <option disabled>Select Channel</option>
            {channels.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <div className="ml-auto text-sm text-slate-400">
            Showing analysis for {filteredData.length} transactions
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard 
            title="Total Revenue" 
            value={formatCurrency(totalRevenue)} 
            icon={<DollarSign className="w-6 h-6" />}
            subValue="EGP (Gross)"
          />
          <KPICard 
            title="Total Weight Sold" 
            value={`${new Intl.NumberFormat('en-US').format(Math.round(totalWeight))} kg`} 
            icon={<Scale className="w-6 h-6" />}
          />
          <KPICard 
            title="Avg Price / KG" 
            value={formatCurrency(avgPrice)} 
            icon={<TrendingUp className="w-6 h-6" />}
          />
          <KPICard 
            title="Transactions" 
            value={transactionCount.toString()} 
            icon={<FileText className="w-6 h-6" />}
          />
        </div>

        {/* Charts Section 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Sales by Meat Cut */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-2">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-500" />
              Revenue by Meat Cut
            </h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByCut} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sales by Region */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-500" />
              Regional Split
            </h3>
            <div className="h-80 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesByRegion}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {salesByRegion.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Section 2 - Time Trend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-8">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-500" />
            Revenue Trend Over Time
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesOverTime} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Line type="monotone" dataKey="Revenue" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </main>
    </div>
  );
}
