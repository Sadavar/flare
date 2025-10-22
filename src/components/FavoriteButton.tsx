import React, { useEffect, useState } from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { CustomText } from '@/components/CustomText';
import { useSession } from '@/context/SessionContext';
import { useQueryClient } from '@tanstack/react-query';
import { toggleFavorite as apiToggle } from '@/lib/favorites';
import { theme } from '@/context/ThemeContext';

type Props = {
    brandId: number;
    initialFavorited?: boolean;
    onChange?: (favorited: boolean) => void;
    onRequireAuth?: () => void;
    disabled?: boolean;
    style?: any;
}

export default function FavoriteButton({ brandId, initialFavorited = false, onChange, onRequireAuth, disabled = false, style }: Props) {
    const { user } = useSession();
    const queryClient = useQueryClient();
    const [favorited, setFavorited] = useState<boolean>(initialFavorited);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        setFavorited(initialFavorited);
    }, [initialFavorited]);

    const handlePress = async () => {
        if (disabled || loading) return;
        if (!user?.id) {
            onRequireAuth?.();
            return;
        }

        const prev = favorited;
        setFavorited(!prev); // optimistic
        setLoading(true);

        try {
            const res = await apiToggle(user.id, brandId);
            setFavorited(res.favorited);
            onChange?.(res.favorited);

            // Invalidate favorites cache for this user so profile/list views refresh
            try {
                queryClient.invalidateQueries({ queryKey: ['favorites', user.id] });
            } catch (e) {
                // non-fatal
                console.warn('Failed to invalidate favorites query', e);
            }

        } catch (err) {
            // rollback
            setFavorited(prev);
            console.error('Favorite toggle failed', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <TouchableOpacity
            style={[styles.button, favorited ? styles.favorited : null, style]}
            onPress={handlePress}
            disabled={disabled || loading}
            accessibilityLabel={favorited ? 'Favorited' : 'Favorite'}
        >
            {loading ? (
                <ActivityIndicator size="small" color="#fff" />
            ) : (
                <CustomText style={styles.text}>{favorited ? 'Favorited' : 'Favorite'}</CustomText>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 10,
        alignItems: 'center',
        marginBottom: 16,
        borderRadius: 12,
    },
    favorited: {
        opacity: 1,
    },
    text: {
        fontSize: 16,
        fontWeight: '500',
        color: '#fff',
    }
});
