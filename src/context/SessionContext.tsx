import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface SessionContextType {
    user: any;
    username: string | null;
    signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType>({
    user: null,
    username: null,
    signOut: async () => { },
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null);
    const [username, setUsername] = useState<string | null>(null);

    useEffect(() => {
        checkUser();
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            checkUser();
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const checkUser = async () => {
        console.log('Checking user');
        const { data: { user } } = await supabase.auth.getUser();
        console.log('user', user);
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
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <SessionContext.Provider value={{ user, username, signOut }}>
            {children}
        </SessionContext.Provider>
    );
}

export const useSession = () => useContext(SessionContext); 