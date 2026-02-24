// =======================================================================
// ملف: advanced-search.js - نظام البحث المتقدم للعملاء والمنتجات
// الإصدار: 2.0 - مع دعم كامل للوحة المفاتيح، التصفية الذكية، والذاكرة المؤقتة
// =======================================================================

const AdvancedSearch = (function() {
    'use strict';

    // ===================================================================
    // الثوابت والإعدادات العامة
    // ===================================================================
    const CONFIG = {
        DEBOUNCE_DELAY: 300,           // تأخير البحث (ms)
        MAX_RESULTS: 50,                // الحد الأقصى للنتائج في الجدول
        MAX_DROPDOWN_RESULTS: 8,         // الحد الأقصى للنتائج في القائمة المنسدلة
        CACHE_DURATION: 5 * 60 * 1000,   // مدة التخزين المؤقت (5 دقائق)
        ANIMATION_DURATION: 300,          // مدة الحركات (ms)
        STORAGE_KEYS: {
            CUSTOMERS: 'search_customers_cache',
            PRODUCTS: 'search_products_cache',
            LAST_SEARCH: 'last_search_terms'
        }
    };

    // ===================================================================
    // المتغيرات العامة
    // ===================================================================
    let customers = [];                 // قائمة العملاء
    let products = [];                  // قائمة المنتجات
    let filteredCustomers = [];          // العملاء بعد التصفية
    let filteredProducts = [];           // المنتجات بعد التصفية
    
    // متغيرات البحث الحالية
    let currentCustomerSearch = '';
    let currentProductSearch = '';
    
    // متغيرات التنقل بلوحة المفاتيح
    let selectedCustomerIndex = -1;
    let selectedProductIndex = -1;
    
    // مؤقتات Debounce
    let customerSearchTimeout = null;
    let productSearchTimeout = null;
    
    // ذاكرة مؤقتة للبيانات
    let cache = {
        customers: { data: [], timestamp: 0 },
        products: { data: [], timestamp: 0 }
    };

    // ===================================================================
    // دوال مساعدة
    // ===================================================================

    /**
     * تنسيق العملة
     */
    function formatCurrency(amount) {
        if (amount === undefined || amount === null || isNaN(amount)) amount = 0;
        return new Intl.NumberFormat('ar-DZ', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount) + ' دج';
    }

    /**
     * تحويل النص إلى رقم
     */
    function parseNumber(value) {
        if (value === undefined || value === null) return 0;
        if (typeof value === 'string') {
            value = value.replace(/,/g, '').replace(/[^\d.-]/g, '');
        }
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
    }

    /**
     * إظهار إشعار
     */
    function showNotification(message, type = 'info', duration = 3000) {
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#2193b0'
        };
        
        const icons = {
            success: 'check_circle',
            error: 'error',
            warning: 'warning',
            info: 'info'
        };

        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${colors[type] || colors.info};
            color: white;
            padding: 12px 25px;
            border-radius: 50px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 1rem;
            animation: slideDown 0.3s ease;
            direction: rtl;
        `;
        
        notification.innerHTML = `
            <i class="material-icons-round">${icons[type]}</i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    /**
     * حفظ في الذاكرة المؤقتة
     */
    function saveToCache(key, data) {
        try {
            cache[key] = {
                data: data,
                timestamp: Date.now()
            };
            localStorage.setItem(CONFIG.STORAGE_KEYS[key], JSON.stringify(cache[key]));
        } catch (e) {
            console.warn('خطأ في حفظ الذاكرة المؤقتة:', e);
        }
    }

    /**
     * تحميل من الذاكرة المؤقتة
     */
    function loadFromCache(key) {
        try {
            const cached = localStorage.getItem(CONFIG.STORAGE_KEYS[key]);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Date.now() - parsed.timestamp < CONFIG.CACHE_DURATION) {
                    cache[key] = parsed;
                    return parsed.data;
                }
            }
        } catch (e) {
            console.warn('خطأ في تحميل الذاكرة المؤقتة:', e);
        }
        return null;
    }

    /**
     * تطبيع النص للبحث (إزالة التشكيل، توحيد الحروف)
     */
    function normalizeText(text) {
        if (!text) return '';
        return text.toString()
            .toLowerCase()
            .replace(/[أإآا]/g, 'ا')
            .replace(/[ىي]/g, 'ي')
            .replace(/[ة]/g, 'ه')
            .replace(/[ؤ]/g, 'و')
            .replace(/[ئ]/g, 'ي')
            .replace(/[ء]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * البحث في النص (ذكي)
     */
    function smartSearch(text, query) {
        if (!query) return true;
        const normalizedText = normalizeText(text);
        const normalizedQuery = normalizeText(query);
        
        // بحث دقيق
        if (normalizedText.includes(normalizedQuery)) return true;
        
        // بحث بالكلمات
        const queryWords = normalizedQuery.split(' ');
        const textWords = normalizedText.split(' ');
        
        return queryWords.every(word => 
            word.length < 2 || textWords.some(tw => tw.includes(word))
        );
    }

    // ===================================================================
    // تحميل البيانات
    // ===================================================================

    /**
     * تحميل العملاء من مصادر متعددة
     */
    function loadCustomers() {
        // محاولة التحميل من الذاكرة المؤقتة أولاً
        const cached = loadFromCache('customers');
        if (cached) {
            customers = cached;
            updateCustomersCount();
            return Promise.resolve(customers);
        }

        // محاولة التحميل من Module العملاء
        if (window.customerModule && typeof window.customerModule.getAllCustomers === 'function') {
            customers = window.customerModule.getAllCustomers() || [];
        } 
        // محاولة التحميل من localStorage
        else {
            try {
                const stored = localStorage.getItem('customers');
                customers = stored ? JSON.parse(stored) : [];
                
                // إذا كان التنسيق قديماً، نقوم بتحويله
                if (customers.length > 0 && !customers[0].fullname && customers[0].name) {
                    customers = customers.map(c => ({
                        ...c,
                        fullname: c.name,
                        purchases: c.purchases || 0,
                        debts: c.debts || 0,
                        email: c.email || '',
                        lastPurchase: c.lastPurchase || null
                    }));
                }
            } catch (e) {
                console.error('خطأ في تحميل العملاء:', e);
                customers = [];
            }
        }

        // توحيد تنسيق البيانات
        customers = customers.map(c => ({
            id: c.id || c.customerId || Date.now() + Math.random(),
            name: c.name || c.fullname || 'بدون اسم',
            fullname: c.fullname || c.name || 'بدون اسم',
            phone: c.phone || c.phone1 || '',
            email: c.email || '',
            purchases: parseNumber(c.purchases || 0),
            debts: parseNumber(c.debts || 0),
            lastPurchase: c.lastPurchase || null,
            address: c.address || '',
            notes: c.notes || ''
        }));

        // حفظ في الذاكرة المؤقتة
        saveToCache('customers', customers);
        updateCustomersCount();
        return Promise.resolve(customers);
    }

    /**
     * تحميل المنتجات من مصادر متعددة
     */
    function loadProducts() {
        // محاولة التحميل من الذاكرة المؤقتة أولاً
        const cached = loadFromCache('products');
        if (cached) {
            products = cached;
            updateProductsCount();
            return Promise.resolve(products);
        }

        // محاولة التحميل من Module المنتجات
        if (window.productModule && typeof window.productModule.getAllProducts === 'function') {
            products = window.productModule.getAllProducts() || [];
        } 
        // محاولة التحميل من localStorage
        else {
            try {
                const stored = localStorage.getItem('products');
                products = stored ? JSON.parse(stored) : [];
            } catch (e) {
                console.error('خطأ في تحميل المنتجات:', e);
                products = [];
            }
        }

        // توحيد تنسيق البيانات
        products = products.map(p => ({
            id: p.id || p.productId || Date.now() + Math.random(),
            name: p.name || p.productName || 'منتج',
            barcode: p.barcode || '',
            category: p.category || 'عام',
            sellPrice: parseNumber(p.sellPrice || p.price || 0),
            buyPrice: parseNumber(p.buyPrice || p.cost || 0),
            quantity: parseNumber(p.quantity || p.stock || 0),
            unit: p.unit || 'قطعة',
            piecesPerUnit: p.piecesPerUnit || 1,
            minStock: parseNumber(p.minStock || 5),
            location: p.location || '',
            expiryDate: p.expiryDate || null
        }));

        // حفظ في الذاكرة المؤقتة
        saveToCache('products', products);
        updateProductsCount();
        return Promise.resolve(products);
    }

    /**
     * تحديث عدد العملاء في الواجهة
     */
    function updateCustomersCount() {
        const countEl = document.getElementById('customers-count');
        if (countEl) {
            countEl.textContent = `${customers.length} عميل`;
        }
    }

    /**
     * تحديث عدد المنتجات في الواجهة
     */
    function updateProductsCount() {
        const countEl = document.getElementById('products-count');
        if (countEl) {
            countEl.textContent = `${products.length} منتج`;
        }
    }

    // ===================================================================
    // البحث عن العملاء
    // ===================================================================

    /**
     * البحث عن العملاء
     */
    function searchCustomers(query) {
        currentCustomerSearch = query;
        
        if (!query || query.length < 2) {
            filteredCustomers = [];
            renderCustomerDropdown([]);
            renderCustomersTable(customers.slice(0, CONFIG.MAX_RESULTS));
            hideCustomerDropdown();
            return;
        }

        // تصفية العملاء
        filteredCustomers = customers.filter(customer => {
            return (
                smartSearch(customer.name, query) ||
                smartSearch(customer.fullname, query) ||
                smartSearch(customer.phone, query) ||
                smartSearch(customer.email, query) ||
                smartSearch(customer.address, query)
            );
        });

        // ترتيب النتائج حسب الأهمية
        filteredCustomers.sort((a, b) => {
            const aName = normalizeText(a.name);
            const bName = normalizeText(b.name);
            const nQuery = normalizeText(query);
            
            // الأولوية للتطابق التام
            if (aName === nQuery && bName !== nQuery) return -1;
            if (bName === nQuery && aName !== nQuery) return 1;
            
            // ثم التطابق في بداية الاسم
            if (aName.startsWith(nQuery) && !bName.startsWith(nQuery)) return -1;
            if (bName.startsWith(nQuery) && !aName.startsWith(nQuery)) return 1;
            
            return 0;
        });

        // عرض النتائج
        renderCustomerDropdown(filteredCustomers.slice(0, CONFIG.MAX_DROPDOWN_RESULTS));
        renderCustomersTable(filteredCustomers.slice(0, CONFIG.MAX_RESULTS));
        
        // إظهار القائمة المنسدلة إذا كانت هناك نتائج
        if (filteredCustomers.length > 0) {
            showCustomerDropdown();
        } else {
            hideCustomerDropdown();
        }

        // إعادة تعيين المؤشر المحدد
        selectedCustomerIndex = -1;
    }

    /**
     * عرض قائمة العملاء المنسدلة
     */
    function renderCustomerDropdown(results) {
        const dropdown = document.getElementById('customer-results-dropdown');
        if (!dropdown) return;

        if (results.length === 0) {
            dropdown.innerHTML = `
                <div class="no-results">
                    <i class="material-icons-round">sentiment_dissatisfied</i>
                    <p>لا توجد نتائج للبحث</p>
                    <small class="text-muted">جرب كلمات بحث مختلفة</small>
                </div>
            `;
            dropdown.classList.add('show');
            return;
        }

        let html = '';
        results.forEach((customer, index) => {
            const isSelected = index === selectedCustomerIndex ? 'selected' : '';
            
            html += `
                <div class="result-item ${isSelected}" 
                     onclick="AdvancedSearch.selectCustomer('${customer.id}')"
                     onmouseenter="AdvancedSearch.hoverCustomer(${index})">
                    <div class="result-icon customer">
                        <i class="material-icons-round">person</i>
                    </div>
                    <div class="result-content">
                        <div class="result-title">${customer.name}</div>
                        <div class="result-subtitle">
                            <span>📞 ${customer.phone || 'لا يوجد هاتف'}</span>
                            ${customer.email ? `<span>✉️ ${customer.email}</span>` : ''}
                        </div>
                        <div class="result-meta">
                            <span class="badge badge-price">
                                <i class="material-icons-round">shopping_cart</i>
                                ${formatCurrency(customer.purchases)}
                            </span>
                            ${customer.debts > 0 ? `
                                <span class="badge badge-debt">
                                    <i class="material-icons-round">warning</i>
                                    دين: ${formatCurrency(customer.debts)}
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        });

        dropdown.innerHTML = html;
        dropdown.classList.add('show');
    }

    /**
     * عرض جدول العملاء
     */
    function renderCustomersTable(results) {
        const tbody = document.getElementById('customers-table-body');
        if (!tbody) return;

        if (results.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-5">
                        <i class="material-icons-round" style="font-size: 3rem; color: #ccc;">people_outline</i>
                        <p class="text-muted mt-2">لا يوجد عملاء للعرض</p>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        results.forEach((customer, index) => {
            const lastPurchase = customer.lastPurchase 
                ? new Date(customer.lastPurchase).toLocaleDateString('ar-EG')
                : '-';
            
            html += `
                <tr onclick="AdvancedSearch.viewCustomerDetails('${customer.id}')">
                    <td>${index + 1}</td>
                    <td class="text-start">
                        <strong>${customer.name}</strong>
                        ${customer.notes ? `<br><small class="text-muted">📝 ${customer.notes.substring(0, 30)}</small>` : ''}
                    </td>
                    <td dir="ltr">${customer.phone || '-'}</td>
                    <td>${customer.email || '-'}</td>
                    <td class="text-success fw-bold">${formatCurrency(customer.purchases)}</td>
                    <td class="${customer.debts > 0 ? 'text-danger fw-bold' : 'text-success'}">
                        ${formatCurrency(customer.debts)}
                    </td>
                    <td>${lastPurchase}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn btn-view" onclick="event.stopPropagation(); AdvancedSearch.viewCustomerDetails('${customer.id}')" title="عرض التفاصيل">
                                <i class="material-icons-round">visibility</i>
                            </button>
                            <button class="action-btn btn-edit" onclick="event.stopPropagation(); AdvancedSearch.editCustomer('${customer.id}')" title="تعديل">
                                <i class="material-icons-round">edit</i>
                            </button>
                            <button class="action-btn btn-select" onclick="event.stopPropagation(); AdvancedSearch.selectCustomer('${customer.id}')" title="تحديد">
                                <i class="material-icons-round">check_circle</i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    }

    // ===================================================================
    // البحث عن المنتجات
    // ===================================================================

    /**
     * البحث عن المنتجات
     */
    function searchProducts(query) {
        currentProductSearch = query;
        
        if (!query || query.length < 2) {
            filteredProducts = [];
            renderProductDropdown([]);
            renderProductsTable(products.slice(0, CONFIG.MAX_RESULTS));
            hideProductDropdown();
            return;
        }

        // تصفية المنتجات
        filteredProducts = products.filter(product => {
            return (
                smartSearch(product.name, query) ||
                smartSearch(product.barcode, query) ||
                smartSearch(product.category, query) ||
                (product.barcode && product.barcode.includes(query))
            );
        });

        // ترتيب النتائج حسب الأهمية
        filteredProducts.sort((a, b) => {
            const aName = normalizeText(a.name);
            const bName = normalizeText(b.name);
            const nQuery = normalizeText(query);
            
            // الأولوية للتطابق التام
            if (aName === nQuery && bName !== nQuery) return -1;
            if (bName === nQuery && aName !== nQuery) return 1;
            
            // ثم التطابق في الباركود
            if (a.barcode === query && b.barcode !== query) return -1;
            if (b.barcode === query && a.barcode !== query) return 1;
            
            // ثم التطابق في بداية الاسم
            if (aName.startsWith(nQuery) && !bName.startsWith(nQuery)) return -1;
            if (bName.startsWith(nQuery) && !aName.startsWith(nQuery)) return 1;
            
            return 0;
        });

        // عرض النتائج
        renderProductDropdown(filteredProducts.slice(0, CONFIG.MAX_DROPDOWN_RESULTS));
        renderProductsTable(filteredProducts.slice(0, CONFIG.MAX_RESULTS));
        
        // إظهار القائمة المنسدلة إذا كانت هناك نتائج
        if (filteredProducts.length > 0) {
            showProductDropdown();
        } else {
            hideProductDropdown();
        }

        // إعادة تعيين المؤشر المحدد
        selectedProductIndex = -1;
    }

    /**
     * عرض قائمة المنتجات المنسدلة
     */
    function renderProductDropdown(results) {
        const dropdown = document.getElementById('product-results-dropdown');
        if (!dropdown) return;

        if (results.length === 0) {
            dropdown.innerHTML = `
                <div class="no-results">
                    <i class="material-icons-round">inventory_2</i>
                    <p>لا توجد نتائج للبحث</p>
                    <small class="text-muted">جرب كلمات بحث مختلفة</small>
                </div>
            `;
            dropdown.classList.add('show');
            return;
        }

        let html = '';
        results.forEach((product, index) => {
            const isSelected = index === selectedProductIndex ? 'selected' : '';
            const stockClass = product.quantity <= 0 ? 'badge-debt' : 
                              product.quantity <= product.minStock ? 'badge-stock' : 'badge-price';
            const stockText = product.quantity <= 0 ? 'نفذ' :
                             product.quantity <= product.minStock ? 'محدود' : 'متوفر';
            
            html += `
                <div class="result-item ${isSelected}" 
                     onclick="AdvancedSearch.selectProduct('${product.id}')"
                     onmouseenter="AdvancedSearch.hoverProduct(${index})">
                    <div class="result-icon product">
                        <i class="material-icons-round">inventory</i>
                    </div>
                    <div class="result-content">
                        <div class="result-title">${product.name}</div>
                        <div class="result-subtitle">
                            ${product.barcode ? `<span>🔖 ${product.barcode}</span>` : ''}
                            <span>📦 ${product.category}</span>
                        </div>
                        <div class="result-meta">
                            <span class="badge badge-price">
                                <i class="material-icons-round">sell</i>
                                ${formatCurrency(product.sellPrice)}
                            </span>
                            <span class="badge ${stockClass}">
                                <i class="material-icons-round">inventory</i>
                                ${product.quantity} ${product.unit} (${stockText})
                            </span>
                        </div>
                    </div>
                </div>
            `;
        });

        dropdown.innerHTML = html;
        dropdown.classList.add('show');
    }

    /**
     * عرض جدول المنتجات
     */
    function renderProductsTable(results) {
        const tbody = document.getElementById('products-table-body');
        if (!tbody) return;

        if (results.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-5">
                        <i class="material-icons-round" style="font-size: 3rem; color: #ccc;">inventory_2</i>
                        <p class="text-muted mt-2">لا يوجد منتجات للعرض</p>
                    </td>
                </tr>
            `;
            return;
        }

        let html = '';
        results.forEach((product, index) => {
            // تحديد حالة المخزون
            let stockClass = 'stock-high';
            let stockStatus = 'متوفر';
            
            if (product.quantity <= 0) {
                stockClass = 'stock-low';
                stockStatus = 'غير متوفر';
            } else if (product.quantity <= product.minStock) {
                stockClass = 'stock-medium';
                stockStatus = 'محدود';
            }
            
            html += `
                <tr onclick="AdvancedSearch.viewProductDetails('${product.id}')">
                    <td>${index + 1}</td>
                    <td class="text-start">
                        <strong>${product.name}</strong>
                        ${product.expiryDate ? `<br><small class="text-muted">⏰ ينتهي: ${new Date(product.expiryDate).toLocaleDateString('ar-EG')}</small>` : ''}
                    </td>
                    <td dir="ltr">${product.barcode || '-'}</td>
                    <td>${product.category}</td>
                    <td class="fw-bold text-primary">${formatCurrency(product.sellPrice)}</td>
                    <td class="text-muted">${formatCurrency(product.buyPrice)}</td>
                    <td>
                        <span class="stock-status ${stockClass}">
                            ${product.quantity} ${product.unit}
                            <br><small>${stockStatus}</small>
                        </span>
                    </td>
                    <td>${product.unit}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn btn-view" onclick="event.stopPropagation(); AdvancedSearch.viewProductDetails('${product.id}')" title="عرض التفاصيل">
                                <i class="material-icons-round">visibility</i>
                            </button>
                            <button class="action-btn btn-edit" onclick="event.stopPropagation(); AdvancedSearch.editProduct('${product.id}')" title="تعديل">
                                <i class="material-icons-round">edit</i>
                            </button>
                            <button class="action-btn btn-select" onclick="event.stopPropagation(); AdvancedSearch.selectProduct('${product.id}')" title="تحديد">
                                <i class="material-icons-round">add_shopping_cart</i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    }

    // ===================================================================
    // التحكم في القوائم المنسدلة
    // ===================================================================

    function showCustomerDropdown() {
        const dropdown = document.getElementById('customer-results-dropdown');
        if (dropdown) dropdown.classList.add('show');
    }

    function hideCustomerDropdown() {
        const dropdown = document.getElementById('customer-results-dropdown');
        if (dropdown) dropdown.classList.remove('show');
    }

    function showProductDropdown() {
        const dropdown = document.getElementById('product-results-dropdown');
        if (dropdown) dropdown.classList.add('show');
    }

    function hideProductDropdown() {
        const dropdown = document.getElementById('product-results-dropdown');
        if (dropdown) dropdown.classList.remove('show');
    }

    // ===================================================================
    // إدارة أحداث البحث (Debounced)
    // ===================================================================

    function handleCustomerSearch(e) {
        const query = e.target.value.trim();
        
        clearTimeout(customerSearchTimeout);
        customerSearchTimeout = setTimeout(() => {
            searchCustomers(query);
        }, CONFIG.DEBOUNCE_DELAY);
    }

    function handleProductSearch(e) {
        const query = e.target.value.trim();
        
        clearTimeout(productSearchTimeout);
        productSearchTimeout = setTimeout(() => {
            searchProducts(query);
        }, CONFIG.DEBOUNCE_DELAY);
    }

    // ===================================================================
    // التنقل بلوحة المفاتيح
    // ===================================================================

    function handleCustomerKeydown(e) {
        const dropdown = document.getElementById('customer-results-dropdown');
        if (!dropdown || !dropdown.classList.contains('show')) return;

        const items = dropdown.querySelectorAll('.result-item');
        if (items.length === 0) return;

        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectedCustomerIndex = Math.min(selectedCustomerIndex + 1, items.length - 1);
                updateSelectedCustomerItem(items);
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                selectedCustomerIndex = Math.max(selectedCustomerIndex - 1, -1);
                updateSelectedCustomerItem(items);
                break;
                
            case 'Enter':
                e.preventDefault();
                if (selectedCustomerIndex >= 0 && items[selectedCustomerIndex]) {
                    items[selectedCustomerIndex].click();
                }
                break;
                
            case 'Escape':
                hideCustomerDropdown();
                break;
        }
    }

    function handleProductKeydown(e) {
        const dropdown = document.getElementById('product-results-dropdown');
        if (!dropdown || !dropdown.classList.contains('show')) return;

        const items = dropdown.querySelectorAll('.result-item');
        if (items.length === 0) return;

        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectedProductIndex = Math.min(selectedProductIndex + 1, items.length - 1);
                updateSelectedProductItem(items);
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                selectedProductIndex = Math.max(selectedProductIndex - 1, -1);
                updateSelectedProductItem(items);
                break;
                
            case 'Enter':
                e.preventDefault();
                if (selectedProductIndex >= 0 && items[selectedProductIndex]) {
                    items[selectedProductIndex].click();
                }
                break;
                
            case 'Escape':
                hideProductDropdown();
                break;
        }
    }

    function updateSelectedCustomerItem(items) {
        items.forEach((item, index) => {
            if (index === selectedCustomerIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            } else {
                item.classList.remove('selected');
            }
        });
    }

    function updateSelectedProductItem(items) {
        items.forEach((item, index) => {
            if (index === selectedProductIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            } else {
                item.classList.remove('selected');
            }
        });
    }

    // ===================================================================
    // اختصارات لوحة المفاتيح العامة
    // ===================================================================

    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl + F: التركيز على بحث العملاء
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                document.getElementById('customer-search-input')?.focus();
            }
            
            // Ctrl + Shift + F: التركيز على بحث المنتجات
            if (e.ctrlKey && e.shiftKey && e.key === 'F') {
                e.preventDefault();
                document.getElementById('product-search-input')?.focus();
            }
            
            // Ctrl + N: إضافة جديد
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                showAddNewModal();
            }
            
            // F5: تحديث البيانات
            if (e.key === 'F5') {
                e.preventDefault();
                refreshData();
            }
        });
    }

    // ===================================================================
    // الإجراءات على العملاء
    // ===================================================================

    function selectCustomer(customerId) {
        const customer = customers.find(c => c.id == customerId);
        if (!customer) return;
        
        // إظهار تفاصيل سريعة
        Swal.fire({
            title: 'تم تحديد العميل',
            html: `
                <div style="text-align: right; direction: rtl;">
                    <p><strong>الاسم:</strong> ${customer.name}</p>
                    <p><strong>الهاتف:</strong> ${customer.phone || '-'}</p>
                    <p><strong>إجمالي المشتريات:</strong> ${formatCurrency(customer.purchases)}</p>
                    <p><strong>الديون:</strong> <span style="color: ${customer.debts > 0 ? 'red' : 'green'};">${formatCurrency(customer.debts)}</span></p>
                </div>
            `,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
        });
        
        // إخفاء القائمة المنسدلة
        hideCustomerDropdown();
        
        // يمكن إضافة كود إضافي هنا لاستخدام العميل المحدد
        if (window.salesModule && typeof window.salesModule.selectCustomer === 'function') {
            window.salesModule.selectCustomer(customer);
        }
    }

    function viewCustomerDetails(customerId) {
        const customer = customers.find(c => c.id == customerId);
        if (!customer) return;
        
        // تحضير سجل المشتريات
        let purchasesHtml = '';
        if (window.salesModule && window.salesModule.invoices) {
            const customerInvoices = window.salesModule.invoices
                .filter(inv => inv.customerId == customerId)
                .slice(0, 5);
            
            if (customerInvoices.length > 0) {
                purchasesHtml = '<h6 class="mt-3">آخر المشتريات:</h6>';
                purchasesHtml += '<table style="width:100%; font-size:0.9rem;">';
                customerInvoices.forEach(inv => {
                    purchasesHtml += `
                        <tr>
                            <td>${new Date(inv.date).toLocaleDateString('ar-EG')}</td>
                            <td>${formatCurrency(inv.grandTotal)}</td>
                        </tr>
                    `;
                });
                purchasesHtml += '</table>';
            }
        }
        
        Swal.fire({
            title: `تفاصيل العميل: ${customer.name}`,
            html: `
                <div style="text-align: right; direction: rtl; max-height: 400px; overflow-y: auto;">
                    <div class="row">
                        <div class="col-6">
                            <p><i class="material-icons-round" style="font-size:1rem;">phone</i> <strong>الهاتف:</strong> ${customer.phone || '-'}</p>
                            <p><i class="material-icons-round" style="font-size:1rem;">email</i> <strong>البريد:</strong> ${customer.email || '-'}</p>
                        </div>
                        <div class="col-6">
                            <p><i class="material-icons-round" style="font-size:1rem;">location_on</i> <strong>العنوان:</strong> ${customer.address || '-'}</p>
                            <p><i class="material-icons-round" style="font-size:1rem;">notes</i> <strong>ملاحظات:</strong> ${customer.notes || '-'}</p>
                        </div>
                    </div>
                    <hr>
                    <div class="row text-center">
                        <div class="col-4">
                            <div class="bg-light p-2 rounded">
                                <small class="text-muted">إجمالي المشتريات</small>
                                <h5 class="text-success">${formatCurrency(customer.purchases)}</h5>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="bg-light p-2 rounded">
                                <small class="text-muted">الديون</small>
                                <h5 class="text-danger">${formatCurrency(customer.debts)}</h5>
                            </div>
                        </div>
                        <div class="col-4">
                            <div class="bg-light p-2 rounded">
                                <small class="text-muted">عدد الفواتير</small>
                                <h5>${window.salesModule ? window.salesModule.invoices.filter(inv => inv.customerId == customerId).length : 0}</h5>
                            </div>
                        </div>
                    </div>
                    ${purchasesHtml}
                </div>
            `,
            width: '600px',
            showCloseButton: true,
            showConfirmButton: false
        });
    }

    function editCustomer(customerId) {
        const customer = customers.find(c => c.id == customerId);
        if (!customer) return;
        
        Swal.fire({
            title: 'تعديل بيانات العميل',
            html: `
                <div style="text-align: right; direction: rtl;">
                    <input type="text" id="edit-name" class="swal2-input" placeholder="اسم العميل" value="${customer.name}">
                    <input type="text" id="edit-phone" class="swal2-input" placeholder="رقم الهاتف" value="${customer.phone || ''}">
                    <input type="email" id="edit-email" class="swal2-input" placeholder="البريد الإلكتروني" value="${customer.email || ''}">
                    <textarea id="edit-address" class="swal2-textarea" placeholder="العنوان">${customer.address || ''}</textarea>
                    <textarea id="edit-notes" class="swal2-textarea" placeholder="ملاحظات">${customer.notes || ''}</textarea>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'حفظ التعديلات',
            cancelButtonText: 'إلغاء',
            preConfirm: () => {
                return {
                    name: document.getElementById('edit-name').value,
                    phone: document.getElementById('edit-phone').value,
                    email: document.getElementById('edit-email').value,
                    address: document.getElementById('edit-address').value,
                    notes: document.getElementById('edit-notes').value
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                // تحديث بيانات العميل
                Object.assign(customer, result.value);
                
                // حفظ التغييرات
                saveCustomers();
                
                showNotification('تم تحديث بيانات العميل بنجاح', 'success');
                
                // إعادة تحميل البيانات
                loadCustomers().then(() => {
                    searchCustomers(currentCustomerSearch);
                });
            }
        });
    }

    // ===================================================================
    // الإجراءات على المنتجات
    // ===================================================================

    function selectProduct(productId) {
        const product = products.find(p => p.id == productId);
        if (!product) return;
        
        if (product.quantity <= 0) {
            showNotification('المنتج غير متوفر في المخزون', 'warning');
            return;
        }
        
        // إظهار تأكيد الإضافة
        Swal.fire({
            title: 'إضافة إلى السلة',
            html: `
                <div style="text-align: right; direction: rtl;">
                    <p><strong>${product.name}</strong></p>
                    <p>السعر: ${formatCurrency(product.sellPrice)}</p>
                    <p>المخزون: ${product.quantity} ${product.unit}</p>
                    <input type="number" id="select-quantity" class="form-control" value="1" min="1" max="${product.quantity}">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'إضافة',
            cancelButtonText: 'إلغاء',
            preConfirm: () => {
                const quantity = parseNumber(document.getElementById('select-quantity').value);
                if (quantity > product.quantity) {
                    Swal.showValidationMessage('الكمية المطلوبة أكبر من المخزون');
                    return false;
                }
                return { quantity };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                // إضافة المنتج إلى السلة
                if (window.salesModule && typeof window.salesModule.addToCart === 'function') {
                    window.salesModule.addToCart({
                        ...product,
                        quantity: result.value.quantity
                    });
                }
                
                showNotification(`تم إضافة ${product.name} إلى السلة`, 'success');
                hideProductDropdown();
            }
        });
    }

    function viewProductDetails(productId) {
        const product = products.find(p => p.id == productId);
        if (!product) return;
        
        const stockStatus = product.quantity <= 0 ? 'غير متوفر' :
                           product.quantity <= product.minStock ? 'محدود' : 'متوفر';
        const stockColor = product.quantity <= 0 ? 'red' :
                          product.quantity <= product.minStock ? 'orange' : 'green';
        
        Swal.fire({
            title: `تفاصيل المنتج: ${product.name}`,
            html: `
                <div style="text-align: right; direction: rtl;">
                    <div class="row">
                        <div class="col-6">
                            <p><strong>الباركود:</strong> ${product.barcode || '-'}</p>
                            <p><strong>الفئة:</strong> ${product.category}</p>
                            <p><strong>الوحدة:</strong> ${product.unit}</p>
                        </div>
                        <div class="col-6">
                            <p><strong>سعر البيع:</strong> <span class="text-primary">${formatCurrency(product.sellPrice)}</span></p>
                            <p><strong>سعر الشراء:</strong> <span class="text-muted">${formatCurrency(product.buyPrice)}</span></p>
                            <p><strong>الهامش:</strong> ${(((product.sellPrice - product.buyPrice) / product.buyPrice) * 100).toFixed(1)}%</p>
                        </div>
                    </div>
                    <hr>
                    <div class="text-center">
                        <div class="bg-light p-3 rounded">
                            <h6>حالة المخزون</h6>
                            <h3 style="color: ${stockColor};">${product.quantity} ${product.unit}</h3>
                            <p>${stockStatus}</p>
                            ${product.location ? `<p><strong>الموقع:</strong> ${product.location}</p>` : ''}
                            ${product.expiryDate ? `<p><strong>تاريخ الانتهاء:</strong> ${new Date(product.expiryDate).toLocaleDateString('ar-EG')}</p>` : ''}
                        </div>
                    </div>
                </div>
            `,
            width: '500px',
            showCloseButton: true,
            showConfirmButton: false
        });
    }

    function editProduct(productId) {
        const product = products.find(p => p.id == productId);
        if (!product) return;
        
        Swal.fire({
            title: 'تعديل بيانات المنتج',
            html: `
                <div style="text-align: right; direction: rtl;">
                    <input type="text" id="edit-product-name" class="swal2-input" placeholder="اسم المنتج" value="${product.name}">
                    <input type="text" id="edit-barcode" class="swal2-input" placeholder="الباركود" value="${product.barcode || ''}">
                    <input type="text" id="edit-category" class="swal2-input" placeholder="الفئة" value="${product.category}">
                    <input type="number" id="edit-sell-price" class="swal2-input" placeholder="سعر البيع" value="${product.sellPrice}">
                    <input type="number" id="edit-buy-price" class="swal2-input" placeholder="سعر الشراء" value="${product.buyPrice}">
                    <input type="number" id="edit-quantity" class="swal2-input" placeholder="الكمية" value="${product.quantity}">
                    <input type="number" id="edit-min-stock" class="swal2-input" placeholder="الحد الأدنى" value="${product.minStock}">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'حفظ التعديلات',
            cancelButtonText: 'إلغاء',
            preConfirm: () => {
                return {
                    name: document.getElementById('edit-product-name').value,
                    barcode: document.getElementById('edit-barcode').value,
                    category: document.getElementById('edit-category').value,
                    sellPrice: parseNumber(document.getElementById('edit-sell-price').value),
                    buyPrice: parseNumber(document.getElementById('edit-buy-price').value),
                    quantity: parseNumber(document.getElementById('edit-quantity').value),
                    minStock: parseNumber(document.getElementById('edit-min-stock').value)
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                // تحديث بيانات المنتج
                Object.assign(product, result.value);
                
                // حفظ التغييرات
                saveProducts();
                
                showNotification('تم تحديث بيانات المنتج بنجاح', 'success');
                
                // إعادة تحميل البيانات
                loadProducts().then(() => {
                    searchProducts(currentProductSearch);
                });
            }
        });
    }

    // ===================================================================
    // حفظ البيانات
    // ===================================================================

    function saveCustomers() {
        try {
            localStorage.setItem('customers', JSON.stringify(customers));
            // تحديث الذاكرة المؤقتة
            saveToCache('customers', customers);
        } catch (e) {
            console.error('خطأ في حفظ العملاء:', e);
            showNotification('حدث خطأ في حفظ البيانات', 'error');
        }
    }

    function saveProducts() {
        try {
            localStorage.setItem('products', JSON.stringify(products));
            // تحديث الذاكرة المؤقتة
            saveToCache('products', products);
        } catch (e) {
            console.error('خطأ في حفظ المنتجات:', e);
            showNotification('حدث خطأ في حفظ البيانات', 'error');
        }
    }

    // ===================================================================
    // دوال مساعدة أخرى
    // ===================================================================

    function clearCustomerSearch() {
        const input = document.getElementById('customer-search-input');
        if (input) {
            input.value = '';
            input.focus();
            searchCustomers('');
        }
    }

    function clearProductSearch() {
        const input = document.getElementById('product-search-input');
        if (input) {
            input.value = '';
            input.focus();
            searchProducts('');
        }
    }

    function hoverCustomer(index) {
        selectedCustomerIndex = index;
        const dropdown = document.getElementById('customer-results-dropdown');
        if (dropdown) {
            const items = dropdown.querySelectorAll('.result-item');
            updateSelectedCustomerItem(items);
        }
    }

    function hoverProduct(index) {
        selectedProductIndex = index;
        const dropdown = document.getElementById('product-results-dropdown');
        if (dropdown) {
            const items = dropdown.querySelectorAll('.result-item');
            updateSelectedProductItem(items);
        }
    }

    function showAddNewModal() {
        Swal.fire({
            title: 'إضافة جديد',
            text: 'ماذا تريد إضافة؟',
            icon: 'question',
            showCancelButton: true,
            showDenyButton: true,
            confirmButtonText: 'عميل جديد',
            denyButtonText: 'منتج جديد',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed) {
                showAddCustomerModal();
            } else if (result.isDenied) {
                showAddProductModal();
            }
        });
    }

    function showAddCustomerModal() {
        Swal.fire({
            title: 'إضافة عميل جديد',
            html: `
                <div style="text-align: right; direction: rtl;">
                    <input type="text" id="new-customer-name" class="swal2-input" placeholder="اسم العميل *">
                    <input type="text" id="new-customer-phone" class="swal2-input" placeholder="رقم الهاتف">
                    <input type="email" id="new-customer-email" class="swal2-input" placeholder="البريد الإلكتروني">
                    <textarea id="new-customer-address" class="swal2-textarea" placeholder="العنوان"></textarea>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'إضافة',
            cancelButtonText: 'إلغاء',
            preConfirm: () => {
                const name = document.getElementById('new-customer-name').value;
                if (!name) {
                    Swal.showValidationMessage('اسم العميل مطلوب');
                    return false;
                }
                return {
                    id: Date.now().toString(),
                    name: name,
                    fullname: name,
                    phone: document.getElementById('new-customer-phone').value,
                    email: document.getElementById('new-customer-email').value,
                    address: document.getElementById('new-customer-address').value,
                    purchases: 0,
                    debts: 0,
                    notes: '',
                    lastPurchase: null
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                customers.unshift(result.value);
                saveCustomers();
                showNotification('تم إضافة العميل بنجاح', 'success');
                loadCustomers().then(() => {
                    searchCustomers('');
                });
            }
        });
    }

    function showAddProductModal() {
        Swal.fire({
            title: 'إضافة منتج جديد',
            html: `
                <div style="text-align: right; direction: rtl;">
                    <input type="text" id="new-product-name" class="swal2-input" placeholder="اسم المنتج *">
                    <input type="text" id="new-product-barcode" class="swal2-input" placeholder="الباركود">
                    <input type="text" id="new-product-category" class="swal2-input" placeholder="الفئة">
                    <input type="number" id="new-product-sell-price" class="swal2-input" placeholder="سعر البيع *">
                    <input type="number" id="new-product-buy-price" class="swal2-input" placeholder="سعر الشراء">
                    <input type="number" id="new-product-quantity" class="swal2-input" placeholder="الكمية" value="0">
                    <input type="text" id="new-product-unit" class="swal2-input" placeholder="الوحدة" value="قطعة">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'إضافة',
            cancelButtonText: 'إلغاء',
            preConfirm: () => {
                const name = document.getElementById('new-product-name').value;
                const sellPrice = parseNumber(document.getElementById('new-product-sell-price').value);
                
                if (!name) {
                    Swal.showValidationMessage('اسم المنتج مطلوب');
                    return false;
                }
                if (!sellPrice || sellPrice <= 0) {
                    Swal.showValidationMessage('سعر البيع مطلوب');
                    return false;
                }
                
                return {
                    id: Date.now().toString(),
                    name: name,
                    barcode: document.getElementById('new-product-barcode').value,
                    category: document.getElementById('new-product-category').value || 'عام',
                    sellPrice: sellPrice,
                    buyPrice: parseNumber(document.getElementById('new-product-buy-price').value),
                    quantity: parseNumber(document.getElementById('new-product-quantity').value),
                    unit: document.getElementById('new-product-unit').value || 'قطعة',
                    piecesPerUnit: 1,
                    minStock: 5,
                    location: '',
                    expiryDate: null
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                products.unshift(result.value);
                saveProducts();
                showNotification('تم إضافة المنتج بنجاح', 'success');
                loadProducts().then(() => {
                    searchProducts('');
                });
            }
        });
    }

    function refreshData() {
        showNotification('جاري تحديث البيانات...', 'info');
        
        Promise.all([
            loadCustomers(),
            loadProducts()
        ]).then(() => {
            searchCustomers(currentCustomerSearch);
            searchProducts(currentProductSearch);
            showNotification('تم تحديث البيانات بنجاح', 'success');
        }).catch(error => {
            console.error('خطأ في تحديث البيانات:', error);
            showNotification('حدث خطأ في تحديث البيانات', 'error');
        });
    }

    // ===================================================================
    // التهيئة
    // ===================================================================

    function init() {
        console.log('✅ AdvancedSearch v2.0 initialized');
        
        // تحميل البيانات
        Promise.all([
            loadCustomers(),
            loadProducts()
        ]).then(() => {
            // عرض البيانات الأولية
            renderCustomersTable(customers.slice(0, CONFIG.MAX_RESULTS));
            renderProductsTable(products.slice(0, CONFIG.MAX_RESULTS));
            
            // إضافة مستمعي الأحداث
            setupEventListeners();
            
            // إعداد اختصارات لوحة المفاتيح
            setupKeyboardShortcuts();
            
            showNotification('نظام البحث المتقدم جاهز للعمل', 'success');
        }).catch(error => {
            console.error('خطأ في تهيئة النظام:', error);
            showNotification('حدث خطأ في تهيئة النظام', 'error');
        });
    }

    function setupEventListeners() {
        // بحث العملاء
        const customerInput = document.getElementById('customer-search-input');
        if (customerInput) {
            customerInput.addEventListener('input', handleCustomerSearch);
            customerInput.addEventListener('keydown', handleCustomerKeydown);
            customerInput.addEventListener('focus', () => {
                if (customerInput.value.trim().length >= 2) {
                    showCustomerDropdown();
                }
            });
        }

        // بحث المنتجات
        const productInput = document.getElementById('product-search-input');
        if (productInput) {
            productInput.addEventListener('input', handleProductSearch);
            productInput.addEventListener('keydown', handleProductKeydown);
            productInput.addEventListener('focus', () => {
                if (productInput.value.trim().length >= 2) {
                    showProductDropdown();
                }
            });
        }

        // إغلاق القوائم المنسدلة عند النقر خارجها
        document.addEventListener('click', (e) => {
            const customerDropdown = document.getElementById('customer-results-dropdown');
            const customerInput = document.getElementById('customer-search-input');
            
            if (customerDropdown && !customerDropdown.contains(e.target) && e.target !== customerInput) {
                hideCustomerDropdown();
            }
            
            const productDropdown = document.getElementById('product-results-dropdown');
            const productInput = document.getElementById('product-search-input');
            
            if (productDropdown && !productDropdown.contains(e.target) && e.target !== productInput) {
                hideProductDropdown();
            }
        });
    }

    // ===================================================================
    // الكشف عن الدوال العامة
    // ===================================================================
    
    return {
        // التهيئة
        init: init,
        
        // البحث
        searchCustomers: searchCustomers,
        searchProducts: searchProducts,
        
        // التنقل بلوحة المفاتيح
        handleCustomerKeydown: handleCustomerKeydown,
        handleProductKeydown: handleProductKeydown,
        hoverCustomer: hoverCustomer,
        hoverProduct: hoverProduct,
        
        // الإجراءات على العملاء
        selectCustomer: selectCustomer,
        viewCustomerDetails: viewCustomerDetails,
        editCustomer: editCustomer,
        
        // الإجراءات على المنتجات
        selectProduct: selectProduct,
        viewProductDetails: viewProductDetails,
        editProduct: editProduct,
        
        // دوال مساعدة
        clearCustomerSearch: clearCustomerSearch,
        clearProductSearch: clearProductSearch,
        refreshData: refreshData,
        showAddNewModal: showAddNewModal,
        formatCurrency: formatCurrency,
        parseNumber: parseNumber,
        showNotification: showNotification
    };
})();

// ===================================================================
// ربط الوحدة بالنافذة العامة
// ===================================================================
window.AdvancedSearch = AdvancedSearch;
