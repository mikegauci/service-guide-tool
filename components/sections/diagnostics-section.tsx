'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { DiagnosticProcedure } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

interface DiagnosticsSectionProps {
  vehicleId: string;
}

interface DiagnosticWithState extends DiagnosticProcedure {
  expanded: boolean;
  notes: string;
}

export default function DiagnosticsSection({ vehicleId }: DiagnosticsSectionProps) {
  const [diagnostics, setDiagnostics] = useState<DiagnosticWithState[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSystem, setFilterSystem] = useState<string>('');

  useEffect(() => {
    loadDiagnostics();
  }, [vehicleId]);

  const loadDiagnostics = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('diagnostic_procedures')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('system', { ascending: true });

      if (error) throw error;

      const withState = (data || []).map((diagnostic) => ({
        ...diagnostic,
        expanded: false,
        notes: '',
      }));

      setDiagnostics(withState);
    } catch (error) {
      console.error('Error loading diagnostics:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (id: string) => {
    setDiagnostics(
      diagnostics.map((d) =>
        d.id === id ? { ...d, expanded: !d.expanded } : d
      )
    );
  };

  const updateNotes = (id: string, notes: string) => {
    setDiagnostics(
      diagnostics.map((d) =>
        d.id === id ? { ...d, notes } : d
      )
    );
  };

  const getFilteredDiagnostics = () => {
    if (!filterSystem) return diagnostics;
    return diagnostics.filter((d) => d.system === filterSystem);
  };

  const groupedDiagnostics = getFilteredDiagnostics().reduce(
    (acc, item) => {
      if (!acc[item.system]) {
        acc[item.system] = [];
      }
      acc[item.system].push(item);
      return acc;
    },
    {} as Record<string, DiagnosticWithState[]>
  );

  const systems = Object.keys(groupedDiagnostics).sort();

  if (loading) {
    return <div className="text-white">Loading diagnostic procedures...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-white">Diagnostic Procedures</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={filterSystem}
            onChange={(e) => setFilterSystem(e.target.value)}
            className="w-full bg-muted border border-border text-white rounded-md px-3 py-2 text-sm"
          >
            <option value="">All Systems</option>
            {systems.map((system) => (
              <option key={system} value={system}>
                {system}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {systems.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="pt-6 text-center text-muted-foreground">
            No diagnostic procedures found for this vehicle
          </CardContent>
        </Card>
      ) : (
        systems.map((system) => (
          <div key={system} className="space-y-2">
            <h3 className="text-lg font-semibold text-white px-1">{system}</h3>
            <div className="space-y-2">
              {groupedDiagnostics[system].map((diagnostic) => (
                <Card
                  key={diagnostic.id}
                  className="bg-card border-border overflow-hidden transition-colors"
                >
                  <div
                    className="p-4 flex gap-3 items-start cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleExpanded(diagnostic.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white">{diagnostic.title}</h4>
                      {diagnostic.description && (
                        <p className="text-sm text-muted-foreground mt-1">{diagnostic.description}</p>
                      )}
                    </div>
                    {diagnostic.expanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>

                  {diagnostic.expanded && (
                    <div className="border-t border-border p-4 space-y-4 bg-muted/50">
                      {diagnostic.steps && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                            Steps
                          </p>
                          <div className="text-sm text-foreground space-y-2 whitespace-pre-wrap">
                            {diagnostic.steps}
                          </div>
                        </div>
                      )}

                      {diagnostic.warnings && (
                        <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-md p-3 flex gap-3">
                          <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-yellow-400 uppercase">Warning</p>
                            <p className="text-sm text-yellow-300 mt-1 whitespace-pre-wrap">
                              {diagnostic.warnings}
                            </p>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase block mb-2">
                          Diagnostic Findings
                        </label>
                        <Textarea
                          placeholder="Record test results and findings..."
                          value={diagnostic.notes}
                          onChange={(e) => updateNotes(diagnostic.id, e.target.value)}
                          className="bg-muted border-border text-white text-sm min-h-[100px]"
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
