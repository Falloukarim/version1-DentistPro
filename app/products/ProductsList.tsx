'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FiPackage, FiDollarSign, FiTrendingUp, FiPlus, FiRefreshCw, FiShoppingCart } from 'react-icons/fi';
import { addProduct, useProduct, restockProduct, fetchProducts } from './action';
import type { Product } from './action';
import ErrorAlert from '../../components/ErrorAlert';

interface ProductsListProps {
  initialProducts: Product[] | null;
}

export default function ProductsList({ initialProducts }: ProductsListProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    stock: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calcul des statistiques
  const totalValue = products.reduce((sum, product) => sum + (product.price * product.stock), 0);
  
  const mostUsed = products.reduce((max, product) => 
    product.used > max.count ? { name: product.name, count: product.used } : max, 
    { name: '', count: 0 }
  );

  // Préparation des données pour le graphique
  const chartData = products.map(product => ({
    name: product.name,
    utilisé: product.used,
    restant: product.stock - product.used
  }));

  const clearError = () => setError(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewProduct({
      ...newProduct,
      [name]: value
    });
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
      disponible: initialStock, // Initialisation correcte
      clinicId: 'temp-clinic-id',
      updatedAt: new Date(),
      clinic: { name: 'Chargement...' }
    };
    
    setProducts(prev => [tempProduct, ...prev]);
    setNewProduct({ name: '', price: '', stock: '', description: '' });
  
    try {
      const createdProduct = await addProduct({
        name: tempProduct.name,
        price: tempProduct.price,
        stock: tempProduct.stock,
        description: tempProduct.description || undefined
      });
      
      // Vérification que le produit créé a bien disponible = stock
      if (createdProduct.disponible !== createdProduct.stock) {
        createdProduct.disponible = createdProduct.stock;
      }
      
      setProducts(prev => [
        createdProduct,
        ...prev.filter(p => p.id !== tempId)
      ]);
      
    } catch (err) {
      setProducts(prev => prev.filter(p => p.id !== tempId));
      setError(err instanceof Error ? err.message : "Erreur lors de l'ajout du produit");
    } finally {
      setLoading(false);
    }
  };

  const handleUseProduct = async (productId: string) => {
    setLoading(true);
    try {
      // Mise à jour optimiste
      setProducts(prev => prev.map(p => 
        p.id === productId ? { 
          ...p, 
          used: p.used + 1,
          disponible: p.disponible - 1
        } : p
      ));

      const updatedProduct = await useProduct(productId);
      setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));
    } catch (err) {
      // Annulation optimiste
      setProducts(prev => prev.map(p => 
        p.id === productId ? { 
          ...p, 
          used: p.used - 1,
          disponible: p.disponible + 1
        } : p
      ));
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  const handleRestockProduct = async (productId: string) => {
    setLoading(true);
    try {
      // Mise à jour optimiste
      setProducts(prev => prev.map(p => 
        p.id === productId ? { 
          ...p, 
          stock: p.stock + 10,
          disponible: p.disponible + 10
        } : p
      ));

      const updatedProduct = await restockProduct(productId);
      setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));
    } catch (err) {
      // Annulation optimiste
      setProducts(prev => prev.map(p => 
        p.id === productId ? { 
          ...p, 
          stock: p.stock - 10,
          disponible: p.disponible - 10
        } : p
      ));
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-background min-h-screen">
      {error && <ErrorAlert message={error} onClose={clearError} />}

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <FiPackage className="text-blue-500" />
          Gestion des Produits
        </h1>
      </div>

      <div className="grid grid-cols-1 bg-background md:grid-cols-3 gap-6 mb-8">
        <div className="bg-background p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <FiPackage className="text-gray-400" />
            <h3 className="text-sm font-medium text-gray-500">Nombre de produits</h3>
          </div>
          <p className="text-2xl font-bold">{products.length}</p>
        </div>
        
        <div className="bg-background p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <FiTrendingUp className="text-gray-400" />
            <h3 className="text-sm font-medium text-gray-500">Produit le plus utilisé</h3>
          </div>
          <p className="text-xl font-medium">
            {mostUsed.name || 'Aucun'} 
            <span className="text-blue-600 ml-2">({mostUsed.count})</span>
          </p>
        </div>
      </div>

      <div className="bg-background p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FiPlus className="text-blue-500" />
          Ajouter un produit
        </h2>
        <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Nom</label>
            <input
              type="text"
              name="name"
              value={newProduct.name}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Prix (FCFA)</label>
            <input
              type="number"
              name="price"
              value={newProduct.price}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
              required
              min="0"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Stock initial</label>
            <input
              type="number"
              name="stock"
              value={newProduct.stock}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all"
              required
              min="0"
            />
          </div>
          <div className="flex items-end">
            <button 
              type="submit" 
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-md"
              disabled={loading}
            >
              <FiPlus />
              {loading ? 'Chargement...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-background p-6 rounded-xl shadow-sm border border-gray-100 mb-8 h-96">
        <h2 className="text-xl font-semibold mb-4">Utilisation des produits</h2>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="name" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip 
              contentStyle={{
                background: '#fff',
                border: '1px solid #eee',
                borderRadius: '0.5rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            />
            <Legend />
            <Bar 
              dataKey="utilisé" 
              fill="#6366f1" 
              name="Utilisé" 
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="restant" 
              fill="#10b981" 
              name="Restant" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-background rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold">Liste des produits</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix unitaire</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisé</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disponible</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map(product => {
                const isTempProduct = product.id.startsWith('temp-');
                
                return (
                  <tr key={product.id} className={`hover:bg-gray-50 transition-colors ${isTempProduct ? 'opacity-70' : ''}`}>
                    {isTempProduct ? (
                      <td colSpan={6} className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center gap-2 text-sm text-gray-500">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                          Ajout du produit en cours...
                        </div>
                      </td>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                          {product.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {product.price.toLocaleString()} FCFA
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {product.stock}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                          {product.used}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.disponible < 3 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {product.disponible}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleUseProduct(product.id)}
                              className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1 rounded-md text-xs transition-colors"
                              disabled={loading || isTempProduct}
                            >
                              <FiShoppingCart size={14} />
                              Utiliser
                            </button>
                            <button 
                              onClick={() => handleRestockProduct(product.id)}
                              className="flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-600 px-3 py-1 rounded-md text-xs transition-colors"
                              disabled={loading || isTempProduct}
                            >
                              <FiRefreshCw size={14} />
                              +10
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {products.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Aucun produit enregistré
          </div>
        )}
      </div>
    </div>
  );
}