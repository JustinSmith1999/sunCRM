import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calendar, Percent, Zap, Home, Sun, Calculator } from 'lucide-react';

interface FinancingOption {
  id: string;
  name: string;
  type: 'cash' | 'loan' | 'lease' | 'ppa';
  apr?: number;
  termYears?: number;
  downPayment?: number;
  monthlyPayment?: number;
  description: string;
}

const FINANCING_OPTIONS: FinancingOption[] = [
  {
    id: 'cash',
    name: 'Cash Purchase',
    type: 'cash',
    description: 'Pay upfront and maximize savings with full tax benefits',
  },
  {
    id: 'loan_12',
    name: '12-Year Loan',
    type: 'loan',
    apr: 4.99,
    termYears: 12,
    downPayment: 0,
    description: 'Low monthly payments with attractive long-term savings',
  },
  {
    id: 'loan_20',
    name: '20-Year Loan',
    type: 'loan',
    apr: 5.99,
    termYears: 20,
    downPayment: 0,
    description: 'Lowest monthly payment option with extended term',
  },
  {
    id: 'loan_25',
    name: '25-Year Loan',
    type: 'loan',
    apr: 6.49,
    termYears: 25,
    downPayment: 0,
    description: 'Maximum payment flexibility with ultra-low monthly cost',
  },
];

const FEDERAL_TAX_CREDIT = 0.30;
const AVERAGE_UTILITY_INCREASE = 0.03;

