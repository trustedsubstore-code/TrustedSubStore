import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  EyeOff,
  Github,
  Image as ImageIcon,
  Layers3,
  Loader2,
  LogOut,
  Package,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import dropdownOptions from '../data/dropdownOptions.json';

const logoModules = import.meta.glob('../../public/logos/*.{png,jpg,jpeg,svg,webp,gif}');
const availableLogos = Object.keys(logoModules).map((path) => path.replace('../../public', '')).sort();
const DRAFT_KEY = 'tss_admin_products_draft';

const emptyProduct = {
  id: '',
  slug: '',
  name: '',
  plan: '',
  category: '',
  official_price: {
    amount: 0,
    currency: 'BDT',
    duration: '',
  },
  our_price: {
    amount: 0,
    currency: 'BDT',
  },
  saved_amount: {
    amount: 0,
    currency: 'BDT',
  },
  image: '',
  how_to_get: '',
  remarks: '',
  stock_status: 'in_stock',
  visible: true,
  status: '',
};

const cx = (...classes) => classes.filter(Boolean).join(' ');

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const cloneProducts = (products) => JSON.parse(JSON.stringify(products));

const reindexProducts = (list) =>
  list.map((product, index) => ({
    ...product,
    id: (index + 1).toString(),
    visible: product.visible !== false,
    stock_status: product.stock_status || 'in_stock',
    official_price: {
      currency: 'BDT',
      duration: '',
      ...(product.official_price || {}),
    },
    our_price: {
      currency: 'BDT',
      amount: 0,
      ...(product.our_price || {}),
    },
    saved_amount: {
      currency: 'BDT',
      amount: 0,
      ...(product.saved_amount || {}),
    },
  }));

const organizeProducts = (list) => {
  const activeInStock = [];
  const activeOutStock = [];
  const inactive = [];

  list.forEach((product) => {
    if (product.visible === false) inactive.push(product);
    else if (product.stock_status === 'out_of_stock') activeOutStock.push(product);
    else activeInStock.push(product);
  });

  return reindexProducts([...activeInStock, ...activeOutStock, ...inactive]);
};

const getProductKey = (product) => product.slug || product.name || product.id;

