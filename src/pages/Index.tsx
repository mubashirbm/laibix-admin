import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Gem } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary to-accent/30">
      <div className="text-center space-y-6 p-8">
        <Gem className="h-20 w-20 mx-auto text-primary" />
        <h1 className="text-6xl font-bold text-foreground mb-4">
          Luxury Jewelry Store
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Admin Panel - Manage your exquisite collection
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate("/auth")} size="lg">
            Admin Login
          </Button>
          <Button onClick={() => navigate("/admin/products")} variant="outline" size="lg">
            View Products
          </Button>
        </div>
      </div>
    </div>
  );
}
