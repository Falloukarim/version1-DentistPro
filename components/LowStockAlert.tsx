'use client';

import { FiAlertTriangle } from 'react-icons/fi';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  stock: number;
  used: number; // Ajout de la propriété 'used'
}

export default function LowStockAlert({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
        <div className="flex items-center">
          <FiAlertTriangle className="text-red-500 mr-3" size={20} />
          <div>
            <h3 className="text-sm font-medium text-red-800">
              Stock faible sur {products.length} produit{products.length > 1 ? 's' : ''}
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <ul className="list-disc pl-5 space-y-1">
                {products.map(product => {
                  const available = product.stock - product.used; // Calcul des unités disponibles
                  return (
                    <li key={product.id}>
                      {product.name} - {available} unité{available !== 1 ? 's' : ''} disponible{available !== 1 ? 's' : ''}
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="mt-4">
              <Link 
                href="/products" 
                className="inline-flex items-center text-sm font-medium text-red-700 hover:text-red-600"
              >
                Gérer le stock <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}