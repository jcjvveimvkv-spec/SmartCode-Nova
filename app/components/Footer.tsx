import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#0a0a2a] border-t border-blue-500/20 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="text-2xl font-bold bg-gradient-to-r from-red-500 to-blue-500 bg-clip-text text-transparent mb-4">
              SmartCodeNova
            </div>
            <p className="text-gray-400">
              Automated trading bots powered by AI for smart investors.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="#features" className="hover:text-white transition">Features</Link></li>
              <li><Link href="#bots" className="hover:text-white transition">Bots</Link></li>
              <li><Link href="#pricing" className="hover:text-white transition">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="#" className="hover:text-white transition">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-white transition">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-white transition">Disclaimer</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Contact</h4>
            <ul className="space-y-2 text-gray-400">
              <li>Email: info@smartcodenova.com</li>
              <li>Telegram: @SmartCodeNova</li>
              <li>Support: 24/7 Live Chat</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-blue-500/20 text-center text-gray-400">
          &copy; 2024 SmartCodeNova. All rights reserved.
        </div>
      </div>
    </footer>
  );
}