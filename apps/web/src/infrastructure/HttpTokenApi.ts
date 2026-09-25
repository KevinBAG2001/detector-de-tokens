export interface ApiResponse<T = any> {
  exito: boolean;
  mensaje: string;
  datos: T;
  meta?: Record<string, any>;
}

export class HttpTokenApi {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001';
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(options?.headers || {}),
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (err: any) {
      console.error(`Error en HttpTokenApi (${endpoint}):`, err);
      throw err;
    }
  }

  public async obtenerSesionActiva(): Promise<ApiResponse<any>> {
    return this.request('/api/v1/sesiones/activa');
  }

  public async listarSesiones(): Promise<ApiResponse<{ sesionActivaId: string | null; totalSesiones: number; sesiones: any[] }>> {
    return this.request('/api/v1/sesiones');
  }

  public async cambiarSesion(sessionId: string, modelId?: string): Promise<ApiResponse<any>> {
    return this.request('/api/v1/sesiones/cambiar', {
      method: 'POST',
      body: JSON.stringify({ sessionId, modelId }),
    });
  }

  public async cambiarModelo(modelId: 'gemini-2.5-pro' | 'gemini-2.5-flash'): Promise<ApiResponse<any>> {
    return this.request('/api/v1/modelo', {
      method: 'POST',
      body: JSON.stringify({ modelId }),
    });
  }

  public async obtenerCuotas(modelId?: string): Promise<ApiResponse<any>> {
    const query = modelId ? `?modelId=${encodeURIComponent(modelId)}` : '';
    return this.request(`/api/v1/cuotas${query}`);
  }

  public async obtenerHistorial(): Promise<ApiResponse<any[]>> {
    return this.request('/api/v1/historial');
  }
}

export const tokenApi = new HttpTokenApi();
