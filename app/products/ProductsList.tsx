"use client";

import { useState } from "react";
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { FiPlus, FiRefreshCw, FiShoppingCart, FiArrowLeft } from "react-icons/fi";
import { addProduct, restockProduct } from "./action";
import type { Product } from "./action";
import ErrorAlert from "../../components/ErrorAlert";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface ProductsListProps {
  initialProducts: Product[] | null;
}

export default function ProductsList({ initialProducts }: ProductsListProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    stock: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🌑 Couleurs noires et gris foncé
  const primaryColor = "#000000"; // Noir
  const secondaryColor = "#222222"; // Gris très foncé
  const accentColor = "#444444"; // Gris foncé
  const lightAccent = "#dddddd"; // Gris clair
  const darkAccent = "#111111"; // Noir légèrement atténué

  const mostUsed = products.reduce(
    (max, product) =>
      product.used > max.count ? { name: product.name, count: product.used } : max,
    { name: "Aucun produit", count: 0 }
  );

  const chartData = products.map((product) => ({
    name: product.name,
    utilisé: product.used,
    restant: product.stock - product.used,
  }));

  const clearError = () => setError(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const tempId = `temp-${Date.now()}`;
    const initialStock = Number(newProduct.stock);

    const tempProduct: Product = {
      id: tempId,
      name: newProduct.name,
      description: newProduct.description || null,
      price: Number(newProduct.price),
      stock: initialStock,
      used: 0,
      disponible: initialStock,
      clinicId: "temp-clinic-id",
      updatedAt: new Date(),
      clinic: { name: "Chargement..." },
    };

    setProducts((prev) => [tempProduct, ...prev]);
    setNewProduct({ name: "", price: "", stock: "", description: "" });

    try {
      const createdProduct = await addProduct({
        name: tempProduct.name,
        price: tempProduct.price,
        stock: tempProduct.stock,
        description: tempProduct.description || undefined,
      });

      setProducts((prev) => [
        { ...createdProduct, disponible: createdProduct.stock },
        ...prev.filter((p) => p.id !== tempId),
      ]);

      toast.success("Produit ajouté", {
        description: `${createdProduct.name} a été ajouté avec succès.`,
      });
    } catch (err) {
      setProducts((prev) => prev.filter((p) => p.id !== tempId));
      setError(err instanceof Error ? err.message : "Erreur lors de l'ajout du produit");
      toast.error("Erreur", {
        description: "Impossible d'ajouter le produit",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUseProduct = async (productId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/products/use/${productId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de l'utilisation");
      }
      const updatedProduct = await response.json();
      setProducts(prev =>
        prev.map(p => (p.id === updatedProduct.id ? updatedProduct : p))
      );
      toast.success("Produit utilisé", {
        description: `${updatedProduct.name} a été utilisé. Stock restant: ${updatedProduct.disponible}`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'utilisation");
      toast.error("Erreur", { description: "Impossible d'utiliser le produit" });
    } finally {
      setLoading(false);
    }
  };

  const handleRestockProduct = async (productId: string) => {
    setLoading(true);
    try {
      const updatedProduct = await restockProduct(productId);
      setProducts((prev) =>
        prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
      );
      toast.success("Produit réapprovisionné", {
        description: `${updatedProduct.name} a été réapprovisionné. Nouveau stock: ${updatedProduct.stock}`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du réapprovisionnement");
      toast.error("Erreur", { description: "Impossible de réapprovisionner le produit" });
    } finally {
      setLoading(false);
    }
  };

return (
  <main
    className="container mx-auto py-6 px-4"
    style={{
      background: "linear-gradient(to bottom, #61D6A6, #393785)",
      color: primaryColor,
    }}
  >
    <Link href="/dashboard" className="text-muted-foreground hover:text-primary">
      <FiArrowLeft size={20} />
    </Link>
    <h1 className="text-3xl font-bold mb-6 text-white">Gestion des produits</h1>

    {error && <ErrorAlert message={error} onClose={clearError} />}


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulaire d'ajout */}
        <Card className="border-2" style={{ borderColor: accentColor, backgroundColor: lightAccent }}>
          <CardHeader className="rounded-t-lg" style={{ backgroundColor: primaryColor }}>
            <CardTitle style={{ color: 'white' }}>Ajouter un produit</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleAddProduct} className="space-y-4">
              <Input
                type="text"
                name="name"
                placeholder="Nom du produit"
                value={newProduct.name}
                onChange={handleInputChange}
                required
                disabled={loading}
                className="border-2 focus:ring-2"
                style={{ borderColor: darkAccent }}
              />
              <Input
                type="number"
                name="price"
                placeholder="Prix (FCFA)"
                value={newProduct.price}
                onChange={handleInputChange}
                required
                disabled={loading}
                min="0"
                step="0.01"
                className="border-2 focus:ring-2"
                style={{ borderColor: darkAccent }}
              />
              <Input
                type="number"
                name="stock"
                placeholder="Quantité initiale"
                value={newProduct.stock}
                onChange={handleInputChange}
                required
                disabled={loading}
                min="0"
                className="border-2 focus:ring-2"
                style={{ borderColor: darkAccent }}
              />
              <Textarea
                name="description"
                placeholder="Description (optionnelle)"
                value={newProduct.description}
                onChange={handleInputChange}
                disabled={loading}
                rows={3}
                className="border-2 focus:ring-2"
                style={{ borderColor: darkAccent }}
              />
              <Button
                type="submit"
                disabled={loading}
                style={{ backgroundColor: secondaryColor }}
                className="w-full hover:bg-opacity-90 text-white"
              >
                <FiPlus className="mr-2" /> Ajouter le produit
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Statistiques */}
        <Card className="border-2" style={{ borderColor: darkAccent, backgroundColor: "rgba(255,255,255,0.2)"}}>
          <CardHeader className="rounded-t-lg" style={{ backgroundColor: darkAccent }}>
            <CardTitle style={{ color: 'white' }}>Statistiques</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="mb-6 p-4 rounded-lg shadow-sm border-2" style={{ borderColor: accentColor, backgroundColor: 'white' }}>
              <p className="text-sm" style={{ color: secondaryColor }}>Produit le plus utilisé</p>
              <p className="text-xl font-semibold" style={{ color: primaryColor }}>
                {mostUsed.name} <span style={{ color: secondaryColor }}>({mostUsed.count}x)</span>
              </p>
            </div>

            <div className="h-[300px] p-4 rounded-lg shadow-sm border-2" style={{ borderColor: accentColor, backgroundColor: "rgba(255,255,255,0.2)"}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" style={{ stroke: darkAccent }} />
                  <YAxis style={{ stroke: darkAccent }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="utilisé" fill={secondaryColor} name="Utilisé" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="restant" fill={accentColor} name="Restant" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des produits */}
      <Card className="mt-6 border-2" style={{ borderColor: primaryColor }}>
        <CardHeader className="rounded-t-lg" style={{ backgroundColor: primaryColor }}>
          <CardTitle style={{ color: 'white' }}>Inventaire des produits</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead style={{ backgroundColor: lightAccent }}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: primaryColor }}>Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: primaryColor }}>Prix</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: primaryColor }}>Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: primaryColor }}>Utilisé</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: primaryColor }}>Disponible</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: primaryColor }}>Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.length > 0 ? (
                  products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium" style={{ color: primaryColor }}>{product.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap" style={{ color: primaryColor }}>{product.price} FCFA</td>
                      <td className="px-6 py-4 whitespace-nowrap" style={{ color: primaryColor }}>{product.stock}</td>
                      <td className="px-6 py-4 whitespace-nowrap" style={{ color: primaryColor }}>{product.used}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium" style={{ color: product.disponible >= 5 ? secondaryColor : 'red' }}>
                        {product.disponible}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUseProduct(product.id)}
                          disabled={loading || product.disponible <= 0}
                          style={{ borderColor: secondaryColor, color: secondaryColor }}
                          className="hover:bg-opacity-90 hover:text-white"
                        >
                          <FiShoppingCart className="mr-2" /> Utiliser
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleRestockProduct(product.id)}
                          disabled={loading}
                          style={{ backgroundColor: accentColor }}
                          className="hover:bg-opacity-90 text-white"
                        >
                          <FiRefreshCw className="mr-2" /> Réapprovisionner
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center" style={{ color: secondaryColor }}>
                      Aucun produit disponible
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
