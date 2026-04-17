import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import type { Message, Profile, MessageReaction } from '../types';

export interface MessageRow extends Message {
  author: Profile | null;
  reactions: MessageReaction[];
}

export function useMessages(locationId: string | null | undefined) {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!locationId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*, author:profiles!messages_author_id_fkey(*), reactions:message_reactions(*)')
      .eq('location_id', locationId)
      .is('archived_at', null)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    setMessages((data as unknown as MessageRow[]) ?? []);
    setLoading(false);
  }, [locationId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const post = useCallback(
    async (body: string, opts?: { pinned?: boolean; authorId: string }) => {
      if (!locationId || !opts?.authorId) throw new Error('missing locationId / authorId');
      const { error } = await supabase.from('messages').insert({
        location_id: locationId,
        author_id: opts.authorId,
        body,
        pinned: opts?.pinned ?? false,
      });
      if (error) throw error;
      await refresh();
    },
    [locationId, refresh]
  );

  const toggleReaction = useCallback(
    async (messageId: string, profileId: string, emoji: '👍' | '👀' | '✅') => {
      const { data: existing } = await supabase
        .from('message_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('profile_id', profileId)
        .eq('emoji', emoji)
        .maybeSingle();
      if (existing) {
        await supabase.from('message_reactions').delete().eq('id', (existing as any).id);
      } else {
        await supabase
          .from('message_reactions')
          .insert({ message_id: messageId, profile_id: profileId, emoji });
      }
      await refresh();
    },
    [refresh]
  );

  return { messages, loading, error, refresh, post, toggleReaction };
}
