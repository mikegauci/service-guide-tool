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
      <Card className="bg-slate-700 border-slate-600">
        <CardHeader>
          <CardTitle className="text-white">Diagnostic Procedures</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={filterSystem}
            onChange={(e) => setFilterSystem(e.target.value)}
            className="w-full bg-slate-600 border border-slate-500 text-white rounded-md px-3 py-2 text-sm"
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
        <Card className="bg-slate-700 border-slate-600">
          <CardContent className="pt-6 text-center text-slate-400">
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
                  className="bg-slate-700 border-slate-600 overflow-hidden transition-colors"
                >
                  <div
                    className="p-4 flex gap-3 items-start cursor-pointer hover:bg-slate-600/50"
                    onClick={() => toggleExpanded(diagnostic.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-white">{diagnostic.title}</h4>
                      {diagnostic.description && (
                        <p className="text-sm text-slate-400 mt-1">{diagnostic.description}</p>
                      )}
                    </div>
                    {diagnostic.expanded ? (
                      <ChevronUp className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    )}
                  </div>

                  {diagnostic.expanded && (
                    <div className="border-t border-slate-600 p-4 space-y-4 bg-slate-800/50">
                      {diagnostic.steps && (
                        <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase mb-2">
                            Steps
                          </p>
                          <div className="text-sm text-slate-300 space-y-2 whitespace-pre-wrap">
                            {diagnostic.steps}
                          </div>
                        </div>
                      )}

                      {diagnostic.warnings && (
                        <div className="bg-yellow-500/10 border border-yellow-600 rounded-md p-3 flex gap-3">
                          <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-yellow-500 uppercase">Warning</p>
                            <p className="text-sm text-yellow-400 mt-1 whitespace-pre-wrap">
                              {diagnostic.warnings}
                            </p>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase block mb-2">
                          Diagnostic Findings
                        </label>
                        <Textarea
                          placeholder="Record test results and findings..."
                          value={diagnostic.notes}
                          onChange={(e) => updateNotes(diagnostic.id, e.target.value)}
                          className="bg-slate-700 border-slate-600 text-white text-sm min-h-[100px]"
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
