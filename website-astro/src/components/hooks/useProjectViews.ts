import { useState, useEffect, useCallback } from 'react';

interface ProjectView {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  view_type: 'table' | 'board';
  config: string;
  is_default: number;
  created_at: string;
}

export function useProjectViews(projectId: string) {
  const [views, setViews] = useState<ProjectView[]>([]);
  const [activeView, setActiveView] = useState<ProjectView | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchViews = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/views`);
      if (res.ok) {
        const data = await res.json();
        setViews(data);
        // Auto-select default or first view
        if (data.length > 0 && !activeView) {
          const defaultView = data.find((v: ProjectView) => v.is_default === 1) || data[0];
          setActiveView(defaultView);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchViews();
  }, [fetchViews]);

  const selectView = useCallback((viewId: string) => {
    const view = views.find(v => v.id === viewId);
    if (view) {
      setActiveView(view);
    }
  }, [views]);

  const createView = useCallback(async (name: string, viewType: 'table' | 'board', config: object = {}) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/views`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, viewType, config }),
      });
      if (res.ok) {
        const created = await res.json();
        setViews(prev => [...prev, created]);
        setActiveView(created);
        return created;
      }
    } catch {
      // silent
    }
    return null;
  }, [projectId]);

  const updateView = useCallback(async (viewId: string, updates: { name?: string; config?: string; isDefault?: number }) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/views/${viewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        setViews(prev => prev.map(v => {
          if (v.id !== viewId) return v;
          return {
            ...v,
            ...(updates.name !== undefined && { name: updates.name }),
            ...(updates.config !== undefined && { config: updates.config }),
            ...(updates.isDefault !== undefined && { is_default: updates.isDefault }),
          };
        }));
        if (activeView?.id === viewId) {
          setActiveView(prev => prev ? {
            ...prev,
            ...(updates.name !== undefined && { name: updates.name }),
            ...(updates.config !== undefined && { config: updates.config }),
            ...(updates.isDefault !== undefined && { is_default: updates.isDefault }),
          } : null);
        }
      }
    } catch {
      // silent
    }
  }, [projectId, activeView]);

  const deleteView = useCallback(async (viewId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/views/${viewId}`, {
        method: 'DELETE',
      });
      if (res.ok || res.status === 204) {
        setViews(prev => prev.filter(v => v.id !== viewId));
        if (activeView?.id === viewId) {
          // Switch to default or first remaining view
          setActiveView(prev => {
            const remaining = views.filter(v => v.id !== viewId);
            return remaining.find(v => v.is_default === 1) || remaining[0] || null;
          });
        }
      }
    } catch {
      // silent
    }
  }, [projectId, activeView, views]);

  return {
    views,
    activeView,
    loading,
    selectView,
    createView,
    updateView,
    deleteView,
  };
}
