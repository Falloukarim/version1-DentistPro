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

// Palette de couleurs moderne
const colors = {
  primary: "#4F46E5", // Violet indigo
  secondary: "#10B981", // Vert émeraude
  accent: "#6366F1", // Violet doux
  background: "#F9FAFB", // Gris très clair
  text: "#111827", // Gris foncé
  lightText: "#6B7280", // Gris moyen
  border: "#E5E7EB", // Gris clair
  white: "#FFFFFF",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444"
};

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
    <main className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center text-sm font-medium text-primary hover:text-accent transition-colors"
          >
            <FiArrowLeft className="mr-2" />
            Retour au tableau de bord
          </Link>
          <h1 className="text-3xl font-bold mt-2" style={{ color: colors.text }}>Gestion des produits</h1>
        </div>

        {error && <ErrorAlert message={error} onClose={clearError} />}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Formulaire d'ajout */}
          <Card className="shadow-sm border border-border">
            <CardHeader className="border-b border-border">
              <CardTitle style={{ color: colors.text }}>Ajouter un produit</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium" style={{ color: colors.text }}>
                    Nom du produit
                  </label>
                  <Input
                    type="text"
                    name="name"
                    placeholder="Ex: Bouteille d'eau"
                    value={newProduct.name}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    className="focus-visible:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium" style={{ color: colors.text }}>
                      Prix (FCFA)
                    </label>
                    <Input
                      type="number"
                      name="price"
                      placeholder="0.00"
                      value={newProduct.price}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                      min="0"
                      step="0.01"
                      className="focus-visible:ring-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium" style={{ color: colors.text }}>
                      Quantité initiale
                    </label>
                    <Input
                      type="number"
                      name="stock"
                      placeholder="0"
                      value={newProduct.stock}
                      onChange={handleInputChange}
                      required
                      disabled={loading}
                      min="0"
                      className="focus-visible:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium" style={{ color: colors.text }}>
                    Description (optionnelle)
                  </label>
                  <Textarea
                    name="description"
                    placeholder="Description du produit..."
                    value={newProduct.description}
                    onChange={handleInputChange}
                    disabled={loading}
                    rows={3}
                    className="focus-visible:ring-primary"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-accent transition-colors"
                >
                  <FiPlus className="mr-2" /> 
                  {loading ? "Ajout en cours..." : "Ajouter le produit"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Statistiques */}
          <Card className="shadow-sm border border-border">
            <CardHeader className="border-b border-border">
              <CardTitle style={{ color: colors.text }}>Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="mb-6 p-4 rounded-lg border border-border bg-white">
                <p className="text-sm font-medium" style={{ color: colors.lightText }}>
                  Produit le plus utilisé
                </p>
                <p className="text-xl font-semibold mt-1" style={{ color: colors.text }}>
                  {mostUsed.name} <span style={{ color: colors.secondary }}>({mostUsed.count}x)</span>
                </p>
              </div>

              <div className="h-[300px] p-4 rounded-lg border border-border bg-white">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                    <XAxis 
                      dataKey="name" 
                      stroke={colors.lightText}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      stroke={colors.lightText}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: colors.white,
                        borderColor: colors.border,
                        borderRadius: '0.375rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        color: colors.text
                      }}
                      itemStyle={{ color: colors.text }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="utilisé" 
                      fill={colors.secondary} 
                      name="Utilisé" 
                      radius={[4, 4, 0, 0]} 
                    />
                    <Bar 
                      dataKey="restant" 
                      fill={colors.accent} 
                      name="Restant" 
                      radius={[4, 4, 0, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des produits */}
        <Card className="shadow-sm border border-border">
          <CardHeader className="border-b border-border">
            <CardTitle style={{ color: colors.text }}>Inventaire des produits</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.lightText }}>
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.lightText }}>
                      Prix
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.lightText }}>
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.lightText }}>
                      Utilisé
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.lightText }}>
                      Disponible
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: colors.lightText }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-border">
                  {products.length > 0 ? (
                    products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap font-medium" style={{ color: colors.text }}>
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap" style={{ color: colors.text }}>
                          {product.price} FCFA
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap" style={{ color: colors.text }}>
                          {product.stock}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap" style={{ color: colors.text }}>
                          {product.used}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium" 
                            style={{ color: product.disponible >= 5 ? colors.success : colors.danger }}>
                          {product.disponible}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUseProduct(product.id)}
                            disabled={loading || product.disponible <= 0}
                            className="border-primary text-primary hover:bg-primary hover:text-white transition-colors"
                          >
                            <FiShoppingCart className="mr-2" /> Utiliser
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleRestockProduct(product.id)}
                            disabled={loading}
                            className="bg-secondary hover:bg-secondary/90 text-black transition-colors"
                          >
                            <FiRefreshCw className="mr-2" /> Réapprovisionner
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm" style={{ color: colors.lightText }}>
                        Aucun produit disponible. Commencez par ajouter un produit.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}