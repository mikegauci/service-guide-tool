'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useVehicle } from '@/lib/vehicle-context';
import { VideoLibrary } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Edit, Trash2, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';

type SortColumn = 'title' | 'category' | 'vehicle' | 'difficulty_level';
type SortDirection = 'asc' | 'desc' | null;

export default function VideosAdmin() {
  const { vehicles } = useVehicle();
  const [videos, setVideos] = useState<VideoLibrary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VideoLibrary | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    title: '',
    category: 'General',
    youtube_link: '',
    description: '',
    difficulty_level: 'Intermediate',
  });

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('video_library')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error loading videos:', error);
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.youtube_link) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('video_library')
          .update(formData)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Video updated successfully');
      } else {
        const { error } = await supabase.from('video_library').insert([formData]);

        if (error) throw error;
        toast.success('Video added successfully');
      }

      resetForm();
      loadVideos();
    } catch (error) {
      toast.error('Failed to save video');
    }
  };

  const handleEdit = (item: VideoLibrary) => {
    setEditingItem(item);
    setFormData({
      vehicle_id: item.vehicle_id || '',
      title: item.title,
      category: item.category,
      youtube_link: item.youtube_link,
      description: item.description,
      difficulty_level: item.difficulty_level,
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;

    try {
      const { error } = await supabase.from('video_library').delete().eq('id', id);

      if (error) throw error;
      toast.success('Video deleted successfully');
      loadVideos();
    } catch (error) {
      toast.error('Failed to delete video');
    }
  };

  const resetForm = () => {
    setFormData({
      vehicle_id: '',
      title: '',
      category: 'General',
      youtube_link: '',
      description: '',
      difficulty_level: 'Intermediate',
    });
    setEditingItem(null);
    setIsOpen(false);
  };

  const getVehicleName = (vehicleId?: string) => {
    if (!vehicleId) return 'All Vehicles';
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    return vehicle
      ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
      : 'Unknown Vehicle';
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortedVideos = () => {
    if (!sortColumn || !sortDirection) return videos;

    return [...videos].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'vehicle':
          aValue = getVehicleName(a.vehicle_id).toLowerCase();
          bValue = getVehicleName(b.vehicle_id).toLowerCase();
          break;
        case 'difficulty_level':
          aValue = a.difficulty_level.toLowerCase();
          bValue = b.difficulty_level.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return <ArrowUpDown className="h-3 w-3 ml-1" />;
    if (sortDirection === 'asc') return <ArrowUp className="h-3 w-3 ml-1" />;
    return <ArrowDown className="h-3 w-3 ml-1" />;
  };

  if (loading) {
    return <div className="text-white">Loading videos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Video Library</h2>
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-btn-green hover:bg-btn-green/80 text-btn-green-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Video
        </Button>
      </div>

      <div className="border border-border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead 
                className="text-foreground cursor-pointer hover:text-white"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center">
                  Title
                  <SortIcon column="title" />
                </div>
              </TableHead>
              <TableHead 
                className="text-foreground cursor-pointer hover:text-white"
                onClick={() => handleSort('vehicle')}
              >
                <div className="flex items-center">
                  Vehicle
                  <SortIcon column="vehicle" />
                </div>
              </TableHead>
              <TableHead 
                className="text-foreground cursor-pointer hover:text-white"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center">
                  Category
                  <SortIcon column="category" />
                </div>
              </TableHead>
              <TableHead 
                className="text-foreground cursor-pointer hover:text-white"
                onClick={() => handleSort('difficulty_level')}
              >
                <div className="flex items-center">
                  Difficulty
                  <SortIcon column="difficulty_level" />
                </div>
              </TableHead>
              <TableHead className="text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {getSortedVideos().length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No videos found
                </TableCell>
              </TableRow>
            ) : (
              getSortedVideos().map((item) => (
                <TableRow key={item.id} className="border-border">
                  <TableCell className="text-white font-medium">{item.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {getVehicleName(item.vehicle_id)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.category}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.difficulty_level}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="text-btn-green hover:text-btn-green/80"
                      >
                        <a href={item.youtube_link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        onClick={() => handleEdit(item)}
                        variant="ghost"
                        size="sm"
                        className="text-btn-blue hover:text-btn-blue/80"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(item.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={resetForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingItem ? 'Edit Video' : 'Add New Video'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingItem ? 'Update video information' : 'Add a new video tutorial'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-foreground">Vehicle (Optional)</Label>
              <select
                value={formData.vehicle_id}
                onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                className="w-full bg-muted border border-border text-white rounded-md px-3 py-2 mt-1"
              >
                <option value="">All Vehicles</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-foreground">Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., How to Change Oil"
                className="bg-muted border-border text-white mt-1"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground">Category</Label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-muted border border-border text-white rounded-md px-3 py-2 mt-1"
                >
                  <option value="General">General</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Repair">Repair</option>
                  <option value="Diagnosis">Diagnosis</option>
                  <option value="Upgrade">Upgrade</option>
                </select>
              </div>
              <div>
                <Label className="text-foreground">Difficulty</Label>
                <select
                  value={formData.difficulty_level}
                  onChange={(e) =>
                    setFormData({ ...formData, difficulty_level: e.target.value })
                  }
                  className="w-full bg-muted border border-border text-white rounded-md px-3 py-2 mt-1"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-foreground">YouTube Link *</Label>
              <Input
                value={formData.youtube_link}
                onChange={(e) => setFormData({ ...formData, youtube_link: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
                className="bg-muted border-border text-white mt-1"
                required
              />
            </div>

            <div>
              <Label className="text-foreground">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the video content"
                className="bg-muted border-border text-white mt-1"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 bg-btn-green hover:bg-btn-green/80 text-btn-green-foreground"
              >
                {editingItem ? 'Update' : 'Add Video'}
              </Button>
              <Button
                type="button"
                onClick={resetForm}
                variant="outline"
                className="border-border text-foreground"
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

