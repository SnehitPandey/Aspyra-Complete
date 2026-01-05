import { useEffect, useState, useCallback } from 'react';
import { socketService } from '../services/socketService';

/**
 * Custom hook for managing shared duo streak with real-time Socket.IO updates
 * @param {string} partnerId - The partner's user ID
 * @returns {{
 *   streak: number,
 *   calendar: Object,
 *   loading: boolean,
 *   checkStreak: Function
 * }}
 */
export const useStreak = (partnerId) => {
  const [streak, setStreak] = useState(0);
  const [calendar, setCalendar] = useState({}); // { "2025-11-05": "completed", "2025-11-04": "missed" }
  const [loading, setLoading] = useState(true);

  /**
   * Manually trigger streak check via Socket.IO
   */
  const checkStreak = useCallback(() => {
    if (!partnerId) {
      console.warn('⚠️ Cannot check streak: No partner ID');
      return;
    }

    console.log('🔍 Triggering duo:checkDailyCompletion event');
    socketService.emit('duo:checkDailyCompletion', { duoId: `${partnerId}` });
  }, [partnerId]);

  useEffect(() => {
    if (!partnerId) {
      setLoading(false);
      return;
    }

    console.log('🎯 useStreak hook initialized for partner:', partnerId);

    // Fetch initial streak data from REST API
    const fetchStreakData = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/duo-streak`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch streak data');
        }

        const data = await response.json();
        
        if (data.success && data.data.exists) {
          setStreak(data.data.streak);
          setCalendar(data.data.calendar || {});
          console.log('✅ Initial streak data loaded:', data.data);
        }
      } catch (error) {
        console.error('❌ Failed to fetch initial streak data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStreakData();

    // Listen for real-time streak updates
    const handleStreakUpdate = (data) => {
      console.log('🔥 duo:streakUpdate received:', data);
      setStreak(data.streak);
      setCalendar(data.calendar || {});
    };

    const handleStreakBroken = (data) => {
      console.log('💔 duo:streakBroken received:', data);
      setStreak(0);
      setCalendar((prev) => ({
        ...prev,
        [data.date]: 'missed',
      }));
    };

    const handleStreakStatus = (data) => {
      console.log('ℹ️ duo:streakStatus received:', data);
      // Optionally show a notification that streak cannot be updated yet
    };

    // Subscribe to Socket.IO events
    socketService.on('duo:streakUpdate', handleStreakUpdate);
    socketService.on('duo:streakBroken', handleStreakBroken);
    socketService.on('duo:streakStatus', handleStreakStatus);

    console.log('👂 Listening for duo streak events...');

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up duo streak listeners');
      socketService.off('duo:streakUpdate', handleStreakUpdate);
      socketService.off('duo:streakBroken', handleStreakBroken);
      socketService.off('duo:streakStatus', handleStreakStatus);
    };
  }, [partnerId]);

  return {
    streak,
    calendar,
    loading,
    checkStreak,
  };
};
