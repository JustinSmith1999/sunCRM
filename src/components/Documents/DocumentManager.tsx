import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Download,
  ExternalLink,
  Eye,
  Trash2,
  FolderOpen,
  Camera,
  Shield,
  ClipboardCheck,
  Wrench,
  Zap,
  FileCode,
  Mail,
  CheckCircle,
  FileCheck,
  Plus,
  X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { egnyteClient, linkFileToRecord, logDocumentAccess } from '../../lib/egnyte';

interface Document {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  title: string;
  description: string;
  category: any;
  egnyte_link: string;
  egnyte_path: string;
  visibility: string;
  created_at: string;
  uploaded_by: any;
  tags: string[];
}

interface DocumentManagerProps {
  leadId?: string;
  opportunityId?: string;
  accountId?: string;
  auroraProjectId?: string;
  mode?: 'full' | 'compact';
}

const CATEGORY_ICONS: Record<string, any> = {
  Proposals: FileText,
  Contracts: FileCheck,
  'Site Photos': Camera,
  Permits: ClipboardCheck,
  Installation: Wrench,
  'Utility Docs': Zap,
  Warranties: Shield,
  Technical: FileCode,
  'Customer Comm': Mail,
  Inspections: CheckCircle,
};

export function DocumentManager({
  leadId,
  opportunityId,
  accountId,
  auroraProjectId,
  mode = 'full',
}: DocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
    loadDocuments();
  }, [leadId, opportunityId, accountId, auroraProjectId]);

  const loadCategories = async () => {
    const { data } = await supabase
      .from('document_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (data) setCategories(data);
  };

  const loadDocuments = async () => {
    setLoading(true);
    let query = supabase
      .from('document_library')
      .select('*, category:document_categories(*), uploaded_by:auth.users(email)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (leadId) query = query.eq('lead_id', leadId);
    if (opportunityId) query = query.eq('opportunity_id', opportunityId);
    if (accountId) query = query.eq('account_id', accountId);
    if (auroraProjectId) query = query.eq('aurora_project_id', auroraProjectId);

    const { data } = await query;

    if (data) setDocuments(data as any);
    setLoading(false);
  };

  const handleFileUpload = async (file: File, categoryId: string) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const category = categories.find((c) => c.id === categoryId);
      const folderPath = category?.folder_path || '/Other';

      const filePath = await egnyteClient.uploadFile(file, folderPath, setUploadProgress);

      await linkFileToRecord(filePath, file.name, file.size, {
        leadId,
        opportunityId,
        accountId,
        auroraProjectId,
        categoryId,
        title: file.name,
        visibility: 'team',
      });

      setShowUpload(false);
      loadDocuments();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleView = async (doc: Document) => {
    await logDocumentAccess(doc.id, 'view');
    window.open(doc.egnyte_link || egnyteClient.getViewerUrl(doc.egnyte_path), '_blank');
  };

  const handleDownload = async (doc: Document) => {
    await logDocumentAccess(doc.id, 'download');
    window.open(doc.egnyte_link, '_blank');
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Delete this document?')) return;

    await logDocumentAccess(docId, 'delete');

    const { error } = await supabase
      .from('document_library')
      .update({ status: 'deleted' })
      .eq('id', docId);

    if (!error) loadDocuments();
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesCategory =
      selectedCategory === 'all' || doc.category?.id === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.title?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (mode === 'compact') {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blue-600" />
            Documents ({documents.length})
          </h3>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <Plus className="w-4 h-4" />
            Upload
          </button>
        </div>

        <div className="space-y-2">
          {documents.slice(0, 5).map((doc) => {
            const Icon = CATEGORY_ICONS[doc.category?.name] || FileText;
            return (
              <div
                key={doc.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 border border-slate-100"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">
                      {doc.file_name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {(doc.file_size / 1024).toFixed(0)} KB
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleView(doc)}
                  className="p-1.5 hover:bg-blue-50 rounded text-blue-600"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>

        {documents.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">No documents yet</div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="flex-shrink-0 p-4 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FolderOpen className="w-6 h-6 text-blue-600" />
              Document Library
            </h1>
            <p className="text-sm text-slate-600">{documents.length} documents</p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading documents...</div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">No Documents</h3>
            <p className="text-slate-600 mb-4">Upload your first document to get started</p>
            <button
              onClick={() => setShowUpload(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Upload Document
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDocs.map((doc) => {
              const Icon = CATEGORY_ICONS[doc.category?.name] || FileText;
              return (
                <div
                  key={doc.id}
                  className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: `${doc.category?.color}20` }}
                    >
                      <Icon
                        className="w-6 h-6"
                        style={{ color: doc.category?.color || '#64748b' }}
                      />
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleView(doc)}
                        className="p-1.5 hover:bg-blue-50 rounded text-blue-600"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(doc)}
                        className="p-1.5 hover:bg-green-50 rounded text-green-600"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 hover:bg-red-50 rounded text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 mb-1 truncate" title={doc.file_name}>
                    {doc.file_name}
                  </h3>

                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>{(doc.file_size / 1024).toFixed(0)} KB</span>
                    <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                  </div>

                  {doc.category && (
                    <div className="mt-2">
                      <span
                        className="inline-block px-2 py-1 rounded text-xs font-medium"
                        style={{
                          backgroundColor: `${doc.category.color}20`,
                          color: doc.category.color,
                        }}
                      >
                        {doc.category.name}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showUpload && (
        <UploadModal
          categories={categories}
          onUpload={handleFileUpload}
          onClose={() => setShowUpload(false)}
          uploading={uploading}
          progress={uploadProgress}
        />
      )}
    </div>
  );
}

function UploadModal({
  categories,
  onUpload,
  onClose,
  uploading,
  progress,
}: {
  categories: any[];
  onUpload: (file: File, categoryId: string) => void;
  onClose: () => void;
  uploading: boolean;
  progress: number;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');

  const handleSubmit = () => {
    if (!selectedFile || !selectedCategory) return;
    onUpload(selectedFile, selectedCategory);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Upload Document</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select File
            </label>
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              disabled={uploading}
              className="w-full text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              disabled={uploading}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose category...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {uploading && (
            <div>
              <div className="flex justify-between text-sm text-slate-600 mb-1">
                <span>Uploading...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 p-4 border-t border-slate-200">
          <button
            onClick={onClose}
            disabled={uploading}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedFile || !selectedCategory || uploading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}
