// lib/payment-api.ts
/**
 * API Client for Payment System
 * Handles all communication with FastAPI backend
 */

import {
  Transaction,
  PaymentRequest,
  PaymentCommit,
  PaymentCancel,
  PaymentStats,
  UserProfile,
  ApiResponse,
} from "./payment-types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"

class PaymentAPI {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
    // Try to get token from localStorage (client-side only)
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("auth_token")
    }
  }

  // Set authentication token
  setToken(token: string) {
    this.token = token
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token)
    }
  }

  // Clear authentication token
  clearToken() {
    this.token = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
    }
  }

  // Get authorization headers
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`
    }
    return headers
  }

  // Generic fetch wrapper with error handling
  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          error: data.detail || data.message || "An error occurred",
        }
      }

      return { data }
    } catch (error) {
      console.error("API Error:", error)
      return {
        error: error instanceof Error ? error.message : "Network error",
      }
    }
  }

  // ===== Authentication Endpoints =====

  async login(email: string, password: string): Promise<ApiResponse<{ access_token: string; token_type: string }>> {
    const response = await this.fetch<{ access_token: string; token_type: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
    
    if (response.data?.access_token) {
      this.setToken(response.data.access_token)
    }
    
    return response
  }

  async register(
    email: string,
    password: string,
    bank_credentials: Record<string, any>
  ): Promise<ApiResponse<{ user_id: string; email: string }>> {
    return this.fetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, bank_credentials }),
    })
  }

  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return this.fetch<UserProfile>("/auth/profile")
  }

  async verifyBankCredentials(): Promise<ApiResponse<{ verified: boolean; message: string }>> {
    return this.fetch("/auth/verify-bank-credentials", {
      method: "POST",
    })
  }

  // ===== Payment Endpoints =====

  async requestPayment(paymentData: PaymentRequest): Promise<ApiResponse<Transaction>> {
    return this.fetch<Transaction>("/payments/request", {
      method: "POST",
      body: JSON.stringify(paymentData),
    })
  }

  async commitPayment(commitData: PaymentCommit): Promise<ApiResponse<{ message: string; transaction_id: string; transaction_hash: string; status: string }>> {
    return this.fetch("/payments/commit", {
      method: "POST",
      body: JSON.stringify(commitData),
    })
  }

  async cancelPayment(cancelData: PaymentCancel): Promise<ApiResponse<{ message: string; transaction_id: string; status: string }>> {
    return this.fetch("/payments/cancel", {
      method: "POST",
      body: JSON.stringify(cancelData),
    })
  }

  async getPaymentDetails(transactionId: string): Promise<ApiResponse<Transaction>> {
    return this.fetch<Transaction>(`/payments/${transactionId}`)
  }

  async getPaymentHistory(limit: number = 50, offset: number = 0): Promise<ApiResponse<Transaction[]>> {
    return this.fetch<Transaction[]>(`/payments/history?limit=${limit}&offset=${offset}`)
  }

  // ===== Dashboard Endpoints =====

  async getDashboardStats(): Promise<ApiResponse<PaymentStats>> {
    return this.fetch<PaymentStats>("/dashboard/stats")
  }

  async getDashboardTransactions(days: number = 7): Promise<ApiResponse<{ transactions: Transaction[]; period: string }>> {
    return this.fetch(`/dashboard/transactions?days=${days}`)
  }

  // ===== Subscription Endpoints =====

  async getSubscriptionPlans(): Promise<ApiResponse<any>> {
    return this.fetch("/subscriptions/plans")
  }

  async subscribeToPlan(tier: string): Promise<ApiResponse<any>> {
    return this.fetch("/subscriptions/subscribe", {
      method: "POST",
      body: JSON.stringify({ tier }),
    })
  }

  async getCurrentSubscription(): Promise<ApiResponse<any>> {
    return this.fetch("/subscriptions/current")
  }

  // ===== Health Check =====

  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.fetch("/health")
  }
}

// Export singleton instance
export const paymentAPI = new PaymentAPI()

// Export class for custom instances
export default PaymentAPI