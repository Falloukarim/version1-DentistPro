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
import { FiPlus, FiRefreshCw, FiShoppingCart } from "react-icons/fi";
import { addProduct, restockProduct } from "./action";
import type { Product } from "./action";
import ErrorAlert from "../../components/ErrorAlert";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FiArrowLeft } from "react-icons/fi";
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
        headers: {
          'Content-Type': 'application/json',
        },
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
      toast.error("Erreur", {
        description: "Impossible d'utiliser le produit",
      });
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
      toast.error("Erreur", {
        description: "Impossible de réapprovisionner le produit",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto py-6 px-4">
      <Link href="/dashboard" className="text-muted-foreground hover:text-primary">
              <FiArrowLeft size={20} />
      </Link>
      <h1 className="text-3xl font-bold mb-6 text-primary">Gestion des produits</h1>

      {error && <ErrorAlert message={error} onClose={clearError} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulaire d'ajout */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="bg-blue-100 rounded-t-lg">
            <CardTitle className="text-blue-800">Ajouter un produit</CardTitle>
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
                className="border-blue-300 focus:ring-blue-500 focus:border-blue-500"
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
                className="border-blue-300 focus:ring-blue-500 focus:border-blue-500"
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
                className="border-blue-300 focus:ring-blue-500 focus:border-blue-500"
              />
              <Textarea
                name="description"
                placeholder="Description (optionnelle)"
                value={newProduct.description}
                onChange={handleInputChange}
                disabled={loading}
                rows={3}
                className="border-blue-300 focus:ring-blue-500 focus:border-blue-500"
              />
              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <FiPlus className="mr-2" /> Ajouter le produit
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Statistiques */}
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="bg-purple-100 rounded-t-lg">
            <CardTitle className="text-purple-800">Statistiques</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-purple-100">
              <p className="text-sm text-purple-600">Produit le plus utilisé</p>
              <p className="text-xl font-semibold text-purple-900">
                {mostUsed.name} <span className="text-purple-600">({mostUsed.count}x)</span>
              </p>
            </div>
            
            <div className="h-[300px] p-4 bg-white rounded-lg shadow-sm border border-purple-100">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9d8fd" />
                  <XAxis dataKey="name" stroke="#6b46c1" />
                  <YAxis stroke="#6b46c1" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#faf5ff',
                      borderColor: '#9f7aea',
                      borderRadius: '0.5rem'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="utilisé" fill="#9f7aea" name="Utilisé" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="restant" fill="#d6bcfa" name="Restant" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des produits */}
      <Card className="mt-6 border-green-200">
        <CardHeader className="bg-green-100 rounded-t-lg">
          <CardTitle className="text-green-800">Inventaire des produits</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-green-200">
              <thead className="bg-green-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">Prix</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">Utilisé</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">Disponible</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-green-200">
                {products.length > 0 ? (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-green-50">
                      <td className="px-6 py-4 whitespace-nowrap text-green-900 font-medium">{product.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-green-900">{product.price} FCFA</td>
                      <td className="px-6 py-4 whitespace-nowrap text-green-900">{product.stock}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-green-900">{product.used}</td>
                      <td className={`px-6 py-4 whitespace-nowrap font-medium ${
                        product.disponible < 5 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {product.disponible}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUseProduct(product.id)}
                          disabled={loading || product.disponible <= 0}
                          className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                        >
                          <FiShoppingCart className="mr-2" /> Utiliser
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleRestockProduct(product.id)}
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <FiRefreshCw className="mr-2" /> Réapprovisionner
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-green-600">
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