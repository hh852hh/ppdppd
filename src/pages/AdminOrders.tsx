import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/paymentUtils";
import { Loader2, ShieldAlert, Package } from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  payment_status: string;
  payment_type: string;
  customer_email: string | null;
  customer_phone: string | null;
  created_at: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price_at_time: number;
}

export default function AdminOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Admin view: show amounts as raw integers from backend (no cents conversion)
  const formatOrderAmount = (amount: number) => {
    return amount.toLocaleString('en', { useGrouping: false });
  };

  useEffect(() => {
    checkAdminAndFetchOrders();
  }, []);

  const checkAdminAndFetchOrders = async () => {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("請先登入");
        navigate("/auth");
        return;
      }

      // Check if user has admin role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleError) {
        console.error("Error checking admin role:", roleError);
        toast.error("權限檢查失敗");
        navigate("/");
        return;
      }

      if (!roleData) {
        toast.error("您沒有訪問此頁面的權限");
        navigate("/");
        return;
      }

      setIsAdmin(true);

      // Fetch all completed orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error("Error fetching orders:", ordersError);
        toast.error("獲取訂單失敗");
        return;
      }

      setOrders(ordersData || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("發生錯誤");
    } finally {
      setLoading(false);
    }
  };

  const handleOrderClick = async (order: Order) => {
    setSelectedOrder(order);
    setLoadingItems(true);
    
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);

      if (error) {
        console.error("Error fetching order items:", error);
        toast.error("獲取訂單詳情失敗");
        return;
      }

      setOrderItems(data || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("發生錯誤");
    } finally {
      setLoadingItems(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] gap-4">
          <ShieldAlert className="h-16 w-16 text-destructive" />
          <h1 className="text-2xl font-bold">訪問被拒絕</h1>
          <p className="text-muted-foreground">您沒有訪問此頁面的權限</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">付款完成訂單</CardTitle>
            <p className="text-muted-foreground">管理所有已完成付款的訂單</p>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">暫無已完成付款的訂單</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>訂單編號</TableHead>
                      <TableHead>總金額</TableHead>
                      <TableHead>付款方式</TableHead>
                      <TableHead>客戶郵箱</TableHead>
                      <TableHead>客戶電話</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead>訂單時間</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow 
                        key={order.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleOrderClick(order)}
                      >
                        <TableCell className="font-medium">
                          {order.order_number}
                        </TableCell>
                        <TableCell>{formatOrderAmount(order.total_amount)}</TableCell>
                        <TableCell className="capitalize">{order.payment_type}</TableCell>
                        <TableCell>{order.customer_email || "-"}</TableCell>
                        <TableCell>{order.customer_phone || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-green-600">
                            已付款
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(order.created_at).toLocaleString('zh-HK', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">訂單詳情</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Information */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">訂單編號</p>
                  <p className="font-semibold">{selectedOrder.order_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">總金額</p>
                  <p className="font-semibold text-lg">{formatOrderAmount(selectedOrder.total_amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">付款方式</p>
                  <p className="font-semibold capitalize">{selectedOrder.payment_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">狀態</p>
                  <Badge variant="default" className="bg-green-600">已付款</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">客戶郵箱</p>
                  <p className="font-medium">{selectedOrder.customer_email || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">客戶電話</p>
                  <p className="font-medium">{selectedOrder.customer_phone || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">訂單時間</p>
                  <p className="font-medium">
                    {new Date(selectedOrder.created_at).toLocaleString('zh-HK', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">訂單商品</h3>
                </div>
                
                {loadingItems ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : orderItems.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">暫無商品資訊</p>
                ) : (
                  <div className="space-y-3">
                    {orderItems.map((item) => (
                      <div 
                        key={item.id} 
                        className="flex justify-between items-center p-4 bg-muted/30 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">數量: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatPrice(item.price_at_time)}</p>
                          <p className="text-sm text-muted-foreground">
                            小計: {formatPrice(item.price_at_time * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
