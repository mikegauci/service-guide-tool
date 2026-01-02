'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { VehicleIssue } from '@/lib/types';
import { uploadImage } from '@/lib/upload-image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, AlertCircle, Clock, CheckCircle2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface IssuesSectionProps {
  vehicleId: string;
}

export default function IssuesSection({ vehicleId }: IssuesSectionProps) {
  const [issues, setIssues] = useState<VehicleIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'open' as 'open' | 'in_progress' | 'resolved',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    loadIssues();
  }, [vehicleId]);

  const loadIssues = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vehicle_issues')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIssues(data || []);
    } catch (error) {
      console.error('Error loading issues:', error);
      toast.error('Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = null;

      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile, 'issue-images');
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const { error } = await supabase.from('vehicle_issues').insert({
        vehicle_id: vehicleId,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: formData.status,
        image_url: imageUrl,
      });

      if (error) throw error;

      toast.success('Issue added successfully');
      resetForm();
      setIsOpen(false);
      loadIssues();
    } catch (error) {
      console.error('Error adding issue:', error);
      toast.error('Failed to add issue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      status: 'open',
    });
    setImageFile(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this issue?')) return;

    try {
      const { error } = await supabase.from('vehicle_issues').delete().eq('id', id);
      if (error) throw error;
      toast.success('Issue deleted');
      loadIssues();
    } catch (error) {
      console.error('Error deleting issue:', error);
      toast.error('Failed to delete issue');
    }
  };

  const updateStatus = async (id: string, status: 'open' | 'in_progress' | 'resolved') => {
    try {
      const { error } = await supabase
        .from('vehicle_issues')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      toast.success('Status updated');
      loadIssues();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const getFilteredIssues = () => {
    if (filterStatus === 'all') return issues;
    return issues.filter((issue) => issue.status === filterStatus);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'low':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'in_progress':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'resolved':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      default:
        return 'bg-muted text-foreground';
    }
  };

  if (loading) {
    return <div className="text-white">Loading issues...</div>;
  }

  const filteredIssues = getFilteredIssues();

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Known Issues</CardTitle>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="bg-btn-green hover:bg-btn-green/80 text-btn-green-foreground">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Issue
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Issue</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Document a known issue with your vehicle
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="bg-muted border-border text-white"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="bg-muted border-border text-white min-h-[100px]"
                      placeholder="Describe the issue in detail..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value: 'low' | 'medium' | 'high') =>
                          setFormData({ ...formData, priority: value })
                        }
                      >
                        <SelectTrigger className="bg-muted border-border text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: 'open' | 'in_progress' | 'resolved') =>
                          setFormData({ ...formData, status: value })
                        }
                      >
                        <SelectTrigger className="bg-muted border-border text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="image">Image</Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      className="bg-muted border-border text-white"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload a photo of the issue
                    </p>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-btn-green hover:bg-btn-green/80 text-btn-green-foreground"
                    >
                      {isSubmitting ? 'Adding...' : 'Add Issue'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        resetForm();
                        setIsOpen(false);
                      }}
                      className="border-border text-foreground hover:bg-muted"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('all')}
              className={`text-xs md:text-sm ${
                filterStatus === 'all'
                  ? 'bg-btn-blue text-btn-blue-foreground'
                  : 'border-border text-foreground'
              }`}
            >
              All ({issues.length})
            </Button>
            <Button
              variant={filterStatus === 'open' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('open')}
              className={`text-xs md:text-sm ${
                filterStatus === 'open'
                  ? 'bg-btn-blue text-btn-blue-foreground'
                  : 'border-border text-foreground'
              }`}
            >
              Open ({issues.filter((i) => i.status === 'open').length})
            </Button>
            <Button
              variant={filterStatus === 'in_progress' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('in_progress')}
              className={`text-xs md:text-sm ${
                filterStatus === 'in_progress'
                  ? 'bg-btn-blue text-btn-blue-foreground'
                  : 'border-border text-foreground'
              }`}
            >
              In Progress ({issues.filter((i) => i.status === 'in_progress').length})
            </Button>
            <Button
              variant={filterStatus === 'resolved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('resolved')}
              className={`text-xs md:text-sm ${
                filterStatus === 'resolved'
                  ? 'bg-btn-blue text-btn-blue-foreground'
                  : 'border-border text-foreground'
              }`}
            >
              Resolved ({issues.filter((i) => i.status === 'resolved').length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {filteredIssues.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="pt-6 text-center text-muted-foreground">
            {filterStatus === 'all'
              ? 'No issues reported for this vehicle'
              : `No ${filterStatus.replace('_', ' ')} issues`}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredIssues.map((issue) => (
            <Card key={issue.id} className="bg-card border-border overflow-hidden">
              {issue.image_url && (
                <div className="w-full h-48 bg-black overflow-hidden">
                  <img
                    src={issue.image_url}
                    alt={issue.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-white text-lg">{issue.title}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(issue.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {issue.description && (
                  <p className="text-sm text-muted-foreground">{issue.description}</p>
                )}

                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className={getPriorityColor(issue.priority)}>
                    {issue.priority.toUpperCase()}
                  </Badge>
                </div>

                <div className="pt-2">
                  <Label className="text-xs text-muted-foreground mb-1 block">Status</Label>
                  <Select
                    value={issue.status}
                    onValueChange={(value: 'open' | 'in_progress' | 'resolved') =>
                      updateStatus(issue.id, value)
                    }
                  >
                    <SelectTrigger className={`bg-muted border text-white ${getStatusColor(issue.status)}`}>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(issue.status)}
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <p className="text-xs text-muted-foreground pt-2">
                  Created: {new Date(issue.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

