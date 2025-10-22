import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface SessionContextType {
    user: any;
    username: string | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType>({
    user: null,
    username: null,
    loading: true,
    signOut: async () => { },
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null);
    const [username, setUsername] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        checkUser();
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            checkUser();
        });

        return () => {
            try {
                // authListener may be undefined in some environments
                // and subscription may not exist; guard against that to avoid crashes
                // when cleaning up the listener.
                (authListener as any)?.subscription?.unsubscribe?.();
            } catch (e) {
                console.warn('Error unsubscribing auth listener', e);
            }
        };
    }, []);

    const checkUser = async () => {
        setLoading(true);
        try {
            const res = await supabase.auth.getUser();
            const user = res?.data?.user ?? null;
            if (user) {
                setUser(user);
            const { data: profile } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', user.id)
                .single();
            setUsername(profile?.username || null);
        } else {
            setUser(null);
            setUsername(null);
        }
        } catch (error) {
            console.warn('Error checking user session', error);
            setUser(null);
            setUsername(null);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <SessionContext.Provider value={{ user, username, loading, signOut }}>
            {children}
        </SessionContext.Provider>
    );
}

export const useSession = () => useContext(SessionContext); 