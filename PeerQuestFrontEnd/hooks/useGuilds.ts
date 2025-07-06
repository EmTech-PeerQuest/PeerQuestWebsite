import { useState, useEffect, useCallback } from 'react';
import { guildApi } from '@/lib/api/guilds';
import type { Guild, GuildMembership, GuildJoinRequest, CreateGuildData } from '@/lib/types';

interface UseGuildsOptions {
  autoFetch?: boolean;
  search?: string;
  specialization?: string;
  max_level?: number;
}

interface UseGuildsReturn {
  guilds: Guild[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  searchGuilds: (params: { search?: string; specialization?: string; max_level?: number }) => Promise<void>;
}

export function useGuilds(options: UseGuildsOptions = {}): UseGuildsReturn {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGuilds = useCallback(async (params?: {
    search?: string;
    specialization?: string;
    max_level?: number;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await guildApi.getGuilds(params);
      setGuilds(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch guilds');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchGuilds({
        search: options.search,
        specialization: options.specialization,
        max_level: options.max_level,
      });
    }
  }, [fetchGuilds, options.autoFetch, options.search, options.specialization, options.max_level]);

  return {
    guilds,
    loading,
    error,
    refetch: () => fetchGuilds(),
    searchGuilds: fetchGuilds,
  };
}

interface UseGuildDetailReturn {
  guild: Guild | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useGuildDetail(guildId: string | null): UseGuildDetailReturn {
  const [guild, setGuild] = useState<Guild | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGuild = useCallback(async () => {
    if (!guildId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await guildApi.getGuildDetail(guildId);
      setGuild(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch guild');
    } finally {
      setLoading(false);
    }
  }, [guildId]);

  useEffect(() => {
    fetchGuild();
  }, [fetchGuild]);

  return {
    guild,
    loading,
    error,
    refetch: fetchGuild,
  };
}

interface UseMyGuildsReturn {
  myGuilds: Guild[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMyGuilds(): UseMyGuildsReturn {
  const [myGuilds, setMyGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMyGuilds = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await guildApi.getMyGuilds();
      setMyGuilds(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch your guilds');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyGuilds();
  }, [fetchMyGuilds]);

  return {
    myGuilds,
    loading,
    error,
    refetch: fetchMyGuilds,
  };
}

interface UseGuildMembersReturn {
  members: GuildMembership[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useGuildMembers(guildId: string | null): UseGuildMembersReturn {
  const [members, setMembers] = useState<GuildMembership[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!guildId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await guildApi.getGuildMembers(guildId);
      setMembers(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch guild members');
    } finally {
      setLoading(false);
    }
  }, [guildId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return {
    members,
    loading,
    error,
    refetch: fetchMembers,
  };
}

interface UseGuildActionsReturn {
  createGuild: (guildData: CreateGuildData) => Promise<Guild>;
  updateGuild: (guildId: string, guildData: Partial<CreateGuildData>) => Promise<Guild>;
  deleteGuild: (guildId: string) => Promise<void>;
  joinGuild: (guildId: string, message?: string) => Promise<any>;
  leaveGuild: (guildId: string) => Promise<any>;
  processJoinRequest: (guildId: string, requestId: number, action: 'approve' | 'reject') => Promise<any>;
  kickMember: (guildId: string, userId: number) => Promise<any>;
  loading: boolean;
  error: string | null;
}

export function useGuildActions(): UseGuildActionsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeAction = useCallback(async <T>(action: () => Promise<T>): Promise<T> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await action();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createGuild: (guildData: CreateGuildData) => 
      executeAction(() => guildApi.createGuild(guildData)),
    
    updateGuild: (guildId: string, guildData: Partial<CreateGuildData>) => 
      executeAction(() => guildApi.updateGuild(guildId, guildData)),
    
    deleteGuild: (guildId: string) => 
      executeAction(() => guildApi.deleteGuild(guildId)),
    
    joinGuild: (guildId: string, message?: string) => 
      executeAction(() => guildApi.joinGuild(guildId, message)),
    
    leaveGuild: (guildId: string) => 
      executeAction(() => guildApi.leaveGuild(guildId)),
    
    processJoinRequest: (guildId: string, requestId: number, action: 'approve' | 'reject') => 
      executeAction(() => guildApi.processJoinRequest(guildId, requestId, action)),
    
    kickMember: (guildId: string, userId: number) => 
      executeAction(() => guildApi.kickMember(guildId, userId)),
    
    loading,
    error,
  };
}
