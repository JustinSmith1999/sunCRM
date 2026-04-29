import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Package, Plus, Minus, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface BarcodeScannerModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function BarcodeScannerModal({ onClose, onSuccess }: BarcodeScannerModalProps) {
  const [mode, setMode] = useState<'scan' | 'manual'>('scan');
  const [scannedCode, setScannedCode] = useState('');
  const [productInfo, setProductInfo] = useState<any>(null);
  const [transactionType, setTransactionType] = useState<'count' | 'addition' | 'removal' | 'adjustment'>('count');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === 'scan') {
      inputRef.current?.focus();
    }
  }, [mode]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (mode === 'scan' && e.key === 'Enter' && scannedCode) {
        lookupProduct();
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [mode, scannedCode]);

  const lookupProduct = async () => {
    if (!scannedCode.trim()) return;

    setLoading(true);
    setError('');
    setProductInfo(null);

    try {
      let { data, error: lookupError } = await supabase
        .from('warehouse_inventory')
        .select('*')
        .eq('product_code', scannedCode.trim().toUpperCase())
        .maybeSingle();

      if (!data) {
        const { data: barcodeData } = await supabase
          .from('inventory_barcodes')
          .select('product_code')
          .eq('barcode', scannedCode.trim())
          .maybeSingle();

        if (barcodeData) {
          const { data: productData } = await supabase
            .from('warehouse_inventory')
            .select('*')
            .eq('product_code', barcodeData.product_code)
            .maybeSingle();

          data = productData;
        }
      }

      if (lookupError || !data) {
        setError('Product not found. Please check the code and try again.');
      } else {
        setProductInfo(data);
        if (transactionType === 'count') {
          setQuantity(data.quantity_on_hand.toString());
        }
      }
    } catch (err) {
      setError('Error looking up product');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const processTransaction = async () => {
    if (!productInfo || !quantity) {
      setError('Please enter a quantity');
      return;
    }

    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum < 0) {
      setError('Please enter a valid quantity');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: transError } = await supabase.rpc('process_inventory_transaction', {
        p_product_code: productInfo.product_code,
        p_transaction_type: transactionType,
        p_quantity_change: quantityNum,
        p_location: productInfo.location,
        p_bin_location: productInfo.bin_location,
        p_notes: notes || null,
        p_scanned_barcode: scannedCode || null,
        p_reference_number: null
      });

      if (transError) throw transError;

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        resetForm();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error processing transaction');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setScannedCode('');
    setProductInfo(null);
    setQuantity('');
    setNotes('');
    setError('');
    setSuccess(false);
    inputRef.current?.focus();
  };

  const quickAdjust = (amount: number) => {
    const current = parseInt(quantity) || 0;
    setQuantity(Math.max(0, current + amount).toString());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Barcode Scanner</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex gap-2">
            <button
              onClick={() => setMode('scan')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                mode === 'scan'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Camera className="w-4 h-4 inline mr-2" />
              Scan Barcode
            </button>
            <button
              onClick={() => setMode('manual')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                mode === 'manual'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Package className="w-4 h-4 inline mr-2" />
              Manual Entry
            </button>
          </div>

          {mode === 'scan' && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 text-center">
              <Camera className="w-16 h-16 mx-auto text-blue-600 mb-4" />
              <p className="text-lg font-medium mb-2">Ready to Scan</p>
              <p className="text-sm text-gray-600 mb-4">
                Use your barcode scanner or camera to scan a product code
              </p>
              <input
                ref={inputRef}
                type="text"
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && lookupProduct()}
                placeholder="Scan or type barcode here..."
                className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg text-center text-lg font-mono"
                autoFocus
              />
              <button
                onClick={lookupProduct}
                disabled={!scannedCode || loading}
                className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Looking up...' : 'Lookup Product'}
              </button>
            </div>
          )}

          {mode === 'manual' && (
            <div>
              <label className="block text-sm font-medium mb-2">Product Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={scannedCode}
                  onChange={(e) => setScannedCode(e.target.value.toUpperCase())}
                  placeholder="Enter product code (e.g., A-MODULE-400W)"
                  className="flex-1 px-4 py-2 border rounded-lg"
                />
                <button
                  onClick={lookupProduct}
                  disabled={!scannedCode || loading}
                  className="px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  Search
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-800 font-medium">Transaction completed successfully!</p>
            </div>
          )}

          {productInfo && !success && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border">
                <h3 className="font-semibold text-lg mb-2">{productInfo.product_name}</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Code:</span>
                    <span className="ml-2 font-mono font-medium">{productInfo.product_code}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Category:</span>
                    <span className="ml-2 font-medium">{productInfo.category}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Current Qty:</span>
                    <span className="ml-2 font-bold text-lg">{productInfo.quantity_on_hand}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Location:</span>
                    <span className="ml-2 font-medium">{productInfo.location} - {productInfo.bin_location}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Transaction Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'count', label: 'Physical Count', desc: 'Set exact quantity' },
                    { value: 'addition', label: 'Add Stock', desc: 'Receive inventory' },
                    { value: 'removal', label: 'Remove Stock', desc: 'Issue/use items' },
                    { value: 'adjustment', label: 'Adjust', desc: 'Correct quantity' }
                  ].map(({ value, label, desc }) => (
                    <button
                      key={value}
                      onClick={() => setTransactionType(value as any)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        transactionType === value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-sm">{label}</div>
                      <div className="text-xs text-gray-600 mt-1">{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {transactionType === 'count' ? 'Counted Quantity' :
                   transactionType === 'addition' ? 'Quantity to Add' :
                   transactionType === 'removal' ? 'Quantity to Remove' : 'Adjustment Amount'}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => quickAdjust(-10)}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    -10
                  </button>
                  <button
                    onClick={() => quickAdjust(-1)}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg text-center text-2xl font-bold"
                    min="0"
                  />
                  <button
                    onClick={() => quickAdjust(1)}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => quickAdjust(10)}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    +10
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this transaction..."
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={2}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={resetForm}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Reset
                </button>
                <button
                  onClick={processTransaction}
                  disabled={loading || !quantity}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Complete Transaction'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
