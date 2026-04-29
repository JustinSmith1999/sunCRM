import { useState } from 'react';
import { Upload, FileText, MapPin, Check, AlertCircle, Download, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Step = 'upload' | 'mapping' | 'validation' | 'import' | 'complete';

interface FieldMapping {
  csvField: string;
  dbField: string;
  required: boolean;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

const OBJECT_TYPES = [
  { value: 'leads', label: 'Leads', fields: ['first_name', 'last_name', 'email', 'phone', 'company', 'status', 'source'] },
  { value: 'contacts', label: 'Contacts', fields: ['first_name', 'last_name', 'email', 'phone', 'account_name', 'title'] },
  { value: 'accounts', label: 'Accounts', fields: ['name', 'industry', 'website', 'phone', 'billing_city', 'billing_state'] },
  { value: 'opportunities', label: 'Opportunities', fields: ['name', 'stage', 'amount', 'close_date', 'account_name', 'probability'] }
];

export default function BulkImportWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>('upload');
  const [objectType, setObjectType] = useState('leads');
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(selectedFile);
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return;

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    setCsvHeaders(headers);

    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });

    setCsvData(data);

    const objectFields = OBJECT_TYPES.find(o => o.value === objectType)?.fields || [];
    const autoMappings: FieldMapping[] = objectFields.map(dbField => {
      const matchingCsvField = headers.find(h =>
        h.toLowerCase().replace(/[^a-z0-9]/g, '') === dbField.toLowerCase().replace(/[^a-z0-9]/g, '')
      );

      return {
        csvField: matchingCsvField || '',
        dbField,
        required: ['first_name', 'last_name', 'name', 'email'].includes(dbField)
      };
    });

    setFieldMappings(autoMappings);
    setStep('mapping');
  };

  const handleMappingChange = (dbField: string, csvField: string) => {
    setFieldMappings(prev =>
      prev.map(m => m.dbField === dbField ? { ...m, csvField } : m)
    );
  };

  const validateData = () => {
    const errors: ValidationError[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    csvData.forEach((row, index) => {
      fieldMappings.forEach(mapping => {
        const value = row[mapping.csvField];

        if (mapping.required && !value) {
          errors.push({
            row: index + 2,
            field: mapping.dbField,
            message: `${mapping.dbField} is required but missing`
          });
        }

        if (mapping.dbField === 'email' && value && !emailRegex.test(value)) {
          errors.push({
            row: index + 2,
            field: 'email',
            message: 'Invalid email format'
          });
        }
      });
    });

    setValidationErrors(errors);
    setStep('validation');
  };

  const performImport = async () => {
    setStep('import');
    let imported = 0;
    let failed = 0;

    const batchSize = 50;
    for (let i = 0; i < csvData.length; i += batchSize) {
      const batch = csvData.slice(i, i + batchSize);

      const records = batch.map(row => {
        const record: any = {};
        fieldMappings.forEach(mapping => {
          if (mapping.csvField && row[mapping.csvField]) {
            record[mapping.dbField] = row[mapping.csvField];
          }
        });
        return record;
      });

      try {
        const { error } = await supabase
          .from(objectType)
          .insert(records);

        if (error) {
          failed += batch.length;
        } else {
          imported += batch.length;
        }
      } catch (error) {
        failed += batch.length;
      }

      setImportedCount(imported);
      setFailedCount(failed);
      setImportProgress(Math.floor(((i + batch.length) / csvData.length) * 100));
    }

    setStep('complete');
  };

  const downloadTemplate = () => {
    const objectFields = OBJECT_TYPES.find(o => o.value === objectType)?.fields || [];
    const csv = objectFields.join(',') + '\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${objectType}_template.csv`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Bulk Import Wizard</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {step === 'upload' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Object Type
                </label>
                <select
                  value={objectType}
                  onChange={(e) => setObjectType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {OBJECT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors">
                <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Upload CSV File
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Select a CSV file to import {objectType}
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                >
                  Choose File
                </label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Download className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      Need a template?
                    </p>
                    <p className="text-sm text-blue-700 mb-2">
                      Download a CSV template with the correct format
                    </p>
                    <button
                      onClick={downloadTemplate}
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Download Template
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  Found <span className="font-semibold">{csvData.length}</span> rows in your CSV file.
                  Map your CSV columns to database fields below.
                </p>
              </div>

              <div className="space-y-4">
                {fieldMappings.map(mapping => (
                  <div key={mapping.dbField} className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {mapping.dbField}
                        {mapping.required && <span className="text-red-600 ml-1">*</span>}
                      </label>
                      <select
                        value={mapping.csvField}
                        onChange={(e) => handleMappingChange(mapping.dbField, e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">-- Select CSV Column --</option>
                        {csvHeaders.map(header => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </select>
                    </div>
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <div className="text-sm text-gray-600">
                        Preview: {mapping.csvField && csvData[0]?.[mapping.csvField] || '-'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'validation' && (
            <div className="space-y-6">
              {validationErrors.length === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <Check className="w-16 h-16 mx-auto mb-4 text-green-600" />
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    Validation Successful!
                  </h3>
                  <p className="text-green-700">
                    All {csvData.length} records passed validation. Ready to import.
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold text-red-900 mb-2">
                        Found {validationErrors.length} Validation Errors
                      </h3>
                      <p className="text-sm text-red-700">
                        Please fix these errors in your CSV and re-upload
                      </p>
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {validationErrors.map((error, index) => (
                      <div key={index} className="bg-white p-3 rounded border border-red-200">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">Row {error.row}:</span> {error.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'import' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-4 relative">
                  <svg className="transform -rotate-90 w-24 h-24">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="#E5E7EB"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="#3B82F6"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - importProgress / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-600">{importProgress}%</span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Importing Records...
                </h3>
                <p className="text-gray-600">
                  {importedCount} of {csvData.length} records imported
                </p>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <Check className="w-16 h-16 mx-auto mb-4 text-green-600" />
                <h3 className="text-2xl font-bold text-green-900 mb-2">
                  Import Complete!
                </h3>
                <div className="space-y-2 text-gray-700">
                  <p>Successfully imported: <span className="font-semibold text-green-700">{importedCount}</span></p>
                  {failedCount > 0 && (
                    <p>Failed: <span className="font-semibold text-red-700">{failedCount}</span></p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {step === 'complete' ? 'Close' : 'Cancel'}
          </button>

          <div className="flex gap-2">
            {step === 'mapping' && (
              <>
                <button
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={validateData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next: Validate
                </button>
              </>
            )}

            {step === 'validation' && validationErrors.length === 0 && (
              <>
                <button
                  onClick={() => setStep('mapping')}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={performImport}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Start Import
                </button>
              </>
            )}

            {step === 'validation' && validationErrors.length > 0 && (
              <button
                onClick={() => setStep('upload')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upload Fixed File
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
