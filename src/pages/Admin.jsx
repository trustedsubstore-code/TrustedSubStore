import React, { useState, useEffect, useRef } from 'react';
import { Download, Plus, Trash2, ChevronDown, ChevronUp, Save, GripVertical, Github, Loader2, LogOut, Archive, Image as ImageIcon, Package, Upload, Search, Copy } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import dropdownOptions from '../data/dropdownOptions.json';

const logoModules = import.meta.glob('../../public/logos/*.{png,jpg,jpeg,svg,webp,gif}');
const availableLogos = Object.keys(logoModules).map(path => path.replace('../../public', ''));

const emptyProduct = {
  id: "",
  slug: "",
  name: "",
  plan: "",
  category: "",
  official_price: {
    amount: 0,
    currency: "BDT",
    duration: ""
  },
  our_price: {
    amount: 0,
    currency: "BDT"
  },
  saved_amount: {
    amount: 0,
    currency: "BDT"
  },
  image: "",
  how_to_get: "",
  remarks: "",
  stock_status: "in_stock",
  visible: true,
  status: ""
};

const LogoManager = ({ pat, repo }) => {
  const [logos, setLogos] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingLogos, setIsLoadingLogos] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const fileInputRef = useRef(null);

  const fetchLogos = async () => {
    setIsLoadingLogos(true);
    try {
      const response = await fetch(`https://api.github.com/repos/${repo}/contents/public/logos`, {
        headers: {
          'Authorization': `token ${pat}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (!response.ok) return;
      const data = await response.json();
      if (Array.isArray(data)) {
        setLogos(data.filter(file => file.type === 'file' && file.name.match(/\.(png|jpe?g|svg|webp|gif)$/i)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingLogos(false);
    }
  };

  useEffect(() => {
    fetchLogos();
  }, [pat, repo]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = prompt("Enter filename with extension (e.g., netflix.png):", file.name.toLowerCase().replace(/\s+/g, '-'));
    if (!fileName) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64Data = event.target.result.split(',')[1];
        
        // Check if file exists to get SHA for overwriting
        let sha = undefined;
        try {
          const checkRes = await fetch(`https://api.github.com/repos/${repo}/contents/public/logos/${fileName}`, {
            headers: { 'Authorization': `token ${pat}` }
          });
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            sha = checkData.sha;
          }
        } catch (e) {}

        const response = await fetch(`https://api.github.com/repos/${repo}/contents/public/logos/${fileName}`, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${pat}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `Upload logo ${fileName} via Admin Panel`,
            content: base64Data,
            ...(sha && { sha })
          })
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
    if (!window.confirm(`Are you sure you want to delete ${fileName}? This will break any products currently using it.`)) return;
    
    try {
      const response = await fetch(`https://api.github.com/repos/${repo}/contents/public/logos/${fileName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `token ${pat}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Delete logo ${fileName}`,
          sha: fileSha
        })
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
      
      const fetchPromises = logos.map(async (logo) => {
        try {
          const response = await fetch(logo.download_url);
          if (response.ok) {
            const blob = await response.blob();
            zip.file(logo.name, blob);
          }
        } catch (e) {
          console.error('Failed to fetch', logo.name);
        }
      });
      
      await Promise.all(fetchPromises);
      
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'trusted-sub-store-logos.zip');
    } catch (err) {
      alert('Failed to zip logos: ' + err.message);
    } finally {
      setIsDownloadingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-brand-500" /> Logo Library
          </h2>
          <p className="text-xs text-slate-500 mt-1">Files in /public/logos</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={downloadAllLogos}
            disabled={isDownloadingAll || logos.length === 0}
            className="flex items-center gap-2 bg-white text-slate-700 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm border border-slate-200 disabled:opacity-70"
            title="Download All Logos as ZIP"
          >
            {isDownloadingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span className="hidden sm:inline">{isDownloadingAll ? 'Zipping...' : 'Download All'}</span>
          </button>

          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 bg-slate-900 text-white px-3 sm:px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-70"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span className="hidden sm:inline">{isUploading ? 'Uploading...' : 'Upload Logo'}</span>
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
            <p>No logos found in public/logos</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {logos.map((logo) => (
              <div key={logo.sha} className="group relative border border-slate-100 rounded-xl p-3 bg-slate-50 hover:bg-slate-100 transition-colors flex flex-col items-center">
                <div className="w-16 h-16 flex items-center justify-center mb-2 bg-white rounded-lg shadow-sm p-2 w-full">
                  <img src={logo.download_url} alt={logo.name} className="max-w-full max-h-full object-contain" />
                </div>
                <p className="text-xs font-medium text-slate-600 truncate w-full text-center" title={logo.name}>
                  {logo.name}
                </p>
                <div className="text-[10px] text-slate-400 font-mono mt-1 w-full text-center truncate">
                  /logos/{logo.name}
                </div>
                
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
  const [editingIndex, setEditingIndex] = useState(null);
  const [adminSearch, setAdminSearch] = useState('');
  const [showPublishModal, setShowPublishModal] = useState(false);

  const filteredAdminProducts = products.filter(p => 
    p.name?.toLowerCase().includes(adminSearch.toLowerCase()) || 
    p.category?.toLowerCase().includes(adminSearch.toLowerCase()) ||
    p.id === adminSearch
  );

  const organizeProducts = (list) => {
    const activeInStock = [];
    const activeOutStock = [];
    const inactive = [];

    list.forEach(p => {
      if (p.visible === false) {
        inactive.push(p);
      } else if (p.stock_status === 'out_of_stock') {
        activeOutStock.push(p);
      } else {
        activeInStock.push(p);
      }
    });

    return [...activeInStock, ...activeOutStock, ...inactive].map((p, i) => ({
      ...p,
      id: (i + 1).toString()
    }));
  };

  // Automatically try to login if credentials are in localStorage
  useEffect(() => {
    if (localStorage.getItem('github_pat')) {
      login();
    }
  }, []);

  const login = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`https://api.github.com/repos/${repo}/contents/public/data/products.json`, {
        headers: {
          'Authorization': `token ${pat}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Authentication failed. Check your PAT and Repository name (owner/repo).');
      }
      
      const data = await response.json();
      setFileSha(data.sha);
      
      // GitHub content is base64 encoded, sometimes with newlines
      const decodedContent = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))));
      const json = JSON.parse(decodedContent);
      
      const organized = organizeProducts(json);
      setProducts(organized);
      setOriginalProducts(JSON.parse(JSON.stringify(organized)));
      setIsAuthenticated(true);
      localStorage.setItem('github_pat', pat);

      // Fetch last commit date
      try {
        const commitRes = await fetch(`https://api.github.com/repos/${repo}/commits?path=public/data/products.json&page=1&per_page=1`, {
          headers: {
            'Authorization': `token ${pat}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        if (commitRes.ok) {
          const commitData = await commitRes.json();
          if (commitData.length > 0) {
            setLastSaved(new Date(commitData[0].commit.committer.date).toLocaleString());
          }
        }
      } catch (e) {}

      // Fetch siteMeta.json for the display date
      try {
        const metaRes = await fetch(`https://api.github.com/repos/${repo}/contents/src/data/siteMeta.json`, {
          headers: {
            'Authorization': `token ${pat}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        if (metaRes.ok) {
          const metaData = await metaRes.json();
          setSiteMetaSha(metaData.sha);
          const metaContent = JSON.parse(decodeURIComponent(escape(atob(metaData.content))));
          
          let dateStr = metaContent.lastUpdated || '';
          try {
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) {
              dateStr = d.toISOString().split('T')[0];
            }
          } catch(e) {}
          
          setSiteMetaDate(dateStr);
        }
      } catch (e) {}
      
    } catch (err) {
      setError(err.message);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setPat('');
    localStorage.removeItem('github_pat');
    setProducts([]);
  };

  const saveToGitHub = async () => {
    setShowPublishModal(false);
    setIsSaving(true);
    try {
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(products, null, 2))));
      
      const response = await fetch(`https://api.github.com/repos/${repo}/contents/public/data/products.json`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${pat}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Update products.json via Admin Panel',
          content: content,
          sha: fileSha
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save to GitHub. Make sure your PAT has write permissions.');
      }
      
      const data = await response.json();
      setFileSha(data.content.sha);

      // Save site meta if we have the date
      if (siteMetaDate) {
        try {
          let formattedDate = siteMetaDate;
          if (siteMetaDate.includes('-')) {
            const [year, month, day] = siteMetaDate.split('-');
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            formattedDate = `${parseInt(day)} ${monthNames[parseInt(month)-1]}, ${year}`;
          }

          const metaContent = btoa(unescape(encodeURIComponent(JSON.stringify({ lastUpdated: formattedDate }, null, 2))));
          const metaRes = await fetch(`https://api.github.com/repos/${repo}/contents/src/data/siteMeta.json`, {
            method: 'PUT',
            headers: {
              'Authorization': `token ${pat}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: `Update site meta date via Admin Panel`,
              content: metaContent,
              ...(siteMetaSha && { sha: siteMetaSha })
            })
          });
          if (metaRes.ok) {
            const newMetaData = await metaRes.json();
            setSiteMetaSha(newMetaData.content.sha);
          }
        } catch (e) {
          console.error('Failed to save site meta:', e);
        }
      }

      setLastSaved(new Date().toLocaleString());
      setOriginalProducts(JSON.parse(JSON.stringify(products)));
      alert('Successfully saved to GitHub!');
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
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
          'Authorization': `token ${pat}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Archive products.json on ${dateStr}`,
          content: content
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create archive on GitHub.');
      }
      
      alert(`Successfully archived as ${fileName} in GitHub!`);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsArchiving(false);
    }
  };

  const downloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(products, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "products.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const reorderedProducts = Array.from(products);
    const [movedProduct] = reorderedProducts.splice(result.source.index, 1);
    reorderedProducts.splice(result.destination.index, 0, movedProduct);
    const updatedProducts = reorderedProducts.map((p, index) => ({
      ...p,
      id: (index + 1).toString()
    }));
    setProducts(updatedProducts);
    setEditingIndex(null);
  };

  const addNewProduct = () => {
    const newId = products.length > 0 ? Math.max(...products.map(p => parseInt(p.id) || 0)) + 1 : 1;
    const newProduct = { ...emptyProduct, id: newId.toString() };
    const updatedProducts = [newProduct, ...products].map((p, i) => ({
      ...p,
      id: (i + 1).toString()
    }));
    setProducts(updatedProducts);
    setEditingIndex(0);
  };

  const removeProduct = (index) => {
    if (window.confirm("Are you sure you want to remove this product?")) {
      const newProducts = [...products];
      newProducts.splice(index, 1);
      const updatedProducts = newProducts.map((p, i) => ({
        ...p,
        id: (i + 1).toString()
      }));
      setProducts(updatedProducts);
      if (editingIndex === index) {
        setEditingIndex(null);
      } else if (editingIndex > index) {
        setEditingIndex(editingIndex - 1);
      }
    }
  };

  const duplicateProduct = (index) => {
    const productToCopy = products[index];
    const newId = products.length > 0 ? Math.max(...products.map(p => parseInt(p.id) || 0)) + 1 : 1;
    const newProduct = { 
      ...productToCopy, 
      id: newId.toString(),
      name: `${productToCopy.name} (Copy)`,
      slug: productToCopy.slug ? `${productToCopy.slug}-copy` : ''
    };
    const updatedProducts = [...products];
    updatedProducts.splice(index + 1, 0, newProduct);
    const reindexedProducts = updatedProducts.map((p, i) => ({
      ...p,
      id: (i + 1).toString()
    }));
    setProducts(reindexedProducts);
    setEditingIndex(index + 1);
  };

  const updateProduct = (index, fieldPath, value) => {
    const newProducts = [...products];
    const pathParts = fieldPath.split('.');
    
    if (pathParts.length === 1) {
      if (fieldPath === 'visible') value = value === 'true' || value === true;
      newProducts[index][fieldPath] = value;
      
      if (fieldPath === 'name' && !newProducts[index].slug) {
        newProducts[index].slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
    } else if (pathParts.length === 2) {
      if (!newProducts[index][pathParts[0]]) newProducts[index][pathParts[0]] = {};
      if (pathParts[1] === 'amount') value = value === '' ? '' : (parseFloat(value) || 0);
      newProducts[index][pathParts[0]][pathParts[1]] = value;

      if ((pathParts[0] === 'official_price' || pathParts[0] === 'our_price') && pathParts[1] === 'amount') {
        const official = parseFloat(newProducts[index].official_price?.amount) || 0;
        const ours = parseFloat(newProducts[index].our_price?.amount) || 0;
        const diff = official - ours;
        if (!newProducts[index].saved_amount) newProducts[index].saved_amount = {};
        newProducts[index].saved_amount.amount = diff > 0 ? parseFloat(diff.toFixed(2)) : 0;
      }
    }

    if (fieldPath === 'stock_status' || fieldPath === 'visible') {
      const targetSlug = newProducts[index].slug;
      const targetName = newProducts[index].name;
      const resorted = organizeProducts(newProducts);
      const newIdx = resorted.findIndex(p => p.slug === targetSlug && p.name === targetName);
      setProducts(resorted);
      if (newIdx !== -1) setEditingIndex(newIdx);
    } else {
      setProducts(newProducts);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto p-6 mt-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
            <Github className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold font-display text-slate-800">Admin Login</h1>
          <p className="text-slate-500 text-sm mt-2">Connect to GitHub to edit products</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={login} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Personal Access Token</label>
            <input 
              type="password" 
              value={pat}
              onChange={(e) => setPat(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxx"
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors shadow-md disabled:opacity-70 mt-6"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Github className="w-5 h-5" />}
            {isLoading ? 'Connecting...' : 'Connect to GitHub'}
          </button>
        </form>
      </div>
    );
  }

  const getChanges = () => {
    const changes = [];
    const originalMap = new Map();
    originalProducts.forEach(p => originalMap.set(p.slug || p.name || p.id, p));
    
    const currentMap = new Map();
    products.forEach(p => currentMap.set(p.slug || p.name || p.id, p));

    products.forEach(currentP => {
      const key = currentP.slug || currentP.name || currentP.id;
      const originalP = originalMap.get(key);
      
      if (!originalP) {
        changes.push({ type: 'added', name: currentP.name || 'Unnamed Product' });
      } else {
        const diffs = [];
        if (currentP.our_price?.amount !== originalP.our_price?.amount) diffs.push('Price');
        if (currentP.stock_status !== originalP.stock_status) diffs.push('Stock');
        if (currentP.visible !== originalP.visible) diffs.push(currentP.visible ? 'Unhidden' : 'Hidden');
        if (currentP.plan !== originalP.plan) diffs.push('Plan');
        if (currentP.category !== originalP.category) diffs.push('Category');
        if (currentP.image !== originalP.image) diffs.push('Image');
        if (currentP.status !== originalP.status) diffs.push('Badge');
        
        if (diffs.length > 0) {
          changes.push({ type: 'modified', name: currentP.name || 'Unnamed Product', details: diffs.join(', ') });
        }
      }
    });

    originalProducts.forEach(originalP => {
      const key = originalP.slug || originalP.name || originalP.id;
      if (!currentMap.has(key)) {
        changes.push({ type: 'removed', name: originalP.name || 'Unnamed Product' });
      }
    });

    return changes;
  };

  const pendingChanges = getChanges();

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-24 relative">
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 overflow-y-auto">
              <h2 className="text-xl font-bold text-slate-800 mb-2">Publish Changes?</h2>
              <p className="text-slate-500 text-sm mb-6">
                You are about to save the current products to GitHub. This will update the live website.
              </p>
              
              {pendingChanges.length > 0 ? (
                <div className="mb-6 space-y-3">
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">Recent Changes</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {pendingChanges.map((change, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {change.type === 'added' && <span className="text-emerald-500 font-bold shrink-0 mt-0.5">+</span>}
                        {change.type === 'removed' && <span className="text-red-500 font-bold shrink-0 mt-0.5">-</span>}
                        {change.type === 'modified' && <span className="text-amber-500 font-bold shrink-0 mt-0.5">~</span>}
                        <div>
                          <span className="font-medium text-slate-800">{change.name}</span>
                          {change.type === 'added' && <span className="text-slate-500 ml-1">(Added)</span>}
                          {change.type === 'removed' && <span className="text-slate-500 ml-1">(Removed)</span>}
                          {change.type === 'modified' && <span className="text-slate-500 block text-xs mt-0.5">Changed: {change.details}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center mb-6 text-sm text-slate-500">
                  No products were changed since last save.
                </div>
              )}
              
              <div className="bg-slate-50 rounded-2xl p-5 mb-6 space-y-3 border border-slate-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 font-medium">Total Products</span>
                  <span className="font-bold text-slate-800">{products.length}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Active & In Stock</span>
                  <span className="font-semibold text-brand-600">
                    {products.filter(p => p.visible !== false && p.stock_status !== 'out_of_stock').length}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Out of Stock</span>
                  <span className="font-semibold text-amber-600">
                    {products.filter(p => p.stock_status === 'out_of_stock' && p.visible !== false).length}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Hidden / Inactive</span>
                  <span className="font-semibold text-slate-400">
                    {products.filter(p => p.visible === false).length}
                  </span>
                </div>
                <div className="h-px bg-slate-200 my-2"></div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 font-medium">Display Date</span>
                  <span className="font-semibold text-slate-800">{siteMetaDate || 'Not set'}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowPublishModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveToGitHub}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 shadow-md shadow-brand-500/20 transition-all flex justify-center items-center gap-2"
                >
                  <Save className="w-4 h-4" /> Confirm & Publish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 bg-white p-4 sm:px-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold font-display text-slate-800 flex items-center gap-2">
            <Github className="w-6 h-6" /> Admin Panel
          </h1>
          <p className="text-slate-500 text-xs mt-1">Editing <span className="font-medium text-slate-700">{repo}</span></p>
        </div>
        
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'products' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Package className="w-4 h-4" /> Products
          </button>
          <button
            onClick={() => setActiveTab('logos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'logos' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <ImageIcon className="w-4 h-4" /> Logos
          </button>
        </div>

        <button 
          onClick={logout}
          className="flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {activeTab === 'logos' ? (
        <LogoManager pat={pat} repo={repo} />
      ) : (
        <div className="space-y-4">
          {/* Action Bar for Products */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <span className="font-medium text-slate-700 whitespace-nowrap">Total: {products.length}</span>
              
              <button 
                onClick={addNewProduct}
                className="flex items-center gap-1 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>

              <button 
                onClick={() => {
                  setProducts(organizeProducts(products));
                  setEditingIndex(null);
                }}
                className="flex items-center gap-1 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors whitespace-nowrap"
              >
                Auto-Sort List
              </button>

              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 whitespace-nowrap">
                <span className="hidden sm:inline">Display Date:</span>
                <span className="sm:hidden">Date:</span>
                <input 
                  type="date" 
                  value={siteMetaDate}
                  onChange={(e) => setSiteMetaDate(e.target.value)}
                  className="bg-transparent border-none outline-none font-medium text-slate-800 w-32 focus:ring-0 p-0"
                />
              </div>

              {lastSaved && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-md border border-emerald-100 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Last Saved: {lastSaved.split(',')[1]?.trim() || lastSaved}
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto md:justify-end">
              <button onClick={downloadJson} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm whitespace-nowrap" title="Download Local Backup">
                <Download className="w-4 h-4" /> <span className="hidden sm:inline">Download</span>
              </button>
              
              <button onClick={archiveToGitHub} disabled={isArchiving || isSaving} className="flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-2 rounded-xl text-sm font-medium hover:bg-amber-100 transition-colors shadow-sm disabled:opacity-50 whitespace-nowrap">
                {isArchiving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                <span className="hidden sm:inline">{isArchiving ? 'Archiving...' : 'Backup Archive'}</span>
              </button>
              
              <button onClick={() => setShowPublishModal(true)} disabled={isSaving || isArchiving} className="flex items-center gap-2 bg-brand-600 text-white border border-brand-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-50 whitespace-nowrap">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save to GitHub'}</span>
              </button>
            </div>
          </div>

          <div className="relative mb-2">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
              placeholder="Search products by name, category, or ID..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all shadow-sm"
            />
          </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="products-list" isDropDisabled={adminSearch !== ''}>
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {filteredAdminProducts.map((product, mapIndex) => {
                  const originalIndex = products.findIndex(p => p.id === product.id);
                  return (
                  <Draggable key={product.id || `temp-${originalIndex}`} draggableId={product.id || `temp-${originalIndex}`} index={originalIndex} isDragDisabled={adminSearch !== ''}>
                    {(provided) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`border rounded-2xl shadow-sm overflow-hidden transition-all duration-500 ${
                          product.visible === false 
                            ? 'border-slate-300 bg-slate-200/70 opacity-60 grayscale' 
                            : product.stock_status === 'out_of_stock'
                              ? 'border-red-300 bg-red-100/60'
                              : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className={`flex items-center justify-between p-4 transition-colors ${
                          editingIndex === originalIndex || product.stock_status === 'out_of_stock' || product.visible === false 
                            ? 'border-b border-black/5 bg-black/5' 
                            : 'hover:bg-slate-50 border-b border-transparent'
                        }`}>
                          <div className="flex items-center gap-3 flex-1">
                            <div {...provided.dragHandleProps} className={`text-slate-400 p-2 flex items-center justify-center ${adminSearch !== '' ? 'opacity-30 cursor-not-allowed' : 'hover:text-brand-500 cursor-grab active:cursor-grabbing'}`}>
                              <GripVertical className="w-5 h-5" />
                            </div>
                            <div className="flex items-center gap-4 cursor-pointer flex-1 py-1" onClick={() => setEditingIndex(editingIndex === originalIndex ? null : originalIndex)}>
                              <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-slate-200">
                                {product.image ? (
                                  <img src={product.image} alt="" className="w-full h-full object-contain p-1" />
                                ) : (
                                  <span className="text-slate-400 text-xs">No img</span>
                                )}
                              </div>
                              <div>
                                <h3 className="font-semibold text-slate-800">{product.name || 'Unnamed Product'}</h3>
                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                  <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">ID: {product.id}</span>
                                  <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded capitalize">{product.category || 'No Category'}</span>
                                  <span className="font-medium text-slate-700">৳{product.our_price?.amount || 0}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button onClick={(e) => { e.stopPropagation(); duplicateProduct(originalIndex); }} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Duplicate Product">
                              <Copy className="w-4 h-4" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); removeProduct(originalIndex); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete Product">
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="p-2 text-slate-400 bg-slate-50 rounded-lg flex items-center justify-center">
                              {editingIndex === originalIndex ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                          </div>
                        </div>

                        {editingIndex === originalIndex && (
                          <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white">
                            <div className="space-y-4 md:col-span-2 relative">
                               <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-2 mb-3">Basic Info</h4>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">ID</label>
                              <input type="text" value={product.id || ''} onChange={(e) => updateProduct(originalIndex, 'id', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Slug (URL friendly)</label>
                              <input type="text" value={product.slug || ''} onChange={(e) => updateProduct(originalIndex, 'slug', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
                              <input type="text" value={product.name || ''} onChange={(e) => updateProduct(originalIndex, 'name', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Plan Description</label>
                              <input type="text" value={product.plan || ''} onChange={(e) => updateProduct(originalIndex, 'plan', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
                              <input type="text" value={product.category || ''} onChange={(e) => updateProduct(originalIndex, 'category', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Image URL</label>
                              <input type="text" list="logos-list" value={product.image || ''} onChange={(e) => updateProduct(originalIndex, 'image', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900" />
                            </div>

                            <div className="space-y-4 md:col-span-2 mt-4">
                               <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-2 mb-3">Pricing (BDT)</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Official Price</label>
                                <input type="number" step="0.01" value={product.official_price?.amount ?? ''} onChange={(e) => updateProduct(originalIndex, 'official_price.amount', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Duration</label>
                                <input type="text" list="duration-list" value={product.official_price?.duration || ''} onChange={(e) => updateProduct(originalIndex, 'official_price.duration', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900" />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Our Price</label>
                                <input type="number" step="0.01" value={product.our_price?.amount ?? ''} onChange={(e) => updateProduct(originalIndex, 'our_price.amount', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 bg-green-50/50" />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Saved Amount</label>
                                <input type="number" step="0.01" value={product.saved_amount?.amount ?? ''} onChange={(e) => updateProduct(originalIndex, 'saved_amount.amount', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 bg-green-50/50" />
                              </div>
                            </div>

                            <div className="space-y-4 md:col-span-2 mt-4">
                               <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-2 mb-3">Additional Info</h4>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-slate-500 mb-1">How to Get / Instructions</label>
                              <textarea value={product.how_to_get || ''} onChange={(e) => updateProduct(originalIndex, 'how_to_get', e.target.value)} rows="3" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 resize-y"></textarea>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-slate-500 mb-1">Remarks</label>
                              <textarea value={product.remarks || ''} onChange={(e) => updateProduct(originalIndex, 'remarks', e.target.value)} rows="3" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 resize-y"></textarea>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Stock Status</label>
                              <select value={product.stock_status || 'in_stock'} onChange={(e) => updateProduct(originalIndex, 'stock_status', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900">
                                <option value="in_stock">In Stock</option>
                                <option value="out_of_stock">Out of Stock</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Badge / Tag</label>
                              <input type="text" list="badge-list" value={product.status || ''} onChange={(e) => updateProduct(originalIndex, 'status', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Visibility</label>
                              <div className="flex items-center gap-4 pt-2">
                                <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-slate-900">
                                  <input type="radio" value="true" checked={product.visible === true} onChange={(e) => updateProduct(originalIndex, 'visible', e.target.value)} className="text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer" />
                                  Visible
                                </label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-slate-900">
                                  <input type="radio" value="false" checked={product.visible === false} onChange={(e) => updateProduct(originalIndex, 'visible', e.target.value)} className="text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer" />
                                  Hidden
                                </label>
                              </div>
                            </div>
                            <div className="md:col-span-2 flex justify-end mt-4 pt-4 border-t border-slate-100">
                              <button onClick={() => setEditingIndex(null)} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors shadow-md">
                                <ChevronUp className="w-4 h-4" /> Collapse
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        
        {products.length > 5 && (
          <div className="flex justify-center pt-4 pb-10">
            <button onClick={addNewProduct} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-medium hover:bg-slate-50 transition-colors shadow-sm">
              <Plus className="w-5 h-5" /> Add Another Product
            </button>
          </div>
        )}
      </div>
      )}

      <datalist id="logos-list">
        {availableLogos.map((logo, i) => (
          <option key={i} value={logo} />
        ))}
      </datalist>

      <datalist id="duration-list">
        {dropdownOptions.durations.map((d, i) => (
          <option key={i} value={d} />
        ))}
      </datalist>

      <datalist id="badge-list">
        {dropdownOptions.badges.map((b, i) => (
          <option key={i} value={b} />
        ))}
      </datalist>
    </div>
  );
}
