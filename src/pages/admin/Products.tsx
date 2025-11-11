import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Product = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  sku: string;
  stock: number;
  is_featured: boolean;
  images: { url: string; alt_text: string | null }[];
};

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        title,
        description,
        price,
        sku,
        stock,
        is_featured,
        images (url, alt_text)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error loading products");
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const { error } = await supabase.from("products").delete().eq("id", deleteId);

    if (error) {
      toast.error("Error deleting product");
    } else {
      toast.success("Product deleted successfully");
      loadProducts();
    }
    setDeleteId(null);
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Products</h1>
        <Button onClick={() => navigate("/admin/products/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Create Product
        </Button>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No products yet. Create your first product!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id}>
              <CardContent className="p-4">
                {product.images?.[0] && (
                  <img
                    src={product.images[0].url}
                    alt={product.images[0].alt_text || product.title}
                    className="w-full h-48 object-cover rounded-md mb-4"
                  />
                )}
                <h3 className="font-semibold text-lg mb-2">{product.title}</h3>
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-lg">${Number(product.price).toFixed(2)}</span>
                  <span className="text-sm text-muted-foreground">Stock: {product.stock}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/admin/products/${product.id}`)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteId(product.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
