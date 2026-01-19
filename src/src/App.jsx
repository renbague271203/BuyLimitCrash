import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, RefreshCw } from 'lucide-react';

const App = () => {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Définition des targets
  const stocks = [
    { symbol: 'AAPL', targets: [166, 219] },
    { symbol: 'NVDA', targets: [95] },
    { symbol: 'GOOGL', targets: [139, 201] },
    { symbol: 'MSFT', targets: [264, 355, 420] },
    { symbol: 'NFLX', targets: [36, 59] },
    { symbol: 'AMZN', targets: [160] },
    { symbol: 'BKNG', targets: [2974, 3328] }
  ];

  const cryptos = [
    { symbol: 'BTC', name: 'Bitcoin', targets: [30000, 40000], id: 'bitcoin' },
    { symbol: 'ETH', name: 'Ethereum', targets: [692], id: 'ethereum' },
    { symbol: 'SOL', name: 'Solana', targets: [27], id: 'solana', note: 'Pour un ami' },
    { symbol: 'HYPE', name: 'Hyperliquid', targets: [15.68, 20.60], id: 'hyperliquid' },
    { symbol: 'AVAX', name: 'Avalanche', targets: [5.09, 9.36], id: 'avalanche-2', note: 'Pour un ami' },
    { symbol: 'ADA', name: 'Cardano', targets: [0.1032, 0.1785], id: 'cardano', note: 'Pour un ami' },
    { symbol: 'GIZA', name: 'Giza', targets: ['🚀 TO THE MOON'], special: true, note: 'Oracle role holder' },
    { symbol: 'WLFI', name: 'WLFI', targets: ['🚀 TO THE MOON'], special: true, note: 'Speculative bet' }
  ];

  // Fonction pour récupérer les prix des actions
  const fetchStockPrices = async () => {
    const newPrices = {};
    
    for (const stock of stocks) {
      try {
        const response = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${stock.symbol}?interval=1d&range=1d`
        );
        const data = await response.json();
        const price = data.chart.result[0].meta.regularMarketPrice;
        newPrices[stock.symbol] = price;
      } catch (error) {
        console.error(`Erreur pour ${stock.symbol}:`, error);
        newPrices[stock.symbol] = null;
      }
    }
    
    return newPrices;
  };

  // Fonction pour récupérer les prix des cryptos
  const fetchCryptoPrices = async () => {
    const newPrices = {};
    
    const normalCryptos = cryptos.filter(c => !c.special);
    const ids = normalCryptos.map(c => c.id).join(',');
    
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
      );
      const data = await response.json();
      
      normalCryptos.forEach(crypto => {
        if (data[crypto.id]) {
          newPrices[crypto.symbol] = data[crypto.id].usd;
        }
      });
    } catch (error) {
      console.error('Erreur cryptos:', error);
    }
    
    return newPrices;
  };

  // Chargement initial et refresh
  useEffect(() => {
    const loadPrices = async () => {
      setLoading(true);
      const [stockPrices, cryptoPrices] = await Promise.all([
        fetchStockPrices(),
        fetchCryptoPrices()
      ]);
      setPrices({ ...stockPrices, ...cryptoPrices });
      setLastUpdate(new Date());
      setLoading(false);
    };

    loadPrices();
    const interval = setInterval(loadPrices, 60000); // Refresh toutes les minutes

    return () => clearInterval(interval);
  }, []);

  // Vérifier si le prix est dans la zone d'achat
  const isInBuyZone = (price, targets) => {
    if (typeof targets[0] === 'string') return false;
    const lowestTarget = Math.min(...targets);
    const threshold = lowestTarget * 1.05; // 5% au-dessus de la target la plus basse
    return price <= threshold;
  };

  // Composant carte pour un actif
  const AssetCard = ({ symbol, name, targets, price, isStock, note, special }) => {
    const inBuyZone = price && !special && isInBuyZone(price, targets);
    
    return (
      <div className={`bg-gray-800 rounded-lg p-4 border-2 transition-all ${
        inBuyZone 
          ? 'border-green-500 shadow-lg shadow-green-500/50 animate-pulse' 
          : 'border-gray-700'
      } ${special ? 'bg-gradient-to-br from-purple-900 to-pink-900' : ''}`}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-xl font-bold text-white">{symbol}</h3>
            {name && <p className="text-sm text-gray-400">{name}</p>}
            {note && <p className="text-xs text-yellow-400 mt-1">⭐ {note}</p>}
          </div>
          {price && (
            <div className={`text-2xl font-bold ${inBuyZone ? 'text-green-400' : 'text-white'}`}>
              ${typeof price === 'number' ? price.toFixed(2) : price}
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <DollarSign size={16} />
            <span>Zones d'achat:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {targets.map((target, idx) => (
              <span 
                key={idx}
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  special 
                    ? 'bg-gradient-to-r from-yellow-400 to-pink-500 text-black animate-pulse'
                    : price && typeof target === 'number' && price <= target * 1.05
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                {typeof target === 'number' ? `$${target.toFixed(2)}` : target}
              </span>
            ))}
          </div>
        </div>
        
        {inBuyZone && (
          <div className="mt-3 bg-green-600/20 border border-green-500 rounded p-2 text-center">
            <span className="text-green-400 font-semibold text-sm">
              🎯 DANS LA ZONE D'ACHAT !
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            BuyLimitCrash 📉💰
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
            </span>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>
        <p className="text-gray-400">
          Surveillance en temps réel de vos zones d'achat - Attendez le crash ! 🚀
        </p>
      </div>

      {loading && (
        <div className="text-center py-12">
          <RefreshCw className="animate-spin mx-auto mb-4" size={48} />
          <p className="text-xl">Chargement des données...</p>
        </div>
      )}

      {!loading && (
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Section Actions */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="text-blue-400" />
              Actions GAFAM+ (7)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stocks.map(stock => (
                <AssetCard
                  key={stock.symbol}
                  symbol={stock.symbol}
                  targets={stock.targets}
                  price={prices[stock.symbol]}
                  isStock={true}
                />
              ))}
            </div>
          </section>

          {/* Section Cryptos */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <TrendingDown className="text-purple-400" />
              Cryptomonnaies (8)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cryptos.map(crypto => (
                <AssetCard
                  key={crypto.symbol}
                  symbol={crypto.symbol}
                  name={crypto.name}
                  targets={crypto.targets}
                  price={prices[crypto.symbol]}
                  isStock={false}
                  note={crypto.note}
                  special={crypto.special}
                />
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Footer */}
      <div className="max-w-7xl mx-auto mt-12 text-center text-gray-500 text-sm">
        <p>📊 Données: Yahoo Finance (Actions) & CoinGecko (Cryptos)</p>
        <p className="mt-2">🎯 Les bordures vertes indiquent les actifs dans votre zone d'achat !</p>
      </div>
    </div>
  );
};

export default App;
