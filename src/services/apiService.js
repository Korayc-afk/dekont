// API Service - Backend ile iletişim

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiService {
  // Helper function for API calls
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Get all tickets
  async getAllTickets(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.userId) params.append('userId', filters.userId);

    const queryString = params.toString();
    return this.request(`/tickets${queryString ? `?${queryString}` : ''}`);
  }

  // Get ticket by ID
  async getTicketById(id) {
    return this.request(`/tickets/${id}`);
  }

  // Get tickets by user ID
  async getTicketsByUserId(userId) {
    return this.request(`/tickets/user/${userId}`);
  }

  // Create new ticket
  async createTicket(ticketData, receiptFile) {
    const formData = new FormData();
    
    // Add text fields
    formData.append('userId', ticketData.userId);
    formData.append('recipientName', ticketData.recipientName);
    formData.append('recipientIban', ticketData.recipientIban);
    formData.append('investmentMethod', ticketData.investmentMethod);
    formData.append('investmentAmount', ticketData.investmentAmount);
    formData.append('investmentDateTime', ticketData.investmentDateTime);
    
    // Add file
    if (receiptFile) {
      formData.append('receipt', receiptFile);
    }

    return this.request('/tickets', {
      method: 'POST',
      headers: {}, // Don't set Content-Type, let browser set it with boundary
      body: formData,
    });
  }

  // Update ticket
  async updateTicket(id, updates) {
    return this.request(`/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Delete ticket
  async deleteTicket(id) {
    return this.request(`/tickets/${id}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

export const apiService = new ApiService();

