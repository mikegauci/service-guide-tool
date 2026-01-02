'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Part } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ExternalLink, Search } from 'lucide-react';

interface PartsSectionProps {
  vehicleId: string;
}

export default function PartsSection({ vehicleId }: PartsSectionProps) {
  const [parts, setParts] = useState<Part[]>([]);
  const [selectedParts, setSelectedParts] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);

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

  const togglePart = (partId: string) => {
    const newSelected = new Set(selectedParts);
    if (newSelected.has(partId)) {
      newSelected.delete(partId);
    } else {
      newSelected.add(partId);
    }
    setSelectedParts(newSelected);
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
  const selectedTotal = Array.from(selectedParts).reduce((sum, id) => {
    const part = parts.find((p) => p.id === id);
    return sum + (part?.price_eur || 0);
  }, 0);

  if (loading) {
    return <div className="text-white">Loading parts...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-white">Parts List & Purchasing</CardTitle>
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
              <p className="text-white font-semibold">
                Selected Total: €{selectedTotal.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedParts.size} item(s) selected
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
                        checked={selectedParts.has(part.id)}
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
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Buy Now
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
    </div>
  );
}
