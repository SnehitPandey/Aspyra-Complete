/**
 * AI Service
 * Handles all AI-related API calls using Gemini AI
 */

import { apiClient } from './api';
import { API_ENDPOINTS } from '../config/api';

// AI requests can take longer - use 60 second timeout
const AI_TIMEOUT = 60000;

export const aiService = {
  /**
   * Generate learning roadmap using Gemini AI
   * @param {Object} input - Roadmap input
   * @param {string} input.goal - Learning goal (5-200 characters)
   * @param {string[]} input.tags - Array of learning topics/tags (1-10 items)
   * @param {string} input.skillLevel - 'Beginner', 'Intermediate', or 'Advanced'
   * @param {number} input.durationWeeks - Duration in weeks (1-52, optional, default: 12)
   * @returns {Promise<Object>} Generated roadmap
   */
  async generateRoadmap(input) {
    try {
      const data = await apiClient.post(
        API_ENDPOINTS.AI.ROADMAP, 
        {
          goal: input.goal,
          tags: input.tags,
          skillLevel: input.skillLevel,
          durationWeeks: input.durationWeeks || 12,
        },
        { timeout: AI_TIMEOUT }
      );
      return data;
    } catch (error) {
      console.error('Generate roadmap error:', error);
      throw error;
    }
  },

  /**
   * Generate quiz questions using Gemini AI
   * @param {Object} input - Quiz input
   * @param {string} input.topic - Quiz topic (2-100 characters)
   * @param {string} input.currentMilestone - Current milestone title (optional)
   * @param {string} input.difficulty - 'Easy', 'Medium', or 'Hard' (optional)
   * @param {number} input.count - Number of questions (1-20, optional)
   * @param {Object} input.userProgress - User progress data (optional)
   * @param {string[]} input.userProgress.completedTopics - List of completed topics
   * @param {number} input.userProgress.currentPhase - Current phase number
   * @returns {Promise<Object>} Generated quiz
   */
  async generateQuiz(input) {
    try {
      const data = await apiClient.post(
        API_ENDPOINTS.AI.QUIZ, 
        {
          topic: input.topic,
          currentMilestone: input.currentMilestone,
          difficulty: input.difficulty,
          count: input.count,
          userProgress: input.userProgress,
        },
        { timeout: AI_TIMEOUT }
      );
      return data;
    } catch (error) {
      console.error('Generate quiz error:', error);
      throw error;
    }
  },

  /**
   * Generate roadmap for a specific room
   * @param {string} roomId - Room ID
   * @returns {Promise<Object>} Generated roadmap
   */
  async generateRoomRoadmap(roomId) {
    try {
      const data = await apiClient.post(
        `/api/rooms/${roomId}/roadmap/generate`,
        {},
        { timeout: AI_TIMEOUT }
      );
      return data;
    } catch (error) {
      console.error('Generate room roadmap error:', error);
      throw error;
    }
  },

  /**
   * Generate quiz for a specific room based on member's progress
   * @param {string} roomId - Room ID
   * @param {Object} options - Quiz options
   * @param {string} options.topic - Quiz topic (optional, defaults to room title)
   * @param {string} options.difficulty - 'Easy', 'Medium', or 'Hard' (optional)
   * @param {number} options.count - Number of questions (optional)
   * @returns {Promise<Object>} Generated quiz
   */
  async generateRoomQuiz(roomId, options = {}) {
    try {
      const data = await apiClient.post(
        `/api/rooms/${roomId}/quiz/generate`, 
        options,
        { timeout: AI_TIMEOUT }
      );
      return data;
    } catch (error) {
      console.error('Generate room quiz error:', error);
      throw error;
    }
  },

  /**
   * Update member's progress in a room
   * @param {string} roomId - Room ID
   * @param {Object} progress - Progress data
   * @param {number} progress.currentPhase - Current phase index
   * @param {number} progress.currentMilestone - Current milestone index
   * @param {string[]} progress.completedMilestones - Array of completed milestone IDs
   * @returns {Promise<Object>} Updated progress
   */
  async updateRoomProgress(roomId, progress) {
    try {
      const data = await apiClient.put(`/api/rooms/${roomId}/progress`, progress);
      return data;
    } catch (error) {
      console.error('Update room progress error:', error);
      throw error;
    }
  },

  /**
   * Generate and store user profile embedding
   * @param {string} userId - User ID
   * @param {Object} profile - User profile data
   * @param {string} profile.skills - User skills (1-500 chars)
   * @param {string} profile.interests - User interests (1-500 chars)
   * @param {string} profile.goals - User goals (1-500 chars)
   * @returns {Promise<Object>} Embedding result
   */
  async embedProfile(userId, profile) {
    try {
      const data = await apiClient.post(API_ENDPOINTS.AI.EMBED_PROFILE, {
        userId,
        profile,
      });
      return data;
    } catch (error) {
      console.error('Embed profile error:', error);
      throw error;
    }
  },

  /**
   * Get embedding status for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Embedding status
   */
  async getEmbeddingStatus(userId) {
    try {
      const data = await apiClient.get(API_ENDPOINTS.AI.EMBEDDING_STATUS(userId));
      return data;
    } catch (error) {
      console.error('Get embedding status error:', error);
      throw error;
    }
  },

  /**
   * Group students based on embeddings (Admin/Moderator only)
   * @param {Object} input - Grouping input
   * @param {number} input.count - Number of groups (1-20)
   * @param {string} input.groupType - 'size' or 'number' (optional)
   * @param {string} input.algorithm - 'kmeans' or 'similarity' (optional)
   * @returns {Promise<Object>} Student groups
   */
  async groupStudents(input) {
    try {
      const data = await apiClient.post(API_ENDPOINTS.AI.GROUP_STUDENTS, {
        count: input.count,
        groupType: input.groupType,
        algorithm: input.algorithm,
      });
      return data;
    } catch (error) {
      console.error('Group students error:', error);
      throw error;
    }
  },

  /**
   * Get embedding statistics (Admin only)
   * @returns {Promise<Object>} Embedding statistics
   */
  async getEmbeddingStats() {
    try {
      const data = await apiClient.get(API_ENDPOINTS.AI.STATS);
      return data;
    } catch (error) {
      console.error('Get embedding stats error:', error);
      throw error;
    }
  },

  /**
   * Generate AI summary and feedback for room creation
   * @param {Object} input - Room details
   * @param {string} input.roomTitle - Room title
   * @param {string} input.description - Room description (optional)
   * @param {string[]} input.topics - Array of learning topics
   * @param {number} input.durationDays - Duration in days
   * @param {string} input.skillLevel - 'Beginner', 'Intermediate', or 'Advanced'
   * @param {string} input.dailyTime - Daily time commitment (e.g., '1hr', '2hrs')
   * @param {string} input.goal - Learning goal (optional)
   * @returns {Promise<Object>} AI summary and feedback
   */
  async generateRoomSummary(input) {
    try {
      const data = await apiClient.post(
        API_ENDPOINTS.AI.ROOM_SUMMARY, 
        {
          roomTitle: input.roomTitle,
          description: input.description,
          topics: input.topics,
          durationDays: input.durationDays,
          skillLevel: input.skillLevel,
          dailyTime: input.dailyTime,
          goal: input.goal,
        },
        { timeout: AI_TIMEOUT }
      );
      return data;
    } catch (error) {
      console.error('Generate room summary error:', error);
      throw error;
    }
  },

  /**
   * Generate simple text response using AI (for chat/conversations)
   * @param {Object} input - Text generation input
   * @param {string} input.prompt - The prompt/question to send to AI
   * @param {number} input.maxTokens - Maximum tokens in response (optional)
   * @returns {Promise<Object>} AI text response
   */
  async generateText(input) {
    try {
      const data = await apiClient.post(
        '/api/ai/text', 
        {
          prompt: input.prompt,
          maxTokens: input.maxTokens || 200,
        },
        { timeout: AI_TIMEOUT }
      );
      return data;
    } catch (error) {
      console.error('Generate text error:', error);
      throw error;
    }
  },
};
