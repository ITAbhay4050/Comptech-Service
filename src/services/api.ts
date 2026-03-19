import axios from 'axios';
import { 
  Ticket, 
  TicketCategory, 
  TicketStatus, 
  CreateTicketPayload, 
  User 
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ================= REQUEST INTERCEPTOR =================
apiClient.interceptors.request.use(
  (config) => {
    const stored = localStorage.getItem('user');
    let token = '';

    if (stored) {
      try {
        const user = JSON.parse(stored);
        token = user?.token || '';
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem('user');
      }
    }

    if (token && config.headers) {
      config.headers['Authorization'] = `Token ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ================= RESPONSE INTERCEPTOR =================
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// ================= ERROR HANDLER =================
const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      console.log("API ERROR:", error.response.data);

      const message =
        error.response.data?.detail ||
        error.response.data?.message ||
        error.response.data?.error ||
        error.response.statusText ||
        'Something went wrong';

      throw new Error(message);
    } 
    else if (error.request) {
      throw new Error('No response from server');
    } 
    else {
      throw new Error(error.message);
    }
  }

  throw new Error('Unknown error');
};

// ================= COMMON RESPONSE HANDLER =================
const extractData = (response: any) => {
  return response.data?.results || response.data;
};

// ================= HELPER =================
const normalizeAssignedTo = (assigned: any) => {
  if (!assigned) return null;

  return {
    content_type: "employee",   // ✅ FIX
    object_id: Number(assigned.object_id)
  };
};

// ================= API FUNCTIONS =================

// 🎯 Ticket Categories
export const getTicketCategories = async (): Promise<TicketCategory[]> => {
  try {
    const response = await apiClient.get('/ticket-categories/');
    return extractData(response);
  } catch (error) {
    return handleApiError(error);
  }
};

// 🎯 Tickets
export const getTickets = async (): Promise<Ticket[]> => {
  try {
    const response = await apiClient.get('/tickets/');
    return extractData(response);
  } catch (error) {
    return handleApiError(error);
  }
};

// 🎯 Create Ticket (🔥 CLEAN VERSION)
export const createTicket = async (
  ticketData: CreateTicketPayload
): Promise<Ticket> => {
  try {

    console.log("Before Normalize:", ticketData);

    // created_by
    if (ticketData.created_by) {
      ticketData.created_by = {
        content_type: ticketData.created_by.content_type,
        object_id: Number(ticketData.created_by.object_id)
      };
    }

    // assigned_to
    ticketData.assigned_to = normalizeAssignedTo(ticketData.assigned_to);

    // ❌ REMOVE machine_installation completely
    delete (ticketData as any).machine_installation;

    // category
    ticketData.category = Number(ticketData.category);

    console.log("FINAL PAYLOAD:", ticketData);

    const response = await apiClient.post('/tickets/', ticketData);
    return response.data;

  } catch (error) {
    return handleApiError(error);
  }
};

// 🎯 Update Ticket
export const updateTicket = async (
  id: number | string,
  ticketData: Partial<CreateTicketPayload> & {
    status?: TicketStatus;
    resolution_notes?: string;
    feedback_notes?: string;
    rating?: number;
  }
): Promise<Ticket> => {
  try {

    if (ticketData.assigned_to) {
      ticketData.assigned_to = normalizeAssignedTo(ticketData.assigned_to);
    }

    // ❌ REMOVE machine_installation
    delete (ticketData as any).machine_installation;

    console.log("UPDATE PAYLOAD:", ticketData);

    const response = await apiClient.patch(`/tickets/${id}/`, ticketData);
    return response.data;

  } catch (error) {
    return handleApiError(error);
  }
};

// 🎯 Delete Ticket
export const deleteTicket = async (id: number | string): Promise<void> => {
  try {
    await apiClient.delete(`/tickets/${id}/`);
  } catch (error) {
    return handleApiError(error);
  }
};

// 🎯 Users
export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await apiClient.get('/users/');
    return extractData(response);
  } catch (error) {
    return handleApiError(error);
  }
};