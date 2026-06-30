// app/admin/crypto-receipts/data/platforms.ts
export interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
}

export const platforms: Platform[] = [
  {
    id: 'binance',
    name: 'Binance',
    icon: '₿',
    color: '#f0b90b',
    type: 'Cryptocurrency'
  },
  {
    id: 'trustwallet',
    name: 'Trust Wallet',
    icon: '🔷',
    color: '#3498db',
    type: 'Wallet'
  },
  {
    id: 'coinbase',
    name: 'Coinbase',
    icon: 'C',
    color: '#1652f0',
    type: 'Cryptocurrency'
  },
  {
    id: 'bybit',
    name: 'Bybit',
    icon: 'B',
    color: '#f7a600',
    type: 'Cryptocurrency'
  },
  {
    id: 'bitcoin',
    name: 'Bitcoin.com',
    icon: '₿',
    color: '#10b981',
    type: 'Cryptocurrency'
  },
  {
    id: 'paypal',
    name: 'PayPal',
    icon: 'P',
    color: '#003087',
    type: 'Payment'
  },
  // Comment out platforms that don't have receipt components yet
  // {
  //   id: 'cashapp',
  //   name: 'CashApp',
  //   icon: '$',
  //   color: '#00d632',
  //   type: 'Payment'
  // },
  // {
  //   id: 'gcash',
  //   name: 'Gcash',
  //   icon: 'G',
  //   color: '#0057b3',
  //   type: 'Payment'
  // },
  // {
  //   id: 'okx',
  //   name: 'OKX Wallet',
  //   icon: 'O',
  //   color: '#1a6dff',
  //   type: 'Wallet'
  // },
  // {
  //   id: 'zelle',
  //   name: 'Zelle',
  //   icon: 'Z',
  //   color: '#6d1a7a',
  //   type: 'Payment'
  // },
  // {
  //   id: 'venmo',
  //   name: 'Venmo',
  //   icon: 'V',
  //   color: '#008cff',
  //   type: 'Payment'
  // },
  // {
  //   id: 'roquq',
  //   name: 'Roquq',
  //   icon: 'R',
  //   color: '#e74c3c',
  //   type: 'Payment'
  // }
];