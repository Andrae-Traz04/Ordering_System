import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../api/client'
import { Product } from '../types'
import { colors, radii, spacing, typeScale } from '../theme/design'

type ProductForm = {
  name: string
  description: string
  price: string
  category: string
  emoji: string
  badge: string
  is_active: boolean
}

const CATEGORIES = ['Electronics', 'Beauty', 'Fitness', 'Gifts', 'Kitchen', 'Others']
const CATEGORY_FILTERS = ['All', ...CATEGORIES]
const BADGES = ['', 'New', 'Best Seller', 'Popular']
const EMOJIS = ['📦', '🎁', '🎈', '📱', '⌚', '🍫', '☕', '🎮', '🍳', '🧴', '🏃', '🛒']

function defaultForm(): ProductForm {
  return {
    name: '',
    description: '',
    price: '',
    category: 'Others',
    emoji: '📦',
    badge: '',
    is_active: true,
  }
}

function ProductEditorModal({
  visible,
  mode,
  initial,
  onClose,
  onSaved,
}: {
  visible: boolean
  mode: 'add' | 'edit'
  initial: Product | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<ProductForm>(defaultForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!visible) return

    if (mode === 'edit' && initial) {
      setForm({
        name: initial.name ?? '',
        description: (initial as any).description ?? '',
        price: String(initial.price ?? ''),
        category: initial.category ?? 'Others',
        emoji: initial.emoji ?? '📦',
        badge: (initial as any).badge ?? '',
        is_active: (initial as any).is_active ?? true,
      })
    } else {
      setForm(defaultForm())
    }

    setError('')
    setSaving(false)
  }, [visible, mode, initial])

  const set = (k: keyof ProductForm, v: any) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    const name = form.name.trim()
    const priceNum = parseFloat(form.price)

    if (!name) return setError('Name is required')
    if (Number.isNaN(priceNum) || priceNum < 0) return setError('Valid price is required')

    setSaving(true)
    setError('')
    try {
      const payload: any = {
        name,
        description: form.description,
        price: priceNum,
        category: form.category,
        emoji: form.emoji,
        badge: form.badge,
        is_active: form.is_active,
      }

      if (mode === 'edit' && initial) {
        await updateProduct(initial.id, payload)
      } else {
        await createProduct(payload)
      }

      onSaved()
      onClose()
    } catch (e: any) {
      const detail = e?.response?.data ? Object.values(e.response.data).flat().join(', ') : ''
      setError(detail || 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{mode === 'edit' ? 'Edit Product' : 'Add New Product'}</Text>
              <Text style={styles.modalSubtitle}>
                {mode === 'edit' ? 'Update product details' : 'Create a product for your catalog'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Text style={styles.modalCloseText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {!!error && <Text style={styles.modalError}>{error}</Text>}

            <Text style={styles.label}>Product Icon</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
              <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                {EMOJIS.map(em => (
                  <TouchableOpacity
                    key={em}
                    onPress={() => set('emoji', em)}
                    style={[styles.emojiPick, form.emoji === em && styles.emojiPickActive]}
                  >
                    <Text style={styles.emojiPickText}>{em}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.label}>Product Name *</Text>
            <TextInput
              value={form.name}
              onChangeText={t => set('name', t)}
              placeholder="e.g. Smart Watch"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <Text style={[styles.label, { marginTop: spacing.sm }]}>Description</Text>
            <TextInput
              value={form.description}
              onChangeText={t => set('description', t)}
              placeholder="Short description..."
              placeholderTextColor={colors.textMuted}
              style={[styles.input, styles.textArea]}
              multiline
            />

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Price (₱) *</Text>
                <TextInput
                  value={form.price}
                  onChangeText={t => set('price', t)}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: spacing.xs, paddingBottom: spacing.xs }}>
                    {CATEGORIES.map(cat => (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => set('category', cat)}
                        style={[styles.smallChip, form.category === cat && styles.smallChipActive]}
                      >
                        <Text
                          style={[
                            styles.smallChipText,
                            form.category === cat && styles.smallChipTextActive,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>

            <Text style={[styles.label, { marginTop: spacing.sm }]}>Badge</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: spacing.xs, paddingBottom: spacing.xs }}>
                {BADGES.map(b => (
                  <TouchableOpacity
                    key={b || 'none'}
                    onPress={() => set('badge', b)}
                    style={[
                      styles.smallChip,
                      (form.badge || '') === (b || '') && styles.smallChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.smallChipText,
                        (form.badge || '') === (b || '') && styles.smallChipTextActive,
                      ]}
                    >
                      {b ? b : '—'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm }}>
              <Text style={styles.label}>Visibility</Text>
              <TouchableOpacity
                onPress={() => set('is_active', !form.is_active)}
                style={[
                  styles.visibilityBtn,
                  form.is_active ? styles.visibilityBtnActive : styles.visibilityBtnInactive,
                ]}
              >
                <Text style={styles.visibilityBtnText}>
                  {form.is_active ? '👁 Active' : '🚫 Inactive'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 16 }} />

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={onClose}>
                <Text style={styles.actionBtnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnPrimary, saving && { opacity: 0.6 }]}
                onPress={submit}
                disabled={saving}
              >
                <Text style={styles.actionBtnPrimaryText}>
                  {saving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Add Product'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

function ProductDeleteModal({
  visible,
  product,
  onClose,
  onDeleted,
}: {
  visible: boolean
  product: Product | null
  onClose: () => void
  onDeleted: () => void
}) {
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!visible) setDeleting(false)
  }, [visible])

  const handle = async () => {
    if (!product) return
    setDeleting(true)
    try {
      await deleteProduct(product.id)
      onDeleted()
      onClose()
    } catch {
      setDeleting(false)
      Alert.alert('Error', 'Failed to delete product')
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.deleteCard}>
          <View style={styles.deleteIconWrap}>
            <Text style={styles.deleteIcon}>🛑</Text>
          </View>
          <Text style={styles.deleteTitle}>Delete Product?</Text>
          <Text style={styles.deleteBody}>
            Remove{' '}
            <Text style={{ fontWeight: '800', color: colors.textPrimary }}>{product?.name}</Text> from your catalog? This cannot be undone.
          </Text>

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={onClose}>
              <Text style={styles.actionBtnSecondaryText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnDanger, deleting && { opacity: 0.7 }]}
              onPress={handle}
              disabled={deleting}
            >
              <Text style={styles.actionBtnDangerText}>{deleting ? 'Deleting...' : 'Delete'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

export default function OwnerProductsScreen() {
  const { user } = useAuth()

  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const [products, setProducts] = useState<Product[]>([])
  const [category, setCategory] = useState<string>('All')
  const [search, setSearch] = useState<string>('')

  const [editorVisible, setEditorVisible] = useState(false)
  const [editorMode, setEditorMode] = useState<'add' | 'edit'>('add')
  const [editorProduct, setEditorProduct] = useState<Product | null>(null)

  const [deleteVisible, setDeleteVisible] = useState(false)
  const [deleteProductState, setDeleteProductState] = useState<Product | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetchProducts()
      setProducts(res.data?.products || res.data || [])
    } catch {
      setError('Failed to load products')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const onRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const filteredProducts = useMemo(() => {
    const s = search.trim().toLowerCase()
    return products.filter(p => {
      const matchCategory = category === 'All' || p.category === category
      const matchSearch = s === '' || p.name?.toLowerCase().includes(s)
      return matchCategory && matchSearch
    })
  }, [products, category, search])

  const onSaved = () => load()

  const toggleActive = async (p: Product) => {
    try {
      await updateProduct(p.id, { is_active: !p.is_active })
      await load()
    } catch {
      Alert.alert('Error', 'Failed to update visibility')
    }
  }

  const renderProduct = ({ item }: { item: Product }) => {
    return (
      <View style={styles.productCard}>
        <View style={styles.productImage}>
          <Text style={styles.productEmoji}>{item.emoji ?? '📦'}</Text>
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.productCategory}>{item.category}</Text>
          <Text style={styles.productPrice}>₱{Number(item.price).toFixed(2)}</Text>
          {item.is_active === false && <Text style={styles.inactive}>Inactive</Text>}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.smallActionBtn}
            onPress={() => {
              setEditorMode('edit')
              setEditorProduct(item)
              setEditorVisible(true)
            }}
          >
            <Text style={styles.smallActionText}>✏️ Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.smallActionBtnDanger}
            onPress={() => {
              setDeleteProductState(item)
              setDeleteVisible(true)
            }}
          >
            <Text style={styles.smallActionTextDanger}>🗑 Delete</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs }}>
          <TouchableOpacity
            style={[
              styles.visibilityChip,
              item.is_active ? styles.visibilityChipActive : styles.visibilityChipInactive,
            ]}
            onPress={() => toggleActive(item)}
          >
            <Text style={styles.visibilityChipText}>
              {item.is_active ? '👁 Active' : '🚫 Inactive'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.id.toString()}
        renderItem={renderProduct}
        numColumns={2}
        columnWrapperStyle={styles.productRow}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View>
                <Text style={styles.welcome}>Hi {user?.first_name || 'there'}!</Text>
                <Text style={styles.title}>Products</Text>
              </View>

              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => {
                  setEditorMode('add')
                  setEditorProduct(null)
                  setEditorVisible(true)
                }}
              >
                <Text style={styles.addBtnText}>＋ Add Product</Text>
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.filterRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search products..."
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
              />

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {CATEGORY_FILTERS.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryBtn, category === cat && styles.categoryBtnActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryBtnText,
                        category === cat && styles.categoryBtnTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={styles.sectionTitle}>
              {filteredProducts.length} product{filteredProducts.length === 1 ? '' : 's'}
            </Text>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>No products available</Text>}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />

      <ProductEditorModal
        visible={editorVisible}
        mode={editorMode}
        initial={editorProduct}
        onClose={() => setEditorVisible(false)}
        onSaved={onSaved}
      />

      <ProductDeleteModal
        visible={deleteVisible}
        product={deleteProductState}
        onClose={() => setDeleteVisible(false)}
        onDeleted={load}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBottom,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgBottom,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  welcome: {
    color: colors.textSecondary,
    fontSize: typeScale.body,
    fontWeight: '600',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '900',
    marginTop: 2,
  },
  addBtn: {
    marginTop: spacing.xs,
    backgroundColor: '#7A57E8',
    borderRadius: radii.pill,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#A98DF6',
    alignItems: 'center',
  },
  addBtnText: {
    color: colors.textPrimary,
    fontWeight: '900',
    fontSize: 12,
  },
  errorText: {
    color: '#ff6b6b',
    marginBottom: spacing.sm,
  },
  filterRow: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    backgroundColor: colors.panelSoft,
    borderRadius: radii.sm,
    padding: spacing.sm,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: '#A98DF6',
    marginBottom: spacing.sm,
  },
  categoryBtn: {
    backgroundColor: colors.panelSoft,
    borderWidth: 1,
    borderColor: '#A98DF6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    marginRight: spacing.xs,
  },
  categoryBtnActive: {
    backgroundColor: '#7A57E8',
  },
  categoryBtnText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  categoryBtnTextActive: {
    color: colors.textPrimary,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  productRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    flex: 1,
    backgroundColor: colors.panel,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#A98DF6',
    padding: spacing.sm,
    marginBottom: spacing.sm,
    marginHorizontal: 2,
  },
  productImage: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  productEmoji: {
    fontSize: 34,
  },
  productInfo: {
    paddingBottom: spacing.sm,
  },
  productName: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 14,
    marginTop: spacing.xs,
  },
  productCategory: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
    fontWeight: '700',
  },
  productPrice: {
    color: colors.accent,
    fontWeight: '900',
    fontSize: 16,
    marginTop: 6,
  },
  inactive: {
    color: '#ff6b6b',
    marginTop: 4,
    fontWeight: '700',
    fontSize: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  smallActionBtn: {
    flex: 1,
    backgroundColor: colors.panelSoft,
    borderRadius: radii.sm,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#6C47FF',
  },
  smallActionText: {
    color: '#6C47FF',
    fontWeight: '900',
    fontSize: 11,
    textAlign: 'center',
  },
  smallActionBtnDanger: {
    flex: 1,
    backgroundColor: '#fef2f2',
    borderRadius: radii.sm,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  smallActionTextDanger: {
    color: '#ef4444',
    fontWeight: '900',
    fontSize: 11,
    textAlign: 'center',
  },
  visibilityChip: {
    flex: 1,
    borderRadius: radii.pill,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  visibilityChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  visibilityChipInactive: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  visibilityChipText: {
    color: colors.textSecondary,
    fontWeight: '900',
    fontSize: 10,
    textAlign: 'center',
  },
  empty: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17,24,39,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modalHeader: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: colors.textPrimary,
    fontWeight: '900',
    fontSize: 16,
  },
  modalSubtitle: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 12,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    color: '#6b7280',
    fontWeight: '900',
    fontSize: 16,
    lineHeight: 16,
  },
  modalContent: {
    padding: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  modalError: {
    color: '#ef4444',
    backgroundColor: '#fef2f2',
    borderRadius: radii.sm,
    padding: spacing.sm,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  label: {
    color: colors.textMuted,
    fontWeight: '900',
    fontSize: 11,
    textTransform: 'uppercase' as any,
    letterSpacing: 0.3,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fafafa',
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  emojiPick: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  emojiPickActive: {
    borderColor: '#6C47FF',
    backgroundColor: '#EDEAFF',
  },
  emojiPickText: {
    fontSize: 18,
  },
  smallChip: {
    borderRadius: 999,
    backgroundColor: colors.panelSoft,
    borderWidth: 1,
    borderColor: '#A98DF6',
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: 'center',
  },
  smallChipActive: {
    backgroundColor: '#7A57E8',
    borderColor: '#7A57E8',
  },
  smallChipText: {
    color: colors.textSecondary,
    fontWeight: '900',
    fontSize: 11,
  },
  smallChipTextActive: {
    color: '#fff',
  },
  visibilityBtn: {
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  visibilityBtnActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  visibilityBtnInactive: {
    backgroundColor: '#fafafa',
    borderColor: '#e5e7eb',
  },
  visibilityBtnText: {
    color: colors.textSecondary,
    fontWeight: '900',
    fontSize: 12,
  },
  actionBtn: {
    flex: 1,
    borderRadius: radii.sm,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actionBtnPrimary: {
    backgroundColor: '#5A2ECB',
    borderColor: '#5A2ECB',
  },
  actionBtnPrimaryText: {
    color: colors.textSecondary,
    fontWeight: '900',
    fontSize: 13,
  },
  actionBtnSecondary: {
    backgroundColor: '#fff',
    borderColor: '#e5e7eb',
  },
  actionBtnSecondaryText: {
    color: '#6b7280',
    fontWeight: '900',
    fontSize: 13,
  },
  actionBtnDanger: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  actionBtnDangerText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 13,
  },

  deleteCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: spacing.lg,
  },
  deleteIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  deleteIcon: {
    fontSize: 24,
  },
  deleteTitle: {
    color: colors.textPrimary,
    fontWeight: '900',
    fontSize: 17,
    marginBottom: 8,
    textAlign: 'center',
  },
  deleteBody: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
})

