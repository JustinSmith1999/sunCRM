import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { MobileHeader } from './components/Layout/MobileHeader';
import { Sidebar } from './components/Layout/Sidebar';

// Critical-path screens (every user hits these) — eager.
import { Home } from './components/Dashboard/Home';
import { AccountList } from './components/Accounts/AccountList';
import { DealsKanban } from './components/Deals/DealsKanban';
import { LeadList } from './components/Leads/LeadList';
import { TaskDashboard } from './components/Tasks/TaskDashboard';
import { CaseList } from './components/Cases/CaseList';

// Heavy / less-common screens — lazy. Lets first-paint render before pulling them.
const ReportsDashboard       = lazy(() => import('./components/Reports/ReportsDashboard').then(m => ({ default: m.ReportsDashboard })));
const ProductCatalog         = lazy(() => import('./components/Sales/ProductCatalog').then(m => ({ default: m.ProductCatalog })));
const Campaigns              = lazy(() => import('./components/Sales/Campaigns').then(m => ({ default: m.Campaigns })));
const KnowledgeBase          = lazy(() => import('./components/Service/KnowledgeBase').then(m => ({ default: m.KnowledgeBase })));
const AdminDashboard         = lazy(() => import('./components/Admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const SalesforceUserMappings = lazy(() => import('./components/Admin/SalesforceUserMappings').then(m => ({ default: m.SalesforceUserMappings })));
const SalesforceSync         = lazy(() => import('./components/Admin/SalesforceSync').then(m => ({ default: m.SalesforceSync })));
const ContactsConsole        = lazy(() => import('./components/Admin/ContactsConsole').then(m => ({ default: m.ContactsConsole })));
const DashboardsConsole      = lazy(() => import('./components/Admin/DashboardsConsole').then(m => ({ default: m.DashboardsConsole })));
const WebFormsConsole        = lazy(() => import('./components/Admin/WebFormsConsole').then(m => ({ default: m.WebFormsConsole })));
const AutomationConsole      = lazy(() => import('./components/Admin/AutomationConsole').then(m => ({ default: m.AutomationConsole })));
const APIIntegrationsConsole = lazy(() => import('./components/Admin/APIIntegrationsConsole'));
const UserManagement         = lazy(() => import('./components/Admin/UserManagement').then(m => ({ default: m.UserManagement })));
const SystemSettings         = lazy(() => import('./components/Admin/SystemSettings').then(m => ({ default: m.SystemSettings })));
const HRConsole              = lazy(() => import('./components/Admin/HRConsole').then(m => ({ default: m.HRConsole })));
const PaylocityConsole       = lazy(() => import('./components/Admin/PaylocityConsole'));
const FinanceDashboard       = lazy(() => import('./components/Admin/FinanceDashboard').then(m => ({ default: m.FinanceDashboard })));
const AdminChangeLog         = lazy(() => import('./components/Admin/AdminChangeLog'));
const CompanyEquipmentConsole= lazy(() => import('./components/Admin/CompanyEquipmentConsole').then(m => ({ default: m.CompanyEquipmentConsole })));
const SoftwareSubscriptions  = lazy(() => import('./components/Admin/SoftwareSubscriptions').then(m => ({ default: m.SoftwareSubscriptions })));
const EngineeringRequests    = lazy(() => import('./components/Admin/EngineeringRequests').then(m => ({ default: m.EngineeringRequests })));
const SalesforceRequests     = lazy(() => import('./components/Admin/SalesforceRequests').then(m => ({ default: m.SalesforceRequests })));
const DashboardsLibrary      = lazy(() => import('./components/Dashboard/DashboardsLibrary').then(m => ({ default: m.DashboardsLibrary })));
const ChannelPartnersConsole = lazy(() => import('./components/Admin/ChannelPartnersConsole'));
const PartnerPortal              = lazy(() => import('./components/Partners/PartnerPortal'));
const PartnerWebForm             = lazy(() => import('./components/Public/PartnerWebForm'));
const SolarLeadIntakeForm        = lazy(() => import('./components/Solar/SolarLeadIntakeForm').then(m => ({ default: m.SolarLeadIntakeForm })));
const SolarPipelineView          = lazy(() => import('./components/Solar/SolarPipelineView').then(m => ({ default: m.SolarPipelineView })));
const InstallationProjectTracker = lazy(() => import('./components/Solar/InstallationProjectTracker').then(m => ({ default: m.InstallationProjectTracker })));
const SolarFinancingCalculator   = lazy(() => import('./components/Solar/SolarFinancingCalculator').then(m => ({ default: m.SolarFinancingCalculator })));
const SolarDesignPlatform        = lazy(() => import('./components/Solar/SolarDesignPlatform').then(m => ({ default: m.SolarDesignPlatform })));
const CustomerProfile            = lazy(() => import('./components/Customer/CustomerProfile').then(m => ({ default: m.CustomerProfile })));
const OutlookCalendarSync        = lazy(() => import('./components/Calendar/OutlookCalendarSync'));
const ServiceDashboard           = lazy(() => import('./components/Service/ServiceDashboard'));
const DispatchBoard              = lazy(() => import('./components/Service/DispatchBoard'));
const ServiceTicketsManager      = lazy(() => import('./components/Service/ServiceTicketsManager'));
const ServiceCustomersManager    = lazy(() => import('./components/Service/ServiceCustomersManager'));
const TechniciansManager         = lazy(() => import('./components/Service/TechniciansManager'));
const PartsInventoryManager      = lazy(() => import('./components/Service/PartsInventoryManager'));
const ServiceInvoicesManager     = lazy(() => import('./components/Service/ServiceInvoicesManager'));
const SalesManagementDashboard   = lazy(() => import('./components/Sales/SalesManagementDashboard').then(m => ({ default: m.SalesManagementDashboard })));
const SalesTeamDashboard         = lazy(() => import('./components/Dashboard/SalesTeamDashboard').then(m => ({ default: m.SalesTeamDashboard })));
const ServiceTeamDashboard       = lazy(() => import('./components/Dashboard/ServiceTeamDashboard').then(m => ({ default: m.ServiceTeamDashboard })));
const WarehouseSyncConsole       = lazy(() => import('./components/Admin/WarehouseSyncConsole'));
const WarehouseInventory         = lazy(() => import('./components/Warehouse/WarehouseInventory'));
const ProcessAutomationConsole   = lazy(() => import('./components/Admin/ProcessAutomationConsole'));
const PermitManagementSystem     = lazy(() => import('./components/Service/PermitManagementSystem'));
const ITSupportDashboard         = lazy(() => import('./components/ITSupport/ITSupportDashboard'));
const MyTickets                  = lazy(() => import('./components/ITSupport/MyTickets'));
const AteraConsole               = lazy(() => import('./components/Admin/AteraConsole'));
const NotificationsPage          = lazy(() => import('./components/Notifications/NotificationsPage'));
const ActivityFeed               = lazy(() => import('./components/Activity/ActivityFeed'));
const SystemHealthDashboard      = lazy(() => import('./components/Admin/SystemHealthDashboard'));
const FinanceLoans               = lazy(() => import('./components/Finance/FinanceLoans').then(m => ({ default: m.FinanceLoans })));
const PaymentPlans               = lazy(() => import('./components/Finance/PaymentPlans').then(m => ({ default: m.PaymentPlans })));
const Vouchers                   = lazy(() => import('./components/Finance/Vouchers').then(m => ({ default: m.Vouchers })));
const IntercompanyPayments       = lazy(() => import('./components/Finance/IntercompanyPayments').then(m => ({ default: m.IntercompanyPayments })));
const JournalRecords             = lazy(() => import('./components/Operations/JournalRecords').then(m => ({ default: m.JournalRecords })));
const ResidentialContracts       = lazy(() => import('./components/Operations/ResidentialContracts').then(m => ({ default: m.ResidentialContracts })));
const ProductionMonitoring      = lazy(() => import('./components/Operations/ProductionMonitoring').then(m => ({ default: m.ProductionMonitoring })));
const CompanyEquipment           = lazy(() => import('./components/Operations/CompanyEquipment').then(m => ({ default: m.CompanyEquipment })));
const LoyaltyProgram             = lazy(() => import('./components/Loyalty/LoyaltyProgram').then(m => ({ default: m.LoyaltyProgram })));
const PullSheets                 = lazy(() => import('./components/Operations/PullSheets').then(m => ({ default: m.PullSheets })));
const Quotes                     = lazy(() => import('./components/Sales/Quotes').then(m => ({ default: m.Quotes })));
const ServicePaymentPlans        = lazy(() => import('./components/Service/ServicePaymentPlans').then(m => ({ default: m.ServicePaymentPlans })));

import { MobileBottomNav } from './components/Layout/MobileBottomNav';
import { InstallPrompt } from './components/Layout/InstallPrompt';
import { RingCentralLoader } from './components/RingCentral/RingCentralLoader';

// Suspense fallback for lazy routes
const RouteFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 border-[3px] border-sky border-t-transparent rounded-full animate-spin" />
  </div>
);

function AppContent() {
  const [currentView, setCurrentView] = useState('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const { user, loading } = useAuth();

  // Listen for admin navigation events
  useEffect(() => {
    const handleAdminNavigation = (event: CustomEvent) => {
      setCurrentView(event.detail);
    };

    window.addEventListener('adminNavigation', handleAdminNavigation as EventListener);
    return () => window.removeEventListener('adminNavigation', handleAdminNavigation as EventListener);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <Home onViewChange={setCurrentView} />;
      case 'accounts':
        return <AccountList />;
      case 'contacts':
        return <ContactsConsole />;
      case 'deals':
      case 'opportunities':
        return <DealsKanban />;
      case 'quotes':
        return <Quotes />;
      case 'leads':
        return <LeadList />;
      case 'tasks':
        return <TaskDashboard />;
      case 'cases':
        return <CaseList />;
      case 'reports':
        return <ReportsDashboard />;
      case 'products':
        return <ProductCatalog />;
      case 'campaigns':
        return <Campaigns />;
      case 'sales-team-dashboard':
      case 'sales-team':
        return <SalesTeamDashboard />;
      case 'sales-management':
        return <SalesManagementDashboard />;
      case 'knowledge':
        return <KnowledgeBase />;
      case 'dashboards-library':
        return <DashboardsLibrary />;
      case 'admin':
        return <AdminDashboard onViewChange={setCurrentView} />;
      case 'admin-user-mappings':
        return <SalesforceUserMappings />;
      case 'admin-salesforce-sync':
        return <SalesforceSync />;
      case 'admin-contacts':
        return <ContactsConsole />;
      case 'admin-dashboards':
        return <DashboardsConsole />;
      case 'admin-webforms':
        return <WebFormsConsole />;
      case 'admin-api-integrations':
        return <APIIntegrationsConsole />;
      case 'admin-automation':
        return <AutomationConsole />;
      case 'admin-process-automation':
        return <ProcessAutomationConsole />;
      case 'admin-atera':
        return <AteraConsole />;
      case 'admin-channel-partners':
        return <ChannelPartnersConsole />;
      case 'admin-users':
        return <UserManagement />;
      case 'admin-change-log':
        return <AdminChangeLog />;
      case 'admin-system-health':
        return <SystemHealthDashboard />;
      case 'admin-hr':
        return <HRConsole />;
      case 'admin-paylocity':
        return <PaylocityConsole />;
      case 'admin-finance':
        return <FinanceDashboard />;
      case 'admin-equipment':
        return <CompanyEquipmentConsole />;
      case 'admin-software':
        return <SoftwareSubscriptions />;
      case 'admin-engineering':
        return <EngineeringRequests />;
      case 'admin-salesforce-requests':
        return <SalesforceRequests />;
      case 'warehouse-inventory':
        return <WarehouseInventory />;
      case 'warehouse-sync':
      case 'admin-warehouse-sync':
        return <WarehouseSyncConsole />;
      case 'admin-settings':
        return <SystemSettings />;
      case 'knowledge-base':
        return <KnowledgeBase />;
      case 'partner-portal':
        return <PartnerPortal />;
      case 'solar-leads':
        return <SolarLeadIntakeForm />;
      case 'solar-pipeline':
        return <SolarPipelineView />;
      case 'solar-design':
        return <SolarDesignPlatform />;
      case 'solar-projects':
        return <InstallationProjectTracker />;
      case 'solar-financing':
        return <SolarFinancingCalculator />;
      case 'service-team-dashboard':
        return <ServiceTeamDashboard />;
      case 'service-dashboard':
        return <ServiceDashboard />;
      case 'dispatch-board':
        return <DispatchBoard />;
      case 'permit-management':
        return <PermitManagementSystem />;
      case 'it-support':
        // Show IT Support Dashboard for tech@sunation.com, My Tickets for everyone else
        return user?.email === 'tech@sunation.com' ? <ITSupportDashboard /> : <MyTickets />;
      case 'service-tickets':
        return <ServiceTicketsManager />;
      case 'service-customers':
        return <ServiceCustomersManager />;
      case 'service-technicians':
        return <TechniciansManager />;
      case 'service-parts':
        return <PartsInventoryManager />;
      case 'service-invoices':
        return <ServiceInvoicesManager />;
      case 'calendar':
        return <OutlookCalendarSync />;
      case 'notifications':
        return <NotificationsPage />;
      case 'activity':
        return <ActivityFeed />;
      case 'finance-loans':
        return <FinanceLoans />;
      case 'payment-plans':
        return <PaymentPlans />;
      case 'vouchers':
        return <Vouchers />;
      case 'intercompany-payments':
        return <IntercompanyPayments />;
      case 'journal-records':
        return <JournalRecords />;
      case 'residential-contracts':
        return <ResidentialContracts />;
      case 'equipment':
        return <CompanyEquipment />;
      case 'production-monitoring':
        return <ProductionMonitoring />;
      case 'loyalty':
        return <LoyaltyProgram />;
      case 'service-payment-plans':
        return <ServicePaymentPlans />;
      case 'pull-sheets':
        return <PullSheets />;
      default:
        return <Home onViewChange={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Mobile Header - Only visible on mobile */}
      <MobileHeader
        showSidebar={showMobileSidebar}
        onToggleSidebar={() => setShowMobileSidebar(!showMobileSidebar)}
        currentView={currentView}
        onNavigateHome={() => setCurrentView('home')}
      />

      {/* Desktop/Mobile Layout Container */}
      <div className="flex">
        {/* Sidebar - Hidden on mobile unless toggled */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed(!sidebarCollapsed)}
        showOnMobile={showMobileSidebar}
        onCloseMobile={() => setShowMobileSidebar(false)}
      />

        {/* Main Content */}
        <main
          className={`flex-1 overflow-auto pt-12 md:pt-0 min-h-screen transition-all duration-300 ${
            sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
          } px-4 md:px-6 py-4`}
          style={{ paddingBottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}
        >
          <Suspense fallback={<RouteFallback />}>
            {renderView()}
          </Suspense>
        </main>
      </div>

      {/* Mobile-only bottom tab bar + install-to-homescreen prompt */}
      <MobileBottomNav
        currentView={currentView}
        onNavigate={setCurrentView}
        onOpenMore={() => setShowMobileSidebar(true)}
      />
      <InstallPrompt />

      {/* Lazy-load the RingCentral embeddable adapter only after auth.
          Prevents the call-popup from rendering on the login screen. */}
      <RingCentralLoader />
    </div>
  );
}

function CustomerProfileWrapper() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <CustomerProfile />
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/partner-form/:slug" element={<PartnerWebForm />} />
          <Route path="/customer/:identifier" element={<CustomerProfileWrapper />} />
          <Route path="*" element={<AppContent />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;