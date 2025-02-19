import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Package, Truck, XCircle, CheckCircle } from 'lucide-react';

interface Order {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country: string;
  address: string;
  zip_code: string;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  tracking_number?: string;
  shipping_notes?: string;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      console.log('Fetching orders...');
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }
      
      console.log('Fetched orders:', data);
      setOrders(data || []);
    } catch (error) {
      console.error('Error in fetchOrders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, updates: Partial<Order>) => {
    const action = updates.status === 'cancelled' ? 'cancel' : 
                  updates.status === 'shipped' ? 'mark as shipped' :
                  'mark as delivered';
    
    // Confirmation dialog
    if (!confirm(`Are you sure you want to ${action} this order?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          ...updates,
          shipping_notes: 
            updates.status === 'shipped' ? `Order shipped on ${new Date().toLocaleDateString()}` :
            updates.status === 'cancelled' ? `Order cancelled on ${new Date().toLocaleDateString()}` :
            updates.status === 'delivered' ? `Order delivered on ${new Date().toLocaleDateString()}` :
            updates.shipping_notes
        })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order:', error);
        alert(`Failed to ${action} order. Please try again.`);
        throw error;
      }

      alert(`Order successfully ${
        updates.status === 'cancelled' ? 'cancelled' : 
        updates.status === 'shipped' ? 'marked as shipped' :
        'marked as delivered'
      }`);
      
      // Refresh orders list after successful update
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
        <div className="flex space-x-4">
          <span className="text-sm text-gray-500">
            Total Orders: {orders.length}
          </span>
        </div>
      </div>

      <div className="grid gap-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium">
                  {order.first_name} {order.last_name}
                </h3>
                <p className="text-sm text-gray-500">{order.email}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Shipping Address</h4>
                <p className="mt-1 text-sm">
                  {order.address}<br />
                  {order.zip_code}, {order.country}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Contact</h4>
                <p className="mt-1 text-sm">{order.phone}</p>
              </div>
            </div>

            {order.status === 'pending' && (
              <div className="mt-4 flex space-x-4">
                <button
                  onClick={() => updateOrderStatus(order.id, {
                    status: 'shipped',
                    shipping_notes: `Order shipped on ${new Date().toLocaleDateString()}`
                  })}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  <Truck className="w-4 h-4 mr-2" />
                  Mark as Shipped
                </button>
                <button
                  onClick={() => updateOrderStatus(order.id, { 
                    status: 'cancelled',
                    shipping_notes: `Order cancelled on ${new Date().toLocaleDateString()}`
                  })}
                  className="flex items-center px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Order
                </button>
              </div>
            )}

            {order.status === 'shipped' && (
              <div className="mt-4">
                <button
                  onClick={() => updateOrderStatus(order.id, { 
                    status: 'delivered',
                    shipping_notes: `Order delivered on ${new Date().toLocaleDateString()}`
                  })}
                  className="flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Delivered
                </button>
              </div>
            )}

            {order.shipping_notes && (
              <div className="mt-4 text-sm text-gray-500">
                <p className="font-medium">Shipping Notes:</p>
                <p>{order.shipping_notes}</p>
              </div>
            )}
          </div>
        ))}

        {orders.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
            <p className="mt-1 text-sm text-gray-500">New orders will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
} 