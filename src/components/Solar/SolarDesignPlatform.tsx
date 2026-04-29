import React, { useState, useEffect } from 'react';
import { Search, Home, Zap, Sun, Ruler, DollarSign, Save, MapPin, Building2, ExternalLink, Calculator, TrendingUp, Layout, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  lat?: number;
  lng?: number;
}

interface RoofData {
  total_area_sqft: number;
  usable_area_sqft: number;
  pitch: number;
  azimuth: number;
  roof_type: string;
  shading_factor: number;
}

interface SolarDesign {
  id?: string;
  address: Address;
  roof: RoofData;
  panel_count: number;
  panel_wattage: number;
  system_size_kw: number;
  annual_production_kwh: number;
  estimated_offset: number;
  estimated_cost: number;
  monthly_savings: number;
  payback_years: number;
  lead_id?: string;
  opportunity_id?: string;
  aurora_project_id?: string;
  proposal_url?: string;
}

interface AuroraProject {
  id: string;
  aurora_project_id: string;
  system_size_kw: number;
  annual_production_kwhr: number;
  panel_count: number;
  panel_model: string;
  estimated_cost: number;
  proposal_url: string;
  created_at: string;
}

const PANEL_SIZES = [
  { name: 'Standard 60-cell', watts: 300, length: 65, width: 39 },
  { name: 'Standard 72-cell', watts: 350, length: 77, width: 39 },
  { name: 'High-efficiency 60-cell', watts: 370, length: 65, width: 39 },
  { name: 'High-efficiency 72-cell', watts: 400, length: 77, width: 39 },
];

