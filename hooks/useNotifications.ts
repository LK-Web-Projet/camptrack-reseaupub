import { useState, useEffect, useCallback } from 'react';

export interface Notification {
    id_notification: string;
    type: string;
    priority: string;
    user_id: string;
    entity_type: string;
    entity_id: string;
    title: string;
    message: string;
    action_url?: string;
    metadata?: any;
    is_read: boolean;
    read_at?: string;
    created_at: string;
}

interface UseNotificationsReturn {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/notifications?limit=20');

            if (!response.ok) {
                // Si erreur 500 ou 401, on suppose que c'est un problème de session/auth
                // On ne lance pas d'erreur critique pour ne pas spammer la console
                if (response.status === 500 || response.status === 401) {
                    console.warn('Impossible de récupérer les notifications (Session possiblement expirée ou erreur serveur)');
                    setNotifications([]);
                    return;
                }
                throw new Error(`Failed to fetch notifications: ${response.status}`);
            }

            const data = await response.json();
            setNotifications(data.notifications);
            setUnreadCount(data.unread_count);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            // On utilise warn au lieu de error pour ne pas spammer la console
            console.warn('Error fetching notifications:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const markAsRead = async (id: string) => {
        try {
            // Optimistic update
            setNotifications(prev =>
                prev.map(n => n.id_notification === id ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));

            const response = await fetch(`/api/notifications/${id}/read`, {
                method: 'PUT'
            });

            if (!response.ok) {
                throw new Error('Failed to mark notification as read');
            }
        } catch (err) {
            console.error('Error marking notification as read:', err);
            // Revert on error (could be improved)
            fetchNotifications();
        }
    };

    const markAllAsRead = async () => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);

            const response = await fetch('/api/notifications/read-all', {
                method: 'PUT'
            });

            if (!response.ok) {
                throw new Error('Failed to mark all notifications as read');
            }
        } catch (err) {
            console.error('Error marking all notifications as read:', err);
            fetchNotifications();
        }
    };

    useEffect(() => {
        fetchNotifications();

        // Optional: Poll for new notifications every minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    return {
        notifications,
        unreadCount,
        loading,
        error,
        refresh: fetchNotifications,
        markAsRead,
        markAllAsRead
    };
}