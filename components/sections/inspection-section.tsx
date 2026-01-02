'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { InspectionTemplate } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface InspectionSectionProps {
  vehicleId: string;
}

interface InspectionWithState extends InspectionTemplate {
  completed: boolean;
  notes: string;
  expanded: boolean;
}

export default function InspectionSection({ vehicleId }: InspectionSectionProps) {
  const [inspections, setInspections] = useState<InspectionWithState[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('');

  useEffect(() => {
    loadInspections();
  }, [vehicleId]);

  const loadInspections = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inspection_templates')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('category', { ascending: true });

      if (error) throw error;

      const withState = (data || []).map((inspection) => ({
        ...inspection,
        completed: false,
        notes: '',
        expanded: false,
      }));

      setInspections(withState);
    } catch (error) {
      console.error('Error loading inspections:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleInspection = (id: string) => {
    setInspections(
      inspections.map((i) =>
        i.id === id ? { ...i, completed: !i.completed } : i
      )
    );
  };

  const updateNotes = (id: string, notes: string) => {
    setInspections(
      inspections.map((i) =>
        i.id === id ? { ...i, notes } : i
      )
    );
  };

  const toggleExpanded = (id: string) => {
    setInspections(
      inspections.map((i) =>
        i.id === id ? { ...i, expanded: !i.expanded } : i
      )
    );
  };

  const getFilteredInspections = () => {
    if (!filterCategory) return inspections;
    return inspections.filter((i) => i.category === filterCategory);
  };

  const groupedInspections = getFilteredInspections().reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, InspectionWithState[]>
  );

  const categories = Object.keys(groupedInspections).sort();
  const completedCount = inspections.filter((i) => i.completed).length;
  const totalCount = inspections.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (loading) {
    return <div className="text-white">Loading inspection checklist...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-700 border-slate-600">
        <CardHeader>
          <CardTitle className="text-white">Inspection Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/2">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-400">Progress</span>
                <span className="text-sm font-semibold text-white">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-slate-600 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Completed</p>
              <p className="text-2xl font-bold text-white">
                {completedCount}/{totalCount}
              </p>
            </div>
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full bg-slate-600 border border-slate-500 text-white rounded-md px-3 py-2 text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {categories.length === 0 ? (
        <Card className="bg-slate-700 border-slate-600">
          <CardContent className="pt-6 text-center text-slate-400">
            No inspection items found for this vehicle
          </CardContent>
        </Card>
      ) : (
        categories.map((category) => (
          <div key={category} className="space-y-2">
            <h3 className="text-lg font-semibold text-white px-1">{category}</h3>
            <div className="space-y-2">
              {groupedInspections[category].map((item) => (
                <Card
                  key={item.id}
                  className="bg-slate-700 border-slate-600 overflow-hidden transition-colors"
                >
                  <div
                    className="p-4 flex gap-3 items-start cursor-pointer hover:bg-slate-600/50"
                    onClick={() => toggleExpanded(item.id)}
                  >
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={() => toggleInspection(item.id)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4
                            className={`font-semibold ${
                              item.completed ? 'text-slate-400 line-through' : 'text-white'
                            }`}
                          >
                            {item.title}
                          </h4>
                          {item.description && (
                            <p className="text-sm text-slate-400 mt-1">{item.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {item.is_priority && (
                            <Badge variant="destructive" className="text-xs">
                              Priority
                            </Badge>
                          )}
                          {item.expanded ? (
                            <ChevronUp className="h-4 w-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {item.expanded && (
                    <div className="border-t border-slate-600 p-4 space-y-4 bg-slate-800/50">
                      {item.specifications && (
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase">
                            Specifications
                          </p>
                          <p className="text-sm text-slate-300 mt-1">{item.specifications}</p>
                        </div>
                      )}

                      <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase block mb-2">
                          Inspection Notes
                        </label>
                        <Textarea
                          placeholder="Document findings here..."
                          value={item.notes}
                          onChange={(e) => updateNotes(item.id, e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white text-sm min-h-[80px]"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