export function SolarDesignPlatform() {
  const [activeTab, setActiveTab] = useState<'search' | 'design' | 'aurora'>('search');
  const [searchAddress, setSearchAddress] = useState('');
  const [currentDesign, setCurrentDesign] = useState<SolarDesign | null>(null);
  const [auroraProjects, setAuroraProjects] = useState<AuroraProject[]>([]);
  const [selectedPanel, setSelectedPanel] = useState(PANEL_SIZES[2]);
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<string>('');
  const [showLeadDropdown, setShowLeadDropdown] = useState(false);

  useEffect(() => {
    loadLeads();
    loadAuroraProjects();
  }, []);

  const loadLeads = async () => {
    const { data } = await supabase
      .from('leads')
      .select('Id, FirstName, LastName, Street, City, State, PostalCode')
      .in('Status', ['Open', 'Opportunity', 'Qualifying', 'Working'])
      .order('created_at', { ascending: false })
      .limit(100);

    if (data) setLeads(data);
  };

  const loadAuroraProjects = async () => {
    const { data } = await supabase
      .from('aurora_projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setAuroraProjects(data);
  };

  const searchAddressDesign = async () => {
    setLoading(true);

    try {
      const addressParts = searchAddress.split(',');
      const address: Address = {
        street: addressParts[0]?.trim() || '',
        city: addressParts[1]?.trim() || '',
        state: addressParts[2]?.trim() || '',
        zip: addressParts[3]?.trim() || '',
      };

      const roofData: RoofData = {
        total_area_sqft: Math.floor(Math.random() * 1500) + 1000,
        usable_area_sqft: Math.floor(Math.random() * 1200) + 800,
        pitch: Math.floor(Math.random() * 8) + 3,
        azimuth: Math.floor(Math.random() * 90) + 135,
        roof_type: ['Asphalt Shingle', 'Metal', 'Tile', 'Flat'][Math.floor(Math.random() * 4)],
        shading_factor: Math.random() * 0.2 + 0.8,
      };

      calculateSolarSystem(address, roofData);
      setActiveTab('design');
    } catch (error) {
      console.error('Error searching address:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeadAddress = () => {
    const lead = leads.find(l => l.Id === selectedLead);
    if (!lead) return;

    const addressString = `${lead.Street || ''}, ${lead.City || ''}, ${lead.State || ''}, ${lead.PostalCode || ''}`;
    setSearchAddress(addressString);
    setShowLeadDropdown(false);
  };

  const calculateSolarSystem = (address: Address, roof: RoofData) => {
    const panelAreaSqFt = (selectedPanel.length * selectedPanel.width) / 144;
    const maxPanels = Math.floor(roof.usable_area_sqft / panelAreaSqFt * 0.85);

    const systemSizeKw = (maxPanels * selectedPanel.watts) / 1000;
    const annualProductionKwh = Math.floor(systemSizeKw * 1350 * roof.shading_factor);
    const estimatedCost = Math.floor(systemSizeKw * 2800);
    const monthlySavings = Math.floor(annualProductionKwh / 12 * 0.13);
    const paybackYears = parseFloat((estimatedCost / (monthlySavings * 12)).toFixed(1));

    const design: SolarDesign = {
      address,
      roof,
      panel_count: maxPanels,
      panel_wattage: selectedPanel.watts,
      system_size_kw: parseFloat(systemSizeKw.toFixed(2)),
      annual_production_kwh: annualProductionKwh,
      estimated_offset: Math.min(Math.floor((annualProductionKwh / 12000) * 100), 100),
      estimated_cost: estimatedCost,
      monthly_savings: monthlySavings,
      payback_years: paybackYears,
      lead_id: selectedLead || undefined,
    };

    setCurrentDesign(design);
  };

  const saveDesign = async () => {
    if (!currentDesign) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('aurora_projects')
        .insert({
          lead_salesforce_id: currentDesign.lead_id,
          system_size_kw: currentDesign.system_size_kw,
          annual_production_kwhr: currentDesign.annual_production_kwh,
          panel_count: currentDesign.panel_count,
          panel_wattage: currentDesign.panel_wattage,
          estimated_cost: currentDesign.estimated_cost,
          roof_type: currentDesign.roof.roof_type,
          roof_pitch: currentDesign.roof.pitch,
          roof_azimuth: currentDesign.roof.azimuth,
          design_data: currentDesign,
        })
        .select()
        .single();

      if (error) throw error;

      alert('Design saved successfully!');
      loadAuroraProjects();
    } catch (error) {
      console.error('Error saving design:', error);
      alert('Failed to save design');
    } finally {
      setLoading(false);
    }
  };

  const RoofVisualization = () => {
    if (!currentDesign) return null;

    const rows = Math.ceil(Math.sqrt(currentDesign.panel_count));
    const cols = Math.ceil(currentDesign.panel_count / rows);

    return (
      <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg p-4 border border-slate-300">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <Home className="w-4 h-4 text-slate-700" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Roof Layout</h3>
              <p className="text-xs text-slate-600">{currentDesign.roof.total_area_sqft.toLocaleString()} sq ft</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-blue-600">{currentDesign.panel_count}</div>
            <div className="text-xs text-slate-600">Panels</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 shadow-inner" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,.03) 10px, rgba(0,0,0,.03) 20px)',
        }}>
          <div className="grid gap-1.5" style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            maxWidth: '100%',
          }}>
            {Array.from({ length: currentDesign.panel_count }).map((_, i) => (
              <div
                key={i}
                className="bg-gradient-to-br from-blue-900 to-blue-700 rounded border border-blue-500 shadow-sm hover:shadow-md transition-all"
                style={{
                  aspectRatio: `${selectedPanel.length}/${selectedPanel.width}`,
                  position: 'relative',
                }}
              >
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-0.5 p-0.5">
                  {Array.from({ length: 9 }).map((_, j) => (
                    <div key={j} className="bg-blue-800/50 rounded-sm"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="bg-white rounded-lg p-2 shadow-sm border border-slate-200">
            <div className="flex items-center gap-1 text-slate-600 text-xs mb-0.5">
              <Ruler className="w-3 h-3" />
              <span>Pitch</span>
            </div>
            <div className="text-sm font-bold text-slate-900">{currentDesign.roof.pitch}/12</div>
          </div>
          <div className="bg-white rounded-lg p-2 shadow-sm border border-slate-200">
            <div className="flex items-center gap-1 text-slate-600 text-xs mb-0.5">
              <Sun className="w-3 h-3" />
              <span>Azimuth</span>
            </div>
            <div className="text-sm font-bold text-slate-900">{currentDesign.roof.azimuth}°</div>
          </div>
          <div className="bg-white rounded-lg p-2 shadow-sm border border-slate-200">
            <div className="flex items-center gap-1 text-slate-600 text-xs mb-0.5">
              <Building2 className="w-3 h-3" />
              <span>Type</span>
            </div>
            <div className="text-xs font-bold text-slate-900">{currentDesign.roof.roof_type}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="flex-shrink-0 p-4 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Layout className="w-6 h-6 text-blue-600" />
              Solar Design Platform
            </h1>
          </div>
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-2 rounded-lg shadow-md">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4" />
              <div>
                <div className="text-xs opacity-90">Designs</div>
                <div className="text-lg font-bold">{auroraProjects.length}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-1.5 px-3 py-2 font-medium transition-all whitespace-nowrap text-sm ${
              activeTab === 'search'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Address Search</span>
            <span className="sm:hidden">Search</span>
          </button>
          <button
            onClick={() => setActiveTab('design')}
            className={`flex items-center gap-1.5 px-3 py-2 font-medium transition-all whitespace-nowrap text-sm ${
              activeTab === 'design'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            disabled={!currentDesign}
          >
            <Calculator className="w-4 h-4" />
            <span className="hidden sm:inline">Calculator</span>
            <span className="sm:hidden">Design</span>
          </button>
          <button
            onClick={() => setActiveTab('aurora')}
            className={`flex items-center gap-1.5 px-3 py-2 font-medium transition-all whitespace-nowrap text-sm ${
              activeTab === 'aurora'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sun className="w-4 h-4" />
            Aurora
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'search' && (
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-white rounded-lg shadow-md p-4 border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Property Search
              </h2>

              <div className="space-y-3">
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Select Lead
                  </label>
                  <button
                    onClick={() => setShowLeadDropdown(!showLeadDropdown)}
                    className="w-full px-3 py-2.5 text-left border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white flex items-center justify-between text-sm"
                  >
                    <span className="truncate">
                      {selectedLead ? leads.find(l => l.Id === selectedLead)?.FirstName + ' ' + leads.find(l => l.Id === selectedLead)?.LastName : 'Choose a lead...'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  </button>

                  {showLeadDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {leads.map((lead) => (
                        <button
                          key={lead.Id}
                          onClick={() => {
                            setSelectedLead(lead.Id);
                            loadLeadAddress();
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-blue-50 text-sm border-b border-slate-100 last:border-0"
                        >
                          <div className="font-medium text-slate-900">{lead.FirstName} {lead.LastName}</div>
                          <div className="text-xs text-slate-600 truncate">{lead.Street}, {lead.City}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-300"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-slate-500">or enter manually</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Address
                  </label>
                  <input
                    type="text"
                    placeholder="123 Main St, City, State, ZIP"
                    value={searchAddress}
                    onChange={(e) => setSearchAddress(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && searchAddressDesign()}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Panel Type
                  </label>
                  <select
                    value={PANEL_SIZES.indexOf(selectedPanel)}
                    onChange={(e) => setSelectedPanel(PANEL_SIZES[parseInt(e.target.value)])}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    {PANEL_SIZES.map((panel, idx) => (
                      <option key={idx} value={idx}>
                        {panel.name} - {panel.watts}W
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={searchAddressDesign}
                  disabled={!searchAddress || loading}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Design System
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'design' && currentDesign && (
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="bg-white rounded-lg shadow-md p-4 border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-slate-900 truncate">System Design</h2>
                  <p className="text-sm text-slate-600 truncate">
                    {currentDesign.address.street}, {currentDesign.address.city}
                  </p>
                </div>
                <button
                  onClick={saveDesign}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-slate-300 transition-all shadow-sm text-sm whitespace-nowrap"
                >
                  <Save className="w-4 h-4" />
                  Save Design
                </button>
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <RoofVisualization />

                <div className="space-y-3">
                  <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-4 text-white">
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      System Overview
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="opacity-90 text-sm">System Size</span>
                        <span className="text-xl font-bold">{currentDesign.system_size_kw} kW</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="opacity-90 text-sm">Solar Panels</span>
                        <span className="text-xl font-bold">{currentDesign.panel_count}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="opacity-90 text-sm">Panel Power</span>
                        <span className="text-lg font-bold">{currentDesign.panel_wattage}W</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-4 text-white">
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Production
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="opacity-90 text-sm">Annual</span>
                        <span className="text-xl font-bold">{currentDesign.annual_production_kwh.toLocaleString()} kWh</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="opacity-90 text-sm">Offset</span>
                        <span className="text-xl font-bold">{currentDesign.estimated_offset}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-600 to-orange-600 rounded-lg p-4 text-white">
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Financial
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="opacity-90 text-sm">Cost</span>
                        <span className="text-xl font-bold">${currentDesign.estimated_cost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="opacity-90 text-sm">Monthly Savings</span>
                        <span className="text-xl font-bold">${currentDesign.monthly_savings}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="opacity-90 text-sm">Payback</span>
                        <span className="text-lg font-bold">{currentDesign.payback_years} yrs</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 border border-slate-200">
              <h3 className="text-base font-bold text-slate-900 mb-3">Specifications</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <div className="text-xs text-slate-600 mb-1">Roof Area</div>
                  <div className="text-lg font-bold text-slate-900">{currentDesign.roof.total_area_sqft.toLocaleString()}</div>
                  <div className="text-xs text-slate-500">sq ft</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <div className="text-xs text-slate-600 mb-1">Usable</div>
                  <div className="text-lg font-bold text-slate-900">{currentDesign.roof.usable_area_sqft.toLocaleString()}</div>
                  <div className="text-xs text-slate-500">sq ft</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <div className="text-xs text-slate-600 mb-1">Cost/Watt</div>
                  <div className="text-lg font-bold text-slate-900">${(currentDesign.estimated_cost / (currentDesign.system_size_kw * 1000)).toFixed(2)}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <div className="text-xs text-slate-600 mb-1">25-Yr Savings</div>
                  <div className="text-lg font-bold text-green-600">${(currentDesign.monthly_savings * 12 * 25).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'aurora' && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-4 border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Aurora Designs</h2>
                  <p className="text-sm text-slate-600">Professional solar designs</p>
                </div>
                <a
                  href="https://app.aurorasolar.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all text-sm whitespace-nowrap justify-center"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Aurora
                </a>
              </div>

              {auroraProjects.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                    <Sun className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">No Designs Yet</h3>
                  <p className="text-sm text-slate-600 mb-4 max-w-md mx-auto">
                    Create designs using the calculator or sync from Aurora Solar
                  </p>
                  <button
                    onClick={() => setActiveTab('search')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all text-sm"
                  >
                    Create Design
                  </button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {auroraProjects.map((project) => (
                    <div key={project.id} className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg p-4 border border-slate-200 hover:border-blue-400 transition-all shadow-sm hover:shadow-md">
                      <div className="flex items-start justify-between mb-3">
                        <div className="bg-blue-600 text-white rounded-lg p-2">
                          <Sun className="w-5 h-5" />
                        </div>
                        {project.aurora_project_id && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                            Aurora
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 mb-3">
                        <div>
                          <div className="text-xs text-slate-600">System Size</div>
                          <div className="text-xl font-bold text-slate-900">{project.system_size_kw} kW</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-600">Annual Production</div>
                          <div className="text-lg font-bold text-green-600">{project.annual_production_kwhr?.toLocaleString() || 'N/A'} kWh</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="text-xs text-slate-600">Panels</div>
                            <div className="text-sm font-bold text-slate-900">{project.panel_count || 'N/A'}</div>
                          </div>
                          {project.panel_model && (
                            <div>
                              <div className="text-xs text-slate-600">Model</div>
                              <div className="text-xs font-medium text-slate-900 truncate">{project.panel_model}</div>
                            </div>
                          )}
                        </div>
                      </div>

                      {project.proposal_url && (
                        <a
                          href={project.proposal_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all text-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Proposal
                        </a>
                      )}

                      <div className="mt-2 text-xs text-slate-500 text-center">
                        {new Date(project.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
