import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { MobileHeader } from './components/Layout/MobileHeader';
import { Sidebar } from './components/Layout/Sidebar';
import { Home } from './components/Dashboard/Home';
import { AccountList } from './components/Accounts/AccountList';
import { DealsKanban } from './components/Deals/DealsKanban';
import { LeadList } from './components/Leads/LeadList';
import { TaskDashboard } from './components/Tasks/TaskDashboard';
import { CaseList } from './components/Cases/CaseList';
import { ReportsDashboard } from './components/Reports/ReportsDashboard';
import { ProductCatalog } from './components/Sales/ProductCatalog';
import { Campaigns } from './components/Sales/Campaigns';
import { KnowledgeBase } from './components/Service/KnowledgeBase';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { SalesforceUserMappings } from './components/Admin/SalesforceUserMappings';
import { SalesforceSync } from './components/Admin/SalesforceSync';
import { ContactsConsole } from './components/Admin/ContactsConsole';
import { DashboardsConsole } from './components/Admin/DashboardsConsole';
import { WebFormsConsole } from './components/Admin/WebFormsConsole';
import { AutomationConsole } from './components/Admin/AutomationConsole';
import APIIntegrationsConsole from './components/Admin/APIIntegrationsConsole';
import { UserManagement } from './components/Admin/UserManagement';
import { SystemSettings } from './components/Admin/SystemSettings';
import { HRConsole } from './components/Admin/HRConsole';
import PaylocityConsole from './components/Admin/PaylocityConsole';
import { FinanceDashboard } from './components/Admin/FinanceDashboard';
import AdminChangeLog from './components/Admin/AdminChangeLog';
import { CompanyEquipmentConsole } from './components/Admin/CompanyEquipmentConsole';
import { SoftwareSubscriptions } from './components/Admin/SoftwareSubscriptions';
import { EngineeringRequests } from './components/Admin/EngineeringRequests';
import { SalesforceRequests } from './components/Admin/SalesforceRequests';
import { DashboardsLibrary } from './components/Dashboard/DashboardsLibrary';
import ChannelPartnersConsole from './components/Admin/ChannelPartnersConsole';
import PartnerPortal from './components/Partners/PartnerPortal';
import PartnerWebForm from './components/Public/PartnerWebForm';
import { SolarLeadIntakeForm } from './components/Solar/SolarLeadIntakeForm';
import { SolarPipelineView } from './components/Solar/SolarPipelineView';
import { InstallationProjectTracker } from './components/Solar/InstallationProjectTracker';
import { SolarFinancingCalculator } from './components/Solar/SolarFinancingCalculator';
import { SolarDesignPlatform } from './components/Solar/SolarDesignPlatform';
import { CustomerProfile } from './components/Customer/CustomerProfile';
import OutlookCalendarSync from './components/Calendar/OutlookCalendarSync';
import ServiceDashboard from './components/Service/ServiceDashboard';
import DispatchBoard from './components/Service/DispatchBoard';
import ServiceTicketsManager from './components/Service/ServiceTicketsManager';
import ServiceCustomersManager from './components/Service/ServiceCustomersManager';
import TechniciansManager from './components/Service/TechniciansManager';
import PartsInventoryManager from './components/Service/PartsInventoryManager';
import ServiceInvoicesManager from './components/Service/ServiceInvoicesManager';
import { SalesManagementDashboard } from './components/Sales/SalesManagementDashboard';
import { SalesTeamDashboard } from './components/Dashboard/SalesTeamDashboard';
import { ServiceTeamDashboard } from './components/Dashboard/ServiceTeamDashboard';
import WarehouseSyncConsole from './components/Admin/WarehouseSyncConsole';
import WarehouseInventory from './components/Warehouse/WarehouseInventory';
import ProcessAutomationConsole from './components/Admin/ProcessAutomationConsole';
import PermitManagementSystem from './components/Service/PermitManagementSystem';
import ITSupportDashboard from './components/ITSupport/ITSupportDashboard';
import MyTickets from './components/ITSupport/MyTickets';
import AteraConsole from './components/Admin/AteraConsole';
import NotificationsPage from './components/Notifications/NotificationsPage';
import ActivityFeed from './components/Activity/ActivityFeed';
import SystemHealthDashboard from './components/Admin/SystemHealthDashboard';
import { FinanceLoans } from './components/Finance/FinanceLoans';
import { PaymentPlans } from './components/Finance/PaymentPlans';
import { Vouchers } from './components/Finance/Vouchers';
import { IntercompanyPayments } from './components/Finance/IntercompanyPayments';
import { JournalRecords } from './components/Operations/JournalRecords';
import { ResidentialContracts } from './components/Operations/ResidentialContracts';
import { ProductionMonitoring } from './components/Operations/ProductionMonitoring';
import { CompanyEquipment } from './components/Operations/CompanyEquipment';
import { LoyaltyProgram } from './components/Loyalty/LoyaltyProgram';
import { Quotes } from './components/Sales/Quotes';
import { ServicePaymentPlans } from './components/Service/ServicePaymentPlans';
import { PullSheets } from './components/Operations/PullSheets';

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
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-700 border-t-blue-500 rounded-full animate-spin"></div>
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
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
        <main className={`flex-1 overflow-auto pt-12 md:pt-0 min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
        } px-4 md:px-6 py-4`}>
        {renderView()}
        </main>
      </div>
    </div>
  );
}

function CustomerProfileWrapper() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-700 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
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