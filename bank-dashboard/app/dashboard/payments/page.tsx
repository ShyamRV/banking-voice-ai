"use client"

import { useState, useEffect } from "react"
import { paymentAPI } from "@/lib/payment-api"
import { Transaction, PaymentStats, TransactionStatus, formatFET, formatTxHash, formatAddress, getStatusColor, getExplorerUrl } from "@/lib/payment-types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RefreshCw, TrendingUp, CheckCircle2, Clock, XCircle, DollarSign, ExternalLink } from "lucide-react"
import { format } from "date-fns"

export default function PaymentsPage() {
  const [stats, setStats] = useState<PaymentStats>({
    total_transactions: 0,
    completed_transactions: 0,
    pending_transactions: 0,
    failed_transactions: 0,
    cancelled_transactions: 0,
    total_volume: 0,
    completed_volume: 0,
    success_rate: 0,
    average_transaction_time: 0,
  })
  
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  // Fetch dashboard stats
  const fetchStats = async () => {
    const response = await paymentAPI.getDashboardStats()
    if (response.data) {
      setStats(response.data)
      setError(null)
    } else if (response.error) {
      setError(response.error)
    }
  }

  // Fetch transactions
  const fetchTransactions = async () => {
    setLoading(true)
    const response = await paymentAPI.getPaymentHistory(50, 0)
    if (response.data) {
      // Ensure we always set an array
      setTransactions(Array.isArray(response.data) ? response.data : [])
      setError(null)
    } else if (response.error) {
      setError(response.error)
      setTransactions([]) // Set empty array on error
    }
    setLoading(false)
  }

  // Fetch transaction details
  const viewTransactionDetails = async (transactionId: string) => {
    const response = await paymentAPI.getPaymentDetails(transactionId)
    if (response.data) {
      setSelectedTransaction(response.data)
      setDetailsOpen(true)
    } else if (response.error) {
      alert(`Failed to fetch transaction details: ${response.error}`)
    }
  }

  // Refresh data
  const handleRefresh = () => {
    fetchStats()
    fetchTransactions()
  }

  // Initial data fetch
  useEffect(() => {
    fetchStats()
    fetchTransactions()
    
    // Set up polling for real-time updates
    const interval = setInterval(() => {
      fetchStats()
      fetchTransactions()
    }, 30000) // Update every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payments</h1>
          <p className="text-sm text-muted-foreground">
            Manage and monitor blockchain transactions
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Error Banner */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_transactions}</div>
            <p className="text-xs text-muted-foreground">
              All time transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed_transactions}</div>
            <p className="text-xs text-muted-foreground">
              Successfully processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending_transactions}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting confirmation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFET(stats.total_volume)} FET</div>
            <p className="text-xs text-muted-foreground">
              {(stats.success_rate * 100).toFixed(1)}% success rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            View and manage your blockchain payment transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No transactions found
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-mono text-sm">
                        {formatTxHash(tx.id, 8)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatFET(tx.amount)} FET
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {formatAddress(tx.recipient_address)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          style={{
                            backgroundColor: `${getStatusColor(tx.status)}20`,
                            color: getStatusColor(tx.status),
                            borderColor: getStatusColor(tx.status),
                          }}
                        >
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(tx.created_at), "MMM dd, yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewTransactionDetails(tx.id)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              Complete information about this blockchain transaction
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Transaction ID</p>
                  <p className="text-sm font-mono">{selectedTransaction.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge
                    variant="outline"
                    style={{
                      backgroundColor: `${getStatusColor(selectedTransaction.status)}20`,
                      color: getStatusColor(selectedTransaction.status),
                      borderColor: getStatusColor(selectedTransaction.status),
                    }}
                  >
                    {selectedTransaction.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
                  <p className="text-lg font-bold">{formatFET(selectedTransaction.amount)} FET</p>
                </div>
                {selectedTransaction.block_height && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Block Height</p>
                    <p className="text-sm font-mono">{selectedTransaction.block_height}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Sender Address</p>
                <p className="text-sm font-mono break-all">{selectedTransaction.sender_address}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Recipient Address</p>
                <p className="text-sm font-mono break-all">{selectedTransaction.recipient_address}</p>
              </div>

              {selectedTransaction.transaction_hash && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Transaction Hash</p>
                  <p className="text-sm font-mono break-all">{selectedTransaction.transaction_hash}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="text-sm">{format(new Date(selectedTransaction.created_at), "PPpp")}</p>
                </div>
                {selectedTransaction.completed_at && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completed</p>
                    <p className="text-sm">{format(new Date(selectedTransaction.completed_at), "PPpp")}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedTransaction?.transaction_hash && (
              <Button
                variant="outline"
                onClick={() => window.open(getExplorerUrl(selectedTransaction.transaction_hash!), "_blank")}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View on Explorer
              </Button>
            )}
            <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
