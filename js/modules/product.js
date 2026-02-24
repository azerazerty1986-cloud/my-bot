// ================== product.js - إدارة المنتجات المتقدمة ==================
// الإصدار: 3.0 - نسخة نهائية كاملة مع جميع الميزات
// ================== نظام إدارة المنتجات المتكامل ==================

const productModule = (function() {
    // ================== 1. البيانات الأساسية ==================
    let products = JSON.parse(localStorage.getItem('products')) || [];
    let categories = JSON.parse(localStorage.getItem('categories')) || [];
    let brands = JSON.parse(localStorage.getItem('brands')) || [];
    let suppliers = JSON.parse(localStorage.getItem('suppliers')) || [];
    
    // ================== 2. تهيئة البيانات الافتراضية ==================
    function initializeDefaultData() {
        // التصنيفات الافتراضية
        if (categories.length === 0) {
            categories = [
                { id: 'cat1', name: 'مواد غذائية', parent: null, count: 0, active: true, icon: '🍎' },
                { id: 'cat2', name: 'مشروبات', parent: null, count: 0, active: true, icon: '🥤' },
                { id: 'cat3', name: 'منظفات', parent: null, count: 0, active: true, icon: '🧹' },
                { id: 'cat4', name: 'الكترونيات', parent: null, count: 0, active: true, icon: '📱' },
                { id: 'cat5', name: 'ملابس', parent: null, count: 0, active: true, icon: '👕' },
                { id: 'cat6', name: 'أدوات منزلية', parent: null, count: 0, active: true, icon: '🏠' },
                { id: 'cat7', name: 'مستحضرات تجميل', parent: null, count: 0, active: true, icon: '💄' },
                { id: 'cat8', name: 'قرطاسية', parent: null, count: 0, active: true, icon: '📚' }
            ];
            saveCategories();
        }
        
        // الماركات الافتراضية
        if (brands.length === 0) {
            brands = [
                { id: 'brand1', name: 'نستله', logo: '', count: 0, website: '', description: 'منتجات غذائية' },
                { id: 'brand2', name: 'بيبسي', logo: '', count: 0, website: '', description: 'مشروبات' },
                { id: 'brand3', name: 'كوكاكولا', logo: '', count: 0, website: '', description: 'مشروبات' },
                { id: 'brand4', name: 'سامسونج', logo: '', count: 0, website: 'www.samsung.com', description: 'الكترونيات' },
                { id: 'brand5', name: 'ايفون', logo: '', count: 0, website: 'www.apple.com', description: 'الكترونيات' }
            ];
            saveBrands();
        }
        
        // منتجات تجريبية
        if (products.length === 0) {
            products = [
                {
                    id: 'prod1',
                    name: 'شيبس ليز',
                    category: 'مواد غذائية',
                    brand: 'نستله',
                    unit: 'قطعة',
                    buyPrice: 50,
                    sellPrice: 75,
                    wholesalePrice: 65,
                    quantity: 100,
                    minStock: 20,
                    maxStock: 500,
                    location: 'رف A1',
                    barcode: '6291041500213',
                    image: '',
                    description: 'شيبس ليز بطعم الجبن',
                    notes: '',
                    tax: 10,
                    trackInventory: true,
                    allowNegative: false,
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    totalPurchases: 0,
                    totalSales: 0
                },
                {
                    id: 'prod2',
                    name: 'بيبسي كولا',
                    category: 'مشروبات',
                    brand: 'بيبسي',
                    unit: 'علبة',
                    buyPrice: 30,
                    sellPrice: 50,
                    wholesalePrice: 45,
                    quantity: 200,
                    minStock: 50,
                    maxStock: 1000,
                    location: 'رف B2',
                    barcode: '6291041500214',
                    image: '',
                    description: 'بيبسي كولا 330مل',
                    notes: '',
                    tax: 10,
                    trackInventory: true,
                    allowNegative: false,
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    totalPurchases: 0,
                    totalSales: 0
                },
                {
                    id: 'prod3',
                    name: 'سامسونج تلفزيون',
                    category: 'الكترونيات',
                    brand: 'سامسونج',
                    unit: 'قطعة',
                    buyPrice: 5000,
                    sellPrice: 6500,
                    wholesalePrice: 6000,
                    quantity: 10,
                    minStock: 2,
                    maxStock: 50,
                    location: 'رف C3',
                    barcode: '8806088765432',
                    image: '',
                    description: 'تلفزيون سامسونج 50 بوصة',
                    notes: 'ضمان سنتين',
                    tax: 15,
                    trackInventory: true,
                    allowNegative: false,
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    totalPurchases: 0,
                    totalSales: 0
                }
            ];
            saveProducts();
        }
    }
    
    // ================== 3. دوال الحفظ الأساسية ==================
    function saveProducts() {
        localStorage.setItem('products', JSON.stringify(products));
        updateCategoriesCount();
        updateBrandsCount();
        updateStats();
    }
    
    function saveCategories() {
        localStorage.setItem('categories', JSON.stringify(categories));
    }
    
    function saveBrands() {
        localStorage.setItem('brands', JSON.stringify(brands));
    }
    
    function saveSuppliers() {
        localStorage.setItem('suppliers', JSON.stringify(suppliers));
    }
    
    // ================== 4. تحديث الإحصائيات ==================
    function updateCategoriesCount() {
        const countMap = {};
        products.forEach(p => {
            countMap[p.category] = (countMap[p.category] || 0) + 1;
        });
        
        categories = categories.map(cat => ({
            ...cat,
            count: countMap[cat.name] || 0
        }));
        saveCategories();
    }
    
    function updateBrandsCount() {
        const countMap = {};
        products.forEach(p => {
            if (p.brand) {
                countMap[p.brand] = (countMap[p.brand] || 0) + 1;
            }
        });
        
        brands = brands.map(b => ({
            ...b,
            count: countMap[b.name] || 0
        }));
        saveBrands();
    }
    
    // ================== 5. دوال مساعدة ==================
    function generateId() {
        return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    
    function formatCurrency(amount) {
        return Number(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }
    
    function showNotification(title, message, type = 'success') {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: type,
                title: title,
                text: message,
                timer: 2000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
        } else {
            alert(`${type}: ${title} - ${message}`);
        }
    }
    
    function showConfirmation(title, text, confirmCallback) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: title,
                text: text,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'نعم',
                cancelButtonText: 'إلغاء'
            }).then((result) => {
                if (result.isConfirmed) confirmCallback();
            });
        } else {
            if (confirm(`${title}: ${text}`)) confirmCallback();
        }
    }
    
    // ================== 6. إدارة المنتجات ==================
    
    // إضافة منتج جديد
    function addProduct(productData) {
        if (!productData.name) {
            showNotification('خطأ', 'اسم المنتج مطلوب', 'error');
            return null;
        }
        
        // التحقق من الباركود المكرر
        if (productData.barcode) {
            const existing = products.find(p => p.barcode === productData.barcode);
            if (existing) {
                showNotification('خطأ', 'الباركود موجود مسبقاً', 'error');
                return null;
            }
        }
        
        const newProduct = {
            id: generateId(),
            name: productData.name,
            category: productData.category || 'عام',
            brand: productData.brand || '',
            unit: productData.unit || 'قطعة',
            buyPrice: parseFloat(productData.buyPrice) || 0,
            sellPrice: parseFloat(productData.sellPrice) || 0,
            wholesalePrice: parseFloat(productData.wholesalePrice) || 0,
            quantity: parseInt(productData.quantity) || 0,
            minStock: parseInt(productData.minStock) || 5,
            maxStock: parseInt(productData.maxStock) || 100,
            location: productData.location || '',
            barcode: productData.barcode || '',
            image: productData.image || '',
            description: productData.description || '',
            notes: productData.notes || '',
            tax: parseInt(productData.tax) || 0,
            trackInventory: productData.trackInventory !== false,
            allowNegative: productData.allowNegative || false,
            isActive: productData.isActive !== false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            totalPurchases: 0,
            totalSales: 0
        };
        
        products.push(newProduct);
        saveProducts();
        
        showNotification('نجاح', 'تم إضافة المنتج بنجاح');
        return newProduct;
    }
    
    // حفظ من النموذج
    function saveAdvancedProduct() {
        const name = document.getElementById('product-name')?.value?.trim();
        if (!name) {
            showNotification('تنبيه', 'اسم المنتج مطلوب', 'warning');
            return false;
        }
        
        const product = {
            name: name,
            unit: document.getElementById('product-unit')?.value || 'قطعة',
            category: document.getElementById('product-category')?.value || 'عام',
            brand: document.getElementById('product-brand')?.value || '',
            buyPrice: document.getElementById('product-buy-price')?.value,
            sellPrice: document.getElementById('product-sell-price')?.value,
            wholesalePrice: document.getElementById('product-wholesale-price')?.value,
            tax: document.getElementById('product-tax')?.value,
            quantity: document.getElementById('product-quantity')?.value,
            minStock: document.getElementById('product-min-stock')?.value,
            maxStock: document.getElementById('product-max-stock')?.value,
            location: document.getElementById('product-location')?.value,
            barcode: document.getElementById('product-barcode')?.value,
            description: document.getElementById('product-description')?.value,
            notes: document.getElementById('product-notes')?.value,
            trackInventory: document.getElementById('product-track-inventory')?.checked,
            allowNegative: document.getElementById('product-allow-negative')?.checked,
            isActive: document.getElementById('product-is-active')?.checked
        };
        
        const result = addProduct(product);
        if (result) {
            resetProductForm();
            renderProducts();
        }
        return result;
    }
    
    // حفظ وإضافة آخر
    function saveAndAddAnother() {
        saveAdvancedProduct();
        document.getElementById('product-name').value = '';
        document.getElementById('product-name').focus();
    }
    
    // إعادة تعيين النموذج
    function resetProductForm() {
        const form = document.getElementById('product-form');
        if (form) form.reset();
        
        const preview = document.getElementById('product-image-preview');
        if (preview) preview.style.display = 'none';
        
        updateProfit();
    }
    
    // حساب الربح
    function updateProfit() {
        const buyPrice = parseFloat(document.getElementById('product-buy-price')?.value) || 0;
        const sellPrice = parseFloat(document.getElementById('product-sell-price')?.value) || 0;
        
        if (buyPrice > 0 && sellPrice > 0) {
            const profit = sellPrice - buyPrice;
            const profitPercent = (profit / buyPrice) * 100;
            
            const profitEl = document.getElementById('product-profit');
            const profitAmountEl = document.getElementById('product-profit-amount');
            
            if (profitEl) profitEl.value = profitPercent.toFixed(1);
            if (profitAmountEl) profitAmountEl.value = formatCurrency(profit);
        }
    }
    
    // الحصول على جميع المنتجات
    function getAllProducts() {
        return [...products];
    }
    
    // الحصول على منتج معين
    function getProduct(id) {
        return products.find(p => p.id === id);
    }
    
    // تحديث منتج
    function updateProduct(id, updatedData) {
        const index = products.findIndex(p => p.id === id);
        if (index === -1) return null;
        
        products[index] = {
            ...products[index],
            ...updatedData,
            updatedAt: new Date().toISOString()
        };
        
        saveProducts();
        showNotification('نجاح', 'تم تحديث المنتج بنجاح');
        renderProducts();
        return products[index];
    }
    
    // حذف منتج
    function deleteProduct(id) {
        const product = getProduct(id);
        if (!product) return false;
        
        showConfirmation('تأكيد الحذف', `هل أنت متأكد من حذف المنتج "${product.name}"؟`, () => {
            products = products.filter(p => p.id !== id);
            saveProducts();
            showNotification('تم', 'تم حذف المنتج بنجاح');
            renderProducts();
        });
        
        return true;
    }
    
    // تفعيل/تعطيل منتج
    function toggleProductStatus(id) {
        const product = getProduct(id);
        if (!product) return;
        
        product.isActive = !product.isActive;
        product.updatedAt = new Date().toISOString();
        saveProducts();
        renderProducts();
        
        showNotification('نجاح', `تم ${product.isActive ? 'تفعيل' : 'تعطيل'} المنتج`);
    }
    
    // ================== 7. البحث والتصفية ==================
    
    // بحث متقدم
    function searchProducts(term, filters = {}) {
        let filtered = products;
        
        // بحث نصي
        if (term && term.length >= 1) {
            term = term.toLowerCase();
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(term) ||
                (p.barcode && p.barcode.toLowerCase().includes(term)) ||
                (p.category && p.category.toLowerCase().includes(term)) ||
                (p.brand && p.brand.toLowerCase().includes(term)) ||
                (p.description && p.description.toLowerCase().includes(term))
            );
        }
        
        // تصفية حسب التصنيف
        if (filters.category) {
            filtered = filtered.filter(p => p.category === filters.category);
        }
        
        // تصفية حسب الماركة
        if (filters.brand) {
            filtered = filtered.filter(p => p.brand === filters.brand);
        }
        
        // تصفية حسب الحالة
        if (filters.status === 'active') {
            filtered = filtered.filter(p => p.isActive !== false);
        } else if (filters.status === 'inactive') {
            filtered = filtered.filter(p => p.isActive === false);
        } else if (filters.status === 'lowstock') {
            filtered = filtered.filter(p => p.quantity <= p.minStock);
        } else if (filters.status === 'outstock') {
            filtered = filtered.filter(p => p.quantity === 0);
        }
        
        // تصفية حسب السعر
        if (filters.minPrice) {
            filtered = filtered.filter(p => p.sellPrice >= parseFloat(filters.minPrice));
        }
        if (filters.maxPrice) {
            filtered = filtered.filter(p => p.sellPrice <= parseFloat(filters.maxPrice));
        }
        
        return filtered;
    }
    
    // تطبيق التصفية من الواجهة
    function filterByCategory() {
        const category = document.getElementById('product-category-filter')?.value;
        const status = document.getElementById('product-status-filter')?.value;
        const searchTerm = document.getElementById('product-search')?.value;
        
        const filtered = searchProducts(searchTerm, { category, status });
        renderProducts(filtered);
    }
    
    // ================== 8. عرض المنتجات ==================
    
    function renderProducts(filteredProducts = null) {
        const tbody = document.getElementById('products-tbody');
        if (!tbody) return;
        
        const dataToRender = filteredProducts || products;
        
        if (dataToRender.length === 0) {
            tbody.innerHTML = '<tr><td colspan="14" class="text-center p-5">لا توجد منتجات</td></tr>';
            return;
        }
        
        tbody.innerHTML = dataToRender.map((p, index) => {
            const stockStatus = p.quantity <= p.minStock ? 'منخفض' : (p.quantity === 0 ? 'نافد' : 'جيد');
            let statusClass = 'badge-success';
            if (p.quantity === 0) statusClass = 'badge-danger';
            else if (p.quantity <= p.minStock) statusClass = 'badge-warning';
            
            const profit = p.sellPrice - p.buyPrice;
            const profitPercent = p.buyPrice > 0 ? ((profit / p.buyPrice) * 100).toFixed(1) : 0;
            
            return `
            <tr class="${p.isActive === false ? 'text-muted' : ''}">
                <td>${index + 1}</td>
                <td>
                    ${p.image ? `<img src="${p.image}" style="width:40px; height:40px; border-radius:5px; object-fit:cover;">` : 
                    '<div style="width:40px; height:40px; background:#f0f0f0; border-radius:5px; display:flex; align-items:center; justify-content:center"><i class="material-icons" style="color:#999;">image</i></div>'}
                </td>
                <td>
                    <strong>${p.name}</strong>
                    ${p.barcode ? `<br><small class="text-muted">🔖 ${p.barcode}</small>` : ''}
                </td>
                <td>${p.category || 'عام'}</td>
                <td>${p.brand || '-'}</td>
                <td>
                    <span class="badge ${statusClass}">${p.quantity}</span>
                    <small class="d-block">${p.unit}</small>
                </td>
                <td>${formatCurrency(p.buyPrice)}</td>
                <td>${formatCurrency(p.sellPrice)}</td>
                <td>
                    <span class="text-success">${formatCurrency(profit)}</span>
                    <small class="d-block text-muted">${profitPercent}%</small>
                </td>
                <td>${p.location || '-'}</td>
                <td>
                    ${p.isActive === false ? '<span class="badge badge-secondary">غير نشط</span>' : 
                      p.quantity === 0 ? '<span class="badge badge-danger">نافد</span>' :
                      p.quantity <= p.minStock ? '<span class="badge badge-warning">منخفض</span>' : 
                      '<span class="badge badge-success">جيد</span>'}
                </td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="productModule.showDetails('${p.id}')" title="عرض التفاصيل">
                        <i class="material-icons">visibility</i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="productModule.editProduct('${p.id}')" title="تعديل">
                        <i class="material-icons">edit</i>
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="productModule.duplicateProduct('${p.id}')" title="نسخ">
                        <i class="material-icons">content_copy</i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="productModule.deleteProduct('${p.id}')" title="حذف">
                        <i class="material-icons">delete</i>
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="productModule.toggleProductStatus('${p.id}')" title="${p.isActive ? 'تعطيل' : 'تفعيل'}">
                        <i class="material-icons">${p.isActive ? 'visibility_off' : 'visibility'}</i>
                    </button>
                </td>
            </tr>
        `}).join('');
        
        updateStats();
    }
    
    // عرض تفاصيل المنتج
    function showDetails(id) {
        const product = getProduct(id);
        if (!product) return;
        
        const profit = product.sellPrice - product.buyPrice;
        const profitPercent = product.buyPrice > 0 ? ((profit / product.buyPrice) * 100).toFixed(1) : 0;
        
        Swal.fire({
            title: product.name,
            html: `
                <div style="text-align:right; max-height:500px; overflow-y:auto; padding:10px;">
                    ${product.image ? `<img src="${product.image}" style="max-width:200px; max-height:200px; margin-bottom:15px; border-radius:10px;">` : ''}
                    
                    <table style="width:100%; border-collapse:collapse;">
                        <tr><td style="padding:8px; background:#f5f5f5;"><strong>التصنيف:</strong></td><td style="padding:8px;">${product.category || 'عام'}</td></tr>
                        <tr><td style="padding:8px; background:#f5f5f5;"><strong>الماركة:</strong></td><td style="padding:8px;">${product.brand || '-'}</td></tr>
                        <tr><td style="padding:8px; background:#f5f5f5;"><strong>الوحدة:</strong></td><td style="padding:8px;">${product.unit}</td></tr>
                        <tr><td style="padding:8px; background:#f5f5f5;"><strong>الكمية:</strong></td><td style="padding:8px;">${product.quantity}</td></tr>
                        <tr><td style="padding:8px; background:#f5f5f5;"><strong>الحد الأدنى:</strong></td><td style="padding:8px;">${product.minStock}</td></tr>
                        <tr><td style="padding:8px; background:#f5f5f5;"><strong>الحد الأقصى:</strong></td><td style="padding:8px;">${product.maxStock}</td></tr>
                        <tr><td style="padding:8px; background:#f5f5f5;"><strong>سعر الشراء:</strong></td><td style="padding:8px;">${formatCurrency(product.buyPrice)}</td></tr>
                        <tr><td style="padding:8px; background:#f5f5f5;"><strong>سعر البيع:</strong></td><td style="padding:8px;">${formatCurrency(product.sellPrice)}</td></tr>
                        <tr><td style="padding:8px; background:#f5f5f5;"><strong>سعر الجملة:</strong></td><td style="padding:8px;">${product.wholesalePrice ? formatCurrency(product.wholesalePrice) : '-'}</td></tr>
                        <tr><td style="padding:8px; background:#f5f5f5;"><strong>الربح:</strong></td><td style="padding:8px;"><span class="text-success">${formatCurrency(profit)} (${profitPercent}%)</span></td></tr>
                        <tr><td style="padding:8px; background:#f5f5f5;"><strong>الباركود:</strong></td><td style="padding:8px;">${product.barcode || '-'}</td></tr>
                        <tr><td style="padding:8px; background:#f5f5f5;"><strong>موقع التخزين:</strong></td><td style="padding:8px;">${product.location || '-'}</td></tr>
                        <tr><td style="padding:8px; background:#f5f5f5;"><strong>الضريبة:</strong></td><td style="padding:8px;">${product.tax || 0}%</td></tr>
                        <tr><td style="padding:8px; background:#f5f5f5;"><strong>الوصف:</strong></td><td style="padding:8px;">${product.description || '-'}</td></tr>
                        <tr><td style="padding:8px; background:#f5f5f5;"><strong>ملاحظات:</strong></td><td style="padding:8px;">${product.notes || '-'}</td></tr>
                        <tr><td style="padding:8px; background:#f5f5f5;"><strong>تاريخ الإضافة:</strong></td><td style="padding:8px;">${new Date(product.createdAt).toLocaleDateString('ar-EG')}</td></tr>
                        <tr><td style="padding:8px; background:#f5f5f5;"><strong>آخر تحديث:</strong></td><td style="padding:8px;">${new Date(product.updatedAt).toLocaleDateString('ar-EG')}</td></tr>
                        <tr><td style="padding:8px; background:#f5f5f5;"><strong>إجمالي المشتريات:</strong></td><td style="padding:8px;">${product.totalPurchases || 0}</td></tr>
                        <tr><td style="padding:8px; background:#f5f5f5;"><strong>إجمالي المبيعات:</strong></td><td style="padding:8px;">${product.totalSales || 0}</td></tr>
                    </table>
                </div>
            `,
            width: '600px',
            confirmButtonText: 'إغلاق',
            showCloseButton: true
        });
    }
    
    // تعديل منتج
    function editProduct(id) {
        const product = getProduct(id);
        if (!product) return;
        
        // ملء النموذج بالبيانات
        const fields = {
            'product-name': product.name,
            'product-unit': product.unit,
            'product-category': product.category,
            'product-brand': product.brand,
            'product-buy-price': product.buyPrice,
            'product-sell-price': product.sellPrice,
            'product-wholesale-price': product.wholesalePrice,
            'product-tax': product.tax,
            'product-quantity': product.quantity,
            'product-min-stock': product.minStock,
            'product-max-stock': product.maxStock,
            'product-location': product.location,
            'product-barcode': product.barcode,
            'product-description': product.description,
            'product-notes': product.notes
        };
        
        Object.entries(fields).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.value = value;
        });
        
        // الحقول المنطقية
        const trackEl = document.getElementById('product-track-inventory');
        if (trackEl) trackEl.checked = product.trackInventory !== false;
        
        const allowEl = document.getElementById('product-allow-negative');
        if (allowEl) allowEl.checked = product.allowNegative || false;
        
        const activeEl = document.getElementById('product-is-active');
        if (activeEl) activeEl.checked = product.isActive !== false;
        
        // تخزين ID للتحديث
        document.getElementById('product-edit-id')?.setAttribute('value', product.id);
        
        // التمرير للنموذج
        document.getElementById('product-form')?.scrollIntoView({ behavior: 'smooth' });
        
        updateProfit();
    }
    
    // نسخ منتج
    function duplicateProduct(id) {
        const product = getProduct(id);
        if (!product) return;
        
        const newProduct = {
            ...product,
            id: generateId(),
            name: product.name + ' (نسخة)',
            barcode: product.barcode ? product.barcode + '-copy' : '',
            quantity: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        products.push(newProduct);
        saveProducts();
        renderProducts();
        showNotification('نجاح', 'تم نسخ المنتج بنجاح');
    }
    
    // ================== 9. إدارة الباركود ==================
    
    // ربط باركود
    function assignBarcode(productId, barcode) {
        const product = getProduct(productId);
        if (!product) return false;
        
        const existing = products.find(p => p.barcode === barcode && p.id !== productId);
        if (existing) {
            showNotification('خطأ', 'الباركود مستخدم بالفعل', 'error');
            return false;
        }
        
        product.barcode = barcode;
        product.updatedAt = new Date().toISOString();
        saveProducts();
        
        showNotification('نجاح', 'تم ربط الباركود بنجاح');
        renderProducts();
        renderBarcodes();
        
        return true;
    }
    
    // عرض الباركودات
    function renderBarcodes() {
        const tbody = document.getElementById('barcodes-tbody');
        if (!tbody) return;
        
        const productsWithBarcode = products.filter(p => p.barcode);
        
        if (productsWithBarcode.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4">لا توجد باركودات</td></tr>';
            return;
        }
        
        tbody.innerHTML = productsWithBarcode.map(p => `
            <tr>
                <td>${p.name}</td>
                <td>${p.barcode}</td>
                <td>
                    <svg id="barcode-${p.id}" style="width:150px; height:40px;"></svg>
                </td>
                <td>${p.sellPrice} دج</td>
                <td><span class="badge-success">مربوط</span></td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="productModule.printBarcode('${p.id}')" title="طباعة">
                        <i class="material-icons">print</i>
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="productModule.printMultipleBarcodes('${p.id}')" title="طباعة عدة">
                        <i class="material-icons">print</i> 5
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="productModule.removeBarcode('${p.id}')" title="إزالة">
                        <i class="material-icons">delete</i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        // رسم الباركود
        setTimeout(() => {
            if (window.JsBarcode) {
                productsWithBarcode.forEach(p => {
                    try {
                        JsBarcode(`#barcode-${p.id}`, p.barcode, {
                            format: "CODE128",
                            lineColor: "#000",
                            width: 2,
                            height: 40,
                            displayValue: false
                        });
                    } catch (e) {
                        console.error('خطأ في رسم الباركود:', e);
                    }
                });
            }
        }, 100);
    }
    
    // طباعة باركود
    function printBarcode(id) {
        const product = getProduct(id);
        if (!product || !product.barcode) return;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html dir="rtl">
            <head>
                <title>باركود ${product.name}</title>
                <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
                <style>
                    body { text-align: center; padding: 20px; font-family: 'Tajawal', Arial; }
                    .barcode-item { 
                        margin: 20px; 
                        padding: 20px; 
                        border: 1px solid #ddd; 
                        display: inline-block;
                        background: white;
                        border-radius: 10px;
                    }
                    .product-name { font-size: 14px; margin-bottom: 10px; }
                    .price { font-size: 16px; font-weight: bold; color: #28a745; }
                </style>
            </head>
            <body>
                <div class="barcode-item">
                    <div class="product-name">${product.name}</div>
                    <svg id="barcode-print"></svg>
                    <div class="price">${product.sellPrice} دج</div>
                    <div>${product.barcode}</div>
                </div>
                <script>
                    JsBarcode("#barcode-print", "${product.barcode}", {
                        format: "CODE128",
                        lineColor: "#000",
                        width: 2,
                        height: 100,
                        displayValue: true,
                        fontSize: 16
                    });
                    setTimeout(() => window.print(), 500);
                <\/script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }
    
    // طباعة عدة باركودات
    function printMultipleBarcodes(id, count = 5) {
        const product = getProduct(id);
        if (!product || !product.barcode) return;
        
        const printWindow = window.open('', '_blank');
        
        let barcodesHtml = '';
        for (let i = 0; i < count; i++) {
            barcodesHtml += `
                <div class="barcode-item">
                    <div class="product-name">${product.name}</div>
                    <svg id="barcode-${i}"></svg>
                    <div class="price">${product.sellPrice} دج</div>
                    <div>${product.barcode}</div>
                </div>
            `;
        }
        
        printWindow.document.write(`
            <html dir="rtl">
            <head>
                <title>باركود ${product.name}</title>
                <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
                <style>
                    body { text-align: center; padding: 20px; font-family: 'Tajawal', Arial; }
                    .barcode-item { 
                        margin: 10px; 
                        padding: 15px; 
                        border: 1px dashed #ddd; 
                        display: inline-block;
                        width: 250px;
                    }
                    .product-name { font-size: 12px; margin-bottom: 5px; }
                    .price { font-size: 14px; font-weight: bold; color: #28a745; }
                </style>
            </head>
            <body>
                ${barcodesHtml}
                <script>
                    ${Array.from({ length: count }, (_, i) => `
                        JsBarcode("#barcode-${i}", "${product.barcode}", {
                            format: "CODE128",
                            lineColor: "#000",
                            width: 1.5,
                            height: 50,
                            displayValue: false
                        });
                    `).join('')}
                    setTimeout(() => window.print(), 500);
                <\/script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }
    
    // إزالة باركود
    function removeBarcode(id) {
        const product = getProduct(id);
        if (!product) return;
        
        product.barcode = '';
        product.updatedAt = new Date().toISOString();
        saveProducts();
        
        showNotification('تم', 'تم إزالة الباركود');
        renderBarcodes();
        renderProducts();
    }
    
    // ================== 10. المنتجات الناقصة ==================
    
    function renderLowStock() {
        const tbody = document.getElementById('low-stock-tbody');
        if (!tbody) return;
        
        const lowStock = products.filter(p => p.quantity <= p.minStock && p.quantity > 0);
        const outOfStock = products.filter(p => p.quantity === 0);
        
        const allLowStock = [...lowStock, ...outOfStock];
        
        if (allLowStock.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="text-center p-4">لا توجد منتجات ناقصة</td></tr>';
            return;
        }
        
        tbody.innerHTML = allLowStock.map((p, index) => {
            const shortage = p.minStock - p.quantity;
            const orderCost = shortage * p.buyPrice;
            const status = p.quantity === 0 ? 'نافد' : 'منخفض';
            const statusClass = p.quantity === 0 ? 'badge-danger' : 'badge-warning';
            
            return `
            <tr>
                <td>${index + 1}</td>
                <td>${p.name}</td>
                <td>${p.category}</td>
                <td><span class="badge ${statusClass}">${p.quantity}</span></td>
                <td>${p.minStock}</td>
                <td>${shortage > 0 ? shortage : 0}</td>
                <td>${formatCurrency(p.buyPrice)}</td>
                <td>${shortage > 0 ? formatCurrency(orderCost) : '-'}</td>
                <td>${p.location || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-success" onclick="productModule.orderProduct('${p.id}')">
                        <i class="material-icons">shopping_cart</i> طلب
                    </button>
                    <button class="btn btn-sm btn-info" onclick="productModule.showDetails('${p.id}')">
                        <i class="material-icons">visibility</i>
                    </button>
                </td>
            </tr>
        `}).join('');
    }
    
    // طلب منتج
    function orderProduct(id) {
        const product = getProduct(id);
        if (!product) return;
        
        // حفظ في sessionStorage للطلب
        const orderList = JSON.parse(sessionStorage.getItem('orderList')) || [];
        orderList.push({
            productId: product.id,
            name: product.name,
            quantity: product.minStock - product.quantity,
            buyPrice: product.buyPrice
        });
        sessionStorage.setItem('orderList', JSON.stringify(orderList));
        
        showNotification('تم', 'تم إضافة المنتج لقائمة الطلب', 'success');
        
        // التوجيه إلى المشتريات
        if (window.switchSection) {
            window.switchSection('purchases');
        }
    }
    
    // طلب جميع الناقص
    function orderAllLowStock() {
        const lowStock = products.filter(p => p.quantity <= p.minStock);
        if (lowStock.length === 0) {
            showNotification('معلومة', 'لا توجد منتجات ناقصة', 'info');
            return;
        }
        
        const orderList = lowStock.map(p => ({
            productId: p.id,
            name: p.name,
            quantity: p.minStock - p.quantity,
            buyPrice: p.buyPrice
        }));
        
        sessionStorage.setItem('orderList', JSON.stringify(orderList));
        
        showNotification('تم', 'تم تجهيز قائمة الطلب', 'success');
        
        if (window.switchSection) {
            window.switchSection('purchases');
        }
    }
    
    // ================== 11. إدارة التصنيفات ==================
    
    function addCategory() {
        const name = document.getElementById('new-category-name')?.value?.trim();
        if (!name) {
            showNotification('تنبيه', 'اسم التصنيف مطلوب', 'warning');
            return;
        }
        
        const parent = document.getElementById('new-category-parent')?.value;
        const icon = document.getElementById('new-category-icon')?.value || '📁';
        
        const newCategory = {
            id: generateId(),
            name: name,
            parent: parent || null,
            count: 0,
            active: true,
            icon: icon
        };
        
        categories.push(newCategory);
        saveCategories();
        renderCategories();
        
        document.getElementById('new-category-name').value = '';
        document.getElementById('new-category-icon').value = '';
        showNotification('نجاح', 'تم إضافة التصنيف');
    }
    
    function renderCategories() {
        const tbody = document.getElementById('categories-tbody');
        if (!tbody) return;
        
        // تحديث قائمة التصنيفات الأب
        const parentSelect = document.getElementById('new-category-parent');
        if (parentSelect) {
            parentSelect.innerHTML = '<option value="">تصنيف رئيسي</option>' + 
                categories.filter(c => !c.parent).map(c => `<option value="${c.id}">${c.icon || '📁'} ${c.name}</option>`).join('');
        }
        
        if (categories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4">لا توجد تصنيفات</td></tr>';
            return;
        }
        
        tbody.innerHTML = categories.map((c, index) => {
            const parent = categories.find(p => p.id === c.parent);
            return `
            <tr>
                <td>${index + 1}</td>
                <td><span style="font-size:20px;">${c.icon || '📁'}</span></td>
                <td>${c.name}</td>
                <td>${parent ? parent.name : 'رئيسي'}</td>
                <td><span class="badge badge-primary">${c.count || 0}</span></td>
                <td><span class="badge ${c.active ? 'badge-success' : 'badge-secondary'}">${c.active ? 'نشط' : 'غير نشط'}</span></td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="productModule.editCategory('${c.id}')">
                        <i class="material-icons">edit</i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="productModule.deleteCategory('${c.id}')">
                        <i class="material-icons">delete</i>
                    </button>
                </td>
            </tr>
        `}).join('');
    }
    
    function deleteCategory(id) {
        const category = categories.find(c => c.id === id);
        if (!category) return;
        
        const productsInCategory = products.filter(p => p.category === category.name);
        if (productsInCategory.length > 0) {
            showNotification('تنبيه', 'لا يمكن حذف تصنيف يحتوي على منتجات', 'warning');
            return;
        }
        
        const children = categories.filter(c => c.parent === id);
        if (children.length > 0) {
            showNotification('تنبيه', 'لا يمكن حذف تصنيف له تصنيفات فرعية', 'warning');
            return;
        }
        
        showConfirmation('تأكيد الحذف', `حذف التصنيف "${category.name}"؟`, () => {
            categories = categories.filter(c => c.id !== id);
            saveCategories();
            renderCategories();
            showNotification('تم', 'تم حذف التصنيف');
        });
    }
    
    // ================== 12. إدارة الماركات ==================
    
    function addBrand() {
        const name = document.getElementById('new-brand-name')?.value?.trim();
        if (!name) {
            showNotification('تنبيه', 'اسم الماركة مطلوب', 'warning');
            return;
        }
        
        const logo = document.getElementById('new-brand-logo')?.value || '';
        const website = document.getElementById('new-brand-website')?.value || '';
        const description = document.getElementById('new-brand-description')?.value || '';
        
        const newBrand = {
            id: generateId(),
            name: name,
            logo: logo,
            website: website,
            description: description,
            count: 0
        };
        
        brands.push(newBrand);
        saveBrands();
        renderBrands();
        
        document.getElementById('new-brand-name').value = '';
        document.getElementById('new-brand-logo').value = '';
        document.getElementById('new-brand-website').value = '';
        document.getElementById('new-brand-description').value = '';
        showNotification('نجاح', 'تم إضافة الماركة');
    }
    
    function renderBrands() {
        const tbody = document.getElementById('brands-tbody');
        if (!tbody) return;
        
        if (brands.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4">لا توجد ماركات</td></tr>';
            return;
        }
        
        tbody.innerHTML = brands.map((b, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>
                    ${b.logo ? `<img src="${b.logo}" style="width:30px; height:30px; border-radius:5px; object-fit:cover;">` : 
                    '<div style="width:30px; height:30px; background:#f0f0f0; border-radius:5px; display:flex; align-items:center; justify-content:center"><i class="material-icons" style="font-size:18px;">branding</i></div>'}
                </td>
                <td>${b.name}</td>
                <td>${b.website ? `<a href="${b.website}" target="_blank">${b.website}</a>` : '-'}</td>
                <td><span class="badge badge-primary">${b.count || 0}</span></td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="productModule.editBrand('${b.id}')">
                        <i class="material-icons">edit</i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="productModule.deleteBrand('${b.id}')">
                        <i class="material-icons">delete</i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    function deleteBrand(id) {
        const brand = brands.find(b => b.id === id);
        if (!brand) return;
        
        const productsInBrand = products.filter(p => p.brand === brand.name);
        if (productsInBrand.length > 0) {
            showNotification('تنبيه', 'لا يمكن حذف ماركة تحتوي على منتجات', 'warning');
            return;
        }
        
        showConfirmation('تأكيد الحذف', `حذف الماركة "${brand.name}"؟`, () => {
            brands = brands.filter(b => b.id !== id);
            saveBrands();
            renderBrands();
            showNotification('تم', 'تم حذف الماركة');
        });
    }
    
    // ================== 13. الإحصائيات والتقارير ==================
    
    function updateStats() {
        const totalCount = products.length;
        const totalValue = products.reduce((sum, p) => sum + (p.buyPrice * p.quantity), 0);
        const totalSalesValue = products.reduce((sum, p) => sum + (p.sellPrice * p.quantity), 0);
        const lowStock = products.filter(p => p.quantity <= p.minStock && p.quantity > 0).length;
        const outOfStock = products.filter(p => p.quantity === 0).length;
        const activeProducts = products.filter(p => p.isActive !== false).length;
        const inactiveProducts = products.filter(p => p.isActive === false).length;
        const totalProfit = products.reduce((sum, p) => sum + ((p.sellPrice - p.buyPrice) * p.quantity), 0);
        
        const elements = {
            'total-products-count': totalCount,
            'total-value': totalValue,
            'total-sales-value': totalSalesValue,
            'total-profit': totalProfit,
            'low-stock-count': lowStock,
            'out-of-stock-count': outOfStock,
            'active-products': activeProducts,
            'inactive-products': inactiveProducts
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = id.includes('value') || id.includes('profit') ? formatCurrency(value) : value;
            }
        });
    }
    
    function getStats() {
        return {
            totalCount: products.length,
            totalValue: products.reduce((sum, p) => sum + (p.buyPrice * p.quantity), 0),
            totalSalesValue: products.reduce((sum, p) => sum + (p.sellPrice * p.quantity), 0),
            lowStock: products.filter(p => p.quantity <= p.minStock && p.quantity > 0).length,
            outOfStock: products.filter(p => p.quantity === 0).length,
            activeProducts: products.filter(p => p.isActive !== false).length,
            totalProfit: products.reduce((sum, p) => sum + ((p.sellPrice - p.buyPrice) * p.quantity), 0)
        };
    }
    
    // ================== 14. تصدير واستيراد ==================
    
    function exportToCSV() {
        if (products.length === 0) {
            showNotification('تنبيه', 'لا توجد منتجات للتصدير', 'warning');
            return;
        }
        
        const headers = ['الاسم', 'التصنيف', 'الماركة', 'الكمية', 'الوحدة', 'سعر الشراء', 'سعر البيع', 'سعر الجملة', 'الباركود', 'الموقع', 'الوصف'];
        const rows = products.map(p => [
            p.name,
            p.category,
            p.brand || '',
            p.quantity,
            p.unit,
            p.buyPrice,
            p.sellPrice,
            p.wholesalePrice || '',
            p.barcode || '',
            p.location || '',
            p.description || ''
        ]);
        
        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.map(cell => `"${cell}"`).join(',') + '\n';
        });
        
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `products_${new Date().toISOString().slice(0,10)}.csv`;
        link.click();
        
        showNotification('نجاح', 'تم تصدير المنتجات بنجاح');
    }
    
    function exportToExcel() {
        exportToCSV(); // CSV مقبول كبديل
    }
    
    // ================== 15. تهيئة الصفحة ==================
    
    function init() {
        console.log('✅ productModule initialized');
        
        initializeDefaultData();
        
        // تحديث القوائم المنسدلة
        const categoryFilter = document.getElementById('product-category-filter');
        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="">جميع التصنيفات</option>' + 
                categories.map(c => `<option value="${c.name}">${c.icon || '📁'} ${c.name}</option>`).join('');
        }
        
        const brandFilter = document.getElementById('product-brand-filter');
        if (brandFilter) {
            brandFilter.innerHTML = '<option value="">جميع الماركات</option>' + 
                brands.map(b => `<option value="${b.name}">${b.name}</option>`).join('');
        }
        
        const barcodeSelect = document.getElementById('barcode-product-select');
        if (barcodeSelect) {
            barcodeSelect.innerHTML = '<option value="">اختر المنتج</option>' + 
                products.map(p => `<option value="${p.id}">${p.name} ${p.barcode ? '(🔖)' : ''}</option>`).join('');
        }
        
        // عرض البيانات
        renderProducts();
        renderCategories();
        renderBrands();
        renderLowStock();
        renderBarcodes();
        updateStats();
        
        // ربط أحداث النماذج
        const buyInput = document.getElementById('product-buy-price');
        const sellInput = document.getElementById('product-sell-price');
        
        if (buyInput) buyInput.addEventListener('input', updateProfit);
        if (sellInput) sellInput.addEventListener('input', updateProfit);
        
        // ربط حدث البحث
        const searchInput = document.getElementById('product-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const filtered = searchProducts(e.target.value, {
                    category: document.getElementById('product-category-filter')?.value,
                    status: document.getElementById('product-status-filter')?.value
                });
                renderProducts(filtered);
            });
        }
    }
    
    // ================== 16. واجهة الوحدة ==================
    return {
        // البيانات
        products,
        categories,
        brands,
        
        // إضافة
        addProduct,
        saveAdvancedProduct,
        saveAndAddAnother,
        resetProductForm,
        
        // استعلام
        getAllProducts,
        getProduct,
        updateProduct,
        deleteProduct,
        toggleProductStatus,
        duplicateProduct,
        
        // بحث وتصفية
        searchProducts,
        filterByCategory,
        
        // عرض
        renderProducts,
        showDetails,
        editProduct,
        updateStats,
        getStats,
        
        // تصنيفات
        addCategory,
        renderCategories,
        deleteCategory,
        
        // ماركات
        addBrand,
        renderBrands,
        deleteBrand,
        
        // باركود
        assignBarcode,
        renderBarcodes,
        printBarcode,
        printMultipleBarcodes,
        removeBarcode,
        
        // مخزون
        renderLowStock,
        orderProduct,
        orderAllLowStock,
        
        // تصدير
        exportToExcel,
        exportToCSV,
        
        // تهيئة
        init
    };
})();

// ================== تصدير للاستخدام العام ==================
window.productModule = productModule;

// ================== تهيئة تلقائية ==================
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => productModule.init(), 100);
    });
    
    // للتهيئة بعد تحميل HTML ديناميكي
    document.addEventListener('html-loaded', () => {
        productModule.init();
    });
}

// ================== نهاية الملف ==================
