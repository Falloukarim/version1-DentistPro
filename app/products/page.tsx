import { fetchProducts } from './action';
import ProductsList from './ProductsList';

export default async function ProductsPage() {
    try {
      const products = await fetchProducts();
      return <ProductsList initialProducts={products} />;
    } catch (error) {
      console.error("Failed to load products:", error);
      return <ProductsList initialProducts={null} />;
    }
  }
  