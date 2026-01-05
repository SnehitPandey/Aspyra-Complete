// Components/room/room.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";

import ErrorBoundary from "../../Components/ErrorBoundary";
import RoomHeader from "../../Components/App/room/roomHeader";
import RoomContent from "../../Components/App/room/roomContent";
import ChatModal from "../../Components/App/room/chatModal";
import SettingsModal from "../../Components/App/room/settingsModal";
import RoomOverlay from "../../Components/App/room/roomOverlay";
import { roomService } from "../../services/roomService";
import { chatService } from "../../services/chatService";
import { socketService } from "../../services/socketService";
import { usePresence } from "../../hooks/usePresence";
import { useDiscordPresence } from "../../hooks/useDiscordPresence";
import { distributeMilestonesAcrossTimeline } from "../../utils/roadmapTimelineUtils";
import { generateTodaysTasks } from "../../utils/taskGenerator";

const Room = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    
    // State management
    const [activeView, setActiveView] = useState("progress");
    const [showSettings, setShowSettings] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [showMembers, setShowMembers] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);
    const [overlayContent, setOverlayContent] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    
    // Room data state
    const [roomData, setRoomData] = useState(null);
    const [members, setMembers] = useState([]);
    // Track online presence list separately from full members list
    const [onlineMembers, setOnlineMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    
    // Mobile detection
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 720);
    
    // Get current user info
    const [currentUser, setCurrentUser] = useState(null);
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setCurrentUser(user);
    }, []);
    
    // Create a refetch function that can be called to refresh room data
    const refetchRoomData = async () => {
        if (!roomId) return;
        
        try {
            console.log('🔄 Refetching room data...');
            const response = await roomService.getRoom(roomId);
            
            if (response.success && response.room) {
                const room = response.room;
                const membersList = room.members || [];
                
                // Calculate days remaining based on actual end date
                const today = new Date();
                let daysRemaining = 30; // Default fallback
                
                if (room.endDate) {
                    const endDate = new Date(room.endDate);
                    const timeDiff = endDate.getTime() - today.getTime();
                    daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
                } else if (room.startDate) {
                    const startDate = new Date(room.startDate);

                    if (room.roadmap && Array.isArray(room.roadmap.phases) && room.roadmap.phases.length > 0) {
                        const estimatedDays = room.roadmap.phases.length * 7;
                        const estimatedEnd = new Date(startDate);
                        estimatedEnd.setDate(estimatedEnd.getDate() + estimatedDays);
                        const timeDiff = estimatedEnd.getTime() - today.getTime();
                        daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
                    } else {
                        const estimatedEnd = new Date(startDate);
                        estimatedEnd.setDate(estimatedEnd.getDate() + 30);
                        const timeDiff = estimatedEnd.getTime() - today.getTime();
                        daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
                    }
                } else {
                    const createdDate = new Date(room.createdAt);
                    const daysPassed = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));
                    daysRemaining = Math.max(0, 30 - daysPassed);
                }
                
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                const activeUsers = membersList.filter(member => {
                    if (member.progress && member.progress.lastActivity) {
                        return new Date(member.progress.lastActivity) >= sevenDaysAgo;
                    }
                    return new Date(member.joinedAt) >= sevenDaysAgo;
                }).length;
                
                const completionRate = room.averageProgress || 0;
                
                let processedRoadmap = room.roadmap || null;
                if (processedRoadmap && processedRoadmap.phases && processedRoadmap.phases.length > 0) {
                    const hasExistingDates = processedRoadmap.phases.some(phase =>
                        phase.milestones.some(m => m.startDate || m.endDate)
                    );
                    
                    if (!hasExistingDates) {
                        const totalDays = room.durationDays || 30;
                        const startDate = room.startDate ? new Date(room.startDate) : new Date();
                        const allMilestones = processedRoadmap.phases.flatMap(phase => phase.milestones);
                        const distributedMilestones = distributeMilestonesAcrossTimeline(
                            allMilestones,
                            totalDays,
                            startDate
                        );
                        
                        let milestoneIndex = 0;
                        processedRoadmap = {
                            ...processedRoadmap,
                            phases: processedRoadmap.phases.map(phase => ({
                                ...phase,
                                milestones: phase.milestones.map(() => {
                                    const distributed = distributedMilestones[milestoneIndex];
                                    milestoneIndex++;
                                    return distributed;
                                })
                            }))
                        };
                    }
                }
                
                setRoomData({
                    id: room.id,
                    name: room.title,
                    description: room.description,
                    tags: room.tags || [],
                    code: room.code,
                    status: room.status,
                    hostId: room.hostId,
                    maxSeats: room.maxSeats,
                    memberCount: membersList.length,
                    createdAt: room.createdAt,
                    daysRemaining: daysRemaining,
                    activeUsers: activeUsers,
                    completionRate: Math.min(completionRate, 100),
                    roadmap: processedRoadmap,
                });
                
                setMembers(membersList);
                console.log('✅ Room data refetched successfully');
            }
        } catch (err) {
            console.error('❌ Failed to refetch room data:', err);
        }
    };
    
    // Real-time presence hooks
    const { updateActivity: legacyUpdateActivity, setIdle: legacySetIdle } = usePresence(currentUser?.id);
    
    // Discord-style presence system
    const {
        presenceMap,
        isInitialized: presenceInitialized,
        updateActivity: updatePresenceActivity,
        setIdle: setPresenceIdle,
        isUserOnline,
        getUserPresence,
        getStatusColor,
        getStatusEmoji,
    } = useDiscordPresence(currentUser);

    // Effect for window resize detection
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 720;
            setIsMobile(mobile);
            
            if (!mobile) {
                setShowOverlay(false);
            } else {
                setShowMembers(false);
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();
        
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch room data on mount
    useEffect(() => {
        const fetchRoomData = async () => {
            try {
                setIsLoading(true);
                const response = await roomService.getRoom(roomId);
                
                if (response.success && response.room) {
                    const room = response.room;
                    const membersList = room.members || [];
                    
                    // Calculate days remaining based on actual end date
                    const today = new Date();
                    let daysRemaining = 30; // Default fallback
                    
                    if (room.endDate) {
                        // Use actual end date if available
                        const endDate = new Date(room.endDate);
                        const timeDiff = endDate.getTime() - today.getTime();
                        daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
                    } else if (room.startDate) {
                        // Fallback: Calculate from start date + 30 days
                        const startDate = new Date(room.startDate);

                        // If a roadmap exists, estimate end date from roadmap phases (1 phase ~= 1 week)
                        if (room.roadmap && Array.isArray(room.roadmap.phases) && room.roadmap.phases.length > 0) {
                            const estimatedDays = room.roadmap.phases.length * 7;
                            const estimatedEnd = new Date(startDate);
                            estimatedEnd.setDate(estimatedEnd.getDate() + estimatedDays);
                            const timeDiff = estimatedEnd.getTime() - today.getTime();
                            daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
                        } else {
                            const estimatedEnd = new Date(startDate);
                            estimatedEnd.setDate(estimatedEnd.getDate() + 30);
                            const timeDiff = estimatedEnd.getTime() - today.getTime();
                            daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
                        }
                    } else {
                        // Last resort: Use creation date + 30 days
                        const createdDate = new Date(room.createdAt);
                        const daysPassed = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));
                        daysRemaining = Math.max(0, 30 - daysPassed);
                    }
                    
                    // Calculate active users (users who have been active in last 7 days)
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    const activeUsers = membersList.filter(member => {
                        if (member.progress && member.progress.lastActivity) {
                            return new Date(member.progress.lastActivity) >= sevenDaysAgo;
                        }
                        // If no activity data, count as active if joined recently
                        return new Date(member.joinedAt) >= sevenDaysAgo;
                    }).length;
                    
                    // Use room's averageProgress as the primary completion rate
                    const completionRate = room.averageProgress || 0;
                    
                    // ✨ Apply timeline distribution to roadmap if it exists
                    let processedRoadmap = room.roadmap || null;
                    if (processedRoadmap && processedRoadmap.phases && processedRoadmap.phases.length > 0) {
                        // Check if milestones already have dates
                        const hasExistingDates = processedRoadmap.phases.some(phase =>
                            phase.milestones.some(m => m.startDate || m.endDate)
                        );
                        
                        // If no dates exist (old roadmap), distribute timeline
                        if (!hasExistingDates) {
                            console.log('⏰ Roadmap missing dates - applying timeline distribution');
                            const totalDays = room.durationDays || 30; // Use room duration or default
                            const startDate = room.startDate ? new Date(room.startDate) : new Date();
                            
                            // Extract all milestones from phases
                            const allMilestones = processedRoadmap.phases.flatMap(phase => phase.milestones);
                            
                            // Apply timeline distribution to milestones
                            const distributedMilestones = distributeMilestonesAcrossTimeline(
                                allMilestones,
                                totalDays,
                                startDate
                            );
                            
                            // Rebuild roadmap structure with distributed milestones
                            let milestoneIndex = 0;
                            processedRoadmap = {
                                ...processedRoadmap,
                                phases: processedRoadmap.phases.map(phase => ({
                                    ...phase,
                                    milestones: phase.milestones.map(() => {
                                        const distributed = distributedMilestones[milestoneIndex];
                                        milestoneIndex++;
                                        return distributed;
                                    })
                                }))
                            };
                        }
                    }
                    
                    setRoomData({
                        id: room.id,
                        name: room.title,
                        description: room.description,
                        tags: room.tags || [],
                        code: room.code,
                        status: room.status,
                        hostId: room.hostId,
                        maxSeats: room.maxSeats,
                        memberCount: membersList.length,
                        createdAt: room.createdAt,
                        daysRemaining: daysRemaining,
                        activeUsers: activeUsers,
                        completionRate: Math.min(completionRate, 100), // Cap at 100%
                        roadmap: processedRoadmap,
                    });
                    
                    setMembers(membersList);
                }
            } catch (err) {
                console.error("Failed to fetch room data:", err);
                setError(err.message || "Failed to load room");
            } finally {
                setIsLoading(false);
            }
        };

        if (roomId) {
            fetchRoomData();
        }
    }, [roomId]);

    // Setup Socket.IO connection
    useEffect(() => {
        if (!roomId) return;

        // Connect to socket if not already connected
        if (!socketService.isConnected()) {
            socketService.connect();
        }

        // Join the room
        socketService.joinRoom(roomId);
        // Setup event listeners
        // Listen for room presence updates emitted by the server
        socketService.onRoomUsers((presence) => {
            try {
                console.log('roomUsers presence:', presence);
                // Server sends an array of presence objects { id, name, ready, isOnline }
                // Keep authoritative member list from the room GET response (members)
                setOnlineMembers(presence || []);

                setRoomData(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        // Do NOT overwrite total memberCount with presence; use presence only for activeUsers
                        activeUsers: (presence || []).filter(p => p.isOnline).length,
                    };
                });
            } catch (e) {
                console.error('Failed to handle roomUsers event', e);
            }
        });

        // Listen for server system messages (e.g., "X joined the room") and refresh members when that happens
        socketService.onSystemMessage((sys) => {
            console.log('System message:', sys);
            // Refresh room membership list to keep UI consistent
            roomService.getRoom(roomId).then(response => {
                if (response.success && response.room) {
                    setMembers(response.room.members || []);
                    // Also keep roomData memberCount consistent
                    setRoomData(prev => prev ? { ...prev, memberCount: response.room.members.length } : prev);
                }
            }).catch(err => console.error('Failed to refresh room after system message', err));
        });

        const handleNewMessage = (message) => {
            console.log("New message received in room.jsx:", message);
            // Only increment unread count if chat is closed
            if (!showChat && !showOverlay) {
                setUnreadCount(prev => prev + 1);
            }
        };

        socketService.onMessage(handleNewMessage);

        // Cleanup on unmount
        return () => {
            socketService.socket?.off('newMessage', handleNewMessage);
            socketService.leaveRoom(roomId);
        };
    }, [roomId, showChat, showOverlay]);

    // Extract roadmap items from room data if available (memoized to prevent infinite loops)
    const roadmapItems = React.useMemo(() => {
        if (!roomData || !roomData.roadmap || !roomData.roadmap.phases) {
            return [];
        }
        
        // ✨ NEW: Get current user's progress
        const currentUserMember = roomData.members?.find(m => {
            const memberUserId = m.userId?._id || m.userId;
            return memberUserId === currentUser?.id;
        });
        const currentMilestoneId = currentUserMember?.progress?.currentMilestoneId;
        const currentTopicTitle = currentUserMember?.progress?.currentTopicTitle;
        
        console.log('📍 User current position:', { currentMilestoneId, currentTopicTitle });
        
        const milestones = roomData.roadmap.phases.flatMap((phase, phaseIndex) => 
            phase.milestones.map((milestone, milestoneIndex) => {
                // Calculate week number based on actual start date
                let weekNumber = phaseIndex + 1; // Default fallback
                if (milestone.startDate && roomData.roadmap.phases[0].milestones[0].startDate) {
                    const roadmapStart = new Date(roomData.roadmap.phases[0].milestones[0].startDate);
                    const milestoneStart = new Date(milestone.startDate);
                    const daysDiff = Math.floor((milestoneStart - roadmapStart) / (1000 * 60 * 60 * 24));
                    weekNumber = Math.floor(daysDiff / 7) + 1;
                }
                
                // Check if milestone is completed based on all topics being completed
                const totalTopics = milestone.topics ? milestone.topics.length : 0;
                const completedTopicsCount = milestone.topics ? milestone.topics.filter((t) => {
                    const status = typeof t === 'object' ? t.status : 'pending';
                    return status === 'completed';
                }).length : 0;
                const completed = totalTopics > 0 && completedTopicsCount >= totalTopics;
                
                // ✨ NEW: Milestone is current if it matches user's currentMilestoneId
                const milestoneId = milestone._id?.toString() || milestone.id || `p${phaseIndex}m${milestoneIndex}`;
                
                return {
                    id: milestoneId,
                    _id: milestone._id,
                    phaseIndex,
                    milestoneIndex,
                    title: milestone.title,
                    description: milestone.description,
                    week: weekNumber,
                    completed: completed,
                    topics: milestone.topics || [],
                    estimatedHours: milestone.estimatedHours || 1,
                    startDate: milestone.startDate,
                    endDate: milestone.endDate,
                    durationDays: milestone.durationDays,
                    completedTopics: completedTopicsCount,
                    currentTopicTitle: undefined, // Will be set below
                    current: false, // Will be set below
                    milestoneId: milestoneId, // For comparison
                };
            })
        );
        
        // ✨ Determine which milestone is "current"
        let currentMilestoneSet = false;
        
        // If user has a saved currentMilestoneId, use that
        if (currentMilestoneId) {
            const currentMilestone = milestones.find(m => m.milestoneId === currentMilestoneId);
            if (currentMilestone) {
                currentMilestone.current = true;
                currentMilestone.currentTopicTitle = currentTopicTitle;
                currentMilestoneSet = true;
                console.log(`✅ Using saved position: ${currentMilestone.title}`);
            }
        }
        
        // FALLBACK: If no saved position, mark first uncompleted milestone as current
        if (!currentMilestoneSet) {
            const firstUncompleted = milestones.find(m => !m.completed);
            if (firstUncompleted) {
                firstUncompleted.current = true;
                console.log(`📌 Fallback: First uncompleted milestone is ${firstUncompleted.title}`);
            }
        }
        
        return milestones;
    }, [roomData, currentUser?.id]);
    
    // State for today's tasks (to allow updates)
    const [todaysTasks, setTodaysTasks] = useState([]);
    
    // ✨ NEW: Generate today's tasks from first active milestone using task generator
    useEffect(() => {
        if (!Array.isArray(roadmapItems) || roadmapItems.length === 0) {
            setTodaysTasks([]);
            return;
        }
        
        try {
            console.log('🔍 Generating tasks from roadmapItems:', roadmapItems);
            console.log('🔍 First roadmapItem:', roadmapItems[0]);
            
            // Generate tasks from first active milestone
            const tasks = generateTodaysTasks(roadmapItems);
            
            console.log('🔍 Generated tasks from taskGenerator:', tasks);
            
            // Format for UI (map topic titles to task structure)
            // ✨ FIX: Use milestone's array indices for backend identification
            const formattedTasks = tasks.map((task) => {
                // Find the original roadmap item to get the phase/milestone indices
                const originalMilestone = roadmapItems.find(item => 
                    item.id === task.milestoneId
                );
                
                if (!originalMilestone) {
                    console.error('❌ Could not find milestone for task:', task);
                    return null;
                }
                
                // ✨ Use milestone's position in roadmap for backend identification
                const milestoneIdentifier = `p${originalMilestone.phaseIndex}m${originalMilestone.milestoneIndex}`;
                
                console.log(`🔍 Task "${task.title}":`, {
                    taskMilestoneId: task.milestoneId,
                    foundMilestone: true,
                    phaseIndex: originalMilestone.phaseIndex,
                    milestoneIndex: originalMilestone.milestoneIndex,
                    milestoneIdentifier,
                    topicOrder: task.order
                });
                
                return {
                    id: `task-${milestoneIdentifier}-${task.order}`,
                    title: task.title,
                    milestone: task.milestone,
                    milestoneId: milestoneIdentifier, // ✨ Use "p0m1" format
                    phaseIndex: originalMilestone.phaseIndex, // ✨ For backend
                    milestoneIndex: originalMilestone.milestoneIndex, // ✨ For backend
                    order: task.order, // ✨ Original index in milestone.topics array
                    completed: task.status === 'completed',
                    timeSpent: "0h 0m",
                    estimatedHours: task.estimatedHours || 1,
                };
            }).filter(Boolean); // Remove nulls
            
            console.log('🔍 Final formattedTasks:', formattedTasks);
            
            setTodaysTasks(formattedTasks);
        } catch (error) {
            console.error('Error generating today\'s tasks:', error);
            setTodaysTasks([]);
        }
    }, [roadmapItems]); // Safe now - roadmapItems is memoized
    
    // Handler to update task completion
    const handleTaskComplete = async (data) => {
        console.log('Task completed:', data);
        
        // Find the completed task to get milestoneId and order
        const completedTask = todaysTasks.find(task => task.id === data.taskId);
        
        // Update the task to show as completed with time spent
        setTodaysTasks(prevTasks => 
            prevTasks.map(task => 
                task.id === data.taskId 
                    ? { ...task, completed: true, timeSpent: data.timeSpent }
                    : task
            )
        );
        
        // Set user as idle after completing task (both systems)
        legacySetIdle();
        setPresenceIdle();
        
        // ✨ NEW: Save completion to backend database
        // Skip database save for milestone-based tasks (those are completed via "Mark Complete" button in StudyLayout)
        if (data.isMilestoneTask) {
            console.log('⏭️ Skipping database save for milestone-based task - use "Mark Complete" button in study panel');
        } else if (completedTask && completedTask.milestoneId && typeof completedTask.order === 'number') {
            console.log('💾 Saving topic completion to database...');
            await handleTopicComplete(completedTask);
        } else {
            console.warn('⚠️ Cannot save completion - task missing milestoneId or order:', completedTask);
        }
        
        // Success - logged in console
        console.log(`✅ Great job! You focused for ${data.timeSpent}. 🎉`);
    };

    // Handler to mark a topic as complete (from Today's Tasks checkbox)
    const handleTopicComplete = async (task) => {
        console.log('🔔 handleTopicComplete called with task:', task);
        console.log('   task.milestoneId:', task.milestoneId);
        console.log('   task.order:', task.order);
        
        // If called from study panel completion (already completed by backend)
        // Just refetch the data to update UI
        if (!task.milestoneId || typeof task.order !== 'number') {
            console.log('ℹ️ Topic already completed via study panel, refetching room data...');
            try {
                await refetchRoom();
                console.log('✅ Room data refetched after topic completion');
            } catch (error) {
                console.error('❌ Failed to refetch room data:', error);
            }
            return;
        }

        // ✨ 1. Optimistic update - Mark task as completed locally for instant feedback
        setTodaysTasks(prevTasks => 
            prevTasks.map(t => 
                t.id === task.id 
                    ? { ...t, completed: true }
                    : t
            )
        );

        try {
            console.log(`📡 Calling backend API: PATCH /api/rooms/${roomId}/milestone/${task.milestoneId}/topic/${task.order}/complete`);
            
            // ✨ 2. Call backend to mark topic complete and recalculate progress
            const response = await roomService.completeTopicAndUpdateProgress(
                roomId,
                task.milestoneId,
                task.order
            );

            console.log('📥 Backend response:', response);

            if (response.success) {
                console.log('✅ Topic marked complete on backend! Refetching room data...');
                
                // ✨ 3. Refetch the entire room to get fresh data from MongoDB
                const roomResponse = await roomService.getRoom(roomId);
                
                if (roomResponse.success && roomResponse.room) {
                    const room = roomResponse.room;
                    
                    // Recalculate days remaining
                    const today = new Date();
                    let daysRemaining = 30;
                    if (room.endDate) {
                        const endDate = new Date(room.endDate);
                        const timeDiff = endDate.getTime() - today.getTime();
                        daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
                    }
                    
                    // ✨ 4. Update room data completely (triggers roadmapItems recalculation)
                    setRoomData(prevData => {
                        console.log('📊 Progress update:', {
                            oldProgress: prevData.completionRate,
                            newProgress: room.averageProgress,
                            completedTopics: response.completedTopics || '?',
                            totalTopics: response.totalTopics || '?',
                        });
                        
                        return {
                            ...prevData,
                            roadmap: room.roadmap,
                            averageProgress: room.averageProgress,
                            completionRate: Math.min(room.averageProgress || 0, 100), // ✨ Update the UI progress bar
                            members: room.members,
                            daysRemaining: daysRemaining,
                        };
                    });
                    
                    console.log('✅ Room data refreshed from server');
                    
                    // ✨ 5. Check if all today's tasks are now complete
                    const allComplete = todaysTasks.every(t => t.id === task.id || t.completed);
                    if (allComplete) {
                        console.log('🎉 All today\'s tasks complete!');
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error completing topic:', error);
            console.error('   Error details:', error.response || error.message);
            
            // ✨ 6. Rollback optimistic update on error
            setTodaysTasks(prevTasks => 
                prevTasks.map(t => 
                    t.id === task.id 
                        ? { ...t, completed: false }
                        : t
                )
            );
        }
    };
    
    // Update user activity when working on a milestone
    const handleMilestoneStart = (milestone) => {
        if (milestone && milestone.title) {
            // Update both presence systems
            legacyUpdateActivity(
                roomData?.name || 'Study Room',
                milestone.title
            );
            updatePresenceActivity(`Studying: ${milestone.title}`);
        }
    };

    // Move to next day/milestone manually
    const handleContinueToNextDay = () => {
        // Refetch room data to get new tasks based on updated timeline
        const fetchUpdatedRoom = async () => {
            try {
                const updatedRoom = await roomService.getRoom(roomId);
                setRoomData(updatedRoom);
                setMembers(updatedRoom.members || []);
                console.log('✅ Moved to next day - new tasks loaded');
            } catch (error) {
                console.error('❌ Failed to load next tasks:', error);
            }
        };
        fetchUpdatedRoom();
    };

    // Handlers
    const handleLeaveRoom = async () => {
        if (window.confirm("Are you sure you want to leave this room?")) {
            try {
                console.log('Leaving room:', roomId);
                const response = await roomService.leaveRoom(roomId);
                console.log('Leave room response:', response);
                
                // Leave the socket room as well
                socketService.leaveRoom(roomId);
                
                // Trigger a custom event to notify other components to refresh
                window.dispatchEvent(new CustomEvent('roomListChanged'));
                
                // Navigate to home
                navigate("/home");
            } catch (err) {
                console.error("Failed to leave room:", err);
                console.error(err.response?.data?.message || err.message || "Failed to leave room. Please try again.");
            }
        }
    };

    const handleChatToggle = () => {
        if (isMobile) {
            // On mobile: show overlay with chat content
            setOverlayContent('chat');
            setShowOverlay(true);
            setUnreadCount(0); // Clear unread count when opening chat overlay
        } else {
            // On desktop: toggle chat modal
            setShowChat(!showChat);
            if (!showChat) {
                setUnreadCount(0); // Clear unread count when opening chat
            }
        }
    };

    const handleMembersToggle = () => {
        if (isMobile) {
            // On mobile: show overlay with members content
            setOverlayContent('members');
            setShowOverlay(true);
        } else {
            // On desktop: toggle members panel
            setShowMembers(!showMembers);
        }
    };

    const handleCloseOverlay = () => {
        setShowOverlay(false);
    };

    const handleChatClose = () => {
        setShowChat(false);
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.3 }
        }
    };

    // Show loading state while room data is loading
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-[var(--color-text)] text-lg">Loading room...</p>
                </div>
            </div>
        );
    }

    // Show error state if room data failed to load
    if (error || !roomData) {
        return (
            <div className="min-h-screen bg-gradient flex items-center justify-center">
                <div className="text-center bg-red-500/10 border border-red-500/20 rounded-lg p-8 max-w-md">
                    <p className="text-red-500 text-xl mb-4">Failed to load room</p>
                    <p className="text-[var(--color-text)]/70 mb-6">{error || 'Room not found'}</p>
                    <button 
                        onClick={() => navigate('/home')}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <div className={`min-h-screen bg-gradient transition-colors duration-300 ${
                isMobile ? '' : 'md:ml-20'
            }`}>
                {/* Room Header */}
                <RoomHeader 
                    roomData={roomData}
                    activeView={activeView}
                    onViewChange={setActiveView}
                    onSettingsToggle={() => setShowSettings(!showSettings)}
                    onChatToggle={handleChatToggle}
                    onMembersToggle={handleMembersToggle}
                    showChat={showChat}
                    showMembers={showMembers} // This will be false by default
                    unreadCount={unreadCount}
                />

                {/* Main Content */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="h-[calc(100vh-120px)]"
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeView}
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className="h-full"
                        >
                            <RoomContent 
                                activeView={activeView}
                                roomData={roomData}
                                members={members}
                                onlineMembers={onlineMembers}
                                todaysTasks={todaysTasks}
                                roadmapItems={roadmapItems}
                                showMembers={!isMobile && showMembers} // Only show on desktop when toggled
                                onTaskComplete={handleTaskComplete}
                                onTopicComplete={handleTopicComplete}
                                onContinueToNextDay={handleContinueToNextDay}
                                onViewChange={setActiveView}
                                onRefetchRoom={refetchRoomData}
                                // Discord presence functions
                                getUserPresence={getUserPresence}
                                isUserOnline={isUserOnline}
                            />
                        </motion.div>
                    </AnimatePresence>
                </motion.div>

                {/* Mobile Overlay */}
                <AnimatePresence>
                    {isMobile && showOverlay && (
                        <RoomOverlay
                            content={overlayContent}
                            members={members}
                            roomData={roomData}
                            unreadCount={unreadCount}
                            onClose={handleCloseOverlay}
                            roomId={roomId}
                        />
                    )}
                </AnimatePresence>

                {/* Desktop Settings Modal */}
                <SettingsModal 
                    showSettings={showSettings}
                    onClose={() => setShowSettings(false)}
                    onLeaveRoom={handleLeaveRoom}
                    roomData={roomData}
                />

                {/* Desktop Chat Modal - Only shows on desktop */}
                <ChatModal 
                    isOpen={showChat && !isMobile}
                    onClose={handleChatClose}
                    roomName={roomData?.name || 'Loading...'}
                    onlineCount={roomData?.activeUsers || 0}
                    totalMembers={roomData?.memberCount || members.length}
                    roomId={roomId}
                />
            </div>
        </ErrorBoundary>
    );
};

export default Room;
