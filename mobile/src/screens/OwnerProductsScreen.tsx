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
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/AuthContext'
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../api/client'
import * as ImagePicker from 'expo-image-picker'
import { Product } from '../types'
import { colors, radii, spacing, typography, shadows, typeScale } from '../theme/design'

const CATEGORIES = ['Electronics', 'Beauty', 'Fitness', 'Gifts', 'Kitchen', 'Others']

export default function OwnerProductsScreen() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Others',
    emoji: '📦',
    badge: '',
    is_active: true,
  })
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchProducts()
      setProducts(res.data?.products || res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadProducts()
    setRefreshing(false)
  }

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCategory = category === 'All' || p.category === category
      const matchSearch = search === '' || p.name?.toLowerCase().includes(search.toLowerCase())
      return matchCategory && matchSearch
    })
  }, [products, category, search])

  const openAddModal = () => {
    setEditingProduct(null)
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'Others',
      emoji: '📦',
      badge: '',
      is_active: true,
    })
    setSelectedImage(null)
    setModalVisible(true)
  }

  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: (product as any).description || '',
      price: String(product.price),
      category: product.category || 'Others',
      emoji: (product as any).emoji || '📦',
      badge: (product as any).badge || '',
      is_active: (product as any).is_active !== false,
    })
    setSelectedImage((product as any).image || null)
    setModalVisible(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Product name is required')
      return
    }
    const priceNum = parseFloat(formData.price)
    if (isNaN(priceNum) || priceNum < 0) {
      Alert.alert('Error', 'Valid price is required')
      return
    }

    setSaving(true)
    try {
      // If an image was selected, send multipart FormData including the image
      let res
      if (selectedImage) {
        const fd = new FormData()
        fd.append('name', formData.name.trim())
        fd.append('description', formData.description)
        fd.append('price', String(priceNum))
        fd.append('category', formData.category)
        fd.append('badge', formData.badge)
        fd.append('is_active', formData.is_active ? 'true' : 'false')

        const filename = selectedImage.split('/').pop() || 'photo.jpg'
        const match = /\.([0-9a-z]+)(?:\?|$)/i.exec(filename)
        const type = match ? `image/${match[1]}` : 'image/jpeg'
        // @ts-ignore
        fd.append('image', { uri: selectedImage, name: filename, type } as any)

        if (editingProduct) {
          res = await updateProduct(editingProduct.id, fd)
        } else {
          res = await createProduct(fd)
        }
      } else {
        const payload = {
          name: formData.name.trim(),
          description: formData.description,
          price: priceNum,
          category: formData.category,
          badge: formData.badge,
          is_active: formData.is_active,
        }

        if (editingProduct) {
          res = await updateProduct(editingProduct.id, payload)
        } else {
          res = await createProduct(payload)
        }
      }

      Alert.alert('Success', editingProduct ? 'Product updated successfully' : 'Product created successfully')
      setModalVisible(false)
      loadProducts()
    } catch (e: any) {
      Alert.alert('Error', 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  const pickProductImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow access to photos to upload product images')
        return
      }
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, allowsEditing: true })
      if (!res.canceled && res.assets?.[0]?.uri) {
        setSelectedImage(res.assets[0].uri)
      }
    } catch (err) {
      console.error('Image pick error', err)
      Alert.alert('Error', 'Failed to pick image')
    }
  }

  const handleDelete = async () => {
    if (!productToDelete) return
    try {
      await deleteProduct(productToDelete.id)
      Alert.alert('Success', 'Product deleted successfully')
      setDeleteModalVisible(false)
      loadProducts()
    } catch {
      Alert.alert('Error', 'Failed to delete product')
    }
  }

  const toggleActive = async (product: Product) => {
    try {
      await updateProduct(product.id, { is_active: !(product as any).is_active })
      loadProducts()
    } catch {
      Alert.alert('Error', 'Failed to update product status')
    }
  }

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <View style={styles.productHeader}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.productImage} />
        ) : (
          <View style={styles.productEmojiWrap}>
            <Text style={styles.productEmoji}>{item.emoji || '📦'}</Text>
          </View>
        )}
        <View style={styles.productActionsRow}>
        <View style={styles.productActions}>
          <TouchableOpacity onPress={() => openEditModal(item)} style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            setProductToDelete(item)
            setDeleteModalVisible(true)
          }} style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
        </View>
      </View>
      <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.productCategory}>{item.category}</Text>
      <Text style={styles.productPrice}>₱{Number(item.price).toFixed(2)}</Text>
      <TouchableOpacity
        style={[styles.activeToggle, (item as any).is_active !== false && styles.activeToggleActive]}
        onPress={() => toggleActive(item)}
      >
        <Text style={styles.activeToggleText}>
          {(item as any).is_active !== false ? 'Active' : 'Inactive'}
        </Text>
      </TouchableOpacity>
    </View>
  )

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.productRow}
        renderItem={renderProduct}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View>
                <Text style={styles.storeName}>MY STORE</Text>
                <Text style={styles.title}>Products</Text>
                <Text style={styles.subtitle}>Manage your catalog</Text>
              </View>
              <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
                <Text style={styles.addButtonText}>+ Add Product</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search..."
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
              />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
              {['All', ...CATEGORIES].map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.resultCount}>{filteredProducts.length} products</Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products available yet.</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={openAddModal}>
              <Text style={styles.emptyButtonText}>Add Your First Product</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Product Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalLabel}>Product Name *</Text>
              <TextInput
                style={styles.modalInput}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter product name"
                placeholderTextColor={colors.textMuted}
              />

              <Text style={styles.modalLabel}>Description</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Product description"
                placeholderTextColor={colors.textMuted}
                multiline
              />

              <Text style={styles.modalLabel}>Image</Text>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <TouchableOpacity onPress={pickProductImage} style={[styles.addButton, { paddingVertical: 8 }]}> 
                  <Text style={styles.addButtonText}>{selectedImage ? 'Change Image' : 'Pick Image'}</Text>
                </TouchableOpacity>
                {selectedImage ? (
                  <Image source={{ uri: selectedImage }} style={{ width: 64, height: 64, borderRadius: 8 }} />
                ) : null}
              </View>

              <Text style={styles.modalLabel}>Price *</Text>
              <TextInput
                style={styles.modalInput}
                value={formData.price}
                onChangeText={(text) => setFormData({ ...formData, price: text })}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
              />

              <Text style={styles.modalLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiScroll}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryOption, formData.category === cat && styles.categoryOptionActive]}
                    onPress={() => setFormData({ ...formData, category: cat })}
                  >
                    <Text style={[styles.categoryOptionText, formData.category === cat && styles.categoryOptionTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={[styles.saveModalButton, saving && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveModalButtonText}>
                  {saving ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={deleteModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteModalTitle}>Delete Product?</Text>
            <Text style={styles.deleteModalText}>
              Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
            </Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity style={styles.deleteModalCancel} onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.deleteModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteModalConfirm} onPress={handleDelete}>
                <Text style={styles.deleteModalConfirmText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  storeName: {
    ...typography.caption,
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.sm,
  },
  addButtonText: {
    ...typography.bodyBold,
    color: colors.textInverse,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: typeScale.body,
  },
  categoriesScroll: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.bgCard,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  categoryChipTextActive: {
    color: colors.textInverse,
  },
  resultCount: {
    ...typography.caption,
    color: colors.textSecondary,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  productRow: {
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  productCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  productHeader: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: radii.md,
    backgroundColor: colors.bgPrimary,
  },
  productEmojiWrap: {
    width: '100%',
    height: 120,
    borderRadius: radii.md,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productEmoji: {
    fontSize: 40,
  },
  productActionsRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  productActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  editButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.sm,
  },
  editButtonText: {
    fontSize: 12,
    color: colors.primary,
  },
  deleteButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.error + '15',
    borderRadius: radii.sm,
  },
  deleteButtonText: {
    fontSize: 12,
    color: colors.error,
  },
  productName: {
    ...typography.subheading,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  productCategory: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  productPrice: {
    ...typography.heading,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  activeToggle: {
    backgroundColor: colors.error + '10',
    borderRadius: radii.pill,
    paddingVertical: 4,
    alignItems: 'center',
  },
  activeToggleActive: {
    backgroundColor: colors.success + '10',
  },
  activeToggleText: {
    ...typography.caption,
    color: colors.error,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  emptyButtonText: {
    ...typography.bodyBold,
    color: colors.textInverse,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.xl,
    width: '90%',
    maxHeight: '80%',
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  modalBody: {
    padding: spacing.lg,
  },
  modalLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  modalInput: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  emojiScroll: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  categoryOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.bgPrimary,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  categoryOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryOptionText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  categoryOptionTextActive: {
    color: colors.textInverse,
  },
  saveModalButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveModalButtonText: {
    ...typography.bodyBold,
    color: colors.textInverse,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  deleteModalContent: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.xl,
    padding: spacing.lg,
    width: '80%',
    alignItems: 'center',
    ...shadows.lg,
  },
  deleteModalTitle: {
    ...typography.heading,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  deleteModalText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  deleteModalCancel: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  deleteModalCancelText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  deleteModalConfirm: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.error,
    alignItems: 'center',
  },
  deleteModalConfirmText: {
    ...typography.bodyBold,
    color: colors.textInverse,
  },
})