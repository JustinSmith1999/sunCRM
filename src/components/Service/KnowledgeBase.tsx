import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, Filter, MoreVertical, BookOpen, Eye, ThumbsUp, ThumbsDown,
  Star, CreditCard as Edit, Users, Zap, Target, Award, FileText, Code, Settings
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Article {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  article_type: string;
  category: string | null;
  tags: string[];
  is_published: boolean;
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  author_id: string;
  created_at: string;
  updated_at: string;
  author: {
    full_name: string | null;
    email: string;
  };
}

export function KnowledgeBase() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showUnpublished, setShowUnpublished] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    loadArticles();
  }, [profile]);

  const loadArticles = async () => {
    if (!profile?.organization_id) return;

    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select(`
          *,
          author:user_profiles!knowledge_base_author_id_fkey (full_name, email)
        `)
        .eq('organization_id', profile.organization_id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const categoryMap = new Map<string, { count: number; articles: Article[] }>();

    articles.forEach(article => {
      const cat = article.category || 'Uncategorized';
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, { count: 0, articles: [] });
      }
      const entry = categoryMap.get(cat)!;
      entry.count++;
      entry.articles.push(article);
    });

    return Array.from(categoryMap.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      articles: data.articles
    })).sort((a, b) => b.count - a.count);
  }, [articles]);

  const getCategoryConfig = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('sales')) {
      return { gradient: 'from-blue-600 to-cyan-600', icon: Target, description: 'Sales processes and best practices' };
    } else if (cat.includes('product')) {
      return { gradient: 'from-emerald-600 to-green-600', icon: Award, description: 'Product guides and features' };
    } else if (cat.includes('process') || cat.includes('operations')) {
      return { gradient: 'from-purple-600 to-pink-600', icon: Settings, description: 'Operational procedures' };
    } else if (cat.includes('technical') || cat.includes('it')) {
      return { gradient: 'from-amber-600 to-orange-600', icon: Code, description: 'Technical documentation' };
    } else {
      return { gradient: 'from-slate-600 to-slate-700', icon: FileText, description: 'General knowledge' };
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = selectedType === 'all' || article.article_type === selectedType;
    const matchesCategory = !selectedCategory || article.category === selectedCategory;
    const matchesPublished = showUnpublished || article.is_published;

    return matchesSearch && matchesType && matchesCategory && matchesPublished;
  });

  const getCategoryColor = (category: string | null) => {
    if (!category) return 'border-slate-500';
    const cat = category.toLowerCase();
    if (cat.includes('sales')) return 'border-blue-500';
    if (cat.includes('product')) return 'border-emerald-500';
    if (cat.includes('process')) return 'border-purple-500';
    if (cat.includes('technical')) return 'border-amber-500';
    return 'border-slate-500';
  };

  const getHelpfulnessRatio = (article: Article) => {
    const total = article.helpful_count + article.not_helpful_count;
    if (total === 0) return 0;
    return Math.round((article.helpful_count / total) * 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">

        <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-3xl shadow-2xl p-12 relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 text-center">
            <BookOpen className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h1 className="text-4xl font-black text-white mb-4">Knowledge Base</h1>
            <p className="text-slate-300 text-lg mb-6">Find answers, guides, and documentation</p>
            <div className="max-w-2xl mx-auto relative">
              <Search className="w-6 h-6 text-slate-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search articles, guides, and documentation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-4 py-4 bg-slate-900/50 border border-slate-600 rounded-2xl focus:ring-2 focus:ring-blue-500 text-white text-lg placeholder-slate-500"
              />
            </div>
          </div>
        </div>

        {!searchTerm && !selectedCategory && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-black text-white">Browse by Category</h2>
              <button className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg hover:shadow-emerald-500/50">
                <Plus className="w-5 h-5" />
                New Article
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category) => {
                const config = getCategoryConfig(category.name);
                const Icon = config.icon;

                return (
                  <div
                    key={category.name}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`bg-gradient-to-br ${config.gradient} rounded-2xl shadow-2xl p-6 relative overflow-hidden cursor-pointer hover:scale-105 transition-all duration-300`}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="relative z-10">
                      <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-black text-white mb-2">{category.name}</h3>
                      <p className="text-white/80 text-sm mb-4">{config.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="bg-white/20 px-3 py-1 rounded-full">
                          <span className="text-white font-bold">{category.count}</span>
                          <span className="text-white/80 text-sm ml-1">articles</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {(searchTerm || selectedCategory) && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-black text-white">
                  {selectedCategory || 'Search Results'}
                </h2>
                {selectedCategory && (
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="text-blue-400 hover:text-blue-300 text-sm mt-1"
                  >
                    ← Back to categories
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="faq">FAQ</option>
                  <option value="howto">How To</option>
                  <option value="troubleshooting">Troubleshooting</option>
                  <option value="policy">Policy</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredArticles.map((article) => {
                const helpfulRatio = getHelpfulnessRatio(article);

                return (
                  <div
                    key={article.id}
                    className={`bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border-l-4 ${getCategoryColor(article.category)} hover:scale-[1.02] transition-all duration-300 cursor-pointer`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-white">{article.title}</h3>
                          {!article.is_published && (
                            <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-full">
                              Draft
                            </span>
                          )}
                        </div>

                        <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                          {article.summary || article.content.substring(0, 200)}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Users className="w-4 h-4" />
                            <span>{article.author?.full_name || article.author?.email || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400">
                            <Eye className="w-4 h-4" />
                            <span>{article.view_count} views</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ThumbsUp className="w-4 h-4 text-emerald-400" />
                            <span className="text-white font-medium">{helpfulRatio}% helpful</span>
                          </div>
                          <div className="text-slate-500">
                            {formatDate(article.updated_at)}
                          </div>
                        </div>

                        {article.tags && article.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {article.tags.slice(0, 5).map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {article.category && (
                        <div className="ml-4">
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            article.category.toLowerCase().includes('sales') ? 'bg-blue-500/20 text-blue-400' :
                            article.category.toLowerCase().includes('product') ? 'bg-emerald-500/20 text-emerald-400' :
                            article.category.toLowerCase().includes('process') ? 'bg-purple-500/20 text-purple-400' :
                            article.category.toLowerCase().includes('technical') ? 'bg-amber-500/20 text-amber-400' :
                            'bg-slate-500/20 text-slate-400'
                          }`}>
                            {article.category}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredArticles.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-400 mb-2">No articles found</h3>
                <p className="text-slate-500">Try adjusting your search or filters</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
