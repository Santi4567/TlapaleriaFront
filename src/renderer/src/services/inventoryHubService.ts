// src/services/inventoryHubService.ts
import * as signalR from '@microsoft/signalr';
import { ApiResponse, StockReservationResult, StockUpdateNotification } from '../types/product';

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

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => this.currentToken || '',
        withCredentials: true
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    this.connection.on('StockUpdated', (raw: any) => {
      const normalized: StockUpdateNotification = {
        productId: raw.productId ?? raw.ProductId,
        currentStock: raw.currentStock ?? raw.CurrentStock ?? 0,
        reservedStock: raw.reservedStock ?? raw.ReservedStock ?? 0,
        availableStock: raw.availableStock ?? raw.AvailableStock ?? 0
      };
      this.stockListeners.forEach((listener) => listener(normalized));
    });

    this.connection.onreconnected(() => {
      this.reconnectListeners.forEach((listener) => listener());
    });

    this.startPromise = this.connection
      .start()
      .catch((err) => {
        console.warn('[InventoryHub] No se pudo iniciar la conexión en tiempo real:', err);
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

  async setItemQuantity(
    presentationId: number,
    quantity: number
  ): Promise<ApiResponse<StockReservationResult> | null> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
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

  async removeItem(presentationId: number): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      await this.connection.invoke('RemoveItem', presentationId);
    } catch (error) {
      console.warn('[InventoryHub] Error en RemoveItem:', error);
    }
  }

  async clearCart(): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    try {
      await this.connection.invoke('ClearCart');
    } catch (error) {
      console.warn('[InventoryHub] Error en ClearCart:', error);
    }
  }
}

export const inventoryHubService = new InventoryHubService();
