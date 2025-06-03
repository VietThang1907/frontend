// searchSuggestionService.js - Service for search term suggestions
import axiosInstance from '../config/axiosConfig';

const searchSuggestionService = {
  // Get search term suggestions from Elasticsearch
  getSuggestions: async (query, limit = 5) => {
    try {
      if (!query || query.trim().length < 2) {
        return { success: true, suggestions: [] };
      }

      const response = await axiosInstance.get(`/search/suggestions?q=${encodeURIComponent(query.trim())}&limit=${limit}`);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          suggestions: response.data.suggestions || []
        };
      }
      return { success: false, suggestions: [] };
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
      return { success: false, suggestions: [], error: error.response?.data || error.message };
    }
  }
};

export default searchSuggestionService;