/**
 * NotificationContext
 *
 * Manages notification state and operations:
 * - Loading notifications
 * - Marking as read
 * - Polling for new notifications
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';

const NotificationContext = createContext(null);

// API base URL
const API_BASE = process.env.REACT_APP_TRADING_API_URL || 'http://localhost:8002';

// Actions
const ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  SET_UNREAD_COUNT: 'SET_UNREAD_COUNT',
  MARK_AS_READ: 'MARK_AS_READ',
  MARK_ALL_READ: 'MARK_ALL_READ',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  SET_ERROR: 'SET_ERROR',
};

// Initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
  total: 0,
  loading: false,
  error: null,
};

// Reducer
function notificationReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };

    case ACTIONS.SET_NOTIFICATIONS:
      return {
        ...state,
        notifications: action.payload.notifications,
        total: action.payload.total,
        unreadCount: action.payload.unread_count,
        loading: false,
        error: null,
      };

    case ACTIONS.SET_UNREAD_COUNT:
      return { ...state, unreadCount: action.payload };

    case ACTIONS.MARK_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };

    case ACTIONS.MARK_ALL_READ:
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
      };

    case ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1,
        total: state.total + 1,
      };

    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };

    default:
      return state;
  }
}

export function NotificationProvider({ children, user }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const pollIntervalRef = useRef(null);
  const userId = user?.id;

  // Load notifications
  const loadNotifications = useCallback(async (limit = 20) => {
    if (!userId) return;

    dispatch({ type: ACTIONS.SET_LOADING, payload: true });

    try {
      const response = await fetch(
        `${API_BASE}/notifications?user_id=${userId}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error('Failed to load notifications');
      }

      const data = await response.json();
      dispatch({ type: ACTIONS.SET_NOTIFICATIONS, payload: data });
    } catch (err) {
      console.error('Error loading notifications:', err);
      dispatch({ type: ACTIONS.SET_ERROR, payload: err.message });
    }
  }, [userId]);

  // Load unread count only (for polling)
  const loadUnreadCount = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(
        `${API_BASE}/notifications/unread-count?user_id=${userId}`
      );

      if (response.ok) {
        const data = await response.json();
        dispatch({ type: ACTIONS.SET_UNREAD_COUNT, payload: data.unread_count });
      }
    } catch (err) {
      // Silently fail on polling errors
      console.debug('Error polling unread count:', err);
    }
  }, [userId]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId) => {
    if (!userId) return;

    try {
      const response = await fetch(
        `${API_BASE}/notifications/${notificationId}/read?user_id=${userId}`,
        { method: 'POST' }
      );

      if (response.ok) {
        dispatch({ type: ACTIONS.MARK_AS_READ, payload: notificationId });
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, [userId]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(
        `${API_BASE}/notifications/mark-all-read?user_id=${userId}`,
        { method: 'POST' }
      );

      if (response.ok) {
        dispatch({ type: ACTIONS.MARK_ALL_READ });
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }, [userId]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    if (!userId) return;

    try {
      const response = await fetch(
        `${API_BASE}/notifications/${notificationId}?user_id=${userId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        // Reload notifications after delete
        loadNotifications();
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, [userId, loadNotifications]);

  // Initial load
  useEffect(() => {
    if (userId) {
      loadNotifications();
    }
  }, [userId, loadNotifications]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (userId) {
      pollIntervalRef.current = setInterval(() => {
        loadUnreadCount();
      }, 30000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [userId, loadUnreadCount]);

  const value = {
    ...state,
    loadNotifications,
    loadUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export default NotificationContext;
