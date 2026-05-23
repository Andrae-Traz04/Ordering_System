import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NativeStackScreenProps } from '@react-navigation/native-stack'

import { useRoute, useNavigation } from '@react-navigation/native'

import { useAuth } from '../context/AuthContext'
import {
  fetchOrder,
  updateStatus,
  cancelOrder,
  deleteOrder,
  submitReview,
} from '../api/client'
import { Order } from '../types'
import { colors, radii, spacing, typeScale } from '../theme/design'

type RouteParams = {
  orderId: number
}

const NEXT_STATUS: Record<string, string | null> = {
  pending: 'processing',
  processing: 'shipped',
  shipped: 'completed',
  completed: null,
}

const NEXT_LABEL: Record<string, string> = {
  processing: 'Start Processing',
  shipped: 'Mark as Shipped',
  completed: 'Mark as Completed',
}

function StarRating({ value }: { value: number }) {
  // Simple star renderer (no touch/hover). Mobile parity target: display + submit review.
  const stars = [1, 2, 3, 4, 5]
  return (
    <View style={styles.starsRow}>
      {stars.map((s) => (
        <Text key={s} style={[styles.star, value >= s ? styles.starOn : styles.starOff]}>
          ★
        </Text>
      ))}
    </View>
  )
}

export default function OrderDetailScreen() {
  const { user } = useAuth()
  const navigation = useNavigation<any>()
  const route = useRoute<any>()

  const orderId: number = (route.params?.orderId ?? route.params?.id) as number

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [updating, setUpdating] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Review state (subset parity with frontend)
  const [reviewRating, setReviewRating] = useState<number>(5)
  const [reviewComment, setReviewComment] = useState<string>('')
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')

  const userRole = user?.role || (user as any)?.profile?.role
  const isAdmin = userRole === 'admin'
  const isUser = userRole === 'user'
  const isMyOrder = (order as any)?.created_by_id === (user as any)?.id
  const canReview = isUser && isMyOrder && order?.status === 'completed' && !(order as any)?.review
  const hasReview = !!(order as any)?.review

  const nextStatus = useMemo(() => {
    const st = (order?.status || '').toLowerCase()
    return NEXT_STATUS[st] ?? null
  }, [order?.status])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetchOrder(orderId)
      const data = res.data
      setOrder(data)
    } catch {
      setError('Order not found.')
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    if (!orderId && orderId !== 0) return
    load()
  }, [load, orderId])

  const advance = async () => {
    if (!order || !nextStatus) return
    setUpdating(true)
    setError('')
    try {
      await updateStatus(order.id, nextStatus, `Manually advanced to ${nextStatus}`)
      await load()
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to update status.')
    } finally {
      setUpdating(false)
    }
  }

  const handleCancel = async () => {
    if (!order) return
    setCancelling(true)
    try {
      await cancelOrder(order.id)
      await load()
      Alert.alert('Success', 'Order cancelled successfully.')
    } catch {
      Alert.alert('Error', 'Failed to cancel order')
    } finally {
      setCancelling(false)
    }
  }

  const handleDelete = async () => {
    if (!order) return
    Alert.alert('Delete order?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true)
          try {
            await deleteOrder(order.id)
            navigation.goBack()
          } catch {
            Alert.alert('Error', 'Failed to delete order')
          } finally {
            setDeleting(false)
          }
        },
      },
    ])
  }

  const submitReviewAction = async () => {
    if (!order) return
    setReviewLoading(true)
    setReviewError('')
    setReviewSuccess('')
    try {
      await submitReview(order.id, { rating: reviewRating, comment: reviewComment })
      setReviewSuccess('Review submitted!')
      setReviewComment('')
      await load()
      setTimeout(() => setReviewSuccess(''), 3000)
    } catch (e: any) {
      setReviewError(e?.response?.data?.detail || 'Failed to submit review.')
    } finally {
      setReviewLoading(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingScreen}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    )
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>{error || 'Order not found.'}</Text>
        </View>
      </SafeAreaView>
    )
  }

  const orderItems = (order as any).items || []
  const statusHistory = (order as any).status_history || []
  const review = (order as any).review

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <Text style={styles.orderNumber}>Order #{order.order_number || order.id}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>{order.status}</Text>
            </View>
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Workflow */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Workflow</Text>

          {isAdmin && nextStatus ? (
            <TouchableOpacity
              style={[styles.primaryBtn, updating && styles.primaryBtnDisabled]}
              disabled={updating}
              onPress={advance}
            >
              <Text style={styles.primaryBtnText}>{updating ? 'Updating...' : `→ ${NEXT_LABEL[nextStatus] || nextStatus}`}</Text>
            </TouchableOpacity>
          ) : null}

          {isUser && nextStatus && order.status !== 'cancelled' ? (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>⏳ Your order is being processed. We will update you soon!</Text>
            </View>
          ) : null}

          {!nextStatus && order.status !== 'cancelled' ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>✓ This order has been completed</Text>
            </View>
          ) : null}

          {order.status === 'cancelled' ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>✕ This order has been cancelled</Text>
            </View>
          ) : null}
        </View>

        {/* Customer details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer Details</Text>
          <Text style={styles.fieldLabel}>Name</Text>
          <Text style={styles.fieldValue}>{(order as any).customer_name || '—'}</Text>
          <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Email</Text>
          <Text style={styles.fieldValue}>{(order as any).customer_email || '—'}</Text>
        </View>

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Items ({(order as any).item_count || orderItems.length})</Text>

          {orderItems.length === 0 ? (
            <Text style={styles.mutedText}>No items.</Text>
          ) : (
            orderItems.map((it: any) => (
              <View key={it.id} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{it.product_name || it.product || 'Product'}</Text>
                  <Text style={styles.itemSub}>Qty {it.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>₱{Number(it.subtotal || it.unit_price).toFixed(2)}</Text>
              </View>
            ))
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₱{Number((order as any).total_amount || 0).toFixed(2)}</Text>
          </View>
        </View>

        {/* Status history */}
        {statusHistory.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Status History</Text>
            {statusHistory.map((h: any) => (
              <View key={h.id} style={styles.historyRow}>
                <View style={styles.historyDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyText}>
                    {h.from_status ? `${h.from_status} → ${h.to_status}` : `Order created as ${h.to_status}`}
                    {h.note ? ` — ${h.note}` : ''}
                  </Text>
                  <Text style={styles.historyTime}>
                    {new Date(h.changed_at).toLocaleString()}
                    {h.changed_by_username ? ` by ${h.changed_by_username}` : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* Review */}
        {(canReview || (hasReview && (isMyOrder || isAdmin))) ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{hasReview ? 'Customer Review' : 'Leave a Review'}</Text>

            {hasReview ? (
              <View>
                <StarRating value={review?.rating || 0} />
                <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Comment</Text>
                <Text style={styles.fieldValue}>{review?.comment || 'No comment left.'}</Text>
              </View>
            ) : canReview ? (
              <View>
                {/* Rating picker (tap stars) */}
                <Text style={[styles.fieldLabel, { marginTop: 8 }]}>Your Rating *</Text>
                <View style={styles.starsPickerRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <TouchableOpacity key={s} onPress={() => setReviewRating(s)}>
                      <Text style={[styles.starPick, reviewRating >= s ? styles.starOn : styles.starOff]}>★</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Comment (optional)</Text>
                <TextInput
                  value={reviewComment}
                  onChangeText={setReviewComment}
                  placeholder="Share your experience with this order..."
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  multiline
                />

                {reviewError ? <Text style={styles.errorText}>{reviewError}</Text> : null}
                {reviewSuccess ? <Text style={styles.successTextSmall}>{reviewSuccess}</Text> : null}

                <TouchableOpacity
                  style={[styles.primaryBtn, reviewLoading && styles.primaryBtnDisabled]}
                  disabled={reviewLoading}
                  onPress={submitReviewAction}
                >
                  <Text style={styles.primaryBtnText}>{reviewLoading ? 'Submitting...' : 'Submit Review'}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Cancel (user only, pending) */}
        {isUser && isMyOrder && order.status === 'pending' ? (
          <View style={styles.card}>
            <TouchableOpacity style={[styles.dangerBtn, cancelling && styles.primaryBtnDisabled]} disabled={cancelling} onPress={handleCancel}>
              <Text style={styles.dangerBtnText}>{cancelling ? 'Cancelling...' : 'Cancel Order'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Delete (admin only) */}
        {isAdmin ? (
          <View style={styles.card}>
            <TouchableOpacity style={[styles.dangerBtn, deleting && styles.primaryBtnDisabled]} disabled={deleting} onPress={handleDelete}>
              <Text style={styles.dangerBtnText}>{deleting ? 'Deleting...' : 'Delete Order'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBottom,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgBottom,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  emptyText: {
    color: colors.textSecondary,
    fontWeight: '700',
  },
  header: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  backBtn: {
    backgroundColor: colors.panel,
    borderRadius: radii.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#A98DF6',
  },
  backBtnText: {
    color: colors.textSecondary,
    fontWeight: '800',
    fontSize: 12,
  },
  headerRight: {
    flex: 1,
    marginLeft: spacing.sm,
    alignItems: 'flex-end',
  },
  orderNumber: {
    color: colors.textPrimary,
    fontWeight: '900',
    fontSize: 14,
    marginBottom: 6,
    textAlign: 'right',
  },
  statusBadge: {
    backgroundColor: '#5A2ECB',
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#9E84F4',
  },
  statusBadgeText: {
    color: colors.textSecondary,
    fontWeight: '800',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  card: {
    backgroundColor: colors.panel,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#A98DF6',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontWeight: '900',
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  primaryBtn: {
    marginTop: spacing.sm,
    backgroundColor: '#5A2ECB',
    borderRadius: radii.sm,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: colors.textSecondary,
    fontWeight: '900',
    fontSize: 13,
  },
  dangerBtn: {
    marginTop: spacing.sm,
    backgroundColor: '#ef4444',
    borderRadius: radii.sm,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  dangerBtnText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 13,
  },
  errorText: {
    color: '#ff6b6b',
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  successTextSmall: {
    color: '#10B981',
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  infoBox: {
    marginTop: spacing.sm,
    backgroundColor: '#EDEAFF',
    borderRadius: radii.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#9E84F4',
  },
  infoText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 12,
  },
  successBox: {
    marginTop: spacing.sm,
    backgroundColor: '#ECFDF5',
    borderRadius: radii.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  successText: {
    color: '#065F46',
    fontWeight: '800',
  },
  errorBox: {
    marginTop: spacing.sm,
    backgroundColor: '#fef2f2',
    borderRadius: radii.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorBoxText: {
    color: '#ef4444',
    fontWeight: '800',
  },
  fieldLabel: {
    color: colors.textMuted,
    fontWeight: '800',
    fontSize: 12,
  },
  fieldValue: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
    marginTop: 6,
  },
  mutedText: {
    color: colors.textMuted,
    fontWeight: '700',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EDEAFF',
  },
  itemName: {
    color: colors.textPrimary,
    fontWeight: '900',
    fontSize: 13,
  },
  itemSub: {
    color: colors.textMuted,
    fontWeight: '700',
    marginTop: 4,
    fontSize: 12,
  },
  itemPrice: {
    color: colors.accent,
    fontWeight: '900',
    fontSize: 12,
    marginLeft: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#EDEAFF',
  },
  totalLabel: {
    color: colors.textMuted,
    fontWeight: '800',
  },
  totalValue: {
    color: colors.accent,
    fontWeight: '900',
    fontSize: 18,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EDEAFF',
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#9B6DFF',
    marginTop: 6,
  },
  historyText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  historyTime: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 11,
    marginTop: 6,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: spacing.sm,
  },
  star: {
    fontSize: 18,
    marginRight: 2,
  },
  starPick: {
    fontSize: 18,
    marginRight: 2,
  },
  starOn: {
    color: '#F59E0B',
  },
  starOff: {
    color: '#E0D8FF',
  },
  input: {
    marginTop: spacing.xs,
    minHeight: 90,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: '#A98DF6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.panelSoft,
    color: colors.textPrimary,
    fontWeight: '700',
  },
})

