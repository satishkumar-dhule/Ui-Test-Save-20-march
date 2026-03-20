import { useEffect, useState, useCallback, useRef } from "react";
import { StreamingUpdate, GeneratedContent, TaskAssignment } from "./types";

export interface EliteAgentConfig {
  id: string;
  name: string;
  role: string;
  status: string;
  currentTask?: string;
  specialization: string;
  yearsOfExperience: number;
  completedTasks: string[];
  performance: { tasksCompleted: number; successRate: number };
}

export interface UseAgentStreamOptions {
  onChunk?: (chunk: StreamingUpdate) => void;
  onComplete?: (contentId: string) => void;
  onError?: (error: Error) => void;
}

export function useAgentStream(
  contentId: string,
  options?: UseAgentStreamOptions,
) {
  const [progress, setProgress] = useState(0);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [chunks, setChunks] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!contentId) return;

    setIsStreaming(true);
    setError(null);

    const checkContent = async () => {
      try {
        const data = await fetch(`/api/agent/content/${contentId}`).then((r) =>
          r.json(),
        );
        if (data) {
          setContent(data);
          setProgress(data.streamedChunks?.length || 0);
          setChunks(data.streamedChunks || []);
          if (data.isComplete) {
            setIsStreaming(false);
            options?.onComplete?.(contentId);
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch content"),
        );
        options?.onError?.(
          err instanceof Error ? err : new Error("Failed to fetch content"),
        );
      }
    };

    const interval = setInterval(checkContent, 100);
    return () => clearInterval(interval);
  }, [contentId, options]);

  return { progress, content, chunks, isStreaming, error };
}

export function useAgentTeam() {
  const [agents, setAgents] = useState<EliteAgentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      const data = await fetch("/api/agent/team").then((r) => r.json());
      setAgents(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch agents"),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 5000);
    return () => clearInterval(interval);
  }, [fetchAgents]);

  return { agents, loading, error, refetch: fetchAgents };
}

export function useTaskQueue() {
  const [tasks, setTasks] = useState<TaskAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const data = await fetch("/api/agent/tasks").then((r) => r.json());
      setTasks(data);
    } catch {
      // Silent fail for background refresh
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 2000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  const submitTask = useCallback(
    async (task: {
      title: string;
      description: string;
      priority: "low" | "medium" | "high" | "critical";
      capabilities: string[];
    }) => {
      const response = await fetch("/api/agent/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });
      return response.json();
    },
    [],
  );

  return { tasks, loading, submitTask, refetch: fetchTasks };
}
