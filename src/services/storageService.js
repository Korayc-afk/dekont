// Storage Service - API Service wrapper
// Backend API'yi kullanır, LocalStorage yerine

import { apiService } from './apiService';

export const storageService = {
  // Tüm dekontları getir
  getAllTickets: async (filters = {}) => {
    try {
      return await apiService.getAllTickets(filters);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      // Fallback: boş array döndür
      return [];
    }
  },

  // Yeni dekont ekle
  addTicket: async (ticketData) => {
    try {
      // Receipt dosyasını File objesine çevir
      let receiptFile = null;
      
      if (ticketData.receipt) {
        // Base64'ten File'a çevir
        if (ticketData.receipt.dataUrl) {
          const response = await fetch(ticketData.receipt.dataUrl);
          const blob = await response.blob();
          receiptFile = new File([blob], ticketData.receipt.name || 'receipt', {
            type: ticketData.receipt.type || 'image/png'
          });
        } else if (ticketData.receipt instanceof File) {
          receiptFile = ticketData.receipt;
        }
      }

      const newTicket = await apiService.createTicket(ticketData, receiptFile);
      return newTicket;
    } catch (error) {
      console.error('Error adding ticket:', error);
      throw error;
    }
  },

  // Dekont güncelle
  updateTicket: async (id, updates) => {
    try {
      return await apiService.updateTicket(id, updates);
    } catch (error) {
      console.error('Error updating ticket:', error);
      throw error;
    }
  },

  // Dekont sil
  deleteTicket: async (id) => {
    try {
      await apiService.deleteTicket(id);
      return true;
    } catch (error) {
      console.error('Error deleting ticket:', error);
      throw error;
    }
  },

  // Dekont ID'ye göre getir
  getTicketById: async (id) => {
    try {
      return await apiService.getTicketById(id);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      return null;
    }
  },

  // Kullanıcı ID'ye göre dekontları getir
  getTicketsByUserId: async (userId) => {
    try {
      return await apiService.getTicketsByUserId(userId);
    } catch (error) {
      console.error('Error fetching user tickets:', error);
      return [];
    }
  }
};

