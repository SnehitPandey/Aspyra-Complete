import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Calendar, TrendingUp, ArrowRight, Clock, Loader2 } from "lucide-react";
import { NavLink } from "react-router-dom";
import { roomService } from "../../../services/roomService";

const RoomsSection = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await roomService.getMyRooms();
                if (response.success && response.rooms) {
                    setRooms(response.rooms);
                } else {
                    setRooms([]);
                }
            } catch (error) {
                console.error('Failed to fetch rooms:', error);
                setError('Failed to load rooms');
                setRooms([]);
            } finally {
                setLoading(false);
            }
        };

        fetchRooms();
        
        // Listen for room list changes
        const handleRoomListChanged = () => {
            console.log('Room list changed, refreshing...');
            fetchRooms();
        };
        window.addEventListener('roomListChanged', handleRoomListChanged);
        
        // Refresh every 30 seconds
        const interval = setInterval(fetchRooms, 30000);
        
        return () => {
            clearInterval(interval);
            window.removeEventListener('roomListChanged', handleRoomListChanged);
        };
    }, []);




    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0
            }
        }
    };




    const cardVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.3, ease: "easeOut" }
        }
    };

    return (
        <div className="w-full px-4 md:pl-24 pr-4 mt-8 mb-24">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-center mb-12"
            >
                <h2 className="text-4xl font-bold text-text mb-4">
                    <span className="text-primary">Rooms</span>
                </h2>
            </motion.div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="ml-3 text-text/60">Loading rooms...</span>
                </div>
            ) : error ? (
                <div className="flex items-center justify-center py-20">
                    <p className="text-red-500">{error}</p>
                </div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-wrap gap-6 justify-center md:justify-start"
                >
                    {rooms.length === 0 ? (
                        <div className="w-full text-center py-20">
                            <p className="text-text/60 mb-4">You haven't joined any rooms yet</p>
                            <NavLink to="/createroom">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-6 py-3 bg-primary text-alt rounded-xl font-medium hover:shadow-lg transition-all"
                                >
                                    Create Your First Room
                                </motion.button>
                            </NavLink>
                        </div>
                    ) : (
                        <>
                            {rooms.map((room) => (
                                <motion.div
                                    key={room.id}
                                    variants={cardVariants}
                                    whileHover={{ y: -8, scale: 1.02 }}
                                    transition={{ duration: 0.2 }}
                                    className="group relative overflow-hidden rounded-2xl border border-text/20 bg-background/60 backdrop-blur-sm hover:border-primary/50 transition-all duration-200 w-80 flex-shrink-0"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/50 opacity-5 group-hover:opacity-10 transition-opacity duration-200" />
                                    
                                    <div className="relative p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                        room.status === 'ACTIVE' ? 'bg-green-500/20 text-green-500' :
                                                        room.status === 'WAITING' ? 'bg-orange-500/20 text-orange-500' :
                                                        room.status === 'PAUSED' ? 'bg-yellow-500/20 text-yellow-500' :
                                                        room.status === 'COMPLETED' ? 'bg-blue-500/20 text-blue-500' :
                                                        'bg-primary/20 text-primary'
                                                    }`}>
                                                        {room.status === 'WAITING' ? 'Preparing' : room.status}
                                                    </span>
                                                    <span className="text-xs px-2 py-1 rounded-full bg-text/10 text-text/70">
                                                        Code: {room.code}
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-bold text-text group-hover:text-primary transition-colors duration-200">
                                                    {room.title}
                                                </h3>
                                                <p className="text-text/60 text-sm mt-2">
                                                    Host: {room.hostName}
                                                </p>
                                            </div>
                                            
                                            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                                        </div>

                                        {/* Stats */}
                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div className="flex items-center gap-2">
                                                <Users size={16} className="text-text/50" />
                                                <div>
                                                    <p className="text-xs text-text/50">Members</p>
                                                    <p className="text-sm font-medium text-text">{room.memberCount}/{room.maxSeats}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} className="text-text/50" />
                                                <div>
                                                    <p className="text-xs text-text/50">Created</p>
                                                    <p className="text-sm font-medium text-text">
                                                        {new Date(room.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <NavLink to={`/room/${room.id}`}>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                transition={{ duration: 0.1 }}
                                                className="w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30"
                                            >
                                                Enter Room
                                                <ArrowRight size={16} />
                                            </motion.button>
                                        </NavLink>
                                    </div>

                                    {/* Hover Effect */}
                                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary/20 rounded-2xl transition-all duration-200 pointer-events-none" />
                                </motion.div>
                            ))}

                            {/* Create Room Card */}
                            <motion.div
                                variants={cardVariants}
                                whileHover={{ y: -8, scale: 1.02 }}
                                transition={{ duration: 0.2 }}
                                className="group relative overflow-hidden rounded-2xl border-2 border-dashed border-text/30 hover:border-primary/50 bg-background/30 backdrop-blur-sm transition-all duration-200 cursor-pointer w-80 flex-shrink-0"
                            >
                                <NavLink to="/createroom" className="block h-full">
                                    <div className="flex flex-col items-center justify-center h-full min-h-[300px] p-6 text-center">
                                        <motion.div
                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                            transition={{ duration: 0.1 }}
                                            className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors duration-200"
                                        >
                                            <span className="text-2xl text-primary">+</span>
                                        </motion.div>
                                        <h3 className="text-xl font-bold text-text mb-2 group-hover:text-primary transition-colors duration-200">
                                            Create New Room
                                        </h3>
                                        <p className="text-text/60 text-sm">
                                            Start your own learning journey and invite others to join
                                        </p>
                                    </div>
                                </NavLink>
                            </motion.div>
                        </>
                    )}
                </motion.div>
            )}
        </div>
    );
};




export default RoomsSection;
