'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Part } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { ExternalLink, Search, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface PartsSectionProps {
  vehicleId: string;
}

export default function PartsSection({ vehicleId }: PartsSectionProps) {
  const [parts, setParts] = useState<Part[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    specifications: '',
    supplier_name: '',
    purchase_link: '',
    price_eur: 0,
    compatibility_notes: '',
    category: 'Engine',
  });

  useEffect(() => {
    loadParts();
  }, [vehicleId]);

  const loadParts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('parts')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('category', { ascending: true });

      if (error) throw error;
      setParts(data || []);
    } catch (error) {
      console.error('Error loading parts:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePart = async (partId: string) => {
    const part = parts.find(p => p.id === partId);
    if (!part) return;

    const newApprovedState = !part.approved_by_mechanic;

    try {
      const { error } = await supabase
        .from('parts')
        .update({ approved_by_mechanic: newApprovedState })
        .eq('id', partId);

      if (error) throw error;

      // Update local state
      setParts(parts.map(p => 
        p.id === partId 
          ? { ...p, approved_by_mechanic: newApprovedState }
          : p
      ));
    } catch (error) {
      console.error('Error updating part approval:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.supplier_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('parts')
        .insert([
          {
            vehicle_id: vehicleId,
            ...formData,
            approved_by_mechanic: false,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setParts([...parts, data]);
      toast.success('Part added successfully');
      resetForm();
    } catch (error) {
      toast.error('Failed to add part');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      specifications: '',
      supplier_name: '',
      purchase_link: '',
      price_eur: 0,
      compatibility_notes: '',
      category: 'Engine',
    });
    setIsOpen(false);
  };

  const getFilteredParts = () => {
    let filtered = parts;

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.specifications.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterCategory) {
      filtered = filtered.filter((p) => p.category === filterCategory);
    }

    return filtered;
  };

  const groupedParts = getFilteredParts().reduce(
    (acc, part) => {
      if (!acc[part.category]) {
        acc[part.category] = [];
      }
      acc[part.category].push(part);
      return acc;
    },
    {} as Record<string, Part[]>
  );

  const categories = Object.keys(groupedParts).sort();
  const approvedParts = parts.filter(p => p.approved_by_mechanic);
  const selectedTotal = approvedParts.reduce((sum, part) => sum + part.price_eur, 0);

  if (loading) {
    return <div className="text-white">Loading parts...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-white">Parts List & Purchasing</CardTitle>
          <Button
            onClick={() => setIsOpen(true)}
            className="bg-btn-green hover:bg-btn-green/80 text-btn-green-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Part
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-col md:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search parts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-muted border-border text-white placeholder:text-muted-foreground"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-muted border border-border text-white rounded-md px-3 py-2 text-sm"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {selectedTotal > 0 && (
            <div className="bg-btn-blue/10 border border-btn-blue/50 rounded-md p-3">
              <p className="text-xs text-btn-blue font-semibold mb-1">
                ✓ Approved to purchase by mechanic
              </p>
              <p className="text-white font-semibold">
                Selected Total: €{selectedTotal.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">
                {approvedParts.length} item(s) selected
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {categories.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="pt-6 text-center text-muted-foreground">
            No parts found for this vehicle
          </CardContent>
        </Card>
      ) : (
        categories.map((category) => (
          <div key={category} className="space-y-3">
            <h3 className="text-lg font-semibold text-white px-1">{category}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {groupedParts[category].map((part) => (
                <Card key={part.id} className="bg-card border-border overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex gap-3">
                      <Checkbox
                        checked={part.approved_by_mechanic}
                        onCheckedChange={() => togglePart(part.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{part.name}</h4>
                        {part.specifications && (
                          <p className="text-xs text-muted-foreground">{part.specifications}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xl font-bold text-btn-green">€{part.price_eur.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{part.supplier_name}</p>
                      </div>
                    </div>

                    {part.compatibility_notes && (
                      <p className="text-xs text-muted-foreground bg-muted rounded p-2">
                        {part.compatibility_notes}
                      </p>
                    )}

                    {part.purchase_link && (
                      <Button
                        asChild
                        size="sm"
                        className="w-full bg-btn-white hover:bg-btn-white/80 text-btn-white-foreground"
                      >
                        <a href={part.purchase_link} target="_blank" rel="noopener noreferrer">
                          Link to Part
                          <ExternalLink className="h-4 w-4 ml-2 mb-0.5" />
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-white">Add New Part</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add a new part to your vehicle's parts list
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-foreground">Part Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Hawk Brake Pads"
                className="bg-muted border-border text-white mt-1"
                required
              />
            </div>

            <div>
              <Label className="text-foreground">Category *</Label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-muted border border-border text-white rounded-md px-3 py-2 mt-1"
                required
              >
                <option value="Engine">Engine</option>
                <option value="Brake System">Brake System</option>
                <option value="Cooling System">Cooling System</option>
                <option value="Suspension">Suspension</option>
                <option value="Exhaust">Exhaust</option>
                <option value="Transmission">Transmission</option>
                <option value="Electrical">Electrical</option>
                <option value="Body">Body</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <Label className="text-foreground">Specifications</Label>
              <Textarea
                value={formData.specifications}
                onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                placeholder="Part specifications and details..."
                className="bg-muted border-border text-white mt-1 min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground">Supplier Name *</Label>
                <Input
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  placeholder="e.g., OEM Parts Supplier"
                  className="bg-muted border-border text-white mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-foreground">Price (EUR) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price_eur}
                  onChange={(e) => setFormData({ ...formData, price_eur: parseFloat(e.target.value) })}
                  placeholder="0.00"
                  className="bg-muted border-border text-white mt-1"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-foreground">Purchase Link</Label>
              <Input
                value={formData.purchase_link}
                onChange={(e) => setFormData({ ...formData, purchase_link: e.target.value })}
                placeholder="https://..."
                className="bg-muted border-border text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-foreground">Compatibility Notes</Label>
              <Textarea
                value={formData.compatibility_notes}
                onChange={(e) => setFormData({ ...formData, compatibility_notes: e.target.value })}
                placeholder="Compatibility information..."
                className="bg-muted border-border text-white mt-1 min-h-[60px]"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-btn-green hover:bg-btn-green/80 text-btn-green-foreground"
              >
                {isSubmitting ? 'Adding...' : 'Add Part'}
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
