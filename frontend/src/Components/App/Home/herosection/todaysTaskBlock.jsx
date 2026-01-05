import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Users, Bell, Plus, PlayCircle, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { roomService } from "../../../../services/roomService";

const TodaysTaskBlock = ({ cardVariants, customIndex }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completedToday, setCompletedToday] = useState(0);
  const [totalToday, setTotalToday] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTodaysTasks = async () => {
      try {
        setLoading(true);
        const response = await roomService.getTodaysTasks();
        
        if (response.success && response.tasks) {
          // Get only first task for "Today's Task Block" feature
          const todaysMainTask = response.tasks.length > 0 ? response.tasks[0] : null;
          setTasks(todaysMainTask ? [todaysMainTask] : []);
          
          // Calculate completion stats
          const completed = response.tasks.filter(t => t.completed).length;
          setCompletedToday(completed);
          setTotalToday(Math.min(response.tasks.length, 5)); // Show max 5 tasks for the day
        }

        // Fetch user's rooms for smart reminders
        const roomsResponse = await roomService.getMyRooms();
        if (roomsResponse.success && roomsResponse.rooms) {
          calculateSmartReminders(roomsResponse.rooms);
        }
      } catch (error) {
        console.error('Failed to fetch today\'s tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTodaysTasks();
  }, []);

  const [smartReminders, setSmartReminders] = useState([]);
  const [progressStatus, setProgressStatus] = useState(null); // 'ahead', 'behind', 'on-track'

  const calculateSmartReminders = (rooms) => {
    const reminders = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let overallStatus = 'on-track';
    let maxDeviation = 0;

    rooms.forEach(room => {
      if (!room.roadmap || !room.roadmap.phases) return;

      // Calculate expected progress based on room dates
      let totalMilestones = 0;
      let completedMilestones = 0;
      let incompleteMilestones = [];

      room.roadmap.phases.forEach((phase, phaseIndex) => {
        phase.milestones.forEach((milestone, milestoneIndex) => {
          totalMilestones++;
          if (milestone.completed) {
            completedMilestones++;
          } else {
            incompleteMilestones.push({
              title: milestone.title,
              week: phaseIndex + 1,
              roomName: room.title,
              roomId: room.id
            });
          }
        });
      });

      // Check if user is behind schedule
      const roomStartDate = room.startDate ? new Date(room.startDate) : new Date(room.createdAt);
      const roomEndDate = room.endDate ? new Date(room.endDate) : new Date(roomStartDate.getTime() + (30 * 24 * 60 * 60 * 1000));
      
      const totalDuration = roomEndDate - roomStartDate;
      const elapsed = today - roomStartDate;
      const expectedProgress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
      const actualProgress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

      // Determine overall status based on biggest deviation
      const deviation = actualProgress - expectedProgress;
      if (Math.abs(deviation) > Math.abs(maxDeviation)) {
        maxDeviation = deviation;
        if (deviation < -10) {
          overallStatus = 'behind';
        } else if (deviation > 10) {
          overallStatus = 'ahead';
        } else {
          overallStatus = 'on-track';
        }
      }

      // Generate reminders based on progress
      if (actualProgress < expectedProgress - 10) {
        const backlogCount = Math.ceil((expectedProgress - actualProgress) / 100 * totalMilestones);
        const estimatedTime = backlogCount * 30; // Assuming 30 mins per milestone
        
        reminders.push({
          type: 'backlog',
          message: `You're behind in "${room.title}" — catch up on ${backlogCount} topic${backlogCount > 1 ? 's' : ''} (${estimatedTime} mins)`,
          roomId: room.id,
          priority: 'high'
        });
      }

      // Check for missed daily tasks (yesterday's incomplete tasks)
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (incompleteMilestones.length > 0 && actualProgress < expectedProgress) {
        reminders.push({
          type: 'missed',
          message: `You missed yesterday's task in "${room.title}" — complete "${incompleteMilestones[0].title}" today`,
          roomId: room.id,
          priority: 'medium'
        });
      }

      // Reminder for incomplete topics from current week
      if (incompleteMilestones.length > 0 && actualProgress >= expectedProgress - 10) {
        reminders.push({
          type: 'pending',
          message: `Don't forget: "${incompleteMilestones[0].title}" in "${room.title}" needs completion`,
          roomId: room.id,
          priority: 'low'
        });
      }
    });

    // Sort by priority and limit to top 2 reminders
    const sortedReminders = reminders
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, 2);

    setSmartReminders(sortedReminders);
    setProgressStatus(overallStatus);
  };

  const handleJoinRoom = () => {
    navigate('/joinroom');
  };

  const handleStartTask = (task) => {
    navigate(`/room/${task.roomId}`);
  };

  const completionPercentage = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  return (
    <motion.div
      custom={customIndex}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      className="lg:col-span-4 p-6 rounded-2xl border border-primary/40 bg-background/50 backdrop-blur-sm min-h-full"
      style={{
        boxShadow: '0 0 20px rgba(var(--color-primary-rgb), 0.15)'
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-3 h-3 bg-primary rounded-full"></div>
        <h2 className="text-xl font-bold text-primary">Today's Task Block</h2>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : tasks.length > 0 ? (
        <div className="space-y-3">
          {/* Main Task */}
          {tasks.map((task, index) => (
            <div key={task.id} className="space-y-3">
              {/* Task Title & Duration */}
              <div>
                <h3 className="text-lg font-bold text-text mb-0.5">
                  "Lesson {index + 1}: {task.title} - {task.estimatedHours * 60} mins"
                </h3>
                <p className="text-xs text-text/50">
                  Start button with timer + check-off system
                </p>
              </div>

              {/* Daily Quiz Section */}
              <div className="p-3 bg-primary/5 border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-primary" />
                    <div>
                      <h4 className="text-sm font-semibold text-primary">Daily Quiz Available</h4>
                      <p className="text-xs text-text/50">"5-question checkpoint quiz ready"</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate(`/room/${task.roomId}?tab=quiz`)}
                    className="text-xs text-primary hover:underline font-medium whitespace-nowrap"
                  >
                    Take Quiz →
                  </button>
                </div>
              </div>

              {/* Completion Meter */}
              <div className="text-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-text/80">Completion meter for the day</span>
                </div>
                <p className="text-xs text-text/50 mb-2">
                  {completedToday} of {totalToday} tasks completed
                </p>
              </div>

              {/* Resume with Group */}
              <div>
                <div className="flex items-start gap-2">
                  <Users size={16} className="mt-0.5 flex-shrink-0" style={{ color: '#51a2ff' }} />
                  <div>
                    <button 
                      onClick={() => navigate(`/room/${task.roomId}`)}
                      className="text-sm font-medium hover:underline"
                      style={{ color: '#51a2ff' }}
                    >
                      "Resume with your group" → 
                      {progressStatus === 'behind' && <span className="text-orange-500"> you are falling behind</span>}
                      {progressStatus === 'ahead' && <span className="text-green-500"> you are ahead of schedule</span>}
                      {progressStatus === 'on-track' && <span style={{ color: '#51a2ff' }}> you are on track</span>}
                    </button>
                    <p className="text-xs text-text/50 mt-0.5">
                      Join {task.roomName} room
                    </p>
                  </div>
                </div>
              </div>

              {/* Smart Reminders */}
              {smartReminders.length > 0 && (
                <div className="p-3 bg-orange-500/5 rounded-lg border-l-4 border-orange-500/50 border-t border-r border-b border-orange-500/20">
                  <div className="flex items-start gap-2">
                    <Bell size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-xs font-semibold text-orange-500 mb-1">
                        Smart reminders:
                      </h4>
                      <div className="space-y-0.5">
                        {smartReminders.map((reminder, idx) => (
                          <button
                            key={idx}
                            onClick={() => navigate(`/room/${reminder.roomId}`)}
                            className="text-xs text-text/70 hover:text-text/90 transition-colors text-left w-full block"
                          >
                            "{reminder.message}"
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <CheckCircle size={32} className="text-primary/50" />
            </div>
          </div>
          <h3 className="text-lg font-medium text-text mb-2">No Tasks Yet</h3>
          <p className="text-sm text-text/70 mb-6 max-w-md">
            Join a study room to see your daily tasks and collaborate with others
          </p>
          <button
            onClick={handleJoinRoom}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors font-medium"
          >
            <Plus size={20} />
            <span>Join a Room</span>
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default TodaysTaskBlock;
