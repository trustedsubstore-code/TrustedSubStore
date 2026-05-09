import { useState, useEffect } from 'react';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const repo = import.meta.env.VITE_GITHUB_REPO;
        
        // Fetch from GitHub directly if repo is set to get the absolute latest data instantly
        // The timestamp ?t= prevents the browser from caching old data
        const url = repo 
          ? `https://raw.githubusercontent.com/${repo}/main/public/data/products.json?t=${Date.now()}`
          : '/data/products.json';

        let response = await fetch(url);
        
        // If GitHub fetch fails (e.g. rate limit), fallback to the local file
        if (!response.ok && repo) {
          response = await fetch('/data/products.json');
        }

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
