import { useState, useEffect } from 'react';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Fetch securely from the local server/CDN.
        // Because Vercel auto-deploys when you save to GitHub, this is always up to date!
        // It also completely hides your GitHub info from the public Network tab.
        const response = await fetch('/data/products.json');

        if (!response.ok) throw new Error('Failed to fetch products');
        
        const data = await response.json();
        
        // Filter out invisible products as per requirements
        const visibleProducts = data.filter(p => p.visible !== false);
        setProducts(visibleProducts);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, loading, error };
}
