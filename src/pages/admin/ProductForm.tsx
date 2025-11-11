import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { z } from "zod";
import { Upload, X } from "lucide-react";

const productSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(2000).optional(),
  price: z.number().positive("Price must be positive"),
  sku: z.string().trim().min(1, "SKU is required").max(100),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  tags: z.string().max(500).optional(),
  is_featured: z.boolean(),
});

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    sku: "",
    stock: "0",
    tags: "",
    is_featured: false,
  });
  const [images, setImages] = useState<{ url: string; alt_text: string }[]>([]);

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        images (url, alt_text, display_order)
      `)
      .eq("id", id)
      .single();

    if (error) {
      toast.error("Error loading product");
      navigate("/admin/products");
      return;
    }

    setFormData({
      title: data.title,
      description: data.description || "",
      price: data.price.toString(),
      sku: data.sku,
      stock: data.stock.toString(),
      tags: data.tags?.join(", ") || "",
      is_featured: data.is_featured,
    });

    setImages(
      data.images
        ?.sort((a: any, b: any) => a.display_order - b.display_order)
        .map((img: any) => ({ url: img.url, alt_text: img.alt_text || "" })) || []
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const uploadedUrls: { url: string; alt_text: string }[] = [];

      for (const file of Array.from(files)) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);

        uploadedUrls.push({ url: publicUrl, alt_text: formData.title });
      }

      setImages([...images, ...uploadedUrls]);
      toast.success("Images uploaded successfully");
    } catch (error) {
      toast.error("Error uploading images");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tags = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const validatedData = productSchema.parse({
        title: formData.title,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        sku: formData.sku,
        stock: parseInt(formData.stock),
        tags: formData.tags || undefined,
        is_featured: formData.is_featured,
      });

      if (id) {
        // Update existing product
        const { error: productError } = await supabase
          .from("products")
          .update({
            title: validatedData.title,
            description: validatedData.description,
            price: validatedData.price,
            sku: validatedData.sku,
            stock: validatedData.stock,
            tags,
            is_featured: validatedData.is_featured,
          })
          .eq("id", id);

        if (productError) throw productError;

        // Delete old images
        await supabase.from("images").delete().eq("product_id", id);

        // Insert new images
        if (images.length > 0) {
          const imageRows = images.map((img, index) => ({
            product_id: id,
            url: img.url,
            alt_text: img.alt_text,
            display_order: index,
          }));

          const { error: imageError } = await supabase.from("images").insert(imageRows);
          if (imageError) throw imageError;
        }

        toast.success("Product updated successfully");
      } else {
        // Create new product
        const { data: product, error: productError } = await supabase
          .from("products")
          .insert({
            title: validatedData.title,
            description: validatedData.description,
            price: validatedData.price,
            sku: validatedData.sku,
            stock: validatedData.stock,
            tags,
            is_featured: validatedData.is_featured,
          })
          .select()
          .single();

        if (productError) throw productError;

        // Insert images
        if (images.length > 0) {
          const imageRows = images.map((img, index) => ({
            product_id: product.id,
            url: img.url,
            alt_text: img.alt_text,
            display_order: index,
          }));

          const { error: imageError } = await supabase.from("images").insert(imageRows);
          if (imageError) throw imageError;
        }

        toast.success("Product created successfully");
      }

      navigate("/admin/products");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Error saving product");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">{id ? "Edit Product" : "Create Product"}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="gold, necklace, luxury"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_featured: checked as boolean })
                }
              />
              <Label htmlFor="featured" className="cursor-pointer">
                Featured Product
              </Label>
            </div>

            <div className="space-y-2">
              <Label>Product Images</Label>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.url}
                      alt={image.alt_text}
                      className="w-full h-32 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                  id="image-upload"
                />
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent">
                    <Upload className="h-4 w-4" />
                    {uploading ? "Uploading..." : "Upload Images"}
                  </div>
                </Label>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading || uploading}>
                {loading ? "Saving..." : id ? "Update Product" : "Create Product"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/products")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
