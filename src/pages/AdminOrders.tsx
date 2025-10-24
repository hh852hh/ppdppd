import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/paymentUtils";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package } from "lucide-react";
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

const AdminOrders = () => {
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
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleError) {
        console.error("Error checking admin role:", roleError);
        toast.error("無法驗證管理員權限");
        navigate("/");
        return;
      }

      if (!roleData) {
        toast.error("您沒有訪問此頁面的權限");
        navigate("/");
        return;
      }

      setIsAdmin(true);

      // Fetch all paid orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .eq("payment_status", "completed")
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("Error fetching orders:", ordersError);
        toast.error("無法載入訂單");
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回首頁
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">訂單管理</CardTitle>
            <CardDescription>
              所有已付款訂單 ({orders.length} 筆)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>已付款訂單列表</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>訂單編號</TableHead>
                  <TableHead>金額</TableHead>
                  <TableHead>付款方式</TableHead>
                  <TableHead>客戶郵箱</TableHead>
                  <TableHead>客戶電話</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead>建立時間</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      暫無已付款訂單
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.order_number}
                      </TableCell>
                      <TableCell>{formatPrice(order.total_amount)}</TableCell>
                      <TableCell>{order.payment_type}</TableCell>
                      <TableCell>{order.customer_email || "-"}</TableCell>
                      <TableCell>{order.customer_phone || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="default">已付款</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(order.created_at).toLocaleString("zh-HK")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOrders;
