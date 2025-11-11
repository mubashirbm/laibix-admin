import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, DollarSign } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    productCount: 0,
    ordersToday: 0,
    revenue: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    // Get product count
    const { count: productCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    // Get today's orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: ordersToday, data: ordersData } = await supabase
      .from("orders")
      .select("total", { count: "exact" })
      .gte("created_at", today.toISOString());

    // Calculate revenue
    const revenue = ordersData?.reduce((sum, order) => sum + Number(order.total), 0) || 0;

    setStats({
      productCount: productCount || 0,
      ordersToday: ordersToday || 0,
      revenue,
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.productCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ordersToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Today</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.revenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
