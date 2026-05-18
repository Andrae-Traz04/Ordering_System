import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { fetchSummary, fetchOrders } from '../api/client'
import { Summary, Order } from '../types'

export default function DashboardScreen() {
  const { user, logout } = useAuth()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [orders, setOrders] = useState<Order[]>([])

  const loadData = async () => {
    try {
      const [summaryRes, ordersRes] = await Promise.all([
        fetchSummary(),
        fetchOrders(),
      ])
      setSummary(summaryRes.data)
      setOrders(ordersRes.data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const renderOrderItem = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <Text style={styles.orderId}>Order #{item.id}</Text>
      <Text>Status: {item.status}</Text>
      <Text>Total: ${item.total}</Text>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome, {user?.first_name}</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      {summary && (
        <View style={styles.summary}>
          <Text>Total Orders: {summary.total_orders}</Text>
          <Text>Revenue: ${summary.total_revenue}</Text>
          <Text>Pending: {summary.pending_orders}</Text>
        </View>
      )}

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrderItem}
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  welcome: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  logout: {
    color: 'red',
  },
  summary: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginBottom: 10,
  },
  orderCard: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  orderId: {
    fontWeight: 'bold',
  },
})