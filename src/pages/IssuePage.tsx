import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Tag, AlertCircle, CheckCircle2, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Issue } from '@/types/issue';
import { currentUser } from '@/data/currentUser';
import { issueApi } from '@/api/issueApi';

const IssuePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: ''
  });
  const [isMarking, setIsMarking] = useState(false);

  useEffect(() => {
    if (id) {
      loadIssue(id);
    }
  }, [id]);

  const loadIssue = async (issueId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const issueData = await issueApi.getIssueById(issueId);
      if (issueData) {
        setIssue(issueData);
        setEditForm({
          title: issueData.title,
          description: issueData.description
        });
      } else {
        setError('Issue topilmadi');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Issue yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (currentUser.role !== 'admin') {
      toast({
        title: "Ruxsat yo'q",
        description: "Tahrirlash uchun admin roli kerak",
        variant: "destructive"
      });
      return;
    }
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!issue) return;

    try {
      const updatedIssue = await issueApi.updateIssue(issue.id, {
        title: editForm.title,
        description: editForm.description
      });
      
      setIssue(updatedIssue);
      setIsEditing(false);
      
      toast({
        title: "Saqlandi",
        description: "Issue muvaffaqiyatli yangilandi"
      });
    } catch (err) {
      toast({
        title: "Xatolik",
        description: err instanceof Error ? err.message : "Saqlashda xatolik",
        variant: "destructive"
      });
    }
  };

  const handleCancelEdit = () => {
    if (issue) {
      setEditForm({
        title: issue.title,
        description: issue.description
      });
    }
    setIsEditing(false);
  };

  const handleMarkAsResolved = async () => {
    if (!issue) return;

    if (currentUser.role !== 'admin') {
      toast({
        title: "Ruxsat yo'q",
        description: "Issue'ni resolved qilish uchun admin roli kerak",
        variant: "destructive"
      });
      return;
    }

    setIsMarking(true);
    
    try {
      const updatedIssue = await issueApi.markAsResolved(issue.id);
      setIssue(updatedIssue);
      
      toast({
        title: "Issue resolved qilindi",
        description: "Issue 'Done' statusga o'tkazildi"
      });
    } catch (err) {
      toast({
        title: "Xatolik",
        description: err instanceof Error ? err.message : "Resolved qilishda xatolik",
        variant: "destructive"
      });
    } finally {
      setIsMarking(false);
    }
  };

  const getSeverityColor = (severity: Issue['severity']) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: Issue['status']) => {
    switch (status) {
      case 'backlog': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'done': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: Issue['status']) => {
    switch (status) {
      case 'backlog': return 'Backlog';
      case 'in-progress': return 'In Progress';
      case 'done': return 'Done';
      default: return status;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('uz-UZ', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Issue yuklanmoqda...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Xatolik</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => navigate('/board')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Boardga qaytish
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            to="/board"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Boardga qaytish
          </Link>
          
          <div className="flex items-center gap-2">
            {issue.status !== 'done' && currentUser.role === 'admin' && (
              <Button 
                onClick={handleMarkAsResolved}
                disabled={isMarking}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {isMarking ? 'Saqlanmoqda...' : 'Resolved qilish'}
              </Button>
            )}
            
            {currentUser.role === 'admin' && (
              <>
                {!isEditing ? (
                  <Button variant="outline" onClick={handleEdit}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Tahrirlash
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleSaveEdit} size="sm">
                      <Save className="w-4 h-4 mr-2" />
                      Saqlash
                    </Button>
                    <Button variant="outline" onClick={handleCancelEdit} size="sm">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Issue Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Issue ID and Status */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-mono text-blue-600">{issue.id}</h1>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(issue.status)}>
                {getStatusText(issue.status)}
              </Badge>
              <Badge className={getSeverityColor(issue.severity)}>
                {issue.severity}
              </Badge>
            </div>
          </div>

          {/* Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sarlavha
            </label>
            {isEditing ? (
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                className="text-xl font-semibold"
                placeholder="Issue sarlavhasi..."
              />
            ) : (
              <h2 className="text-2xl font-semibold text-gray-900">{issue.title}</h2>
            )}
          </div>

          {/* Description */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tavsif
            </label>
            {isEditing ? (
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                rows={6}
                placeholder="Issue tavsifi..."
              />
            ) : (
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {issue.description}
                </p>
              </div>
            )}
          </div>

          {/* Tags */}
          {issue.tags.length > 0 && (
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teglar
              </label>
              <div className="flex flex-wrap gap-2">
                {issue.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="bg-blue-50">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tayinlangan
              </label>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-gray-900">{issue.assignee}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity
              </label>
              <Badge className={getSeverityColor(issue.severity)}>
                {issue.severity}
              </Badge>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Yaratilgan
              </label>
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>{formatDate(issue.createdAt)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Oxirgi yangilanish
              </label>
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>{formatDate(issue.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Role Info */}
        {currentUser.role === 'contributor' && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              <strong>Diqqat:</strong> Siz "contributor" roliga egasiz. Tahrirlash va status o'zgartirish uchun admin roli kerak.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IssuePage;