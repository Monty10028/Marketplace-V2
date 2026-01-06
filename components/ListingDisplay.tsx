
import React, { useState } from 'react';
import { MarketplaceListing, GroundingSource } from '../types.ts';

interface ListingDisplayProps {
  listing: MarketplaceListing;
  sources: GroundingSource[];
  imagePreview: string | null;
}

const ListingDisplay: React.FC<ListingDisplayProps> = ({ listing, sources, imagePreview }) => {
  const [strategy, setStrategy] = useState<'standard' | 'quick'>('standard');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full text-sm font-bold shadow-2xl z-50 animate-bounce';
    toast.innerText = 'Copied to clipboard! ✅';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  const currentPrice = strategy === 'standard' ? listing.suggested_list_price : listing.quick_sell_price;
  const currentDescription = strategy === 'standard' ? listing.description : listing.description_quick_sell;

  const getStockColor = (status: string) => {
    return status.toLowerCase().includes('no stock') ? 'text-red-500 bg-red-50' : 'text-emerald-600 bg-emerald-50';
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Quick Stats & Strategy */}
        <div className="lg:col-span-1 space-y-6">
          {/* Strategy Toggle */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Pricing Strategy</h3>
            <div className="flex p-1.5 bg-slate-100 rounded-2xl relative">
              <button 
                onClick={() => setStrategy('standard')}
                className={`flex-1 py-3 text-xs font-black rounded-xl transition-all z-10 ${strategy === 'standard' ? 'text-indigo-600' : 'text-slate-500'}`}
              >
                STANDARD
              </button>
              <button 
                onClick={() => setStrategy('quick')}
                className={`flex-1 py-3 text-xs font-black rounded-xl transition-all z-10 ${strategy === 'quick' ? 'text-emerald-600' : 'text-slate-500'}`}
              >
                QUICK SELL
              </button>
              <div 
                className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-md transition-all duration-300 transform ${strategy === 'quick' ? 'translate-x-[calc(100%+0px)]' : 'translate-x-0'}`}
              ></div>
            </div>
            
            <div className="pt-4 space-y-3">
               <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold text-slate-500">Retail Value (New)</span>
                <span className="text-sm font-bold text-slate-400 line-through">{listing.new_price}</span>
              </div>
              <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 text-center">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter mb-1">Suggested Listing Price</p>
                <p className="text-4xl font-black text-indigo-700 tracking-tight">{currentPrice}</p>
                <p className="text-[10px] font-medium text-indigo-400 mt-2">Market Range: {listing.estimated_price_range}</p>
              </div>
            </div>
          </div>

          {/* Market Availability - Mandatory Check */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Market Availability</h3>
            <div className="space-y-2">
              {[
                { label: 'eBay AU', status: listing.market_stock_status.ebay },
                { label: 'Gumtree AU', status: listing.market_stock_status.gumtree },
                { label: 'Cash Converters', status: listing.market_stock_status.cash_converters },
              ].map((site, i) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">{site.label}</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${getStockColor(site.status)}`}>
                    {site.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Keyword Cloud */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Search Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {listing.keywords.map((word, i) => (
                <span key={i} className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-xl text-[11px] font-bold border border-slate-100">
                  {word}
                </span>
              ))}
            </div>
            <button 
              onClick={() => copyToClipboard(listing.keywords.join(', '))}
              className="w-full mt-4 text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest"
            >
              Copy all tags
            </button>
          </div>

          {/* Grounding Sources */}
          {sources.length > 0 && (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Research Sources</h3>
              <div className="space-y-3">
                {sources.slice(0, 3).map((source, i) => (
                  <a 
                    key={i} 
                    href={source.uri} 
                    target="_blank" 
                    className="block p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white hover:border-indigo-200 transition-all group"
                  >
                    <p className="text-[11px] font-bold text-slate-700 truncate group-hover:text-indigo-600">{source.title}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5 truncate uppercase font-bold">{source.uri ? new URL(source.uri).hostname : 'Reference'}</p>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Content Generator */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${strategy === 'quick' ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500'}`}></div>
                <h2 className="text-lg font-black text-slate-800 tracking-tight">
                  {strategy === 'quick' ? 'Quick Sell Listing' : 'Standard Listing'}
                </h2>
              </div>
              <div className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-black text-slate-400">
                {listing.category_suggestion}
              </div>
            </div>

            <div className="p-8 space-y-10">
              {/* Optimized Title */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Optimized Title (Click to copy)</label>
                <div 
                  onClick={() => copyToClipboard(listing.suggested_title)}
                  className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-100 font-bold text-slate-800 text-xl cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/30 transition-all leading-tight"
                >
                  {listing.suggested_title}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                  <button 
                    onClick={() => copyToClipboard(currentDescription)}
                    className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-widest"
                  >
                    Copy Full Text
                  </button>
                </div>
                <div className="relative">
                  <pre className="whitespace-pre-wrap font-sans text-sm p-8 bg-slate-50 rounded-[28px] border-2 border-slate-100 text-slate-700 leading-relaxed min-h-[400px]">
                    {currentDescription}
                  </pre>
                  {strategy === 'quick' && (
                    <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border border-emerald-200 shadow-sm">
                      Priced to sell fast
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDisplay;
