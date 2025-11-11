import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AvailableUser {
  id: string;
  full_name: string;
  roles: string[];
}

export const useAvailableUsers = () => {
  const { user, profile } = useAuth();
  const [users, setUsers] = useState<AvailableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      console.log('🔍 [useAvailableUsers] ========== FETCH STARTED ==========');
      console.log('🔍 [useAvailableUsers] Current user:', user);
      console.log('🔍 [useAvailableUsers] Current user ID:', user?.id);
      console.log('🔍 [useAvailableUsers] Current profile:', profile);

      // Set timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.log('⏱️ [useAvailableUsers] TIMEOUT - Request took too long');
        setLoading(false);
        setError('Request timed out. Please try again.');
      }, 5000);

      try {
        // SIMPLIFIED QUERY: Get ALL profiles except current user (if logged in)
        console.log('📡 [useAvailableUsers] Fetching profiles from database...');
        
        let query = supabase
          .from('profiles')
          .select('id, full_name');
        
        // Only filter out current user if logged in
        if (user?.id) {
          console.log('🔍 [useAvailableUsers] Filtering out current user:', user.id);
          query = query.neq('id', user.id);
        } else {
          console.log('⚠️ [useAvailableUsers] No user logged in - showing ALL users');
        }

        const { data: profiles, error: profilesError } = await query;

        console.log('📡 [useAvailableUsers] Supabase response received');
        console.log('✅ [useAvailableUsers] Raw profiles data:', profiles);
        console.log('❌ [useAvailableUsers] Profiles error:', profilesError);

        if (profilesError) {
          console.error('❌ [useAvailableUsers] ERROR fetching profiles:', profilesError);
          throw profilesError;
        }

        if (!profiles || profiles.length === 0) {
          console.log('⚠️ [useAvailableUsers] No profiles returned from database');
          console.log('⚠️ [useAvailableUsers] This means: Either no other users exist, or RLS is blocking access');
          setUsers([]);
          setError(null);
          clearTimeout(timeoutId);
          setLoading(false);
          return;
        }

        console.log('✅ [useAvailableUsers] Found', profiles.length, 'profile(s)');

        // Get roles for each profile
        console.log('📡 [useAvailableUsers] Fetching user roles...');
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', profiles.map(p => p.id));

        console.log('✅ [useAvailableUsers] User roles data:', userRoles);
        console.log('❌ [useAvailableUsers] Roles error:', rolesError);

        if (rolesError) {
          console.error('❌ [useAvailableUsers] ERROR fetching roles:', rolesError);
          // Don't throw - we can still show users without roles
        }

        // Combine profiles with their roles
        const usersWithRoles = profiles.map(profile => {
          const roles = userRoles
            ?.filter(ur => ur.user_id === profile.id)
            .map(ur => ur.role) || [];
          
          console.log(`👤 [useAvailableUsers] User ${profile.full_name} (${profile.id}): roles =`, roles);
          
          return {
            id: profile.id,
            full_name: profile.full_name,
            roles,
          };
        });

        console.log('✅ [useAvailableUsers] Final users list:', usersWithRoles);
        console.log('✅ [useAvailableUsers] Total users to display:', usersWithRoles.length);
        
        setUsers(usersWithRoles);
        setError(null);
        clearTimeout(timeoutId);
        setLoading(false);
      } catch (error) {
        console.error('❌ [useAvailableUsers] CATCH ERROR:', error);
        setError('Failed to load users');
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user, profile]);

  return { users, loading, error };
};
