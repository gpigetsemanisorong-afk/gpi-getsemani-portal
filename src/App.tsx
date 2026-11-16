import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { PortalProvider, usePortal } from './context/PortalContext';
import { MobileBottomNav, TopNavbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { OfflineIndicator } from './components/PWAComponents';
import { BerandaPage } from './pages/BerandaPage';
import { TataIbadahPage } from './pages/TataIbadahPage';
import { LiturgiUnsurPage } from './pages/LiturgiUnsurPage';
import { JadwalIbadahPage } from './pages/JadwalIbadahPage';
import { WartaJemaatPage } from './pages/WartaJemaatPage';
import { NyanyianRohaniPage } from './pages/NyanyianRohaniPage';
import { AlkitabPage } from './pages/AlkitabPage';
import { LayananJemaatPage } from './pages/LayananJemaatPage';
import { KotakDoaPage } from './pages/KotakDoaPage';
import { LaporanKeuanganPage } from './pages/LaporanKeuanganPage';
import { DataStatistikPage } from './pages/DataStatistikPage';
import { ProfilKontakPage } from './pages/ProfilKontakPage';
import { TentangAplikasiPage } from './pages/TentangAplikasiPage';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

const PortalShell: React.FC = () => {
  const { route, setRoute, currentUsername } = usePortal();

  // Proteksi Penuh: Jika pengguna belum login, seluruh aplikasi terkunci di balik layar login
  if (!currentUsername) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (route) {
      case 'beranda':
        return <BerandaPage />;
      case 'tata-ibadah':
        return <TataIbadahPage />;
      case 'liturgi-unsur':
        return <LiturgiUnsurPage />;
      case 'jadwal':
        return <JadwalIbadahPage />;
      case 'warta':
        return <WartaJemaatPage />;
      case 'nyanyian':
        return <NyanyianRohaniPage />;
      case 'alkitab':
        return <AlkitabPage />;
      case 'layanan':
        return <LayananJemaatPage />;
      case 'kotak-doa':
        return <KotakDoaPage />;
      case 'keuangan':
        return <LaporanKeuanganPage />;
      case 'statistik':
        return <DataStatistikPage />;
      case 'profil':
        return <ProfilKontakPage />;
      case 'tentang':
        return <TentangAplikasiPage />;
      case 'login':
        return <BerandaPage />;
      case 'dashboard':
        return <AdminDashboardPage />;
      default:
        return <BerandaPage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 transition-colors dark:bg-[#0F1115] dark:text-stone-100">
      <TopNavbar />

      <main className="mx-auto max-w-[1280px] px-4 py-6 md:px-6 md:py-8">
        {route !== 'beranda' && route !== 'login' && route !== 'dashboard' && (
          <div className="mb-5">
            <button
              type="button"
              onClick={() => setRoute('beranda')}
              className="inline-flex min-h-[36px] items-center gap-1.5 text-xs font-semibold text-stone-600 transition-colors hover:text-[#7F1D1D] dark:text-stone-400 dark:hover:text-amber-400 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali ke Beranda</span>
            </button>
          </div>
        )}

        {renderPage()}
      </main>

      <Footer />
      <MobileBottomNav />
      <OfflineIndicator />
    </div>
  );
};

export default function App() {
  return (
    <PortalProvider>
      <PortalShell />
    </PortalProvider>
  );
}
