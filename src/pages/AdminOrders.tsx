import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/lib/paymentUtils";
import { Package, ArrowLeft } from "lucide-react";
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
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("請先登入");
        navigate("/auth");
        return;
      }

      // Check if user has admin role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleError || !roleData) {
        toast.error("您沒有權限訪問此頁面");
        navigate("/");
        return;
      }

      setIsAdmin(true);

      // Fetch all completed orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .eq("payment_status", "completed")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      setOrders(ordersData || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("載入訂單失敗");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Package className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            返回首頁
          </Button>
          <h1 className="text-3xl font-bold">已完成訂單管理</h1>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">暫無已完成的訂單</p>
          </div>
        ) : (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>訂單號</TableHead>
                  <TableHead>金額</TableHead>
                  <TableHead>付款狀態</TableHead>
                  <TableHead>付款方式</TableHead>
                  <TableHead>客戶郵箱</TableHead>
                  <TableHead>客戶電話</TableHead>
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
                    <TableCell>
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                        已付款
                      </span>
                    </TableCell>
                    <TableCell className="uppercase">
                      {order.payment_type}
                    </TableCell>
                    <TableCell>{order.customer_email || "-"}</TableCell>
                    <TableCell>{order.customer_phone || "-"}</TableCell>
                    <TableCell>
                      {new Date(order.created_at).toLocaleString("zh-HK")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-6 text-sm text-muted-foreground">
          共 {orders.length} 筆已完成訂單
        </div>
      </main>
    </div>
  );
}
