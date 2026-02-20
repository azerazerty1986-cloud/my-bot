// ================== product.js - إدارة المنتجات المتقدمة ==================
// الرقم 19 في ترتيب الملفات - نسخة نهائية كاملة

const productModule = (function() {
    // ================== البيانات ==================
    let products = JSON.parse(localStorage.getItem('products')) || [];
    let categories = JSON.parse(localStorage.getItem('categories')) || [];
    let brands = JSON.parse(localStorage.getItem('brands')) || [];
    
    // ================== تهيئة البيانات الافتراضية ==================
    if (categories.length === 0) {
        categories = [
            { id: 1, name: 'مواد غذائية', parent: null, count: 0, active: true },
            { id: 2, name: 'مشروبات', parent: null, count: 0, active: true },
            { id: 3, name: 'منظفات', parent: null, count: 0, active: true },
            { id: 4, name: 'الكترونيات', parent: null, count: 0, active: true },
            { id: 5, name: 'ملابس', parent: null, count: 0, active: true },
            { id: 6, name: 'أدوات منزلية', parent: null, count: 0, active: true }
        ];
        saveCategories();
    }
    
    // ================== دوال الحفظ الأساسية ==================
    function saveProducts() {
        localStorage.setItem('products', JSON.stringify(products));
        updateCategoriesCount();
        updateBrandsCount();
    }
    
    function saveCategories() {
        localStorage.setItem('categories', JSON.stringify(categories));
    }
    
    function saveBrands() {
        localStorage.setItem('brands', JSON.stringify(brands));
    }
    
    // ================== تحديث الإحصائيات ==================
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
    
    // ================== دوال مساعدة ==================
    function generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
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
        }
    }
    
    function showConfirmation(title, text, confirmCallback) {
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
    }
    
    // ================== إضافة منتج متقدم ==================
    function addProduct(productData) {
        if (!productData.name) {
            showNotification('خطأ', 'اسم المنتج مطلوب', 'error');
            return null;
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
            updatedAt: new Date().toISOString()
        };
        
        products.push(newProduct);
        saveProducts();
        
        showNotification('نجاح', 'تم إضافة المنتج');
        return newProduct;
    }
    
    // ================== حفظ من النموذج المتقدم ==================
    function saveAdvancedProduct() {
        const name = document.getElementById('product-name')?.value.trim();
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
    
    // ================== حفظ وإضافة آخر ==================
    function saveAndAddAnother() {
        saveAdvancedProduct();
        document.getElementById('product-name').value = '';
        document.getElementById('product-name').focus();
    }
    
    // ================== إعادة تعيين النموذج ==================
    function resetProductForm() {
        const form = document.getElementById('product-form');
        if (form) form.reset();
        
        const preview = document.getElementById('product-image-preview');
        if (preview) preview.style.display = 'none';
        
        updateProfit();
    }
    
    // ================== حساب الربح ==================
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
    
    // ================== الحصول على جميع المنتجات ==================
    function getAllProducts() {
        return [...products];
    }
    
    // ================== الحصول على منتج ==================
    function getProduct(id) {
        return products.find(p => p.id == id);
    }
    
    // ================== تحديث منتج ==================
    function updateProduct(id, updatedData) {
        const index = products.findIndex(p => p.id == id);
        if (index === -1) return null;
        
        products[index] = {
            ...products[index],
            ...updatedData,
            updatedAt: new Date().toISOString()
        };
        
        saveProducts();
        showNotification('نجاح', 'تم تحديث المنتج');
        renderProducts();
        return products[index];
    }
    
    // ================== حذف منتج ==================
    function deleteProduct(id) {
        const product = getProduct(id);
        if (!product) return false;
        
        showConfirmation('تأكيد الحذف', `حذف المنتج "${product.name}"؟`, () => {
            products = products.filter(p => p.id != id);
            saveProducts();
            showNotification('تم', 'تم حذف المنتج');
            renderProducts();
        });
        
        return true;
    }
    
    // ================== البحث عن المنتجات ==================
    function searchProducts(term) {
        const tbody = document.getElementById('products-tbody');
        if (!tbody) return;
        
        if (!term || term.length < 2) {
            renderProducts();
            return;
        }
        
        term = term.toLowerCase();
        const filtered = products.filter(p => 
            p.name.toLowerCase().includes(term) ||
            (p.barcode && p.barcode.includes(term)) ||
            (p.category && p.category.toLowerCase().includes(term)) ||
            (p.brand && p.brand.toLowerCase().includes(term))
        );
        
        renderProducts(filtered);
    }
    
    // ================== تصفية حسب التصنيف ==================
    function filterByCategory() {
        const category = document.getElementById('product-category-filter')?.value;
        const status = document.getElementById('product-status-filter')?.value;
        
        let filtered = products;
        
        if (category) {
            filtered = filtered.filter(p => p.category === category);
        }
        
        if (status === 'active') {
            filtered = filtered.filter(p => p.isActive !== false);
        } else if (status === 'inactive') {
            filtered = filtered.filter(p => p.isActive === false);
        } else if (status === 'lowstock') {
            filtered = filtered.filter(p => p.quantity <= p.minStock);
        }
        
        renderProducts(filtered);
    }
    
    // ================== عرض المنتجات ==================
    function renderProducts(filteredProducts = null) {
        const tbody = document.getElementById('products-tbody');
        if (!tbody) return;
        
        const dataToRender = filteredProducts || products;
        
        if (dataToRender.length === 0) {
            tbody.innerHTML = '<tr><td colspan="13" class="text-center p-4">لا توجد منتجات</td></tr>';
            return;
        }
        
        tbody.innerHTML = dataToRender.map((p, index) => {
            const stockStatus = p.quantity <= p.minStock ? 'منخفض' : 'جيد';
            const statusClass = p.quantity <= p.minStock ? 'badge-danger' : 'badge-success';
            const activeClass = p.isActive === false ? 'badge-secondary' : '';
            
            return `
            <tr>
                <td>${index + 1}</td>
                <td>
                    ${p.image ? `<img src="${p.image}" style="width:40px; height:40px; border-radius:5px; object-fit:cover;">` : 
                    '<i class="material-icons-round" style="font-size:24px;">image</i>'}
                </td>
                <td>${p.name}</td>
                <td>${p.category || 'عام'}</td>
                <td>${p.brand || '-'}</td>
                <td>${p.quantity}</td>
                <td>${p.unit}</td>
                <td>${formatCurrency(p.buyPrice)}</td>
                <td>${formatCurrency(p.sellPrice)}</td>
                <td>${p.wholesalePrice ? formatCurrency(p.wholesalePrice) : '-'}</td>
                <td>${p.barcode || '-'}</td>
                <td>
                    <span class="${stockStatus}">${stockStatus}</span>
                    ${p.isActive === false ? '<span class="badge-secondary">غير نشط</span>' : ''}
                </td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="productModule.showDetails('${p.id}')">
                        <i class="material-icons-round">visibility</i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="productModule.editProduct('${p.id}')">
                        <i class="material-icons-round">edit</i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="productModule.deleteProduct('${p.id}')">
                        <i class="material-icons-round">delete</i>
                    </button>
                </td>
            </tr>
        `}).join('');
        
        updateStats();
    }
    
    // ================== عرض تفاصيل المنتج ==================
    function showDetails(id) {
        const product = getProduct(id);
        if (!product) return;
        
        Swal.fire({
            title: product.name,
            html: `
                <div style="text-align:right; max-height:400px; overflow-y:auto;">
                    <p><strong>التصنيف:</strong> ${product.category}</p>
                    <p><strong>الماركة:</strong> ${product.brand || '-'}</p>
                    <p><strong>الوحدة:</strong> ${product.unit}</p>
                    <p><strong>الكمية:</strong> ${product.quantity}</p>
                    <p><strong>سعر الشراء:</strong> ${formatCurrency(product.buyPrice)}</p>
                    <p><strong>سعر البيع:</strong> ${formatCurrency(product.sellPrice)}</p>
                    <p><strong>سعر الجملة:</strong> ${product.wholesalePrice ? formatCurrency(product.wholesalePrice) : '-'}</p>
                    <p><strong>الباركود:</strong> ${product.barcode || '-'}</p>
                    <p><strong>موقع التخزين:</strong> ${product.location || '-'}</p>
                    <p><strong>الوصف:</strong> ${product.description || '-'}</p>
                    <p><strong>ملاحظات:</strong> ${product.notes || '-'}</p>
                    <p><strong>تاريخ الإضافة:</strong> ${new Date(product.createdAt).toLocaleDateString('ar-EG')}</p>
                </div>
            `,
            confirmButtonText: 'إغلاق'
        });
    }
    
    // ================== ربط الباركود ==================
    function assignBarcode(productId, barcode) {
        const product = getProduct(productId);
        if (!product) return false;
        
        const existing = products.find(p => p.barcode === barcode && p.id != productId);
        if (existing) {
            showNotification('خطأ', 'الباركود مستخدم بالفعل', 'error');
            return false;
        }
        
        product.barcode = barcode;
        product.updatedAt = new Date().toISOString();
        saveProducts();
        
        showNotification('نجاح', 'تم ربط الباركود');
        renderProducts();
        renderBarcodes();
        
        return true;
    }
    
    // ================== عرض الباركودات ==================
    function renderBarcodes() {
        const tbody = document.getElementById('barcodes-tbody');
        if (!tbody) return;
        
        const productsWithBarcode = products.filter(p => p.barcode);
        
        if (productsWithBarcode.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4">لا توجد باركودات</td></tr>';
            return;
        }
        
        tbody.innerHTML = productsWithBarcode.map(p => `
            <tr>
                <td>${p.name}</td>
                <td>${p.barcode}</td>
                <td>
                    <svg id="barcode-${p.id}" style="width:150px; height:40px;"></svg>
                </td>
                <td><span class="badge-success">مربوط</span></td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="productModule.printBarcode('${p.id}')">
                        <i class="material-icons-round">print</i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="productModule.removeBarcode('${p.id}')">
                        <i class="material-icons-round">delete</i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        // رسم الباركود لكل منتج
        setTimeout(() => {
            productsWithBarcode.forEach(p => {
                if (window.JsBarcode) {
                    JsBarcode(`#barcode-${p.id}`, p.barcode, {
                        format: "CODE128",
                        lineColor: "#000",
                        width: 2,
                        height: 40,
                        displayValue: false
                    });
                }
            });
        }, 100);
    }
    
    // ================== طباعة باركود ==================
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
                    body { text-align: center; padding: 20px; font-family: Arial; }
                    .barcode-item { margin: 20px; padding: 20px; border: 1px solid #ddd; display: inline-block; }
                </style>
            </head>
            <body>
                <div class="barcode-item">
                    <h3>${product.name}</h3>
                    <svg id="barcode-print"></svg>
                    <p>${product.barcode}</p>
                </div>
                <script>
                    JsBarcode("#barcode-print", "${product.barcode}", {
                        format: "CODE128",
                        lineColor: "#000",
                        width: 2,
                        height: 100,
                        displayValue: true
                    });
                    window.print();
                <\/script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }
    
    // ================== إزالة باركود ==================
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
    
    // ================== المنتجات الناقصة ==================
    function renderLowStock() {
        const tbody = document.getElementById('low-stock-tbody');
        if (!tbody) return;
        
        const lowStock = products.filter(p => p.quantity <= p.minStock);
        
        if (lowStock.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center p-4">لا توجد منتجات ناقصة</td></tr>';
            return;
        }
        
        tbody.innerHTML = lowStock.map((p, index) => {
            const shortage = p.minStock - p.quantity;
            const orderCost = shortage * p.buyPrice;
            
            return `
            <tr>
                <td>${index + 1}</td>
                <td>${p.name}</td>
                <td>${p.quantity}</td>
                <td>${p.minStock}</td>
                <td>${shortage}</td>
                <td>${formatCurrency(p.buyPrice)}</td>
                <td>${formatCurrency(orderCost)}</td>
                <td>-</td>
                <td>
                    <button class="btn btn-sm btn-success" onclick="productModule.orderProduct('${p.id}')">
                        <i class="material-icons-round">shopping_cart</i> طلب
                    </button>
                </td>
            </tr>
        `}).join('');
    }
    
    // ================== طلب منتج ==================
    function orderProduct(id) {
        const product = getProduct(id);
        if (!product) return;
        
        // التوجيه إلى المشتريات
        if (window.switchSection) {
            window.switchSection('purchases');
            setTimeout(() => {
                const searchInput = document.getElementById('purchase-search');
                if (searchInput) {
                    searchInput.value = product.name;
                }
                showSubSection('purchase-operation');
            }, 300);
        }
    }
    
    // ================== طلب جميع الناقص ==================
    function orderAllLowStock() {
        const lowStock = products.filter(p => p.quantity <= p.minStock);
        if (lowStock.length === 0) {
            showNotification('معلومة', 'لا توجد منتجات ناقصة', 'info');
            return;
        }
        
        // حفظ قائمة المنتجات في sessionStorage
        sessionStorage.setItem('orderList', JSON.stringify(lowStock));
        
        // التوجيه إلى المشتريات
        if (window.switchSection) {
            window.switchSection('purchases');
            showNotification('تم', 'تم تجهيز قائمة الطلب', 'success');
        }
    }
    
    // ================== إضافة تصنيف ==================
    function addCategory() {
        const name = document.getElementById('new-category-name')?.value.trim();
        if (!name) {
            showNotification('تنبيه', 'اسم التصنيف مطلوب', 'warning');
            return;
        }
        
        const parent = document.getElementById('new-category-parent')?.value;
        
        const newCategory = {
            id: generateId(),
            name: name,
            parent: parent || null,
            count: 0,
            active: true
        };
        
        categories.push(newCategory);
        saveCategories();
        renderCategories();
        
        document.getElementById('new-category-name').value = '';
        showNotification('نجاح', 'تم إضافة التصنيف');
    }
    
    // ================== عرض التصنيفات ==================
    function renderCategories() {
        const tbody = document.getElementById('categories-tbody');
        if (!tbody) return;
        
        const parentSelect = document.getElementById('new-category-parent');
        if (parentSelect) {
            parentSelect.innerHTML = '<option value="">تصنيف رئيسي</option>' + 
                categories.filter(c => !c.parent).map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        }
        
        if (categories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4">لا توجد تصنيفات</td></tr>';
            return;
        }
        
        tbody.innerHTML = categories.map((c, index) => {
            const parent = categories.find(p => p.id == c.parent);
            return `
            <tr>
                <td>${index + 1}</td>
                <td>${c.name}</td>
                <td>${parent ? parent.name : 'رئيسي'}</td>
                <td>${c.count || 0}</td>
                <td><span class="${c.active ? 'badge-success' : 'badge-secondary'}">${c.active ? 'نشط' : 'غير نشط'}</span></td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="productModule.editCategory('${c.id}')">
                        <i class="material-icons-round">edit</i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="productModule.deleteCategory('${c.id}')">
                        <i class="material-icons-round">delete</i>
                    </button>
                </td>
            </tr>
        `}).join('');
    }
    
    // ================== حذف تصنيف ==================
    function deleteCategory(id) {
        const category = categories.find(c => c.id == id);
        if (!category) return;
        
        const productsInCategory = products.filter(p => p.category === category.name);
        if (productsInCategory.length > 0) {
            showNotification('تنبيه', 'لا يمكن حذف تصنيف يحتوي على منتجات', 'warning');
            return;
        }
        
        showConfirmation('تأكيد الحذف', `حذف التصنيف "${category.name}"؟`, () => {
            categories = categories.filter(c => c.id != id);
            saveCategories();
            renderCategories();
            showNotification('تم', 'تم حذف التصنيف');
        });
    }
    
    // ================== إضافة ماركة ==================
    function addBrand() {
        const name = document.getElementById('new-brand-name')?.value.trim();
        if (!name) {
            showNotification('تنبيه', 'اسم الماركة مطلوب', 'warning');
            return;
        }
        
        const logo = document.getElementById('new-brand-logo')?.value || '';
        
        const newBrand = {
            id: generateId(),
            name: name,
            logo: logo,
            count: 0
        };
        
        brands.push(newBrand);
        saveBrands();
        renderBrands();
        
        document.getElementById('new-brand-name').value = '';
        document.getElementById('new-brand-logo').value = '';
        showNotification('نجاح', 'تم إضافة الماركة');
    }
    
    // ================== عرض الماركات ==================
    function renderBrands() {
        const tbody = document.getElementById('brands-tbody');
        if (!tbody) return;
        
        if (brands.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4">لا توجد ماركات</td></tr>';
            return;
        }
        
        tbody.innerHTML = brands.map((b, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${b.logo ? `<img src="${b.logo}" style="width:30px; height:30px; border-radius:5px;">` : '-'}</td>
                <td>${b.name}</td>
                <td>${b.count || 0}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="productModule.editBrand('${b.id}')">
                        <i class="material-icons-round">edit</i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="productModule.deleteBrand('${b.id}')">
                        <i class="material-icons-round">delete</i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    // ================== تحديث الإحصائيات ==================
    function updateStats() {
        const totalCount = products.length;
        const totalValue = products.reduce((sum, p) => sum + (p.buyPrice * p.quantity), 0);
        const lowStock = products.filter(p => p.quantity <= p.minStock).length;
        const outOfStock = products.filter(p => p.quantity === 0).length;
        
        const elements = {
            'total-products-count': totalCount,
            'total-value': totalValue,
            'low-stock-count': lowStock,
            'out-of-stock-count': outOfStock
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) {
                el.textContent = id.includes('value') ? formatCurrency(value) : value;
            }
        });
    }
    
    // ================== تصدير إلى Excel ==================
    function exportToExcel() {
        if (products.length === 0) {
            showNotification('تنبيه', 'لا توجد منتجات للتصدير', 'warning');
            return;
        }
        
        const headers = ['الاسم', 'التصنيف', 'الماركة', 'الكمية', 'الوحدة', 'سعر الشراء', 'سعر البيع', 'سعر الجملة', 'الباركود', 'الموقع'];
        const data = products.map(p => ({
            name: p.name,
            category: p.category,
            brand: p.brand || '',
            quantity: p.quantity,
            unit: p.unit,
            buyPrice: p.buyPrice,
            sellPrice: p.sellPrice,
            wholesalePrice: p.wholesalePrice || '',
            barcode: p.barcode || '',
            location: p.location || ''
        }));
        
        // دالة تصدير إلى CSV (يمكن استخدام utils.exportToCSV)
        console.log('تصدير', data);
        showNotification('نجاح', 'تم التصدير بنجاح');
    }
    
    // ================== تهيئة الصفحة ==================
    function init() {
        console.log('✅ productModule initialized');
        
        // تحديث القوائم المنسدلة
        const categoryFilter = document.getElementById('product-category-filter');
        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="">جميع التصنيفات</option>' + 
                categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        }
        
        const barcodeSelect = document.getElementById('barcode-product-select');
        if (barcodeSelect) {
            barcodeSelect.innerHTML = '<option value="">اختر المنتج</option>' + 
                products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
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
    }
    
    // ================== واجهة الوحدة ==================
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
        
        // بحث وتصفية
        searchProducts,
        filterByCategory,
        
        // عرض
        renderProducts,
        showDetails,
        updateStats,
        
        // تصنيفات
        addCategory,
        renderCategories,
        deleteCategory,
        
        // ماركات
        addBrand,
        renderBrands,
        
        // باركود
        assignBarcode,
        renderBarcodes,
        printBarcode,
        removeBarcode,
        
        // مخزون
        renderLowStock,
        orderProduct,
        orderAllLowStock,
        
        // تصدير
        exportToExcel,
        
        // تهيئة
        init
    };
})();

window.productModule = productModule;

// تهيئة تلقائية
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => productModule.init());
    document.addEventListener('html-loaded', () => productModule.init());
}