export function SolarFinancingCalculator() {
  const [systemSize, setSystemSize] = useState<number>(8);
  const [costPerWatt, setCostPerWatt] = useState<number>(3.0);
  const [monthlyBill, setMonthlyBill] = useState<number>(200);
  const [electricityRate, setElectricityRate] = useState<number>(0.15);
  const [annualProduction, setAnnualProduction] = useState<number>(10000);
  const [selectedFinancing, setSelectedFinancing] = useState<string>('cash');
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    setAnnualProduction(systemSize * 1250);
  }, [systemSize]);

  useEffect(() => {
    calculateFinancing();
  }, [systemSize, costPerWatt, monthlyBill, electricityRate, annualProduction, selectedFinancing]);

  const calculateFinancing = () => {
    const systemCost = systemSize * 1000 * costPerWatt;
    const federalTaxCredit = systemCost * FEDERAL_TAX_CREDIT;
    const netSystemCost = systemCost - federalTaxCredit;

    const annualSavings = annualProduction * electricityRate;
    const firstYearSavings = annualSavings;

    let totalLifetimeSavings = 0;
    let cumulativeSavings = 0;
    let paybackYear = 0;

    for (let year = 1; year <= 25; year++) {
      const yearSavings = annualSavings * Math.pow(1 + AVERAGE_UTILITY_INCREASE, year - 1);
      totalLifetimeSavings += yearSavings;
      cumulativeSavings += yearSavings;

      if (paybackYear === 0 && cumulativeSavings >= netSystemCost) {
        paybackYear = year;
      }
    }

    const option = FINANCING_OPTIONS.find(o => o.id === selectedFinancing);
    let monthlyPayment = 0;
    let totalInterestPaid = 0;
    let netCost = netSystemCost;

    if (option?.type === 'loan' && option.apr && option.termYears) {
      const monthlyRate = option.apr / 100 / 12;
      const numPayments = option.termYears * 12;
      monthlyPayment = (netSystemCost * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
                       (Math.pow(1 + monthlyRate, numPayments) - 1);
      totalInterestPaid = (monthlyPayment * numPayments) - netSystemCost;
      netCost = netSystemCost + totalInterestPaid;
    }

    const monthlyBillReduction = annualSavings / 12;
    const netMonthlySavings = monthlyBillReduction - monthlyPayment;
    const roi = ((totalLifetimeSavings - netCost) / netCost) * 100;

    setResults({
      systemCost,
      federalTaxCredit,
      netSystemCost,
      annualSavings: firstYearSavings,
      monthlyBillReduction,
      totalLifetimeSavings,
      paybackYears: paybackYear,
      roi,
      monthlyPayment,
      totalInterestPaid,
      netMonthlySavings,
      netCost,
      option,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Solar Financing Calculator</h1>
            <p className="text-sm sm:text-base text-slate-600">Explore financing options and estimated savings</p>
          </div>
          <Calculator className="w-10 h-10 sm:w-12 sm:h-12 text-amber-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
                <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                System Details
              </h2>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 sm:mb-2">
                    System Size (kW)
                  </label>
                  <input
                    type="number"
                    value={systemSize}
                    onChange={(e) => setSystemSize(parseFloat(e.target.value) || 0)}
                    step="0.5"
                    min="0"
                    className="w-full px-3 sm:px-4 py-2 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 sm:mb-2">
                    Cost per Watt ($)
                  </label>
                  <input
                    type="number"
                    value={costPerWatt}
                    onChange={(e) => setCostPerWatt(parseFloat(e.target.value) || 0)}
                    step="0.10"
                    min="0"
                    className="w-full px-3 sm:px-4 py-2 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 sm:mb-2">
                    Annual Production (kWh)
                  </label>
                  <input
                    type="number"
                    value={annualProduction}
                    onChange={(e) => setAnnualProduction(parseFloat(e.target.value) || 0)}
                    step="100"
                    min="0"
                    className="w-full px-3 sm:px-4 py-2 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
                <Home className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                Current Usage
              </h2>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 sm:mb-2">
                    Monthly Electric Bill ($)
                  </label>
                  <input
                    type="number"
                    value={monthlyBill}
                    onChange={(e) => setMonthlyBill(parseFloat(e.target.value) || 0)}
                    step="10"
                    min="0"
                    className="w-full px-3 sm:px-4 py-2 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 sm:mb-2">
                    Electricity Rate ($/kWh)
                  </label>
                  <input
                    type="number"
                    value={electricityRate}
                    onChange={(e) => setElectricityRate(parseFloat(e.target.value) || 0)}
                    step="0.01"
                    min="0"
                    className="w-full px-3 sm:px-4 py-2 text-base border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                Financing Options
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {FINANCING_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedFinancing(option.id)}
                    className={`p-3 sm:p-4 border-2 rounded-lg text-left transition-all touch-manipulation ${
                      selectedFinancing === option.id
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <h3 className="font-semibold text-slate-900 mb-1 text-sm sm:text-base">{option.name}</h3>
                    {option.type === 'loan' && (
                      <p className="text-xs sm:text-sm text-slate-600 mb-1 sm:mb-2">
                        {formatPercent(option.apr || 0)} APR • {option.termYears} years
                      </p>
                    )}
                    <p className="text-xs text-slate-500">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {results && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-green-800 font-medium truncate">System Cost</span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold text-green-900 truncate">{formatCurrency(results.systemCost)}</p>
                    <p className="text-xs text-green-700 mt-0.5 sm:mt-1">Before incentives</p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                      <Percent className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-blue-800 font-medium truncate">Tax Credit</span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold text-blue-900 truncate">{formatCurrency(results.federalTaxCredit)}</p>
                    <p className="text-xs text-blue-700 mt-0.5 sm:mt-1">30% Federal ITC</p>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                      <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-amber-800 font-medium truncate">Net Cost</span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold text-amber-900 truncate">{formatCurrency(results.netCost)}</p>
                    <p className="text-xs text-amber-700 mt-0.5 sm:mt-1 truncate">After tax credit {results.totalInterestPaid > 0 ? '+ interest' : ''}</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-purple-800 font-medium truncate">Payback</span>
                    </div>
                    <p className="text-lg sm:text-2xl font-bold text-purple-900">{results.paybackYears} years</p>
                    <p className="text-xs text-purple-700 mt-0.5 sm:mt-1">Break-even point</p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6">
                  <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Savings Breakdown</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-slate-700 mb-2 sm:mb-3">Monthly</h3>
                      <div className="space-y-2 sm:space-y-3">
                        {results.monthlyPayment > 0 && (
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                            <span className="text-xs sm:text-sm text-slate-600">Loan Payment</span>
                            <span className="text-xs sm:text-sm font-semibold text-red-600">
                              -{formatCurrency(results.monthlyPayment)}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <span className="text-xs sm:text-sm text-slate-600">Electric Bill Reduction</span>
                          <span className="text-xs sm:text-sm font-semibold text-green-600">
                            +{formatCurrency(results.monthlyBillReduction)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-sm sm:text-base font-medium text-slate-900">Net Monthly Savings</span>
                          <span className={`text-base sm:text-lg font-bold ${results.netMonthlySavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {results.netMonthlySavings >= 0 ? '+' : ''}{formatCurrency(results.netMonthlySavings)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-slate-700 mb-2 sm:mb-3">25-Year Totals</h3>
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <span className="text-xs sm:text-sm text-slate-600">Total Lifetime Savings</span>
                          <span className="text-xs sm:text-sm font-semibold text-green-600">
                            +{formatCurrency(results.totalLifetimeSavings)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <span className="text-xs sm:text-sm text-slate-600">Total System Cost</span>
                          <span className="text-xs sm:text-sm font-semibold text-red-600">
                            -{formatCurrency(results.netCost)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-sm sm:text-base font-medium text-slate-900">Net Lifetime Benefit</span>
                          <span className="text-base sm:text-lg font-bold text-green-600">
                            +{formatCurrency(results.totalLifetimeSavings - results.netCost)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-200">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-center sm:text-left">
                        <p className="text-xs sm:text-sm text-slate-600 mb-1">Return on Investment</p>
                        <p className="text-2xl sm:text-3xl font-bold text-green-600">{formatPercent(results.roi)}</p>
                      </div>
                      <div className="text-center sm:text-right">
                        <p className="text-xs sm:text-sm text-slate-600 mb-1">First Year Savings</p>
                        <p className="text-2xl sm:text-3xl font-bold text-green-600">{formatCurrency(results.annualSavings)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 sm:p-6">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 flex-shrink-0 mt-0.5 sm:mt-1" />
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2 text-sm sm:text-base">Important Notes</h3>
                      <ul className="text-xs sm:text-sm text-slate-700 space-y-1">
                        <li>• Assumes {formatPercent(AVERAGE_UTILITY_INCREASE * 100)} annual utility rate increase</li>
                        <li>• 30% Federal Investment Tax Credit (ITC) included</li>
                        <li>• State and local incentives may apply (not included)</li>
                        <li>• System performance guaranteed for 25 years</li>
                        <li>• Net metering policies vary by utility company</li>
                        <li>• Actual savings depend on your specific usage patterns</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
