
import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  Recycle, 
  MapPin, 
  ChevronRight, 
  Leaf, 
  Trash2, 
  AlertCircle, 
  Info,
  History,
  LayoutDashboard,
  X,
  Loader2,
  ExternalLink,
  ArrowRight,
  Share2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  BookOpen,
  Sparkles,
  Droplets,
  Wind,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { classifyWaste, findNearbyRecyclingCenters } from './services/geminiService';
import { WasteAnalysis, RecyclingCenter, WasteRecord } from './types';
import WasteChart from './components/WasteChart';

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'scanner' | 'history' | 'map' | 'guide'>('dashboard');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<WasteAnalysis | null>(null);
  const [showDetailedInstructions, setShowDetailedInstructions] = useState(false);
  const [centers, setCenters] = useState<RecyclingCenter[]>([]);
  const [history, setHistory] = useState<WasteRecord[]>([]);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLoadingCenters, setIsLoadingCenters] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('waste_history');
    if (saved) setHistory(JSON.parse(saved));

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      }, (err) => console.debug("Location denied", err));
    }
  }, []);

  const saveToHistory = (analysis: WasteAnalysis) => {
    const newRecord: WasteRecord = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      item: analysis.item,
      category: analysis.category,
    };
    const updated = [newRecord, ...history].slice(0, 50);
    setHistory(updated);
    localStorage.setItem('waste_history', JSON.stringify(updated));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setView('scanner');
    setResult(null);
    setShowDetailedInstructions(false);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const analysis = await classifyWaste(base64);
        setResult(analysis);
        saveToHistory(analysis);
        
        if (location) {
          setIsLoadingCenters(true);
          try {
            const nearby = await findNearbyRecyclingCenters(location.lat, location.lng, analysis.item);
            setCenters(nearby);
          } catch (err) {
            console.error("Map search failed", err);
          } finally {
            setIsLoadingCenters(false);
          }
        }
      } catch (err) {
        alert("Classification failed. Please try again with a clearer image.");
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleShare = async (analysis: WasteAnalysis) => {
    const shareData = {
      title: 'EcoSort AI: Waste Sorted!',
      text: `I just correctly sorted ${analysis.item} as ${analysis.category}! 🌍\nSustainability Tip: ${analysis.sustainabilityTip}\nHelp me save the planet with EcoSort AI!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        alert('Copied share link to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const NavItem = ({ icon: Icon, label, id }: { icon: any, label: string, id: typeof view }) => (
    <button
      onClick={() => setView(id)}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        view === id 
          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium whitespace-nowrap">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-lg text-white shadow-md">
            <Leaf size={24} />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">EcoSort <span className="text-emerald-600">AI</span></h1>
        </div>
        
        <nav className="flex flex-col gap-1.5 flex-grow">
          <NavItem icon={LayoutDashboard} label="Dashboard" id="dashboard" />
          <NavItem icon={Camera} label="Waste Scanner" id="scanner" />
          <NavItem icon={BookOpen} label="Clean Guide" id="guide" />
          <NavItem icon={History} label="History" id="history" />
          <NavItem icon={MapPin} label="Find Facilities" id="map" />
        </nav>

        <div className="pt-6 border-t border-slate-100">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-2xl border border-emerald-100">
            <p className="text-xs text-emerald-700 font-bold mb-1 uppercase tracking-wider">Impact Score</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-emerald-900">{history.length * 5}</span>
              <span className="text-xs text-emerald-600 font-medium">kg CO2 saved</span>
            </div>
            <div className="w-full bg-emerald-200 h-2 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-emerald-600 h-full transition-all duration-500" 
                style={{ width: `${Math.min((history.length * 5), 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
        <header className="flex justify-between items-center mb-8 md:hidden">
          <div className="flex items-center gap-2">
            <Leaf className="text-emerald-600" size={24} />
            <h1 className="text-xl font-bold">EcoSort AI</h1>
          </div>
          <div className="bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-2">
             <Zap size={14} className="text-emerald-600" />
             <span className="text-xs font-bold text-emerald-700">{history.length * 5} pts</span>
          </div>
        </header>

        {view === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <header>
              <h2 className="text-3xl font-black text-slate-900">Your Impact</h2>
              <p className="text-slate-500">Track your progress in clean waste management.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group hover:shadow-md transition-all">
                <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-600 mb-5 group-hover:scale-110 transition-transform">
                  <Recycle size={24} />
                </div>
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Items Sorted</p>
                <h4 className="text-3xl font-black text-slate-900">{history.length}</h4>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group hover:shadow-md transition-all">
                <div className="bg-emerald-50 w-12 h-12 rounded-2xl flex items-center justify-center text-emerald-600 mb-5 group-hover:scale-110 transition-transform">
                  <Sparkles size={24} />
                </div>
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Clean Actions</p>
                <h4 className="text-3xl font-black text-slate-900">{history.length * 2}</h4>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group hover:shadow-md transition-all">
                <div className="bg-amber-50 w-12 h-12 rounded-2xl flex items-center justify-center text-amber-600 mb-5 group-hover:scale-110 transition-transform">
                  <ShieldCheck size={24} />
                </div>
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Eco Badge</p>
                <h4 className="text-3xl font-black text-slate-900">Level {Math.floor(history.length / 5) + 1}</h4>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                  <h3 className="text-xl font-black mb-6 text-slate-800">Waste Categorization</h3>
                  <WasteChart data={history} />
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-slate-800">Recent Sorting</h3>
                    <button onClick={() => setView('history')} className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                      Full Log <ChevronRight size={18} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {history.slice(0, 4).map(item => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50/50 border border-transparent hover:border-slate-200 rounded-2xl transition-all">
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-12 rounded-full ${
                            item.category === 'Recyclable' ? 'bg-blue-400 shadow-lg shadow-blue-100' :
                            item.category === 'Organic' ? 'bg-emerald-400 shadow-lg shadow-emerald-100' :
                            item.category === 'Hazardous' ? 'bg-red-400 shadow-lg shadow-red-100' :
                            'bg-slate-300'
                          }`} />
                          <div>
                            <p className="font-bold text-slate-900 capitalize text-lg leading-tight">{item.item}</p>
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-tighter">{new Date(item.timestamp).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-white shadow-sm border border-slate-100 text-slate-600">
                          {item.category}
                        </span>
                      </div>
                    ))}
                    {history.length === 0 && (
                      <div className="text-center py-12 px-6">
                        <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                          <History size={32} />
                        </div>
                        <p className="text-slate-400 font-medium">Ready to start your green journey?</p>
                        <button onClick={() => setView('scanner')} className="mt-4 text-emerald-600 font-bold hover:underline">Scan your first item</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white p-8 rounded-[2rem] relative overflow-hidden shadow-xl shadow-emerald-100/50">
                  <div className="relative z-10">
                    <div className="bg-emerald-400/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/10">
                       <Zap size={24} />
                    </div>
                    <h3 className="text-2xl font-black mb-3">Green Streak</h3>
                    <p className="text-emerald-100/80 text-sm mb-8 leading-relaxed font-medium">
                      Sorting your waste properly reduces methane emissions by 40%. Keep going!
                    </p>
                    <button 
                      onClick={() => setView('scanner')}
                      className="w-full bg-white text-emerald-900 py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-emerald-50 transition-all shadow-lg"
                    >
                      <Camera size={20} /> Open Scanner
                    </button>
                  </div>
                  <Leaf className="absolute -right-12 -bottom-12 text-white/5 rotate-12" size={240} />
                </div>

                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                  <h3 className="text-xl font-black mb-4 text-slate-800">Eco Insight</h3>
                  <div className="flex gap-5">
                    <div className="text-emerald-500 shrink-0 bg-emerald-50 w-10 h-10 rounded-xl flex items-center justify-center">
                      <Info size={20} />
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium italic">
                      "Clean waste management starts with rinsing food containers. This simple act makes recycling 90% more efficient."
                    </p>
                  </div>
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Sparkles size={80} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'guide' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <header className="max-w-2xl">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">Clean Management Guide</h2>
              <p className="text-slate-500 text-lg mt-2 font-medium">Expert practices for keeping your home and planet healthy through efficient waste handling.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-emerald-100/50 transition-all border-b-4 border-b-blue-500">
                <div className="bg-blue-50 w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-blue-600 mb-6">
                  <Droplets size={32} />
                </div>
                <h4 className="text-2xl font-black text-slate-900 mb-3">Rinse & Dry</h4>
                <p className="text-slate-600 font-medium leading-relaxed mb-6">Contaminated recycling can spoil entire batches. Always rinse food residue and let containers dry before binning.</p>
                <div className="flex items-center gap-2 text-blue-600 text-sm font-black uppercase tracking-widest">
                  <CheckCircle2 size={16} /> High Impact
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-emerald-100/50 transition-all border-b-4 border-b-emerald-500">
                <div className="bg-emerald-50 w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-emerald-600 mb-6">
                  <Wind size={32} />
                </div>
                <h4 className="text-2xl font-black text-slate-900 mb-3">Odor Control</h4>
                <p className="text-slate-600 font-medium leading-relaxed mb-6">Use baking soda at the bottom of bins to neutralize smells naturally without using harmful chemical sprays.</p>
                <div className="flex items-center gap-2 text-emerald-600 text-sm font-black uppercase tracking-widest">
                  <CheckCircle2 size={16} /> Essential
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-emerald-100/50 transition-all border-b-4 border-b-amber-500">
                <div className="bg-amber-50 w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-amber-600 mb-6">
                  <Sparkles size={32} />
                </div>
                <h4 className="text-2xl font-black text-slate-900 mb-3">Proper Bagging</h4>
                <p className="text-slate-600 font-medium leading-relaxed mb-6">Choose compostable liners for organics and never bag recyclables—most sorting centers need items loose.</p>
                <div className="flex items-center gap-2 text-amber-600 text-sm font-black uppercase tracking-widest">
                  <CheckCircle2 size={16} /> Smart Sorting
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row items-center gap-12 overflow-hidden relative shadow-2xl">
              <div className="relative z-10 space-y-6 flex-1">
                <span className="bg-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em] border border-emerald-500/30">
                  Zero Waste Masterclass
                </span>
                <h3 className="text-4xl font-black leading-tight">Mastering Household <br/> <span className="text-emerald-400">Clean Management</span></h3>
                <p className="text-slate-400 text-lg font-medium leading-relaxed">
                  Clean waste isn't just about sorting; it's about maintaining hygiene in your environment and maximizing the potential of every material.
                </p>
                <div className="flex flex-wrap gap-4 pt-4">
                  <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-3xl backdrop-blur-md">
                    <p className="text-emerald-400 font-black text-2xl mb-1">98%</p>
                    <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Recyclability</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-3xl backdrop-blur-md">
                    <p className="text-emerald-400 font-black text-2xl mb-1">Zero</p>
                    <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Odors</p>
                  </div>
                </div>
              </div>
              <div className="relative shrink-0 w-full md:w-auto flex justify-center">
                <div className="w-64 h-64 bg-emerald-500 rounded-full blur-[80px] opacity-20 absolute -z-10 animate-pulse"></div>
                <img 
                  src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=800" 
                  alt="Sustainable bins" 
                  className="w-full md:w-80 h-96 object-cover rounded-[3rem] shadow-2xl border-4 border-white/5 ring-1 ring-white/20"
                />
              </div>
            </div>
          </div>
        )}

        {view === 'scanner' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-6 duration-700">
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 text-center relative overflow-hidden">
              {!result && !isAnalyzing ? (
                <>
                  <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-emerald-600 shadow-inner">
                    <Camera size={48} />
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Identify Your Waste</h2>
                  <p className="text-slate-500 text-lg font-medium mb-10">Instant identification and clean disposal guide for any item.</p>
                  
                  <div className="flex flex-col sm:flex-row gap-5 justify-center">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 bg-emerald-600 text-white px-8 py-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200"
                    >
                      <Camera size={24} /> Take Photo
                    </button>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 bg-white border-2 border-slate-100 text-slate-700 px-8 py-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-sm"
                    >
                      <Upload size={24} /> Upload
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      capture="environment"
                      onChange={handleFileUpload} 
                    />
                  </div>
                </>
              ) : isAnalyzing ? (
                <div className="py-16 space-y-8">
                  <div className="relative mx-auto w-32 h-32">
                    <div className="absolute inset-0 border-8 border-emerald-50 rounded-full"></div>
                    <div className="absolute inset-0 border-8 border-emerald-600 rounded-full border-t-transparent animate-spin shadow-lg"></div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">AI Sorting in Progress</h3>
                    <p className="text-slate-400 font-medium">Scanning materials and environmental impact...</p>
                  </div>
                </div>
              ) : result && (
                <div className="text-left animate-in fade-in zoom-in-95 duration-500">
                  <div className="flex justify-between items-start mb-10">
                    <div className="space-y-2">
                      <span className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-sm ${
                        result.category === 'Recyclable' ? 'bg-blue-600 text-white' :
                        result.category === 'Organic' ? 'bg-emerald-600 text-white' :
                        result.category === 'Hazardous' ? 'bg-red-600 text-white' :
                        'bg-slate-900 text-white'
                      }`}>
                        {result.category}
                      </span>
                      <h2 className="text-4xl font-black text-slate-900 tracking-tighter capitalize pt-2">{result.item}</h2>
                    </div>
                    <button 
                      onClick={() => setResult(null)}
                      className="bg-slate-100 text-slate-500 hover:text-slate-900 p-3 rounded-2xl transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <div className="space-y-5">
                    <div 
                      onClick={() => setShowDetailedInstructions(!showDetailedInstructions)}
                      className={`cursor-pointer transition-all duration-300 rounded-[2rem] border-2 group ${
                        showDetailedInstructions 
                          ? 'bg-white border-emerald-500 shadow-2xl ring-8 ring-emerald-50' 
                          : 'bg-slate-50 border-transparent hover:bg-slate-100'
                      } p-8`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="flex items-center gap-3 font-black text-slate-900 text-xl tracking-tight">
                          <Trash2 size={24} className="text-emerald-600" /> Disposal Guide
                        </h4>
                        <div className="p-2 rounded-xl bg-white group-hover:shadow-sm transition-all">
                           {showDetailedInstructions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </div>
                      
                      <p className="text-slate-600 font-medium text-lg leading-relaxed mb-4">
                        {result.disposalInstructions}
                      </p>

                      {!showDetailedInstructions && (
                        <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest animate-pulse">
                          <Sparkles size={16} /> Tap for Clean Steps
                        </div>
                      )}

                      {showDetailedInstructions && (
                        <div className="mt-8 pt-8 border-t border-slate-100 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                          <div>
                            <h5 className="text-sm font-black text-slate-900 mb-5 flex items-center gap-3 uppercase tracking-widest">
                              <CheckCircle2 size={18} className="text-emerald-500" /> Preparation
                            </h5>
                            <ul className="space-y-4">
                              {result.preparationSteps?.map((step, i) => (
                                <li key={i} className="flex items-start gap-4 text-slate-600 font-medium leading-relaxed">
                                  <span className="w-8 h-8 shrink-0 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center text-sm font-black shadow-sm">
                                    {i + 1}
                                  </span>
                                  {step}
                                </li>
                              ))}
                            </ul>
                          </div>

                          {result.localRegulationsSummary && (
                            <div>
                              <h5 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-3 uppercase tracking-widest">
                                <ShieldCheck size={18} className="text-amber-500" /> Regulations
                              </h5>
                              <p className="text-slate-600 font-medium leading-relaxed bg-amber-50/50 p-6 rounded-[1.5rem] border border-amber-100/50 italic">
                                "{result.localRegulationsSummary}"
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="bg-emerald-50 p-8 rounded-[2rem] border border-emerald-100 flex gap-6 items-start relative overflow-hidden group">
                      <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform">
                        <Leaf size={28} />
                      </div>
                      <div>
                        <h4 className="font-black text-emerald-900 text-xl tracking-tight mb-2">Sustainable Impact</h4>
                        <p className="text-emerald-800 font-medium italic leading-relaxed">
                          "{result.sustainabilityTip}"
                        </p>
                      </div>
                      <Sparkles className="absolute -top-4 -right-4 text-emerald-200/50" size={80} />
                    </div>

                    <div className="bg-blue-50 p-8 rounded-[2rem] border border-blue-100">
                      <h4 className="flex items-center gap-3 font-black text-blue-900 text-xl tracking-tight mb-6">
                        <MapPin size={24} className="text-blue-600" /> Trusted Disposal Centers
                      </h4>
                      {isLoadingCenters ? (
                        <div className="flex items-center gap-3 text-blue-600 py-6 px-4">
                          <Loader2 className="animate-spin" size={24} />
                          <span className="font-bold text-lg">Scanning for nearby facilities...</span>
                        </div>
                      ) : centers.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {centers.map((center, idx) => (
                            <a 
                              key={idx}
                              href={center.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex flex-col gap-1 p-5 bg-white rounded-3xl border border-blue-100 hover:border-blue-500 hover:shadow-lg transition-all group"
                            >
                                <span className="text-xs font-black uppercase text-blue-400 tracking-widest">Facility</span>
                                <span className="font-black text-slate-800 flex items-center justify-between">
                                  {center.name}
                                  <ExternalLink size={16} className="text-blue-300 group-hover:text-blue-600" />
                                </span>
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-white/50 p-6 rounded-2xl text-center">
                           <p className="text-blue-700 font-medium">Please enable location for real-time facility search.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-5 mt-10">
                    <button 
                      onClick={() => setResult(null)}
                      className="flex-[2] bg-slate-900 text-white py-5 rounded-[1.5rem] font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3"
                    >
                      <Camera size={20} /> New Scan
                    </button>
                    <button 
                      onClick={() => handleShare(result)}
                      className="flex-1 bg-white border-2 border-slate-100 text-slate-700 px-4 py-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 hover:bg-slate-50 transition-all"
                    >
                      <Share2 size={24} />
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-amber-50/50 p-6 rounded-[2rem] border border-amber-100 flex gap-5 items-center">
              <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
                <AlertCircle size={24} />
              </div>
              <div>
                <h5 className="font-black text-amber-900 text-sm tracking-tight uppercase">Safety First</h5>
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  Identifications are AI-powered suggestions. Always prioritize your local municipal disposal rules for hazardous or specialized materials.
                </p>
              </div>
            </div>
          </div>
        )}

        {view === 'history' && (
          <div className="animate-in fade-in duration-500 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black text-slate-900">Your Green Log</h2>
              <button 
                onClick={() => {
                  if(confirm("Are you sure you want to clear your green journey data?")) {
                    setHistory([]);
                    localStorage.removeItem('waste_history');
                  }
                }}
                className="text-sm font-bold text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition-all"
              >
                Clear History
              </button>
            </div>
            
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Item</th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Category</th>
                      <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {history.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5 text-sm font-bold text-slate-400">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </td>
                        <td className="px-8 py-5 text-lg font-black text-slate-900 capitalize">
                          {item.item}
                        </td>
                        <td className="px-8 py-5">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            item.category === 'Recyclable' ? 'bg-blue-50 text-blue-600' :
                            item.category === 'Organic' ? 'bg-emerald-50 text-emerald-600' :
                            item.category === 'Hazardous' ? 'bg-red-50 text-red-600' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {item.category}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-1.5 font-black text-emerald-600">
                            <Zap size={14} />
                            <span>+5 pts</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {history.length === 0 && (
                <div className="p-20 text-center">
                  <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                    <History size={48} />
                  </div>
                  <p className="text-slate-400 text-lg font-bold">Your journey begins with a single scan.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'map' && (
          <div className="space-y-8 animate-in fade-in duration-500">
             <header className="max-w-2xl">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Facility Locator</h2>
              <p className="text-slate-500 text-lg mt-2 font-medium">Find specialized recycling hubs and drop-off points in your immediate vicinity.</p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'General Recycling', color: 'blue' },
                { title: 'E-Waste Hub', color: 'violet' },
                { title: 'Organic Composting', color: 'emerald' },
                { title: 'Chemical Disposal', color: 'red' }
              ].map((item, idx) => (
                <div key={idx} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 group hover:border-emerald-200 transition-all cursor-pointer">
                  <div className="bg-slate-50 p-4 rounded-2xl text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors mb-6 w-fit">
                    <MapPin size={28} />
                  </div>
                  <h4 className="font-black text-slate-900 text-lg mb-2 tracking-tight">{item.title}</h4>
                  <p className="text-sm font-medium text-slate-400 leading-relaxed mb-6">Locating verified drop-off points for clean disposal.</p>
                  <button 
                    onClick={() => {
                      setView('scanner');
                      alert("Scan an item to find matching specialized facilities!");
                    }}
                    className="flex items-center gap-2 text-sm font-black text-emerald-600 uppercase tracking-widest"
                  >
                    Locate <ArrowRight size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-10 rounded-[3rem] flex flex-col lg:flex-row items-center gap-12 relative overflow-hidden">
              <div className="relative z-10 shrink-0">
                <div className="bg-white p-6 rounded-3xl shadow-xl shadow-emerald-100">
                  <div className="w-24 h-24 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <MapPin size={48} />
                  </div>
                </div>
              </div>
              <div className="relative z-10 space-y-4">
                <h3 className="text-3xl font-black text-emerald-900 tracking-tight">Real-time Location Data</h3>
                <p className="text-emerald-800 text-lg font-medium leading-relaxed max-w-2xl">
                  Allow access to your location for precise facility distance, operating hours, and turn-by-turn navigation via Google Maps.
                </p>
                <button 
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition((pos) => {
                        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                        alert("🌍 Location synchronized!");
                      });
                    }
                  }}
                  className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200"
                >
                  Synchronize Location
                </button>
              </div>
              <Sparkles className="absolute -bottom-10 -right-10 text-emerald-200 opacity-30" size={240} />
            </div>
          </div>
        )}
      </main>

      {/* Mobile Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-6 py-4 flex justify-between items-center z-50 shadow-2xl">
        <button onClick={() => setView('dashboard')} className={`p-3 rounded-2xl transition-all ${view === 'dashboard' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-400'}`}>
          <LayoutDashboard size={24} />
        </button>
        <button onClick={() => setView('guide')} className={`p-3 rounded-2xl transition-all ${view === 'guide' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-400'}`}>
          <BookOpen size={24} />
        </button>
        <div className="relative -mt-16">
          <button 
            onClick={() => setView('scanner')} 
            className="bg-emerald-600 text-white p-5 rounded-[2rem] shadow-2xl shadow-emerald-300 border-[6px] border-slate-50 active:scale-90 transition-all"
          >
            <Camera size={28} />
          </button>
        </div>
        <button onClick={() => setView('history')} className={`p-3 rounded-2xl transition-all ${view === 'history' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-400'}`}>
          <History size={24} />
        </button>
        <button onClick={() => setView('map')} className={`p-3 rounded-2xl transition-all ${view === 'map' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-400'}`}>
          <MapPin size={24} />
        </button>
      </nav>
    </div>
  );
};

export default App;
