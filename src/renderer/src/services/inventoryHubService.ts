// src/services/inventoryHubService.ts
import * as signalR from '@microsoft/signalr';
import { ApiResponse, StockReservationResult, StockUpdateNotification } from '../types/product';
import { fetchWithAuth } from '../utils/fetchClient';

const BASE_API = import.meta.env.VITE_API_URL;
const HUB_URL = `${BASE_API}/hubs/inventory`;

type StockUpdateListener = (data: StockUpdateNotification) => void;
type ReconnectListener = () => void;

class InventoryHubService {
  private connection: signalR.HubConnection | null = null;
  private currentToken: string | null = null;
  private stockListeners = new Set<StockUpdateListener>();
  private reconnectListeners = new Set<ReconnectListener>();
  private startPromise: Promise<void> | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('token-refreshed', (event: Event) => {
        const { token } = (event as CustomEvent<{ token: string }>).detail;
        if (token) {
          this.currentToken = token;
        }
      });
    }
  }

  private isTokenExpiringSoon(token: string | null): boolean {
    if (!token) return true;
    try {
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) return true;
      const payload = JSON.parse(atob(payloadBase64));
      if (!payload.exp) return false;
      return payload.exp * 1000 <= Date.now() + 30000;
    } catch {
      return false;
    }
  }

  private async getValidAccessToken(): Promise<string> {
    if (this.currentToken && this.isTokenExpiringSoon(this.currentToken)) {
      try {
        await fetchWithAuth(`${BASE_API}/Users/profile`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.currentToken}`
          }
        });
      } catch {
        // Si el refresh falla, fetchWithAuth dispara 'auth-expired' automáticamente
      }
    }
    return this.currentToken || '';
  }

  private buildHubConnection(transport?: signalR.HttpTransportType): signalR.HubConnection {
    const conn = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => this.getValidAccessToken(),
        withCredentials: false,
        ...(transport ? { transport } : {})
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    conn.on('StockUpdated', (raw: any) => {
      const normalized: StockUpdateNotification = {
        productId: raw.productId ?? raw.ProductId,
        currentStock: raw.currentStock ?? raw.CurrentStock ?? 0,
        reservedStock: raw.reservedStock ?? raw.ReservedStock ?? 0,
        availableStock: raw.availableStock ?? raw.AvailableStock ?? 0
      };
      this.stockListeners.forEach((listener) => listener(normalized));
    });

    conn.on('WorkTasksUpdated', (raw: any) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('worktasks-updated', { detail: raw }));
      }
    });

    conn.onreconnected(() => {
      this.reconnectListeners.forEach((listener) => listener());
    });

    return conn;
  }

  async connect(token: string): Promise<void> {
    this.currentToken = token;

    if (this.connection) {
      if (this.connection.state === signalR.HubConnectionState.Connected) {
        return;
      }
      if (this.startPromise) {
        return this.startPromise;
      }
    }

    this.connection = this.buildHubConnection(signalR.HttpTransportType.WebSockets);

    this.startPromise = this.connection
      .start()
      .catch(async () => {
        // Fallback automático a SSE / LongPolling si el proxy aún no tiene Upgrade habilitado
        this.connection = this.buildHubConnection(
          signalR.HttpTransportType.ServerSentEvents | signalR.HttpTransportType.LongPolling
        );
        await this.connection.start().catch((err) => {
          console.warn('[InventoryHub] No se pudo iniciar la conexión en tiempo real:', err);
        });
      })
      .finally(() => {
        this.startPromise = null;
      });

    return this.startPromise;
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
      } catch {
        // Ignorar error al desconectar
      } finally {
        this.connection = null;
      }
    }
  }

  getConnectionId(): string | null {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      return this.connection.connectionId;
    }
    return null;
  }

  onStockUpdated(listener: StockUpdateListener): () => void {
    this.stockListeners.add(listener);
    return () => {
      this.stockListeners.delete(listener);
    };
  }

  onReconnected(listener: ReconnectListener): () => void {
    this.reconnectListeners.add(listener);
    return () => {
      this.reconnectListeners.delete(listener);
    };
  }

  private async ensureConnected(): Promise<boolean> {
    if (this.startPromise) {
      await this.startPromise;
    }
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      return true;
    }
    if (this.currentToken) {
      await this.connect(this.currentToken);
    }
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  async setItemQuantity(
    presentationId: number,
    quantity: number
  ): Promise<ApiResponse<StockReservationResult> | null> {
    if (!(await this.ensureConnected()) || !this.connection) {
      return null;
    }

    try {
      return await this.connection.invoke<ApiResponse<StockReservationResult>>(
        'SetItemQuantity',
        presentationId,
        quantity
      );
    } catch (error) {
      console.warn('[InventoryHub] Error en SetItemQuantity:', error);
      return null;
    }
  }

  async removeItem(presentationId: number): Promise<boolean> {
    if (!(await this.ensureConnected()) || !this.connection) {
      return false;
    }

    try {
      await this.connection.invoke('RemoveItem', presentationId);
      return true;
    } catch (error) {
      console.warn('[InventoryHub] Error en RemoveItem:', error);
      return false;
    }
  }

  async clearCart(): Promise<boolean> {
    if (!(await this.ensureConnected()) || !this.connection) {
      return false;
    }

    try {
      await this.connection.invoke('ClearCart');
      return true;
    } catch (error) {
      console.warn('[InventoryHub] Error en ClearCart:', error);
      return false;
    }
  }
}

export const inventoryHubService = new InventoryHubService();
