'use client';

import { useAppStore } from '@/lib/store';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppButton } from '@/components/shared/WhatsAppButton';
import { HomePage } from '@/components/pages/HomePage';
import { MachinesPage } from '@/components/pages/MachinesPage';
import { MachineDetailPage } from '@/components/pages/MachineDetailPage';
import { ProductionLinesPage } from '@/components/pages/ProductionLinesPage';
import { ProductionLineDetailPage } from '@/components/pages/ProductionLineDetailPage';
import { ServiceRequestPage } from '@/components/pages/ServiceRequestPage';
import { ProjectsPage } from '@/components/pages/ProjectsPage';
import { ProjectDetailPage } from '@/components/pages/ProjectDetailPage';
import { NewsPage } from '@/components/pages/NewsPage';
import { NewsDetailPage } from '@/components/pages/NewsDetailPage';
import { FAQPage } from '@/components/pages/FAQPage';
import { AboutPage } from '@/components/pages/AboutPage';
import { ContactPage } from '@/components/pages/ContactPage';

export default function App() {
  const { currentPage } = useAppStore();

  const renderPage = () => {
    switch (currentPage) {
      case 'machines': return <MachinesPage />;
      case 'machine-detail': return <MachineDetailPage />;
      case 'production-lines': return <ProductionLinesPage />;
      case 'production-line-detail': return <ProductionLineDetailPage />;
      case 'services': return <HomePage />; // redirect old services page to home
      case 'service-request': return <ServiceRequestPage />;
      case 'projects': return <ProjectsPage />;
      case 'project-detail': return <ProjectDetailPage />;
      case 'news': return <NewsPage />;
      case 'news-detail': return <NewsDetailPage />;
      case 'faq': return <FAQPage />;
      case 'about': return <AboutPage />;
      case 'contact': return <ContactPage />;
      default: return <HomePage />;
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{renderPage()}</main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