const LogoManager = ({ pat, repo }) => {
  const [logos, setLogos] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingLogos, setIsLoadingLogos] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const fileInputRef = useRef(null);

  const fetchLogos = useCallback(async () => {
    setIsLoadingLogos(true);
    try {
      const response = await fetch(`https://api.github.com/repos/${repo}/contents/public/logos`, {
        headers: {
          Authorization: `token ${pat}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      if (!response.ok) return;
      const data = await response.json();
      if (Array.isArray(data)) {
        setLogos(data.filter((file) => file.type === 'file' && file.name.match(/\.(png|jpe?g|svg|webp|gif)$/i)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingLogos(false);
    }
  }, [pat, repo]);

  useEffect(() => {
    fetchLogos();
  }, [fetchLogos]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = prompt('Enter filename with extension (e.g., netflix.png):', file.name.toLowerCase().replace(/\s+/g, '-'));
    if (!fileName) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64Data = event.target.result.split(',')[1];
        let sha;

        try {
          const checkRes = await fetch(`https://api.github.com/repos/${repo}/contents/public/logos/${fileName}`, {
            headers: { Authorization: `token ${pat}` },
          });
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            sha = checkData.sha;
          }
        } catch (err) {
          console.error(err);
        }

        const response = await fetch(`https://api.github.com/repos/${repo}/contents/public/logos/${fileName}`, {
          method: 'PUT',
          headers: {
            Authorization: `token ${pat}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `Upload logo ${fileName} via Admin Panel`,
            content: base64Data,
            ...(sha && { sha }),
          }),
        });

        if (!response.ok) throw new Error('Failed to upload logo');
        alert('Logo uploaded successfully!');
        fetchLogos();
      } catch (err) {
        alert(err.message);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const deleteLogo = async (fileSha, fileName) => {
    if (!window.confirm(`Are you sure you want to delete ${fileName}? Products using it will show a broken image.`)) return;

    try {
      const response = await fetch(`https://api.github.com/repos/${repo}/contents/public/logos/${fileName}`, {
        method: 'DELETE',
        headers: {
          Authorization: `token ${pat}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Delete logo ${fileName}`,
          sha: fileSha,
        }),
      });

      if (!response.ok) throw new Error('Failed to delete logo');
      fetchLogos();
    } catch (err) {
      alert(err.message);
    }
  };

  const downloadAllLogos = async () => {
    if (logos.length === 0) return alert('No logos to download.');
    setIsDownloadingAll(true);
    try {
      const zip = new JSZip();
      await Promise.all(
        logos.map(async (logo) => {
          try {
            const response = await fetch(logo.download_url);
            if (response.ok) zip.file(logo.name, await response.blob());
          } catch (err) {
            console.error('Failed to fetch', logo.name, err);
          }
        }),
      );

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'trusted-sub-store-logos.zip');
    } catch (err) {
      alert('Failed to zip logos: ' + err.message);
    } finally {
      setIsDownloadingAll(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-brand-500" /> Logo Library
          </h2>
          <p className="text-xs text-slate-500 mt-1">Manage files in /public/logos.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadAllLogos}
            disabled={isDownloadingAll || logos.length === 0}
            className="flex items-center gap-2 bg-white text-slate-700 px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 border border-slate-200 disabled:opacity-60"
          >
            {isDownloadingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download All
          </button>
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 bg-slate-900 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-800 disabled:opacity-60"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Upload
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        {isLoadingLogos ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          </div>
        ) : logos.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p>No logos found in public/logos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {logos.map((logo) => (
              <div key={logo.sha} className="group relative border border-slate-100 rounded-xl p-3 bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="h-20 flex items-center justify-center mb-2 bg-white rounded-lg shadow-sm p-2">
                  <img src={logo.download_url} alt={logo.name} className="max-w-full max-h-full object-contain" />
                </div>
                <p className="text-xs font-medium text-slate-600 truncate text-center" title={logo.name}>
                  {logo.name}
                </p>
                <button
                  onClick={() => deleteLogo(logo.sha, logo.name)}
                  className="absolute top-2 right-2 p-1.5 bg-white text-red-500 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                  title="Delete Logo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, tone = 'slate' }) => {
  const tones = {
    slate: 'bg-white text-slate-900 border-slate-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    brand: 'bg-brand-50 text-brand-700 border-brand-100',
  };

  return (
    <div className={cx('rounded-2xl border p-4 shadow-sm', tones[tone])}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-extrabold">{value}</p>
    </div>
  );
};

export default function Admin() {
  const [pat, setPat] = useState(localStorage.getItem('github_pat') || '');
  const repo = import.meta.env.VITE_GITHUB_REPO || 'your-username/your-repo-name';
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('products');
  const [lastSaved, setLastSaved] = useState(null);

  const [siteMetaDate, setSiteMetaDate] = useState('');
  const [siteMetaSha, setSiteMetaSha] = useState('');
  const [fileSha, setFileSha] = useState('');
  const [products, setProducts] = useState([]);
  const [originalProducts, setOriginalProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [hasDraft, setHasDraft] = useState(() => Boolean(localStorage.getItem(DRAFT_KEY)));
  const [filters, setFilters] = useState({
    search: '',
    category: 'All',
    stock: 'All',
    visibility: 'All',
    issue: 'All',
  });

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort(), [products]);
  const badges = useMemo(() => Array.from(new Set([...dropdownOptions.badges, ...products.map((p) => p.status).filter(Boolean)])).sort(), [products]);

  const stats = useMemo(
    () => ({
      total: products.length,
      active: products.filter((p) => p.visible !== false && p.stock_status !== 'out_of_stock').length,
      out: products.filter((p) => p.visible !== false && p.stock_status === 'out_of_stock').length,
      hidden: products.filter((p) => p.visible === false).length,
      categories: categories.length,
    }),
    [categories.length, products],
  );

  const qualityIssues = useMemo(() => {
    const slugCounts = new Map();
    products.forEach((p) => {
      if (p.slug) slugCounts.set(p.slug, (slugCounts.get(p.slug) || 0) + 1);
    });

    return products.flatMap((product) => {
      const issues = [];
      if (!product.name?.trim()) issues.push('Missing name');
      if (!product.slug?.trim()) issues.push('Missing slug');
      if (product.slug && slugCounts.get(product.slug) > 1) issues.push('Duplicate slug');
      if (!product.category?.trim()) issues.push('Missing category');
      if (!product.image?.trim()) issues.push('Missing logo');
      if (!Number(product.our_price?.amount)) issues.push('Missing price');
      if (Number(product.official_price?.amount || 0) > 0 && Number(product.our_price?.amount || 0) >= Number(product.official_price?.amount || 0)) {
        issues.push('Our price is not lower');
      }
      return issues.length ? [{ id: product.id, name: product.name || `Product ${product.id}`, issues }] : [];
    });
  }, [products]);

  const filteredProducts = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const issueIds = new Set(qualityIssues.map((issue) => issue.id));

    return products.filter((product) => {
      const matchesSearch =
        !search ||
        product.name?.toLowerCase().includes(search) ||
        product.plan?.toLowerCase().includes(search) ||
        product.category?.toLowerCase().includes(search) ||
        product.slug?.toLowerCase().includes(search) ||
        product.id === search;

      const matchesCategory = filters.category === 'All' || product.category === filters.category;
      const matchesStock = filters.stock === 'All' || product.stock_status === filters.stock;
      const matchesVisibility =
        filters.visibility === 'All' ||
        (filters.visibility === 'visible' && product.visible !== false) ||
        (filters.visibility === 'hidden' && product.visible === false);
      const matchesIssue = filters.issue === 'All' || issueIds.has(product.id);

      return matchesSearch && matchesCategory && matchesStock && matchesVisibility && matchesIssue;
    });
  }, [filters, products, qualityIssues]);

  const editingProduct = products.find((product) => product.id === editingId);
  const allVisibleSelected = filteredProducts.length > 0 && filteredProducts.every((product) => selectedIds.has(product.id));

  const pendingChanges = useMemo(() => {
    const changes = [];
    const originalMap = new Map(originalProducts.map((p) => [getProductKey(p), p]));
    const currentMap = new Map(products.map((p) => [getProductKey(p), p]));

    products.forEach((currentP) => {
      const originalP = originalMap.get(getProductKey(currentP));

      if (!originalP) {
        changes.push({ type: 'added', name: currentP.name || 'Unnamed Product' });
        return;
      }

      const diffs = [];
      if (currentP.name !== originalP.name) diffs.push('Name');
      if (currentP.plan !== originalP.plan) diffs.push('Plan');
      if (currentP.category !== originalP.category) diffs.push('Category');
      if (currentP.our_price?.amount !== originalP.our_price?.amount) diffs.push('Price');
      if (currentP.stock_status !== originalP.stock_status) diffs.push('Stock');
      if (currentP.visible !== originalP.visible) diffs.push(currentP.visible ? 'Visible' : 'Hidden');
      if (currentP.image !== originalP.image) diffs.push('Logo');
      if (currentP.status !== originalP.status) diffs.push('Badge');
      if (diffs.length) changes.push({ type: 'modified', name: currentP.name || 'Unnamed Product', details: diffs.join(', ') });
    });

    originalProducts.forEach((originalP) => {
      if (!currentMap.has(getProductKey(originalP))) changes.push({ type: 'removed', name: originalP.name || 'Unnamed Product' });
    });

    return changes;
  }, [originalProducts, products]);

  const updateDraft = (nextProducts) => {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        products: nextProducts,
        siteMetaDate,
        savedAt: new Date().toISOString(),
      }),
    );
    setHasDraft(true);
  };

  const commitProducts = (nextProducts, { draft = true, clearSelection = false } = {}) => {
    const normalized = reindexProducts(nextProducts);
    setProducts(normalized);
    if (draft) updateDraft(normalized);
    if (clearSelection) setSelectedIds(new Set());
    if (editingId && !normalized.some((product) => product.id === editingId)) setEditingId(null);
  };

  const login = useCallback(async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`https://api.github.com/repos/${repo}/contents/public/data/products.json`, {
        headers: {
          Authorization: `token ${pat}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) throw new Error('Authentication failed. Check your PAT and Repository name.');

      const data = await response.json();
      setFileSha(data.sha);

      const decodedContent = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))));
      const json = JSON.parse(decodedContent);
      const organized = organizeProducts(json);
      setProducts(organized);
      setOriginalProducts(cloneProducts(organized));
      setIsAuthenticated(true);
      localStorage.setItem('github_pat', pat);

      try {
        const commitRes = await fetch(`https://api.github.com/repos/${repo}/commits?path=public/data/products.json&page=1&per_page=1`, {
          headers: {
            Authorization: `token ${pat}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });
        if (commitRes.ok) {
          const commitData = await commitRes.json();
          if (commitData.length > 0) setLastSaved(new Date(commitData[0].commit.committer.date).toLocaleString());
        }
      } catch (err) {
        console.error(err);
      }

      try {
        const metaRes = await fetch(`https://api.github.com/repos/${repo}/contents/src/data/siteMeta.json`, {
          headers: {
            Authorization: `token ${pat}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });
        if (metaRes.ok) {
          const metaData = await metaRes.json();
          setSiteMetaSha(metaData.sha);
          const metaContent = JSON.parse(decodeURIComponent(escape(atob(metaData.content))));
          setSiteMetaDate(metaContent.lastUpdated || '');
        }
      } catch (err) {
        console.error(err);
      }
    } catch (err) {
      setError(err.message);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, [pat, repo]);

  useEffect(() => {
    if (localStorage.getItem('github_pat')) login();
  }, [login]);

  const logout = () => {
    setIsAuthenticated(false);
    setPat('');
    setProducts([]);
    setOriginalProducts([]);
    setSelectedIds(new Set());
    localStorage.removeItem('github_pat');
  };

  const updateProduct = (id, fieldPath, value) => {
    const next = products.map((product) => {
      if (product.id !== id) return product;

      const updated = cloneProducts([product])[0];
      const parts = fieldPath.split('.');

      if (parts.length === 1) {
        updated[fieldPath] = fieldPath === 'visible' ? value === true || value === 'true' : value;
        if (fieldPath === 'name' && !updated.slug) updated.slug = slugify(value);
      } else {
        if (!updated[parts[0]]) updated[parts[0]] = {};
        updated[parts[0]][parts[1]] = parts[1] === 'amount' ? (value === '' ? '' : Number(value) || 0) : value;
      }

      if (fieldPath === 'name' || fieldPath === 'plan') {
        const base = `${updated.name || ''} ${updated.plan || ''}`;
        if (!updated.slug || fieldPath === 'name') updated.slug = slugify(base);
      }

      if (fieldPath === 'official_price.amount' || fieldPath === 'our_price.amount') {
        const official = Number(updated.official_price?.amount || 0);
        const ours = Number(updated.our_price?.amount || 0);
        updated.saved_amount = {
          ...(updated.saved_amount || {}),
          currency: 'BDT',
          amount: Math.max(official - ours, 0),
        };
      }

      return updated;
    });

    commitProducts(next);
  };

  const addNewProduct = () => {
    const nextProduct = {
      ...cloneProducts([emptyProduct])[0],
      id: '1',
      slug: `new-product-${Date.now()}`,
      name: 'New Product',
      visible: true,
    };
    const next = reindexProducts([nextProduct, ...products]);
    setProducts(next);
    updateDraft(next);
    setEditingId(next[0].id);
  };

  const duplicateProduct = (product) => {
    const index = products.findIndex((p) => p.id === product.id);
    const nextProduct = {
      ...cloneProducts([product])[0],
      id: '',
      name: `${product.name} Copy`,
      slug: `${product.slug || slugify(product.name)}-copy`,
    };
    const next = [...products];
    next.splice(index + 1, 0, nextProduct);
    const normalized = reindexProducts(next);
    commitProducts(normalized);
    setEditingId(normalized[index + 1].id);
  };

  const removeProduct = (product) => {
    if (!window.confirm(`Delete ${product.name || 'this product'}?`)) return;
    commitProducts(products.filter((p) => p.id !== product.id), { clearSelection: true });
  };

  const applyBulk = (action, value) => {
    if (selectedIds.size === 0) return;
    const next = products
      .filter((product) => !(action === 'delete' && selectedIds.has(product.id)))
      .map((product) => {
        if (!selectedIds.has(product.id)) return product;
        if (action === 'visible') return { ...product, visible: value };
        if (action === 'stock') return { ...product, stock_status: value };
        if (action === 'category') return { ...product, category: value };
        return product;
      });
    commitProducts(action === 'stock' || action === 'visible' ? organizeProducts(next) : next, { clearSelection: action === 'delete' });
  };

  const saveDraftNow = () => {
    updateDraft(products);
    alert('Draft saved in this browser.');
  };

  const restoreDraft = () => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw);
      if (!Array.isArray(draft.products)) throw new Error('Draft does not contain products.');
      commitProducts(draft.products, { draft: false, clearSelection: true });
      if (draft.siteMetaDate) setSiteMetaDate(draft.siteMetaDate);
      alert('Draft restored.');
    } catch (err) {
      alert('Could not restore draft: ' + err.message);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
  };

  const downloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(products, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', 'products.json');
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const archiveToGitHub = async () => {
    setIsArchiving(true);
    try {
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(products, null, 2))));
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileName = `products_${dateStr}.json`;

      const response = await fetch(`https://api.github.com/repos/${repo}/contents/public/data/product_archive/${fileName}`, {
        method: 'PUT',
        headers: {
          Authorization: `token ${pat}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Archive products.json on ${dateStr}`,
          content,
        }),
      });

      if (!response.ok) throw new Error('Failed to create archive on GitHub.');
      alert(`Successfully archived as ${fileName} in GitHub!`);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsArchiving(false);
    }
  };

  const saveToGitHub = async () => {
    if (qualityIssues.length > 0 && !window.confirm('There are product warnings. Publish anyway?')) return;

    setShowPublishModal(false);
    setIsSaving(true);
    try {
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(products, null, 2))));

      const response = await fetch(`https://api.github.com/repos/${repo}/contents/public/data/products.json`, {
        method: 'PUT',
        headers: {
          Authorization: `token ${pat}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Update products.json via Admin Panel',
          content,
          sha: fileSha,
        }),
      });

      if (!response.ok) throw new Error('Failed to save to GitHub. Make sure your PAT has write permissions.');

      const data = await response.json();
      setFileSha(data.content.sha);

      if (siteMetaDate) {
        try {
          const metaContent = btoa(unescape(encodeURIComponent(JSON.stringify({ lastUpdated: siteMetaDate }, null, 2))));
          const metaRes = await fetch(`https://api.github.com/repos/${repo}/contents/src/data/siteMeta.json`, {
            method: 'PUT',
            headers: {
              Authorization: `token ${pat}`,
              Accept: 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: 'Update site meta date via Admin Panel',
              content: metaContent,
              ...(siteMetaSha && { sha: siteMetaSha }),
            }),
          });
          if (metaRes.ok) {
            const newMetaData = await metaRes.json();
            setSiteMetaSha(newMetaData.content.sha);
          }
        } catch (err) {
          console.error('Failed to save site meta:', err);
        }
      }

      setLastSaved(new Date().toLocaleString());
      setOriginalProducts(cloneProducts(products));
      clearDraft();
      alert('Successfully saved to GitHub!');
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto p-6 mt-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
            <Github className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Login</h1>
          <p className="text-slate-500 text-sm mt-2">Connect to GitHub to edit products.</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100">{error}</div>}

        <form onSubmit={login} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Personal Access Token</label>
            <input
              type="password"
              value={pat}
              onChange={(e) => setPat(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxx"
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-slate-800 shadow-md disabled:opacity-70 mt-6"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Github className="w-5 h-5" />}
            {isLoading ? 'Connecting...' : 'Connect to GitHub'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 pb-24 relative">
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 overflow-y-auto">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Publish Changes</h2>
                  <p className="text-slate-500 text-sm mt-1">This updates GitHub and the live website after deployment.</p>
                </div>
                <button onClick={() => setShowPublishModal(false)} className="p-2 rounded-full hover:bg-slate-100 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <StatCard label="Products" value={products.length} />
                <StatCard label="Changes" value={pendingChanges.length} tone="brand" />
                <StatCard label="Warnings" value={qualityIssues.length} tone={qualityIssues.length ? 'amber' : 'green'} />
                <StatCard label="Selected" value={selectedIds.size} />
              </div>

              <div className="mb-5">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">Change Summary</h3>
                {pendingChanges.length > 0 ? (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {pendingChanges.map((change, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span
                          className={cx(
                            'font-bold shrink-0 mt-0.5',
                            change.type === 'added' && 'text-emerald-500',
                            change.type === 'removed' && 'text-red-500',
                            change.type === 'modified' && 'text-amber-500',
                          )}
                        >
                          {change.type === 'added' ? '+' : change.type === 'removed' ? '-' : '~'}
                        </span>
                        <div>
                          <span className="font-medium text-slate-800">{change.name}</span>
                          <span className="text-slate-500 ml-1">({change.type})</span>
                          {change.details && <span className="text-slate-500 block text-xs mt-0.5">Changed: {change.details}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center text-sm text-slate-500">
                    No products were changed since last save.
                  </div>
                )}
              </div>

              {qualityIssues.length > 0 && (
                <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Warnings before publish
                  </h3>
                  <div className="mt-3 max-h-36 overflow-y-auto space-y-2">
                    {qualityIssues.slice(0, 8).map((item) => (
                      <p key={item.id} className="text-xs text-amber-800">
                        <span className="font-semibold">{item.name}:</span> {item.issues.join(', ')}
                      </p>
                    ))}
                    {qualityIssues.length > 8 && <p className="text-xs font-medium text-amber-800">And {qualityIssues.length - 8} more...</p>}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPublishModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveToGitHub}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 shadow-md shadow-brand-500/20 flex justify-center items-center gap-2 disabled:opacity-60"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Publish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 bg-white p-4 sm:px-6 rounded-2xl border border-slate-200 shadow-sm mb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Github className="w-6 h-6" /> Admin Panel
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Editing <span className="font-medium text-slate-700">{repo}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('products')}
              className={cx('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium', activeTab === 'products' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}
            >
              <Package className="w-4 h-4" /> Products
            </button>
            <button
              onClick={() => setActiveTab('logos')}
              className={cx('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium', activeTab === 'logos' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}
            >
              <ImageIcon className="w-4 h-4" /> Logos
            </button>
          </div>
          <button onClick={logout} className="flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-200">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {activeTab === 'logos' ? (
        <LogoManager pat={pat} repo={repo} />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <StatCard label="Total" value={stats.total} />
            <StatCard label="In Stock" value={stats.active} tone="green" />
            <StatCard label="Out" value={stats.out} tone="amber" />
            <StatCard label="Hidden" value={stats.hidden} tone="red" />
            <StatCard label="Categories" value={stats.categories} tone="brand" />
          </div>

          <div className="sticky top-16 z-30 bg-slate-50/95 backdrop-blur border border-slate-200 rounded-2xl p-3 shadow-sm">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={addNewProduct} className="flex items-center gap-2 bg-slate-900 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-800">
                  <Plus className="w-4 h-4" /> Add Product
                </button>
                <button onClick={() => commitProducts(organizeProducts(products))} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-50">
                  <Layers3 className="w-4 h-4" /> Auto Sort
                </button>
                <button onClick={saveDraftNow} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-50">
                  <Save className="w-4 h-4" /> Draft
                </button>
                {hasDraft && (
                  <button onClick={restoreDraft} className="flex items-center gap-2 bg-brand-50 border border-brand-100 text-brand-700 px-3 py-2 rounded-xl text-sm font-medium hover:bg-brand-100">
                    <RotateCcw className="w-4 h-4" /> Restore
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 bg-white px-3 py-2 rounded-xl border border-slate-200">
                  <span>Date</span>
                  <input
                    type="text"
                    value={siteMetaDate}
                    onChange={(e) => setSiteMetaDate(e.target.value)}
                    className="bg-transparent border-none outline-none font-medium text-slate-800 w-28 sm:w-36 p-0"
                    placeholder="31-03-2026"
                  />
                </div>
                {lastSaved && <span className="text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">Saved: {lastSaved}</span>}
                <button onClick={downloadJson} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-50">
                  <Download className="w-4 h-4" /> JSON
                </button>
                <button onClick={archiveToGitHub} disabled={isArchiving || isSaving} className="flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-2 rounded-xl text-sm font-medium hover:bg-amber-100 disabled:opacity-50">
                  {isArchiving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                  Archive
                </button>
                <button onClick={() => setShowPublishModal(true)} disabled={isSaving || isArchiving} className="flex items-center gap-2 bg-brand-600 text-white border border-brand-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Publish
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div className="relative md:col-span-2">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={filters.search}
                      onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                      placeholder="Search name, plan, category, slug..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>
                  <select value={filters.category} onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm">
                    <option value="All">All categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <select value={filters.stock} onChange={(e) => setFilters((prev) => ({ ...prev, stock: e.target.value }))} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm">
                    <option value="All">All stock</option>
                    <option value="in_stock">In stock</option>
                    <option value="out_of_stock">Out of stock</option>
                  </select>
                  <select value={filters.visibility} onChange={(e) => setFilters((prev) => ({ ...prev, visibility: e.target.value }))} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm">
                    <option value="All">All visibility</option>
                    <option value="visible">Visible</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, issue: prev.issue === 'warnings' ? 'All' : 'warnings' }))}
                    className={cx(
                      'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border',
                      filters.issue === 'warnings' ? 'bg-amber-100 border-amber-200 text-amber-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50',
                    )}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Warnings {qualityIssues.length}
                  </button>

                  {selectedIds.size > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500">{selectedIds.size} selected</span>
                      <button onClick={() => applyBulk('visible', true)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50">Show</button>
                      <button onClick={() => applyBulk('visible', false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50">Hide</button>
                      <button onClick={() => applyBulk('stock', 'in_stock')} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">In Stock</button>
                      <button onClick={() => applyBulk('stock', 'out_of_stock')} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">Out</button>
                      <button onClick={() => window.confirm(`Delete ${selectedIds.size} products?`) && applyBulk('delete')} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 border border-red-100">Delete</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-left w-10">
                          <input
                            type="checkbox"
                            checked={allVisibleSelected}
                            onChange={(e) => {
                              const next = new Set(selectedIds);
                              filteredProducts.forEach((product) => (e.target.checked ? next.add(product.id) : next.delete(product.id)));
                              setSelectedIds(next);
                            }}
                          />
                        </th>
                        <th className="px-4 py-3 text-left">Product</th>
                        <th className="px-4 py-3 text-left">Category</th>
                        <th className="px-4 py-3 text-right">Price</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProducts.map((product) => {
                        const itemIssues = qualityIssues.find((issue) => issue.id === product.id);
                        const isActive = editingId === product.id;
                        return (
                          <tr key={product.id} className={cx('hover:bg-slate-50', isActive && 'bg-brand-50/60', product.visible === false && 'opacity-60')}>
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedIds.has(product.id)}
                                onChange={(e) => {
                                  const next = new Set(selectedIds);
                                  if (e.target.checked) next.add(product.id);
                                  else next.delete(product.id);
                                  setSelectedIds(next);
                                }}
                              />
                            </td>
                            <td className="px-4 py-3 min-w-[280px]">
                              <button onClick={() => setEditingId(product.id)} className="flex items-center gap-3 text-left w-full">
                                <div className="w-11 h-11 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200 shrink-0">
                                  {product.image ? <img src={product.image} alt="" className="w-full h-full object-contain p-1.5" /> : <ImageIcon className="w-4 h-4 text-slate-400" />}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-slate-900 truncate">{product.name || 'Unnamed Product'}</div>
                                  <div className="text-xs text-slate-500 truncate">#{product.id} {product.plan}</div>
                                  {itemIssues && <div className="text-xs text-amber-700 mt-1 truncate">{itemIssues.issues.join(', ')}</div>}
                                </div>
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium whitespace-nowrap">{product.category || 'None'}</span>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900 whitespace-nowrap">BDT {product.our_price?.amount || 0}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {product.visible === false ? (
                                  <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold">Hidden</span>
                                ) : product.stock_status === 'out_of_stock' ? (
                                  <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">Out</span>
                                ) : (
                                  <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">Live</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={() => updateProduct(product.id, 'visible', product.visible === false)} className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50" title={product.visible === false ? 'Show' : 'Hide'}>
                                  {product.visible === false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>
                                <button onClick={() => duplicateProduct(product)} className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50" title="Duplicate">
                                  <Copy className="w-4 h-4" />
                                </button>
                                <button onClick={() => removeProduct(product)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50" title="Delete">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredProducts.length === 0 && (
                        <tr>
                          <td colSpan="6" className="px-6 py-14 text-center text-slate-500">
                            No products match the current filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-fit lg:sticky lg:top-36">
              {editingProduct ? (
                <div>
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-bold text-slate-900 truncate">Edit Product</h2>
                      <p className="text-xs text-slate-500 truncate">{editingProduct.name || 'Unnamed Product'}</p>
                    </div>
                    <button onClick={() => setEditingId(null)} className="p-2 rounded-full text-slate-400 hover:bg-slate-100">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-4 space-y-5 max-h-[calc(100vh-12rem)] overflow-y-auto">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden shrink-0">
                        {editingProduct.image ? <img src={editingProduct.image} alt="" className="w-full h-full object-contain p-2" /> : <ImageIcon className="w-7 h-7 text-slate-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Logo</label>
                        <input
                          type="text"
                          list="logos-list"
                          value={editingProduct.image || ''}
                          onChange={(e) => updateProduct(editingProduct.id, 'image', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="ID" value={editingProduct.id || ''} onChange={(value) => updateProduct(editingProduct.id, 'id', value)} />
                      <Field label="Slug" value={editingProduct.slug || ''} onChange={(value) => updateProduct(editingProduct.id, 'slug', slugify(value))} />
                    </div>
                    <Field label="Name" value={editingProduct.name || ''} onChange={(value) => updateProduct(editingProduct.id, 'name', value)} />
                    <Field label="Plan" value={editingProduct.plan || ''} onChange={(value) => updateProduct(editingProduct.id, 'plan', value)} />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Category" value={editingProduct.category || ''} onChange={(value) => updateProduct(editingProduct.id, 'category', value)} list="category-list" />
                      <Field label="Badge" value={editingProduct.status || ''} onChange={(value) => updateProduct(editingProduct.id, 'status', value)} list="badge-list" />
                    </div>

                    <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-800">Pricing</h3>
                        <span className="text-xs text-slate-500">BDT</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field type="number" label="Official" value={editingProduct.official_price?.amount ?? ''} onChange={(value) => updateProduct(editingProduct.id, 'official_price.amount', value)} />
                        <Field type="number" label="Our Price" value={editingProduct.our_price?.amount ?? ''} onChange={(value) => updateProduct(editingProduct.id, 'our_price.amount', value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Field type="number" label="Saved" value={editingProduct.saved_amount?.amount ?? ''} onChange={(value) => updateProduct(editingProduct.id, 'saved_amount.amount', value)} />
                        <Field label="Duration" value={editingProduct.official_price?.duration || ''} onChange={(value) => updateProduct(editingProduct.id, 'official_price.duration', value)} list="duration-list" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Stock</label>
                        <select value={editingProduct.stock_status || 'in_stock'} onChange={(e) => updateProduct(editingProduct.id, 'stock_status', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm">
                          <option value="in_stock">In Stock</option>
                          <option value="out_of_stock">Out of Stock</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Visibility</label>
                        <select value={editingProduct.visible === false ? 'false' : 'true'} onChange={(e) => updateProduct(editingProduct.id, 'visible', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm">
                          <option value="true">Visible</option>
                          <option value="false">Hidden</option>
                        </select>
                      </div>
                    </div>

                    <TextArea label="How to Get" value={editingProduct.how_to_get || ''} onChange={(value) => updateProduct(editingProduct.id, 'how_to_get', value)} />
                    <TextArea label="Remarks" value={editingProduct.remarks || ''} onChange={(value) => updateProduct(editingProduct.id, 'remarks', value)} />

                    <div className="flex gap-2 pt-2">
                      <button onClick={() => duplicateProduct(editingProduct)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50">
                        <Copy className="w-4 h-4" /> Duplicate
                      </button>
                      <button onClick={() => removeProduct(editingProduct)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-red-100 bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100">
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <h2 className="font-bold text-slate-900">Select a product</h2>
                  <p className="text-sm text-slate-500 mt-1">Click any row to edit details, price, logo, stock, or visibility.</p>
                  {qualityIssues.length === 0 ? (
                    <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
                      <CheckCircle2 className="w-4 h-4" /> No data warnings
                    </div>
                  ) : (
                    <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-100">
                      <AlertTriangle className="w-4 h-4" /> {qualityIssues.length} warnings
                    </div>
                  )}
                </div>
              )}
            </aside>
          </div>
        </div>
      )}

      <datalist id="logos-list">
        {availableLogos.map((logo) => (
          <option key={logo} value={logo} />
        ))}
      </datalist>
      <datalist id="duration-list">
        {dropdownOptions.durations.map((duration) => (
          <option key={duration} value={duration} />
        ))}
      </datalist>
      <datalist id="badge-list">
        {badges.map((badge) => (
          <option key={badge} value={badge} />
        ))}
      </datalist>
      <datalist id="category-list">
        {categories.map((category) => (
          <option key={category} value={category} />
        ))}
      </datalist>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', list }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <input
        type={type}
        step={type === 'number' ? '0.01' : undefined}
        list={list}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
      />
    </div>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows="4"
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-y"
      />
    </div>
  );
}
