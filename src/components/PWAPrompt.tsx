import React, { useState, useEffect } from 'react';
import { Download, Share, X, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PWAPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isAppStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(isAppStandalone);

    if (isAppStandalone) return;

    const hasDismissed = localStorage.getItem('pwaPromptDismissed') === 'true';
    setIsDismissed(hasDismissed);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      if (!hasDismissed) {
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    } else {
      // For Android / Chrome
      const handleBeforeInstallPrompt = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
        
        if (!hasDismissed) {
          setShowPrompt(true);
        }
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  // Listen for the appinstalled event to hide the prompt immediately when installed
  useEffect(() => {
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setShowPrompt(false);
    };
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => window.removeEventListener('appinstalled', handleAppInstalled);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      setDeferredPrompt(null);
      setShowPrompt(false);
      if (outcome === 'accepted') {
        setIsStandalone(true);
      }
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setIsDismissed(true);
    localStorage.setItem('pwaPromptDismissed', 'true');
  };

  const handleShowAgain = () => {
    setShowPrompt(true);
  };

  if (isStandalone) return null;

  return (
    <>
      {/* Minimized / Dismissed State - Small button at the top right below header */}
      <AnimatePresence>
        {isDismissed && !showPrompt && (isIOS || deferredPrompt) && (
          <motion.button
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            onClick={handleShowAgain}
            className="fixed top-20 right-4 md:right-8 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 z-[9998] transition-all"
          >
            <Smartphone className="h-4 w-4" />
            <span className="text-sm font-medium">Instal App</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Main Big Popup State */}
      <AnimatePresence>
        {showPrompt && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 left-4 right-4 md:bottom-8 md:left-auto md:right-8 md:w-96 bg-white rounded-xl shadow-2xl border border-blue-100 p-5 z-[9999]"
          >
            <button 
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 bg-blue-50 p-3 rounded-xl">
                <Download className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900">
                  Instal Aplikasi Mahada
                </h3>
                <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                  Instal aplikasi ini di layar utama HP Anda agar lebih mudah dan cepat diakses, tanpa perlu membuka browser.
                </p>
                
                {isIOS ? (
                  <div className="mt-4 bg-gray-50 p-3 rounded-lg text-sm text-gray-700">
                    Untuk iOS/iPhone: Tap icon <Share className="inline h-4 w-4 mx-1" /> di bawah layar Anda, lalu pilih <strong>Add to Home Screen</strong> <span className="inline-block border border-gray-300 rounded px-1 text-xs mx-1 bg-white shadow-sm">+</span>
                  </div>
                ) : (
                  <button
                    onClick={handleInstallClick}
                    className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Instal Sekarang
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
