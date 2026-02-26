// lib/payment-types.ts
/**
 * TypeScript types and interfaces for the payment system
 * Integrates with FastAPI backend and Fetch.ai blockchain
 */

export enum TransactionStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export enum SubscriptionTier {
  BASIC = "1500",
  PREMIUM = "3000",
  ENTERPRISE = "6000",
}

export enum PaymentEventType {
  REQUEST = "REQUESTPAYMENT",
  COMMIT = "COMPLETEPAYMENT",
  CANCEL = "CANCELPAYMENT",
}

export interface Transaction {
  id: string
  user_id: string
  transaction_hash: string | null
  block_height: number | null
  sender_address: string
  recipient_address: string
  amount: number
  status: TransactionStatus
  request_type: string | null
  subscription_tier: SubscriptionTier | null
  verified: boolean
  verification_data: Record<string, any> | null
  created_at: string
  completed_at: string | null
  metadata: Record<string, any> | null
  error_message: string | null
}

export interface PaymentRequest {
  recipient_address: string
  amount: number
  subscription_tier: SubscriptionTier
}

export interface PaymentCommit {
  transaction_id: string
  transaction_hash: string
}

export interface PaymentCancel {
  transaction_id: string
  reason?: string
}

export interface PaymentStats {
  total_transactions: number
  completed_transactions: number
  pending_transactions: number
  failed_transactions: number
  cancelled_transactions: number
  total_volume: number
  completed_volume: number
  success_rate: number
  average_transaction_time: number
}

export interface UserProfile {
  user_id: string
  email: string
  subscription_tier: SubscriptionTier
  wallet_address: string
  bank_verified: boolean
  created_at: string
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

// Helper function to format FET amounts
export const formatFET = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(amount)
}

// Helper function to get status color
export const getStatusColor = (status: TransactionStatus): string => {
  const colors: Record<TransactionStatus, string> = {
    [TransactionStatus.PENDING]: "#FFA500",
    [TransactionStatus.COMPLETED]: "#4CAF50",
    [TransactionStatus.FAILED]: "#F44336",
    [TransactionStatus.CANCELLED]: "#9E9E9E",
  }
  return colors[status] || "#000000"
}

// Helper function to get subscription tier price
export const getSubscriptionPrice = (tier: SubscriptionTier): number => {
  return parseInt(tier)
}

// Helper function to format transaction hash for display
export const formatTxHash = (hash: string | null, length: number = 12): string => {
  if (!hash) return "Pending"
  return hash.length > length ? `${hash.substring(0, length)}...` : hash
}

// Helper function to format wallet address for display
export const formatAddress = (address: string, length: number = 12): string => {
  return address.length > length ? `${address.substring(0, length)}...` : address
}

// Helper function to get explorer URL
export const getExplorerUrl = (txHash: string, network: "testnet" | "mainnet" = "testnet"): string => {
  const baseUrl = network === "testnet" 
    ? "https://explore-dorado.fetch.ai" 
    : "https://explore.fetch.ai"
  return `${baseUrl}/transactions/${txHash}`
}
