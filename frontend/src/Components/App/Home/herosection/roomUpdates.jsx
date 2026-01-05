import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { notificationService } from "../../../../services/notificationService";

const RoomUpdates = ({ cardVariants, customIndex }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await notificationService.getNotifications({ limit: 10 });
        if (response.notifications) {
          // Filter for room-related notifications only AND unread
          const roomNotifications = response.notifications.filter(notif => 
            !notif.read && (
              notif.type === 'ROOM_INVITE' || 
              notif.type === 'ROOM_JOINED' || 
              notif.type === 'NOTE_UPLOADED' ||
              notif.type === 'TASK_ASSIGNED' ||
              notif.type === 'GROUP_ASSIGNED' ||
              notif.type === 'QUIZ_GENERATED'
            )
          );
          setNotifications(roomNotifications.slice(0, 3)); // Show max 3 updates
        } else {
          setNotifications([]);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ROOM_INVITE':
      case 'ROOM_JOINED':
        return '👥';
      case 'NOTE_UPLOADED':
        return '📝';
      case 'TASK_ASSIGNED':
        return '✅';
      case 'GROUP_ASSIGNED':
        return '🎯';
      case 'QUIZ_GENERATED':
        return '📋';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'ROOM_INVITE':
      case 'ROOM_JOINED':
        return 'text-green-400';
      case 'NOTE_UPLOADED':
        return 'text-blue-400';
      case 'TASK_ASSIGNED':
        return 'text-orange-400';
      case 'GROUP_ASSIGNED':
        return 'text-purple-400';
      case 'QUIZ_GENERATED':
        return 'text-yellow-400';
      default:
        return 'text-primary';
    }
  };

  const formatNotificationMessage = (notification) => {
    // Format the message to be concise
    if (notification.message) {
      return notification.message.length > 80 
        ? notification.message.substring(0, 80) + '...' 
        : notification.message;
    }
    return notification.title;
  };

  const handleClearAll = async () => {
    try {
      // Mark all as read
      await notificationService.markAllAsRead();
      // Clear local state
      setNotifications([]);
    } catch (err) {
      console.error('Failed to clear room updates:', err);
    }
  };

  return (
    <motion.div
      custom={customIndex}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      className="p-4 rounded-2xl border border-primary/30 bg-background/50 min-h-full"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-medium text-primary">Updates about rooms</h3>
        {notifications.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs text-red-400 hover:text-red-300 font-medium"
          >
            Clear
          </button>
        )}
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((notification, idx) => (
            <div
              key={notification._id || notification.id || idx}
              className="p-2 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-2">
                <span className="text-lg flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notification.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${getNotificationColor(notification.type)}`}>
                    {formatNotificationMessage(notification)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-text/70">No room updates yet</p>
          <p className="text-xs text-text/50 mt-1">Check back later for activity in your rooms</p>
        </div>
      )}
    </motion.div>
  );
};

export default RoomUpdates;
