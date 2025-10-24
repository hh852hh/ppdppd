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
import { formatPrice } from "@/lib/paymentUtils";
import { Loader2, ShieldAlert } from "lucide-react";
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

export default function AdminOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

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
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          {order.order_number}
                        </TableCell>
                        <TableCell>{formatPrice(order.total_amount)}</TableCell>
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
    </div>
  );
}
