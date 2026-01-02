'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useVehicle } from '@/lib/vehicle-context';
import { VehicleIssue } from '@/lib/types';
import { uploadImage } from '@/lib/upload-image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';

type SortColumn = 'title' | 'status' | 'priority' | 'vehicle' | 'created_at';
type SortDirection = 'asc' | 'desc' | null;

export default function IssuesAdmin() {
  const { vehicles } = useVehicle();
  const [issues, setIssues] = useState<VehicleIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<VehicleIssue | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    title: '',
    description: '',
    status: 'open' as 'open' | 'in_progress' | 'resolved',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vehicle_issues')
        .select('*')
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

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortedIssues = () => {
    if (!sortColumn || !sortDirection) return issues;

    return [...issues].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortColumn === 'vehicle') {
        const aVehicle = vehicles.find((v) => v.id === a.vehicle_id);
        const bVehicle = vehicles.find((v) => v.id === b.vehicle_id);
        aValue = aVehicle ? `${aVehicle.year} ${aVehicle.make} ${aVehicle.model}` : '';
        bValue = bVehicle ? `${bVehicle.year} ${bVehicle.make} ${bVehicle.model}` : '';
      } else {
        aValue = a[sortColumn as keyof VehicleIssue];
        bValue = b[sortColumn as keyof VehicleIssue];
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let imageUrl = editingIssue?.image_url || null;

      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile, 'issue-images');
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      if (editingIssue) {
        const { error } = await supabase
          .from('vehicle_issues')
          .update({
            ...formData,
            image_url: imageUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingIssue.id);

        if (error) throw error;
        toast.success('Issue updated successfully');
      } else {
        const { error } = await supabase.from('vehicle_issues').insert({
          ...formData,
          image_url: imageUrl,
        });

        if (error) throw error;
        toast.success('Issue added successfully');
      }

      setIsOpen(false);
      resetForm();
      loadIssues();
    } catch (error) {
      console.error('Error saving issue:', error);
      toast.error('Failed to save issue');
    }
  };

  const handleEdit = (issue: VehicleIssue) => {
    setEditingIssue(issue);
    setFormData({
      vehicle_id: issue.vehicle_id,
      title: issue.title,
      description: issue.description,
      status: issue.status,
      priority: issue.priority,
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this issue?')) return;

    try {
      const { error } = await supabase.from('vehicle_issues').delete().eq('id', id);
      if (error) throw error;
      toast.success('Issue deleted successfully');
      loadIssues();
    } catch (error) {
      console.error('Error deleting issue:', error);
      toast.error('Failed to delete issue');
    }
  };

  const resetForm = () => {
    setFormData({
      vehicle_id: '',
      title: '',
      description: '',
      status: 'open',
      priority: 'medium',
    });
    setEditingIssue(null);
    setImageFile(null);
  };

  const getVehicleName = (vehicleId: string) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    return vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : 'Unknown';
  };

  if (loading) {
    return <div className="text-white">Loading issues...</div>;
  }

  const sortedIssues = getSortedIssues();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Issues Management</h2>
        <Button
          onClick={() => {
            resetForm();
            setIsOpen(true);
          }}
          className="bg-btn-green hover:bg-btn-green/80 text-btn-green-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Issue
        </Button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-muted/50">
              <TableHead 
                className="text-white cursor-pointer"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center">
                  Title
                  <SortIcon column="title" />
                </div>
              </TableHead>
              <TableHead 
                className="text-white cursor-pointer"
                onClick={() => handleSort('vehicle')}
              >
                <div className="flex items-center">
                  Vehicle
                  <SortIcon column="vehicle" />
                </div>
              </TableHead>
              <TableHead 
                className="text-white cursor-pointer"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">
                  Status
                  <SortIcon column="status" />
                </div>
              </TableHead>
              <TableHead 
                className="text-white cursor-pointer"
                onClick={() => handleSort('priority')}
              >
                <div className="flex items-center">
                  Priority
                  <SortIcon column="priority" />
                </div>
              </TableHead>
              <TableHead 
                className="text-white cursor-pointer"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center">
                  Created
                  <SortIcon column="created_at" />
                </div>
              </TableHead>
              <TableHead className="text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedIssues.map((issue) => (
              <TableRow key={issue.id} className="border-border hover:bg-muted/50">
                <TableCell className="text-white font-medium">{issue.title}</TableCell>
                <TableCell className="text-white">{getVehicleName(issue.vehicle_id)}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                      issue.status === 'open'
                        ? 'bg-red-500/20 text-red-400'
                        : issue.status === 'in_progress'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-green-500/20 text-green-400'
                    }`}
                  >
                    {issue.status.replace('_', ' ')}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                      issue.priority === 'high'
                        ? 'bg-red-500/20 text-red-400'
                        : issue.priority === 'medium'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {issue.priority}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(issue.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(issue)}
                      className="text-btn-blue hover:text-btn-blue/80"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(issue.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-card border-border text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingIssue ? 'Edit Issue' : 'Add New Issue'}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingIssue ? 'Update issue details' : 'Add a new vehicle issue'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="vehicle_id">Vehicle *</Label>
              <Select
                value={formData.vehicle_id}
                onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}
              >
                <SelectTrigger className="bg-muted border-border text-white">
                  <SelectValue placeholder="Select a vehicle" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                placeholder="Describe the issue..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              {editingIssue?.image_url && !imageFile && (
                <p className="text-xs text-muted-foreground mt-1">
                  Current image will be kept unless you upload a new one
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                className="flex-1 bg-btn-green hover:bg-btn-green/80 text-btn-green-foreground"
              >
                {editingIssue ? 'Update' : 'Add'} Issue
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsOpen(false);
                  resetForm();
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
  );
}

