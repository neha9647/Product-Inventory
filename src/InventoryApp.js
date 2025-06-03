import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  Package,
  Download
} from "lucide-react";
import * as XLSX from 'xlsx';

export default function ProductInventorySystem() {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [activeSubDropdown, setActiveSubDropdown] = useState(null);
  const [currentPage, setCurrentPage] = useState("home");
  const [components, setComponents] = useState([]);
  const [editingComponent, setEditingComponent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productComponents, setProductComponents] = useState({});
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editProductData, setEditProductData] = useState({
    productName: '',
    specifications: ''
  });
  const [formData, setFormData] = useState({
    slNo: '',
    itemName: '',
    component: '',
    tolerance: '',
    ppm: '',
    package: '',
    packageSize: '',
    manuf: '',
    sourceOrigin: '',
    vendor: '',
    stockQuantity: '',
    orderedQuantity: '',
    priceInr: ''
  });
  const [productFormData, setProductFormData] = useState({
    productName: '',
    specifications: '',
    category: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    console.log('Loading initial products...');

    fetch('http://localhost:5050/api/products')
      .then(async res => {
        const responseText = await res.text();
        console.log('Raw products response:', responseText);

        if (!res.ok) {
          throw new Error(`Failed to load products: ${responseText}`);
        }

        try {
          return JSON.parse(responseText);
        } catch (e) {
          throw new Error(`Invalid JSON in products response: ${responseText}`);
        }
      })
      .then(data => {
        console.log('Products loaded successfully:', data);
        const grouped = data.reduce((acc, prod) => {
          // Ensure we have the MongoDB _id
          if (!prod._id) {
            console.warn('Product missing _id:', prod);
          }

          acc[prod.category] = acc[prod.category] || [];
          acc[prod.category].push({
            ...prod,
            dateAdded: prod.dateAdded || prod.date
          });
          return acc;
        }, {});

        console.log('Grouped products by category:', grouped);
        setProducts(grouped);
        setError(null);
      })
      .catch(err => {
        console.error('Error loading products:', {
          error: err,
          message: err.message
        });
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    console.log('Loading components...');
    fetch('http://localhost:5050/api/components', {
      headers: {
        'Accept': 'application/json'
      }
    })
      .then(async res => {
        const responseText = await res.text();
        console.log('Raw components response:', responseText);

        if (!res.ok) {
          throw new Error(`Failed to load components: ${responseText}`);
        }

        try {
          return JSON.parse(responseText);
        } catch (e) {
          throw new Error(`Invalid JSON in components response: ${responseText}`);
        }
      })
      .then(data => {
        console.log('Components loaded:', data);
        // Verify each component has _id
        const validComponents = data.map(comp => {
          if (!comp._id) {
            console.warn('Component missing _id:', comp);
          }
          return comp;
        });
        setComponents(validComponents);
        setError(null);
      })
      .catch(err => {
        console.error('Error loading components:', {
          error: err,
          message: err.message
        });
        setError(err.message);
      });
  }, []);

  useEffect(() => {
    if (selectedProduct && selectedProduct._id) {
      const cleanProductId = selectedProduct._id.trim();
      console.log('Loading components for product:', cleanProductId);

      const url = `http://localhost:5050/api/products/${encodeURIComponent(cleanProductId)}/components`;
      console.log('Fetching components from:', url);

      fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      })
        .then(async res => {
          const responseText = await res.text();
          console.log('Raw components response:', responseText);

          if (!res.ok) {
            throw new Error(`Failed to load components: ${responseText}`);
          }

          try {
            return JSON.parse(responseText);
          } catch (e) {
            throw new Error(`Invalid JSON in components response: ${responseText}`);
          }
        })
        .then(components => {
          console.log('Components loaded successfully:', components);
          setProductComponents(prev => ({
            ...prev,
            [cleanProductId]: components
          }));
        })
        .catch(err => {
          console.error('Error loading product components:', {
            error: err,
            message: err.message,
            productId: cleanProductId,
            url
          });
        });
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (selectedProduct) {
      setEditProductData({
        productName: selectedProduct.productName || '',
        specifications: selectedProduct.specifications || ''
      });
    }
  }, [selectedProduct]);

  const handleNavigation = (category, subcategory = null) => {
    if (subcategory) {
      setCurrentPage(`${category}-${subcategory}`);
    } else {
      setCurrentPage(category);
    }
    setActiveDropdown(null);
    setActiveSubDropdown(null);
  };

  const handleComponentsLibrary = () => {
    setCurrentPage("components-library");
  };

  const handleAddComponent = () => {
    setEditingComponent(null);
    setFormData({
      slNo: '',
      itemName: '',
      component: '',
      tolerance: '',
      ppm: '',
      package: '',
      packageSize: '',
      manuf: '',
      sourceOrigin: '',
      vendor: '',
      stockQuantity: '',
      orderedQuantity: '',
      priceInr: ''
    });
    setCurrentPage("add-component");
  };

  const handleEditComponent = (component) => {
    setEditingComponent(component);
    setFormData({
      slNo: component.slNo,
      itemName: component.itemName,
      component: component.component,
      tolerance: component.tolerance,
      ppm: component.ppm,
      package: component.package,
      packageSize: component.packageSize,
      manuf: component.manuf,
      sourceOrigin: component.sourceOrigin,
      vendor: component.vendor,
      stockQuantity: component.stockQuantity,
      orderedQuantity: component.orderedQuantity,
      priceInr: component.priceInr
    });
    setCurrentPage("add-component");
  };

  const handleDeleteComponent = (componentId, options = {}) => {
    if (window.confirm('Are you sure you want to delete this component?')) {
      let url;
      let isProductComponent = false;
      // If deleting from inside a product (embedded component)
      if (options.productId) {
        url = `http://localhost:5050/api/products/${encodeURIComponent(options.productId)}/components/${encodeURIComponent(componentId)}`;
        isProductComponent = true;
      } else {
        // Deleting from library
        url = `http://localhost:5050/api/components/${encodeURIComponent(componentId)}`;
      }
      console.log('Deleting component with URL:', url);

      fetch(url, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json'
        }
      })
        .then(async res => {
          const responseText = await res.text();
          console.log('Delete response:', responseText);

          if (!res.ok) {
            throw new Error(`Failed to delete component: ${responseText}`);
          }

          if (isProductComponent) {
            // Remove from productComponents state
            setProductComponents(prev => {
              const newState = { ...prev };
              if (options.productId) {
                newState[options.productId] = (newState[options.productId] || []).filter(comp => comp._id !== componentId);
              }
              return newState;
            });
          } else {
            // Remove from components state
            setComponents(prevComponents =>
              prevComponents.filter(comp => comp._id !== componentId)
            );
          }
          console.log('Component deleted successfully');
        })
        .catch(err => {
          console.error('Error deleting component:', {
            error: err,
            message: err.message,
            componentId,
            url
          });
          alert(`Error deleting component: ${err.message}`);
        });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const currentDate = new Date().toLocaleDateString('en-IN');

    if (editingComponent) {
      // EDIT (PUT) existing component
      fetch(`http://localhost:5050/api/components/${editingComponent._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, lastUpdated: currentDate })
      })
        .then(res => res.json())
        .then(updatedComponent => {
          setComponents(components.map(comp => comp._id === updatedComponent._id ? updatedComponent : comp));
          setFormData({ slNo: '', itemName: '', component: '', tolerance: '', ppm: '', package: '', packageSize: '', manuf: '', sourceOrigin: '', vendor: '', stockQuantity: '', orderedQuantity: '', priceInr: '' });
          setEditingComponent(null);
          setCurrentPage("components-library");
        })
        .catch(err => {
          alert('Error updating component');
          console.error('Error:', err);
        });
    } else {
      // ADD (POST) new component
      fetch('http://localhost:5050/api/components', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, lastUpdated: currentDate })
      })
        .then(res => res.json())
        .then(savedComponent => {
          setComponents([...components, savedComponent]);
          setFormData({ slNo: '', itemName: '', component: '', tolerance: '', ppm: '', package: '', packageSize: '', manuf: '', sourceOrigin: '', vendor: '', stockQuantity: '', orderedQuantity: '', priceInr: '' });
          setEditingComponent(null);
          setCurrentPage("components-library");
        })
        .catch(err => {
          alert('Error saving component');
          console.error('Error:', err);
        });
    }
  };

  const productCategories = [
    {
      name: "Test and Measurements",
      subcategories: [
        "Power Supplies",
        "Function Generators",
        "Battery Chargers",
      ],
      description: "Precision testing equipment and measurement tools",
    },
    {
      name: "Bio-Medical Instruments",
      subcategories: [],
      description: "Medical devices and diagnostic equipment",
    },
    {
      name: "Defense Product",
      subcategories: [],
      description: "Military-grade components and systems",
    },
    {
      name: "ISRO",
      subcategories: [],
      description: "Aerospace and satellite components",
    },
  ];

  const handleExportToExcel = () => {
    // Prepare the data for export
    const exportData = components.map(component => ({
      'SL No.': component.slNo,
      'Item Name': component.itemName,
      'Component Value': component.component,
      'Tolerance': component.tolerance,
      'PPM': component.ppm,
      'Package': component.package,
      'Package Size': component.packageSize,
      'Manuf. Part No': component.manuf,
      'Source Origin': component.sourceOrigin,
      'Vendor': component.vendor,
      'Unit Price (INR)': component.priceInr,
      'Stock Qty': component.stockQuantity,
      'Ordered Qty': component.orderedQuantity,
      'Last Updated': component.lastUpdated || 'N/A'
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Components");

    // Generate Excel file
    XLSX.writeFile(wb, "Components_Library.xlsx");
  };

  const handleProductSubmit = (e) => {
    e.preventDefault();
    const category = currentPage.split('-form')[0];

    // Create the new product data
    const newProduct = {
      productName: productFormData.productName.trim(),
      specifications: productFormData.specifications.trim(),
      category: category
    };

    console.log('Sending product data:', newProduct);

    fetch('http://localhost:5050/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(newProduct)
    })
      .then(async res => {
        const responseText = await res.text();
        console.log('Create response:', responseText);

        if (!res.ok) {
          throw new Error(`Failed to add product: ${responseText}`);
        }

        const savedProduct = JSON.parse(responseText);
        console.log('Product saved successfully:', savedProduct);

        // Add the new product to state
        setProducts(prev => {
          const updated = { ...prev };
          if (!updated[category]) {
            updated[category] = [];
          }
          updated[category] = [...updated[category], savedProduct];
          return updated;
        });

        // Reset form and navigate back
        setProductFormData({
          productName: '',
          specifications: '',
          category: ''
        });
        setCurrentPage(category);
      })
      .catch(err => {
        console.error('Error saving product:', {
          error: err,
          message: err.message,
          data: newProduct
        });
        alert(`Error saving product: ${err.message}`);
      });
  };

  const handleAddComponentToProduct = (component) => {
    if (!selectedProduct || !selectedProduct._id) {
      console.error('Invalid product selected. Selected product:', selectedProduct);
      alert('Please select a valid product first');
      return;
    }

    // Format the component data for the API
    const componentData = {
      itemName: component.itemName,
      component: component.component,
      tolerance: component.tolerance,
      ppm: component.ppm,
      package: component.package,
      packageSize: component.packageSize,
      manuf: component.manuf,
      sourceOrigin: component.sourceOrigin,
      vendor: component.vendor,
      stockQuantity: parseInt(component.stockQuantity) || 0,
      orderedQuantity: parseInt(component.orderedQuantity) || 0,
      priceInr: parseFloat(component.priceInr) || 0
    };

    // Clean up the product ID and create proper URL
    const cleanProductId = selectedProduct._id.toString().trim();
    console.log('Making API request with:', {
      productId: cleanProductId,
      componentData: componentData
    });

    // Call the backend API to add the component
    fetch(`http://localhost:5050/api/products/${cleanProductId}/components`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(componentData)
    })
      .then(async response => {
        const responseText = await response.text();
        console.log('Raw API Response:', responseText);

        if (!response.ok) {
          throw new Error(`API Error (${response.status}): ${responseText}`);
        }

        try {
          return JSON.parse(responseText);
        } catch (e) {
          throw new Error(`Invalid JSON response: ${responseText}`);
        }
      })
      .then(updatedProduct => {
        console.log('Product updated successfully:', updatedProduct);

        // Update the products state
        setProducts(prev => {
          const updated = { ...prev };
          const category = selectedProduct.category;
          const updatedProducts = updated[category].map(p =>
            p._id === cleanProductId ? updatedProduct : p
          );
          updated[category] = updatedProducts;
          return updated;
        });

        // Update the product components state
        setProductComponents(prev => ({
          ...prev,
          [cleanProductId]: updatedProduct.components || []
        }));

        // Update selected product
        setSelectedProduct(updatedProduct);

        // Show success message
        alert('Component added successfully!');

        // Navigate back to the product page
        setCurrentPage(`product-${cleanProductId}`);
      })
      .catch(err => {
        console.error('Error adding component:', err);
        alert(`Failed to add component: ${err.message}`);
      });
  };

  const handleAddComponentsToProduct = () => {
    // selectedProduct is already set, just navigate to components library
    setCurrentPage('components-library');
  };

  const goHome = () => {
    setCurrentPage("home");
    setSelectedProduct(null);
    setActiveDropdown(null);
    setActiveSubDropdown(null);
  };

  // Function to find and set product by ID
  const findAndSetProduct = (productId) => {
    for (const categoryProducts of Object.values(products)) {
      const product = categoryProducts.find(p => p._id === productId);
      if (product) {
        setSelectedProduct(product);
        return true;
      }
    }
    return false;
  };

  // Function to handle product deletion
  const handleDeleteProduct = (productId, category) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      const url = `http://localhost:5050/api/products/${encodeURIComponent(productId)}`;
      console.log('Deleting product with URL:', url);

      fetch(url, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json'
        }
      })
        .then(async res => {
          const responseText = await res.text();
          console.log('Delete response:', responseText);

          if (!res.ok) {
            throw new Error(`Failed to delete product: ${responseText}`);
          }

          // Remove product from state
          setProducts(prev => {
            const updated = { ...prev };
            if (updated[category]) {
              updated[category] = updated[category].filter(p => p._id !== productId);
            }
            return updated;
          });

          // If we're on the product's page, go back to category
          if (currentPage === `product-${productId}`) {
            setSelectedProduct(null);
            setCurrentPage(category);
          }

          console.log('Product deleted successfully');
        })
        .catch(err => {
          console.error('Error deleting product:', {
            error: err,
            message: err.message,
            productId,
            url
          });
          alert(`Error deleting product: ${err.message}`);
        });
    }
  };

  // Function to handle product edit form submission
  const handleEditProduct = (productId) => {
    if (!editProductData.productName || !editProductData.specifications) {
      alert('Product name and specifications are required');
      return;
    }

    const url = `http://localhost:5050/api/products/${encodeURIComponent(productId)}`;
    console.log('Updating product with URL:', url);

    fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        productName: editProductData.productName.trim(),
        specifications: editProductData.specifications.trim()
      })
    })
      .then(async res => {
        const responseText = await res.text();
        console.log('Update response:', responseText);

        if (!res.ok) {
          throw new Error(`Failed to update product: ${responseText}`);
        }

        const updatedProduct = JSON.parse(responseText);
        console.log('Product updated successfully:', updatedProduct);

        // Update products state
        setProducts(prev => {
          const updated = { ...prev };
          if (updated[updatedProduct.category]) {
            updated[updatedProduct.category] = updated[updatedProduct.category].map(p =>
              p._id === productId ? updatedProduct : p
            );
          }
          return updated;
        });

        // Update selected product if we're on its page
        if (selectedProduct && selectedProduct._id === productId) {
          setSelectedProduct(updatedProduct);
        }

        setIsEditingProduct(false);
      })
      .catch(err => {
        console.error('Error updating product:', {
          error: err,
          message: err.message,
          productId,
          url
        });
        alert(`Error updating product: ${err.message}`);
      });
  };

  // Render different pages based on currentPage state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Please make sure the backend server is running at http://localhost:5050</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h2>
          <p className="text-gray-600">Please wait while we fetch the data</p>
        </div>
      </div>
    );
  }

  if (currentPage === "add-component") {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div
                className="flex items-center space-x-3 cursor-pointer"
                onClick={goHome}
              >
                <img
                  src="https://www.tmisystems.in/images/logo/tmi_logo.png"
                  alt="TMI Systems Logo"
                  className="h-12 w-auto object-contain"
                />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    TMI SYSTEMS
                  </h1>
                  <p className="text-xs text-gray-500">
                    Product Management System
                  </p>
                </div>
              </div>
              <button
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                onClick={() => setCurrentPage("components-library")}
              >
                ← Back to Components
              </button>
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            {editingComponent ? 'Edit Component' : 'Add New Component'}
          </h1>
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-8">
            <form onSubmit={handleFormSubmit} className="space-y-6" autoComplete="off">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Name
                  </label>
                  <input
                    type="text"
                    name="itemName"
                    value={formData.itemName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Component Value
                  </label>
                  <input
                    type="text"
                    name="component"
                    value={formData.component}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tolerance
                  </label>
                  <input
                    type="text"
                    name="tolerance"
                    value={formData.tolerance}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PPM
                  </label>
                  <input
                    type="text"
                    name="ppm"
                    value={formData.ppm}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Package
                  </label>
                  <input
                    type="text"
                    name="package"
                    value={formData.package}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Package Size
                  </label>
                  <input
                    type="text"
                    name="packageSize"
                    value={formData.packageSize}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manuf. Part No
                  </label>
                  <input
                    type="text"
                    name="manuf"
                    value={formData.manuf}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Source Origin
                  </label>
                  <input
                    type="text"
                    name="sourceOrigin"
                    value={formData.sourceOrigin}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendor
                  </label>
                  <input
                    type="text"
                    name="vendor"
                    value={formData.vendor}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit Price (INR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="priceInr"
                    value={formData.priceInr}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    name="stockQuantity"
                    value={formData.stockQuantity}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ordered Quantity
                  </label>
                  <input
                    type="number"
                    name="orderedQuantity"
                    value={formData.orderedQuantity}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => setCurrentPage("components-library")}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
                  style={{ backgroundColor: '#63bfdb' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#4fa8c5'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#63bfdb'}
                >
                  {editingComponent ? 'Update' : 'Add Component'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    );
  }

  if (currentPage === "components-library") {
    const filteredComponents = components.filter(component =>
      component.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      component.manuf.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div
                className="flex items-center space-x-3 cursor-pointer"
                onClick={() => {
                  if (selectedProduct) {
                    // If we came from a product, go back to that product
                    setCurrentPage(`product-${selectedProduct._id}`);
                  } else {
                    // Otherwise go home
                    setSelectedProduct(null);
                    goHome();
                  }
                }}
              >
                <img
                  src="https://www.tmisystems.in/images/logo/tmi_logo.png"
                  alt="TMI Systems Logo"
                  className="h-12 w-auto object-contain"
                />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    TMI SYSTEMS
                  </h1>
                  <p className="text-xs text-gray-500">
                    Product Management System
                  </p>
                </div>
              </div>
              <div className="flex space-x-4">
                <button
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                  onClick={() => {
                    if (selectedProduct) {
                      // If we came from a product, go back to that product
                      setCurrentPage(`product-${selectedProduct._id}`);
                    } else {
                      // Otherwise go home
                      setSelectedProduct(null);
                      goHome();
                    }
                  }}
                >
                  {selectedProduct ? '← Back to Product' : '← Back to Home'}
                </button>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Components Library</h1>
              {selectedProduct && (
                <p className="mt-2 text-gray-600">
                  Selecting components for: {selectedProduct.productName}
                </p>
              )}
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleExportToExcel}
                className="text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 bg-green-600 hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                <span>Export to Excel</span>
              </button>
              {!selectedProduct && (
                <button
                  className="text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                  style={{ backgroundColor: '#63bfdb' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#4fa8c5'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#63bfdb'}
                  onClick={handleAddComponent}
                >
                  <span>+ Add Component</span>
                </button>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <input
                type="text"
                id="search"
                name="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by item name or manufacturer"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {filteredComponents.length === 0 && searchQuery ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-8 text-center">
              <p className="text-gray-600 text-lg">
                No components found matching "{searchQuery}"
              </p>
            </div>
          ) : components.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-8 text-center">
              <p className="text-gray-600 text-lg">
                No components added yet. Click "Add Component" to get started.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {selectedProduct ? (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Add
                        </th>
                      ) : (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SL No.</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tolerance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PPM</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package Size</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manuf. Part No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source Origin</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price (INR)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Qty</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordered Qty</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredComponents.map((component, index) => (
                      <tr key={component._id} className="hover:bg-gray-50">
                        {selectedProduct ? (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                handleAddComponentToProduct(component);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Add
                            </button>
                          </td>
                        ) : (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditComponent(component)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors duration-200"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteComponent(component._id)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors duration-200"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{component.itemName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{component.component}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{component.tolerance}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{component.ppm}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{component.package}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{component.packageSize}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{component.manuf}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{component.sourceOrigin}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{component.vendor}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{component.priceInr}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{component.stockQuantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{component.orderedQuantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{component.lastUpdated || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (currentPage.endsWith('-form')) {
    const category = currentPage.split('-form')[0];
    const categoryProducts = products[category] || [];

    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div
                className="flex items-center space-x-3 cursor-pointer"
                onClick={() => {
                  setSelectedProduct(null);
                  goHome();
                }}
              >
                <img
                  src="https://www.tmisystems.in/images/logo/tmi_logo.png"
                  alt="TMI Systems Logo"
                  className="h-12 w-auto object-contain"
                />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    TMI SYSTEMS
                  </h1>
                  <p className="text-xs text-gray-500">
                    Product Management System
                  </p>
                </div>
              </div>
              <button
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                onClick={() => setCurrentPage(category)}
              >
                ← Back
              </button>
            </div>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Add New Product
          </h1>
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-8">
            <form onSubmit={handleProductSubmit} className="space-y-6" autoComplete="off">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name
                </label>
                <input
                  type="text"
                  name="productName"
                  value={productFormData.productName}
                  onChange={(e) => setProductFormData({
                    ...productFormData,
                    productName: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specifications
                </label>
                <textarea
                  name="specifications"
                  value={productFormData.specifications}
                  onChange={(e) => setProductFormData({
                    ...productFormData,
                    specifications: e.target.value
                  })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  autoComplete="off"
                />
              </div>
              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => setCurrentPage(category)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-white rounded-lg font-medium transition-colors duration-200"
                  style={{ backgroundColor: '#63bfdb' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#4fa8c5'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#63bfdb'}
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    );
  }

  if (currentPage.startsWith('product-')) {
    const productId = currentPage.split('-')[1];

    // If we don't have the correct product selected, find and set it
    if (!selectedProduct || selectedProduct._id !== productId) {
      findAndSetProduct(productId);
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading product details...</h2>
            <p className="text-gray-600">Please wait</p>
          </div>
        </div>
      );
    }

    const category = selectedProduct.category;
    const productComps = productComponents[productId] || [];

    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3 cursor-pointer" onClick={goHome}>
                <img src="https://www.tmisystems.in/images/logo/tmi_logo.png" alt="TMI Systems Logo" className="h-12 w-auto object-contain" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">TMI SYSTEMS</h1>
                  <p className="text-xs text-gray-500">Product Management System</p>
                </div>
              </div>
              <button
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                onClick={() => {
                  setSelectedProduct(null);
                  setCurrentPage(category);
                }}
              >
                ← Back to Category
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {selectedProduct.productName}
              </h1>
              <p className="text-gray-600">
                Added on: {selectedProduct.dateAdded}
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                className="text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                style={{ backgroundColor: '#63bfdb' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#4fa8c5'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#63bfdb'}
                onClick={handleAddComponentsToProduct}
              >
                <span>+ Add Components</span>
              </button>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Product Details</h2>
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Added: {selectedProduct.dateAdded}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDeleteProduct(productId, category)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors duration-200"
                  >
                    Delete Product
                  </button>
                </div>
              </div>

              {isEditingProduct ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={editProductData.productName}
                      onChange={(e) => setEditProductData(prev => ({
                        ...prev,
                        productName: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Specifications
                    </label>
                    <textarea
                      value={editProductData.specifications}
                      onChange={(e) => setEditProductData(prev => ({
                        ...prev,
                        specifications: e.target.value
                      }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setIsEditingProduct(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleEditProduct(productId)}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Specifications</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedProduct.specifications}</p>
                </>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Components</h2>
              </div>
              {productComps.length === 0 ? (
                <div className="p-6 text-center text-gray-600">
                  No components added yet. Click "Add Components" to get started.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SL No.</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component Value</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tolerance</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PPM</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package Size</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manuf. Part No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source Origin</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price (INR)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Qty</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordered Qty</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Added</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {productComps.map((comp, index) => (
                        <tr key={comp._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex space-x-2">
                              {/* Only Remove button, no Edit button inside products */}
                              <button
                                onClick={() => handleDeleteComponent(comp._id, { productId: selectedProduct._id })}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors duration-200"
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{comp.itemName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{comp.component}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{comp.tolerance}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{comp.ppm}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{comp.package}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{comp.packageSize}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{comp.manuf}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{comp.sourceOrigin}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{comp.vendor}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{comp.priceInr}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{comp.stockQuantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{comp.orderedQuantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{comp.dateAdded}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (currentPage !== "home" && currentPage !== "components-library") {
    const categoryProducts = products[currentPage] || [];
    console.log('Current page:', currentPage);
    console.log('All products:', products);
    console.log('Category products:', categoryProducts);

    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div
                className="flex items-center space-x-3 cursor-pointer"
                onClick={() => {
                  setSelectedProduct(null);
                  goHome();
                }}
              >
                <img
                  src="https://www.tmisystems.in/images/logo/tmi_logo.png"
                  alt="TMI Systems Logo"
                  className="h-12 w-auto object-contain"
                />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    TMI SYSTEMS
                  </h1>
                  <p className="text-xs text-gray-500">
                    Product Management System
                  </p>
                </div>
              </div>
              <button
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                onClick={() => {
                  setSelectedProduct(null);
                  goHome();
                }}
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {currentPage.startsWith('Test and Measurements')
                  ? currentPage.replace("-", " > ")
                  : currentPage.replace("-", " - ")}
              </h1>
              <p className="mt-2 text-gray-600">
                {categoryProducts.length} {categoryProducts.length === 1 ? 'Product' : 'Products'} Available
              </p>
            </div>
            <button
              className="text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              style={{ backgroundColor: '#63bfdb' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#4fa8c5'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#63bfdb'}
              onClick={() => {
                setCurrentPage(`${currentPage}-form`);
              }}
            >
              <span>+ Add Product</span>
            </button>
          </div>

          {categoryProducts.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-8 text-center">
              <p className="text-gray-600 text-lg">
                No products added yet. Click "Add Product" to get started.
              </p>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold text-gray-700 mb-6">
                Products in Current Category
              </h2>
              <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sl No.
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Specifications
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Added
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {categoryProducts.map((product, index) => (
                        <tr key={product._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleDeleteProduct(product._id, product.category)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors duration-200"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <button
                              onClick={() => {
                                setSelectedProduct(product);
                                setCurrentPage(`product-${product._id}`);
                              }}
                              className="text-blue-600 hover:text-blue-900 hover:underline text-left"
                            >
                              {product.productName}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <div className="max-w-xl whitespace-pre-wrap">
                              {product.specifications}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.dateAdded}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Company Logo & Name */}
            <div
              className="flex items-center space-x-3 cursor-pointer"
              onClick={goHome}
            >
              <img
                src="https://www.tmisystems.in/images/logo/tmi_logo.png"
                alt="TMI Systems Logo"
                className="h-12 w-auto object-contain"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">TMI SYSTEMS</h1>
                <p className="text-xs text-gray-500">
                  Product Management System
                </p>
              </div>
            </div>

            {/* Components Library Button */}
            {currentPage === "home" && (
              <button
                className="text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                style={{ backgroundColor: '#63bfdb' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#4fa8c5'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#63bfdb'}
                onClick={handleComponentsLibrary}
              >
                <Package className="w-4 h-4" />
                <span>Components Library</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        {/* Welcome Section */}
        <div className="text-left mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Product Inventory Management
          </h1>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Total Components</h3>
              <Package className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{components.length}</p>
            <p className="text-xs text-gray-500 mt-1">Available in inventory</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Total Products</h3>
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {Object.values(products).reduce((total, categoryProducts) => total + categoryProducts.length, 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Across all categories</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Low Stock</h3>
              <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {components.filter(comp => parseInt(comp.stockQuantity) < 10).length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Components below 10 units</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700">Ordered</h3>
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {components.filter(comp => parseInt(comp.orderedQuantity) > 0).length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Components on order</p>
          </div>
        </div>

        {/* Quick Access */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {productCategories.map((category, index) => (
              <div
                key={index}
                className={`relative group ${category.name === 'Test and Measurements' ? 'lg:col-span-1' : ''}`}
              >
                <button
                  onClick={() => {
                    if (category.name !== 'Test and Measurements') {
                      handleNavigation(category.name);
                    }
                  }}
                  className="w-full flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors duration-200"
                >
                  <svg className="w-8 h-8 text-blue-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2M7 7h10" />
                  </svg>
                  <span className="text-lg font-medium text-gray-900">{category.name}</span>
                </button>
                {category.name === 'Test and Measurements' && category.subcategories.length > 0 && (
                  <div className="absolute left-0 w-full mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                      {category.subcategories.map((subcategory, subIndex) => (
                        <button
                          key={subIndex}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavigation(category.name, subcategory);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                        >
                          <span className="text-gray-900">{subcategory}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
