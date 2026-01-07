
import React, { useState, useEffect } from 'react';
import { analyzeItemWithGemini } from './services/geminiService.ts';
import { AnalysisState } from './types.ts';
import ListingDisplay from './components/ListingDisplay.tsx';

const App: React.FC = () => {
  const [suburb, setSuburb] = useState<string>('Melbourne CBD');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState<boolean>(true);
  const [state, setState] = useState<AnalysisState>({
    loading: false,
    error: null,
    listing: null,
    sources: [],
    statusMessage: '',
  });

  useEffect(() => {
    const checkKeyAvailability = async () => {
      // Prioritize the environment variable from Hostinger
      const envKey = process.env.API_KEY;
      if (envKey && envKey.length > 5) {
        setHasKey(true);
        return;
      }

      if (window.aistudio?.hasSelectedApiKey) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    };
    checkKeyAvailability();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasKey(true); 
      setState(prev => ({ ...prev, error: null }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setState(prev => ({ ...prev, listing: null, error: null }));
    }
  };

  const handleAnalyze = async () => {
    if (!imagePreview || !suburb) return;

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      statusMessage: 'Scanning local markets...',
    }));

    try {
      const base64Data = imagePreview.split(',')[1];
      const { listing, sources } = await analyzeItemWithGemini(
        base64Data,
        suburb,
        (status) => setState(prev => ({ ...prev, statusMessage: status }))
      );

      if (listing.is_unclear) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: listing.unclear_message || "Image too unclear for research.",
          listing: null,
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        loading: false,
        listing,
        sources,
        statusMessage: 'Ready!',
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message || "An unexpected error occurred.",
        statusMessage: '',
      }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-slate-800 leading-tight">Ian A. Marketplace App</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Melbourne Reseller Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-4 text-sm font-medium text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                API Connected
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 pb-20">
        {!state.listing && !state.loading && (
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Market Analysis.</h2>
            <p className="text-lg text-slate-600">
              Identify your item and find its current resale value across eBay, Gumtree, and Cash Converters.
            </p>
          </div>
        )}

        <div className={`transition-all duration-500 ${state.listing ? 'scale-95 opacity-50 pointer-events-none absolute -top-[1000px]' : 'scale-100 opacity-100'}`}>
          <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
            <div className="p-8 space-y-8">
              <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">Item Photo</label>
                <div 
                  className={`relative group h-72 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden
                    ${imagePreview ? 'border-indigo-400 bg-slate-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}
                >
                  <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 z-10 cursor-pointer" />
                  {imagePreview ? (
                    <div className="relative w-full h-full">
                      <img src={imagePreview} className="w-full h-full object-contain p-2" alt="Preview" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold uppercase text-xs tracking-widest">Change Photo</div>
                    </div>
                  ) : (
                    <div className="text-center p-6">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <svg className="w-8 h-8 text-slate-400 group-hover:text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-slate-600 font-bold">Upload product image</p>
                      <p className="text-slate-400 text-sm mt-1">Tap to select or drag & drop</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">Melbourne Suburb</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </span>
                  <input type="text" value={suburb} onChange={(e) => setSuburb(e.target.value)} placeholder="e.g. Richmond" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 placeholder:font-normal" />
                </div>
              </div>

              {state.error && (
                <div className="p-6 bg-rose-50 border-2 border-rose-100 text-rose-900 rounded-3xl space-y-4">
                  <div className="flex gap-3 items-start">
                    <div className="mt-1">
                      <svg className="w-6 h-6 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="space-y-1">
                      <p className="font-black uppercase text-xs tracking-widest text-rose-600">Quota Limit Exceeded</p>
                      <p className="text-sm font-bold leading-relaxed">{state.error}</p>
                    </div>
                  </div>
                  
                  {state.error.includes('429') && (
                    <div className="pt-4 border-t border-rose-200 flex flex-col gap-3">
                      <p className="text-xs font-medium text-rose-700">Recommended Steps:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <a 
                          href="https://console.cloud.google.com/billing" 
                          target="_blank" 
                          className="flex items-center justify-center p-3 bg-white border border-rose-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-100 transition-colors shadow-sm"
                        >
                          Check Billing Status
                        </a>
                        <a 
                          href="https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas" 
                          target="_blank" 
                          className="flex items-center justify-center p-3 bg-white border border-rose-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-100 transition-colors shadow-sm"
                        >
                          View Quota Dashboard
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button 
                onClick={handleAnalyze}
                disabled={!imageFile || state.loading}
                className={`w-full py-5 rounded-2xl font-black text-lg transition-all shadow-xl uppercase tracking-widest
                  ${!imageFile || state.loading ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] shadow-indigo-200'}`}
              >
                {state.loading ? (
                  <div className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {state.statusMessage}
                  </div>
                ) : 'Analyze Market Data'}
              </button>
            </div>
          </div>
        </div>

        {state.listing && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
               <button onClick={() => setState(prev => ({ ...prev, listing: null }))} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-black text-xs uppercase tracking-widest">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                New Research
              </button>
              <div className="text-right">
                 <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Research Verified</p>
                 <p className="text-xs font-bold text-emerald-600">{suburb}, VIC</p>
              </div>
            </div>
            <ListingDisplay listing={state.listing} sources={state.sources} imagePreview={imagePreview} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
