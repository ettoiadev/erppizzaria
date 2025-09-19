class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  }

  async get(endpoint: string, params?: Record<string, any>) {
    const url = new URL(endpoint, this.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  }

  async post(endpoint: string, data?: any) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  }

  async put(endpoint: string, data?: any) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  }

  async patch(endpoint: string, data?: any) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  }

  async delete(endpoint: string) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  }

  // Métodos específicos para o domínio da aplicação
  async getOrders(params?: { status?: string; limit?: number; offset?: number }) {
    return this.get('/api/orders', params);
  }

  async getOrder(id: string) {
    return this.get(`/api/orders/${id}`);
  }

  async updateOrderStatus(id: string, status: string, notes?: string) {
    return this.put(`/api/orders/${id}/status`, { status, notes });
  }

  async archiveOrder(id: string) {
    return this.patch(`/api/orders/${id}/archive`, { archived: true });
  }

  async getProducts(params?: { category?: string; active?: boolean }) {
    return this.get('/api/products', params);
  }

  async getCustomers(params?: { limit?: number; offset?: number }) {
    return this.get('/api/customers', params);
  }

  async getSettings() {
    return this.get('/api/settings');
  }

  async updateSettings(settings: Record<string, any>) {
    return this.put('/api/settings', settings);
  }
}

export const apiClient = new ApiClient();

// Hook para usar com React Query
export function useApiClient() {
  return apiClient;
}