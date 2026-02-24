// =======================================================================
// ملف: sales.js - نظام إدارة المبيعات المتقدم مع دعم الديون والوحدات
// الإصدار: 7.5 - بحث فوري بحرف واحد وإضافة مباشرة
// =======================================================================

// =======================================================================
// الجزء 1: تعريف الوحدة الرئيسية وهيكل البيانات الأساسي
// =======================================================================
const salesModule = (function() {
    
    // =======================================================================
    // الجزء 2: تهيئة البيانات واسترجاعها من التخزين المحلي
    // =======================================================================
    let customerCarts = JSON.parse(localStorage.getItem('customer_carts')) || {};
    let currentCart = [];
    let invoices = JSON.parse(localStorage.getItem('sales_invoices')) || [];
    let activeCustomers = JSON.parse(localStorage.getItem('activeCustomers')) || [];
    let currentCustomerId = localStorage.getItem('currentCustomerId') || null;
    let searchTimeout = null;
    let selectedProductIndex = -1;
    let productsList = [];

    // =======================================================================
    // الجزء 3: الدوال المساعدة الأساسية
    // =======================================================================
    
    function formatCurrency(amount) {
        if (amount === undefined || amount === null || isNaN(amount)) amount = 0;
        return Number(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }
    
    function parseNumber(value) {
        if (value === undefined || value === null) return 0;
        if (typeof value === 'string') {
            // إزالة الفواصل وتحويل الفاصلة العشرية العربية إلى نقطة
            value = value.replace(/,/g, '').replace(/[^\d.-]/g, '');
        }
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
    }
    
    function generateInvoiceNumber() {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `SALE-${year}${month}${day}-${random}`;
    }
    
    function showNotification(title, message, type = 'success') {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: type,
                title: title,
                text: message,
                timer: 1500,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
        } else {
            alert(`${title}: ${message}`);
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
            if (confirm(`${title}\n${text}`)) confirmCallback();
        }
    }
    
    function saveInvoices() {
        localStorage.setItem('sales_invoices', JSON.stringify(invoices));
    }
    
    function saveCustomerCarts() {
        localStorage.setItem('customer_carts', JSON.stringify(customerCarts));
    }
    
    function saveActiveCustomers() {
        localStorage.setItem('activeCustomers', JSON.stringify(activeCustomers));
        if (currentCustomerId) {
            localStorage.setItem('currentCustomerId', currentCustomerId);
        } else {
            localStorage.removeItem('currentCustomerId');
        }
    }

    // =======================================================================
    // الجزء 4: إدارة سلة المشتريات حسب العميل
    // =======================================================================
    
    function loadCustomerCart(customerId) {
        if (customerId) {
            currentCart = customerCarts[customerId] || [];
        } else {
            const cashCustomerId = 'cash_customer';
            currentCart = customerCarts[cashCustomerId] || [];
        }
        renderCart();
        updateCartCount();
        updateRemainingAmount();
    }
    
    function saveCurrentCart() {
        const cartKey = currentCustomerId || 'cash_customer';
        customerCarts[cartKey] = [...currentCart];
        saveCustomerCarts();
    }
    
    function switchToCustomerCart(customerId) {
        const oldKey = currentCustomerId || 'cash_customer';
        customerCarts[oldKey] = [...currentCart];
        
        currentCustomerId = customerId;
        
        const newKey = customerId || 'cash_customer';
        currentCart = customerCarts[newKey] || [];
        
        renderCart();
        updateTotals();
        updateRemainingAmount();
        updateCartCount();
        
        saveCustomerCarts();
        saveActiveCustomers();
    }
    
    function getCustomerNameById(customerId) {
        if (!customerId) return 'زبون نقدي';
        const allCustomers = getAllCustomers();
        const customer = allCustomers.find(c => c.id === customerId);
        return customer ? (customer.name || customer.fullname || 'عميل') : 'عميل';
    }
    
    function updateCartCount() {
        const cartCountEl = document.getElementById('cart-count');
        if (cartCountEl) {
            cartCountEl.textContent = currentCart.length;
        }
    }

    // =======================================================================
    // الجزء 5: إدارة العملاء النشطين
    // =======================================================================
    
    function addActiveCustomer(customer) {
        if (!customer || !customer.id) return;
        
        const existingIndex = activeCustomers.findIndex(c => c.id === customer.id);
        
        if (existingIndex === -1) {
            if (!customerCarts[customer.id]) {
                customerCarts[customer.id] = [];
            }
            
            activeCustomers.push({
                id: customer.id,
                name: customer.name || customer.fullname || 'بدون اسم',
                phone: customer.phone || customer.phone1 || '',
                active: true
            });
            
            activeCustomers.forEach(c => {
                if (c.id !== customer.id) c.active = false;
            });
        } else {
            activeCustomers.forEach(c => c.active = (c.id === customer.id));
        }
        
        switchToCustomerCart(customer.id);
        
        renderActiveCustomers();
        showSelectedCustomerBadge(customer);
        
        const area = document.getElementById('active-customers-area');
        if (area) area.style.display = 'block';
        
        saveActiveCustomers();
        
        const customerSelect = document.getElementById('sale-customer');
        if (customerSelect) {
            customerSelect.value = customer.id;
        }
        
        const searchInput = document.getElementById('customer-search');
        if (searchInput) {
            searchInput.value = customer.name || customer.fullname || '';
            hideCustomerResults();
        }
        
        showNotification('نجاح', `تم اختيار العميل ${customer.name}`);
    }
    
    function hideCustomerResults() {
        const resultsDiv = document.getElementById('customer-results');
        if (resultsDiv) resultsDiv.style.display = 'none';
    }
    
    function renderActiveCustomers() {
        const container = document.getElementById('active-customers-list');
        const area = document.getElementById('active-customers-area');
        const totalSpan = document.getElementById('active-customers-total');
        
        if (!container) return;
        
        if (activeCustomers.length === 0) {
            if (area) area.style.display = 'none';
            return;
        }
        
        if (area) area.style.display = 'block';
        if (totalSpan) totalSpan.textContent = activeCustomers.length;
        
        let html = '';
        activeCustomers.forEach(customer => {
            const activeClass = customer.active ? 'bg-success text-white' : 'bg-light';
            const activeIcon = customer.active ? 
                '<i class="material-icons-round" style="font-size: 14px;">check_circle</i>' : 
                '<i class="material-icons-round" style="font-size: 14px;">radio_button_unchecked</i>';
            
            const cartCount = (customerCarts[customer.id] || []).length;
            const cartBadge = cartCount > 0 ? `<span class="badge bg-warning text-dark ms-1" style="font-size: 0.6rem;">${cartCount}</span>` : '';
            
            html += `
                <div class="customer-chip p-1 rounded ${activeClass}" 
                     onclick="salesModule.switchActiveCustomer('${customer.id}')"
                     style="cursor: pointer; display: inline-flex; align-items: center; gap: 3px; border: 1px solid #dee2e6; margin: 1px; font-size: 0.7rem;">
                    ${activeIcon}
                    <span>${customer.name}</span>
                    ${cartBadge}
                    <i class="material-icons-round" style="font-size: 14px; cursor: pointer;" 
                       onclick="event.stopPropagation(); salesModule.removeActiveCustomer('${customer.id}')">close</i>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    function switchActiveCustomer(customerId) {
        const oldKey = currentCustomerId || 'cash_customer';
        customerCarts[oldKey] = [...currentCart];
        
        activeCustomers.forEach(c => c.active = (c.id === customerId));
        
        switchToCustomerCart(customerId);
        
        renderActiveCustomers();
        
        const allCustomers = getAllCustomers();
        const customer = allCustomers.find(c => c.id === customerId) || 
                        activeCustomers.find(c => c.id === customerId);
        if (customer) {
            showSelectedCustomerBadge(customer);
        }
        
        const customerSelect = document.getElementById('sale-customer');
        if (customerSelect) {
            customerSelect.value = customerId;
        }
        
        const searchInput = document.getElementById('customer-search');
        if (searchInput && customer) {
            searchInput.value = customer.name || '';
        }
        
        hideCustomerResults();
    }
    
    function removeActiveCustomer(customerId) {
        const index = activeCustomers.findIndex(c => c.id === customerId);
        
        if (index !== -1) {
            delete customerCarts[customerId];
            
            if (currentCustomerId === customerId) {
                if (activeCustomers.length > 1) {
                    const nextCustomer = activeCustomers.find((c, i) => i !== index);
                    if (nextCustomer) {
                        switchToCustomerCart(nextCustomer.id);
                        nextCustomer.active = true;
                        const allCustomers = getAllCustomers();
                        const fullCustomer = allCustomers.find(c => c.id === nextCustomer.id) || nextCustomer;
                        showSelectedCustomerBadge(fullCustomer);
                    }
                } else {
                    currentCustomerId = null;
                    switchToCustomerCart(null);
                    clearSelectedCustomerUI();
                }
            }
            
            activeCustomers.splice(index, 1);
            
            renderActiveCustomers();
            saveActiveCustomers();
            saveCustomerCarts();
            
            showNotification('تم', 'تم إزالة العميل من القائمة');
        }
    }
    
    function clearAllActiveCustomers() {
        if (activeCustomers.length === 0) return;
        
        showConfirmation('تأكيد', 'هل تريد مسح جميع العملاء النشطين وسلاتهم؟', () => {
            activeCustomers.forEach(c => {
                delete customerCarts[c.id];
            });
            
            activeCustomers = [];
            currentCustomerId = null;
            
            switchToCustomerCart(null);
            
            const area = document.getElementById('active-customers-area');
            if (area) area.style.display = 'none';
            
            clearSelectedCustomerUI();
            renderActiveCustomers();
            saveActiveCustomers();
            saveCustomerCarts();
            
            showNotification('تم', 'تم مسح جميع العملاء النشطين');
        });
    }
    
    function clearSelectedCustomerUI() {
        const badge = document.getElementById('selected-customer-badge');
        if (badge) badge.style.display = 'none';
        
        const searchInput = document.getElementById('customer-search');
        if (searchInput) searchInput.value = '';
        
        const customerSelect = document.getElementById('sale-customer');
        if (customerSelect) customerSelect.value = '';
        
        const customerCartLabel = document.getElementById('current-customer-cart-label');
        if (customerCartLabel) customerCartLabel.textContent = ' - زبون نقدي';
        
        const paidAmount = document.getElementById('paid-amount');
        if (paidAmount) paidAmount.value = '0';
    }
    
    function showSelectedCustomerBadge(customer) {
        const badge = document.getElementById('selected-customer-badge');
        const nameSpan = document.getElementById('selected-customer-name');
        const customerCartLabel = document.getElementById('current-customer-cart-label');
        
        if (badge && nameSpan && customer) {
            nameSpan.textContent = customer.name || customer.fullname || 'عميل';
            badge.style.display = 'block';
            
            if (customerCartLabel) {
                customerCartLabel.textContent = ` - ${customer.name || customer.fullname || 'عميل'}`;
            }
        }
    }
    
    function clearSelectedCustomer() {
        if (currentCustomerId) {
            removeActiveCustomer(currentCustomerId);
        } else {
            clearSelectedCustomerUI();
        }
    }
    
    function getAllCustomers() {
        let customers = [];
        
        if (window.customerModule && typeof window.customerModule.getAllCustomers === 'function') {
            customers = window.customerModule.getAllCustomers() || [];
        }
        
        if (customers.length === 0) {
            customers = JSON.parse(localStorage.getItem('customers') || '[]');
        }
        
        return customers;
    }

    // =======================================================================
    // الجزء 6: البحث الفوري عن العملاء (بحرف واحد)
    // =======================================================================
    
    function searchCustomersInstant(query) {
        const resultsDiv = document.getElementById('customer-results');
        if (!resultsDiv) return;
        
        if (!query || query.length < 1) {
            resultsDiv.style.display = 'none';
            return;
        }
        
        const customers = getAllCustomers();
        
        // بحث فوري بحرف واحد
        const filtered = customers.filter(c => 
            (c.name && c.name.toLowerCase().includes(query.toLowerCase())) ||
            (c.fullname && c.fullname.toLowerCase().includes(query.toLowerCase())) ||
            (c.phone && c.phone.includes(query)) ||
            (c.phone1 && c.phone1.includes(query))
        ).slice(0, 5);
        
        if (filtered.length === 0) {
            resultsDiv.innerHTML = '<div class="search-item text-muted">لا توجد نتائج - <a href="#" onclick="salesModule.openAddCustomerModal()">إضافة عميل جديد</a></div>';
            resultsDiv.style.display = 'block';
            return;
        }
        
        let html = '';
        filtered.forEach(customer => {
            const customerName = customer.name || customer.fullname || 'بدون اسم';
            const customerPhone = customer.phone || customer.phone1 || '';
            const isActive = activeCustomers.some(ac => ac.id === customer.id);
            
            html += `
                <div class="search-item" onclick="salesModule.addCustomerDirect('${customer.id}')">
                    <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                        <i class="material-icons-round" style="font-size: 1.2rem;">person</i>
                        <div>
                            <strong>${customerName}</strong>
                            ${customerPhone ? `<br><small>${customerPhone}</small>` : ''}
                        </div>
                    </div>
                    ${isActive ? '<span class="badge bg-success">نشط</span>' : '<span class="badge bg-primary">إضافة</span>'}
                </div>
            `;
        });
        
        resultsDiv.innerHTML = html;
        resultsDiv.style.display = 'block';
    }
    
    // دالة إضافة العميل مباشرة من البحث
    function addCustomerDirect(customerId) {
        const customers = getAllCustomers();
        const customer = customers.find(c => c.id === customerId);
        if (customer) {
            addActiveCustomer(customer);
            hideCustomerResults();
        }
    }
    
    function searchCustomers(query) {
        return searchCustomersInstant(query);
    }
    
    function selectCustomerFromDropdown(customerId) {
        if (!customerId) return;
        
        const customers = getAllCustomers();
        const customer = customers.find(c => c.id === customerId);
        
        if (customer) {
            addActiveCustomer(customer);
        }
    }

    // =======================================================================
    // الجزء 7: البحث الفوري عن المنتجات (بحرف واحد)
    // =======================================================================
    
    function loadProducts() {
        if (window.productModule && typeof window.productModule.getAllProducts === 'function') {
            productsList = window.productModule.getAllProducts() || [];
        } else {
            productsList = JSON.parse(localStorage.getItem('products') || '[]');
        }
        return productsList;
    }
    
    function handleProductSearchKeydown(e) {
        const resultsContainer = document.getElementById('product-search-results');
        
        if (!resultsContainer || resultsContainer.style.display !== 'block') return;
        
        const items = resultsContainer.querySelectorAll('.search-result-item');
        if (items.length === 0) return;
        
        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectedProductIndex = Math.min(selectedProductIndex + 1, items.length - 1);
                updateSelectedItem(items);
                break;
            case 'ArrowUp':
                e.preventDefault();
                selectedProductIndex = Math.max(selectedProductIndex - 1, -1);
                updateSelectedItem(items);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedProductIndex >= 0 && items[selectedProductIndex]) {
                    const productId = items[selectedProductIndex].getAttribute('data-product-id');
                    if (productId) {
                        addProductDirect(productId);
                    }
                } else if (items[0]) {
                    const productId = items[0].getAttribute('data-product-id');
                    if (productId) {
                        addProductDirect(productId);
                    }
                }
                break;
            case 'Escape':
                hideSearchResults();
                break;
        }
    }
    
    function updateSelectedItem(items) {
        items.forEach((item, index) => {
            if (index === selectedProductIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
            }
        });
    }
    
    function searchProductsInTable(term) {
        const resultsContainer = document.getElementById('product-search-results');
        
        if (!resultsContainer) return;
        
        clearTimeout(searchTimeout);
        
        if (!term || term.length < 1) {
            hideSearchResults();
            return;
        }
        
        // بحث فوري بدون تأخير بحرف واحد
        const products = loadProducts();
        
        const filtered = products.filter(p => 
            (p.name && p.name.toLowerCase().includes(term.toLowerCase())) ||
            (p.barcode && p.barcode.includes(term))
        ).slice(0, 5);
        
        showSearchResults(filtered, term);
    }
    
    function showSearchResults(results, searchTerm) {
        const resultsContainer = document.getElementById('product-search-results');
        
        if (!resultsContainer) return;
        
        selectedProductIndex = -1;
        
        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="search-result-item">
                    <span class="text-muted">لا توجد نتائج</span>
                    <span class="badge bg-warning" onclick="salesModule.showAddProductModal('${searchTerm}')">إضافة جديد</span>
                </div>
            `;
        } else {
            let html = '';
            results.forEach(product => {
                const stockClass = product.quantity > 0 ? 'text-success' : 'text-danger';
                
                html += `
                    <div class="search-result-item" data-product-id="${product.id}" onclick="salesModule.addProductDirect('${product.id}')">
                        <div style="flex: 1;">
                            <strong>${product.name}</strong>
                            <br>
                            <small class="text-muted">${formatCurrency(product.sellPrice || 0)} دج</small>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="${stockClass}">${product.quantity || 0}</span>
                            <i class="material-icons-round" style="font-size: 1.2rem;">add_shopping_cart</i>
                        </div>
                    </div>
                `;
            });
            resultsContainer.innerHTML = html;
        }
        
        resultsContainer.style.display = 'block';
        
        // Adjust position
        const searchInput = document.getElementById('product-search-input');
        if (searchInput) {
            const rect = searchInput.getBoundingClientRect();
            resultsContainer.style.width = rect.width + 'px';
            resultsContainer.style.top = (rect.bottom + window.scrollY) + 'px';
            resultsContainer.style.left = rect.left + 'px';
        }
    }
    
    function hideSearchResults() {
        const resultsContainer = document.getElementById('product-search-results');
        if (resultsContainer) {
            resultsContainer.style.display = 'none';
        }
        selectedProductIndex = -1;
    }
    
    // دالة إضافة المنتج مباشرة من البحث
    function addProductDirect(productId) {
        const products = loadProducts();
        const product = products.find(p => p.id == productId);
        
        if (!product) {
            console.error('المنتج غير موجود');
            return;
        }
        
        addProductToCart(product);
        hideSearchResults();
        
        // Clear search input
        const searchInput = document.getElementById('product-search-input');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Focus back on search input for next product
        setTimeout(() => {
            if (searchInput) searchInput.focus();
        }, 100);
    }
    
    function addProductFromSearch(element) {
        let product;
        if (typeof element === 'string') {
            try {
                product = JSON.parse(element);
            } catch (e) {
                console.error('خطأ في تحليل بيانات المنتج', e);
                return;
            }
        } else if (element && element.tagName) {
            const productStr = element.getAttribute('data-product');
            if (productStr) {
                try {
                    product = JSON.parse(productStr);
                } catch (e) {
                    console.error('خطأ في تحليل بيانات المنتج', e);
                    return;
                }
            }
        }
        
        if (!product) {
            console.error('المنتج غير موجود');
            return;
        }
        
        addProductToCart(product);
        hideSearchResults();
        
        const searchInput = document.getElementById('product-search-input');
        if (searchInput) searchInput.value = '';
        setTimeout(() => {
            if (searchInput) searchInput.focus();
        }, 100);
    }
    
    function addProductToCart(product) {
        if (!product) return false;
        
        const sellPrice = parseNumber(product.sellPrice || product.price || 0);
        const stock = parseNumber(product.quantity || product.stock || 0);
        
        if (stock <= 0) {
            showNotification('تنبيه', 'المنتج غير متوفر في المخزون', 'warning');
            return false;
        }
        
        // التحقق من وجود المنتج في السلة
        const existingItem = currentCart.find(item => item.productId === product.id);
        
        if (existingItem) {
            // زيادة الكمية إذا كان المنتج موجوداً
            existingItem.qty += 1;
            existingItem.total = existingItem.qty * existingItem.price * (1 - existingItem.discount / 100);
            showNotification('نجاح', `تم زيادة كمية ${product.name}`);
        } else {
            // إضافة منتج جديد
            const newItem = {
                id: Date.now() + Math.random(),
                productId: product.id,
                name: product.name,
                qty: 1,
                unit: product.unit || 'piece',
                piecesPerUnit: product.piecesPerUnit || 1,
                basePrice: sellPrice,
                price: sellPrice,
                discount: 0,
                total: sellPrice,
                stock: stock,
                unitOptions: product.unitOptions || []
            };
            
            currentCart.push(newItem);
            showNotification('نجاح', `تم إضافة ${product.name}`);
        }
        
        saveCurrentCart();
        renderCart();
        renderActiveCustomers();
        updateRemainingAmount();
        
        setTimeout(setupTableNavigation, 100);
        
        return true;
    }
    
    function showAddProductModal(productName) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'إضافة منتج جديد',
                html: `
                    <div style="text-align:right">
                        <input type="text" id="new-product-name" class="swal2-input" placeholder="اسم المنتج" value="${productName}">
                        <input type="number" id="new-product-price" class="swal2-input" placeholder="سعر البيع" step="0.01">
                        <input type="number" id="new-product-cost" class="swal2-input" placeholder="سعر الشراء" step="0.01">
                        <input type="number" id="new-product-quantity" class="swal2-input" placeholder="الكمية" value="1">
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'حفظ',
                cancelButtonText: 'إلغاء',
                preConfirm: () => {
                    const name = document.getElementById('new-product-name').value;
                    const price = parseNumber(document.getElementById('new-product-price').value);
                    const cost = parseNumber(document.getElementById('new-product-cost').value);
                    const quantity = parseNumber(document.getElementById('new-product-quantity').value);
                    
                    if (!name) {
                        Swal.showValidationMessage('اسم المنتج مطلوب');
                        return false;
                    }
                    if (!price || price <= 0) {
                        Swal.showValidationMessage('سعر البيع مطلوب');
                        return false;
                    }
                    
                    return { name, price, cost, quantity };
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    const newProduct = {
                        id: Date.now().toString(),
                        name: result.value.name,
                        sellPrice: result.value.price,
                        buyPrice: result.value.cost || 0,
                        quantity: result.value.quantity || 0,
                        unit: 'piece',
                        piecesPerUnit: 1,
                        createdAt: new Date().toISOString()
                    };
                    
                    const products = JSON.parse(localStorage.getItem('products') || '[]');
                    products.push(newProduct);
                    localStorage.setItem('products', JSON.stringify(products));
                    
                    if (window.productModule?.loadProducts) {
                        window.productModule.loadProducts();
                    }
                    
                    addProductToCart(newProduct);
                    showNotification('نجاح', 'تم إضافة المنتج');
                }
            });
        }
    }

    // =======================================================================
    // الجزء 8: إضافة منتج إلى السلة (الطريقة التقليدية)
    // =======================================================================
    
    function addToCart() {
        const searchInput = document.getElementById('sale-search');
        const productName = searchInput?.value.trim();
        
        if (!productName) {
            showNotification('تنبيه', 'الرجاء اختيار منتج', 'warning');
            return false;
        }
        
        let products = loadProducts();
        
        const product = products.find(p => 
            p.name === productName || 
            p.barcode === productName ||
            (p.name && p.name.toLowerCase() === productName.toLowerCase())
        );
        
        if (!product) {
            showNotification('تنبيه', 'المنتج غير موجود', 'warning');
            return false;
        }
        
        return addProductToCart(product);
    }
    
    function updateItemQuantity(itemId, newQty) {
        const item = currentCart.find(i => i.id === itemId);
        if (!item) return;
        
        newQty = parseNumber(newQty);
        if (newQty <= 0) {
            removeFromCart(itemId);
            return;
        }
        
        if (newQty > item.stock) {
            showNotification('تنبيه', `الكمية المطلوبة أكبر من المخزون (${item.stock})`, 'warning');
            newQty = item.stock;
        }
        
        item.qty = newQty;
        item.total = item.qty * item.price * (1 - item.discount / 100);
        
        saveCurrentCart();
        renderCart();
        updateRemainingAmount();
    }
    
    function updateItemPieces(itemId, newPieces) {
        const item = currentCart.find(i => i.id === itemId);
        if (!item) return;
        
        newPieces = parseNumber(newPieces);
        if (newPieces <= 0) {
            removeFromCart(itemId);
            return;
        }
        
        if (item.piecesPerUnit && item.piecesPerUnit > 0) {
            item.qty = newPieces / item.piecesPerUnit;
        } else {
            item.qty = newPieces;
        }
        
        if (item.qty < 0.1) item.qty = 0.1;
        
        if (item.qty > item.stock) {
            showNotification('تنبيه', `الكمية المطلوبة أكبر من المخزون (${item.stock})`, 'warning');
            item.qty = item.stock;
        }
        
        item.total = item.qty * item.price * (1 - item.discount / 100);
        
        saveCurrentCart();
        renderCart();
        updateRemainingAmount();
    }
    
    function updateItemPrice(itemId, newPrice) {
        const item = currentCart.find(i => i.id === itemId);
        if (!item) return;
        
        newPrice = parseNumber(newPrice);
        if (newPrice < 0) newPrice = 0;
        
        item.price = newPrice;
        item.total = item.qty * item.price * (1 - item.discount / 100);
        
        saveCurrentCart();
        renderCart();
        updateRemainingAmount();
    }
    
    function updateItemDiscount(itemId, newDiscount) {
        const item = currentCart.find(i => i.id === itemId);
        if (!item) return;
        
        newDiscount = parseNumber(newDiscount);
        if (newDiscount > 100) newDiscount = 100;
        if (newDiscount < 0) newDiscount = 0;
        
        item.discount = newDiscount;
        item.total = item.qty * item.price * (1 - item.discount / 100);
        
        // تحديث حقل المجموع في الجدول مباشرة
        const totalField = document.getElementById(`total-${item.id}`);
        if (totalField) {
            totalField.value = formatCurrency(item.total);
        }
        
        saveCurrentCart();
        updateTotals();
        updateRemainingAmount();
    }
    
    function updateItemUnit(itemId, newUnit) {
        const item = currentCart.find(i => i.id === itemId);
        if (!item) return;
        
        const oldUnit = item.unit;
        const oldPiecesPerUnit = item.piecesPerUnit || 1;
        item.unit = newUnit;
        
        if (newUnit === 'piece') {
            item.piecesPerUnit = 1;
        } else if (newUnit === 'kg') {
            item.piecesPerUnit = 1000;
        } else if (newUnit === 'box') {
            item.piecesPerUnit = 24;
        } else if (newUnit === 'pack') {
            item.piecesPerUnit = 12;
        } else if (newUnit === 'liter') {
            item.piecesPerUnit = 1000;
        }
        
        if (oldUnit !== newUnit) {
            const currentPieces = item.qty * oldPiecesPerUnit;
            item.qty = currentPieces / item.piecesPerUnit;
        }
        
        if (item.basePrice && oldUnit !== newUnit) {
            item.price = item.basePrice * item.piecesPerUnit;
        }
        
        item.total = item.qty * item.price * (1 - item.discount / 100);
        
        saveCurrentCart();
        renderCart();
        updateRemainingAmount();
    }
    
    function removeFromCart(itemId) {
        currentCart = currentCart.filter(item => item.id !== itemId);
        saveCurrentCart();
        renderCart();
        renderActiveCustomers();
        updateRemainingAmount();
        showNotification('تم', 'تم حذف المنتج');
    }
    
    function clearCart() {
        if (currentCart.length === 0) return;
        
        showConfirmation('تأكيد', 'هل تريد تفريغ السلة الحالية؟', () => {
            currentCart = [];
            saveCurrentCart();
            renderCart();
            renderActiveCustomers();
            const paidAmount = document.getElementById('paid-amount');
            if (paidAmount) paidAmount.value = '0';
            showNotification('تم', 'تم تفريغ السلة');
            updateRemainingAmount();
        });
    }

    // =======================================================================
    // الجزء 9: عرض السلة مع صف البحث المدمج
    // =======================================================================

    function renderCart() {
        const tbody = document.getElementById('cart-table');
        if (!tbody) return;
        
        // إضافة صف البحث في البداية
        let html = `
            <tr id="product-search-row" class="table-primary">
                <td colspan="10" style="padding: 6px;">
                    <div style="position: relative;">
                        <div class="input-group input-group-sm">
                            <span class="input-group-text bg-light p-0 px-2">
                                <i class="material-icons-round" style="font-size: 1rem;">search</i>
                            </span>
                            <input type="text" 
                                   id="product-search-input" 
                                   class="form-control form-control-sm" 
                                   placeholder="اكتب حرفاً للبحث عن منتج..."
                                   autocomplete="off"
                                   oninput="salesModule.searchProductsInTable(this.value)"
                                   onkeydown="salesModule.handleProductSearchKeydown(event)"
                                   onfocus="if(this.value) salesModule.searchProductsInTable(this.value)">
                        </div>
                        <div id="product-search-results" class="search-results" style="display: none;"></div>
                    </div>
                </td>
            </tr>
        `;
        
        if (currentCart.length === 0) {
            html += '<tr><td colspan="10" class="text-center p-3"><i class="material-icons-round" style="font-size: 2rem; color: #ccc;">shopping_cart</i><br><small class="text-muted">السلة فارغة - اكتب حرفاً للبحث عن منتج</small></td></tr>';
            tbody.innerHTML = html;
            updateTotals();
            updateRemainingAmount();
            return;
        }
        
        // إضافة صفوف المنتجات
        currentCart.forEach((item, index) => {
            let unitText = 'قطعة';
            if (item.unit === 'kg') unitText = 'كيلو';
            else if (item.unit === 'box') unitText = 'علبة';
            else if (item.unit === 'pack') unitText = 'كرتونة';
            else if (item.unit === 'liter') unitText = 'لتر';
            
            const piecesCount = item.piecesPerUnit ? item.qty * item.piecesPerUnit : item.qty;
            
            html += `
                <tr data-item-id="${item.id}">
                    <td>${index + 1}</td>
                    <td class="text-end">${item.name}</td>
                    <td>
                        <input type="number" id="qty-${item.id}" class="form-control text-center" 
                               value="${item.qty.toFixed(2)}" min="0.1" step="any"
                               onchange="salesModule.updateItemQuantity('${item.id}', this.value)"
                               style="width: 60px; padding: 2px 4px; font-size: 0.7rem;">
                    </td>
                    <td>
                        <input type="number" id="pieces-${item.id}" class="form-control text-center" 
                               value="${piecesCount.toFixed(2)}" min="0.1" step="any"
                               onchange="salesModule.updateItemPieces('${item.id}', this.value)"
                               style="width: 60px; padding: 2px 4px; font-size: 0.7rem;">
                    </td>
                    <td>
                        <select id="unit-${item.id}" class="form-select form-select-sm" 
                                onchange="salesModule.updateItemUnit('${item.id}', this.value)"
                                style="width: 70px; padding: 2px 4px; font-size: 0.7rem;">
                            <option value="piece" ${item.unit === 'piece' ? 'selected' : ''}>قطعة</option>
                            <option value="kg" ${item.unit === 'kg' ? 'selected' : ''}>كيلو</option>
                            <option value="box" ${item.unit === 'box' ? 'selected' : ''}>علبة</option>
                            <option value="pack" ${item.unit === 'pack' ? 'selected' : ''}>كرتونة</option>
                            <option value="liter" ${item.unit === 'liter' ? 'selected' : ''}>لتر</option>
                        </select>
                    </td>
                    <td>
                        <input type="number" id="price-${item.id}" class="form-control text-center" 
                               value="${item.price}" min="0" step="any"
                               onchange="salesModule.updateItemPrice('${item.id}', this.value)"
                               style="width: 70px; padding: 2px 4px; font-size: 0.7rem;">
                    </td>
                    <td>
                        <input type="text" id="total-${item.id}" class="form-control text-center fw-bold" 
                               value="${formatCurrency(item.total)}" readonly
                               style="width: 80px; padding: 2px 4px; font-size: 0.7rem; background-color: #f8f9fa; color: #28a745;">
                    </td>
                    <td>
                        <span class="badge bg-info" style="font-size: 0.6rem;">${item.stock}</span>
                    </td>
                    <td>
                        <input type="number" id="discount-${item.id}" class="form-control text-center" 
                               value="${item.discount}" min="0" max="100" step="1"
                               onchange="salesModule.updateItemDiscount('${item.id}', this.value)"
                               style="width: 50px; padding: 2px 4px; font-size: 0.7rem;">
                    </td>
                    <td>
                        <button class="btn btn-sm btn-danger p-0" onclick="salesModule.removeFromCart('${item.id}')" style="width: 24px; height: 24px;">
                            <i class="material-icons-round" style="font-size: 1rem;">delete</i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        updateTotals();
        setupTableNavigation();
    }
    
    function addProductFromSearchInput() {
        const searchInput = document.getElementById('product-search-input');
        if (!searchInput) return;
        
        const searchTerm = searchInput.value.trim();
        if (!searchTerm) {
            showNotification('تنبيه', 'الرجاء إدخال اسم المنتج', 'warning');
            return;
        }
        
        const products = loadProducts();
        const product = products.find(p => 
            p.name === searchTerm || 
            p.barcode === searchTerm ||
            (p.name && p.name.toLowerCase() === searchTerm.toLowerCase())
        );
        
        if (product) {
            addProductToCart(product);
            searchInput.value = '';
            hideSearchResults();
        } else {
            showAddProductModal(searchTerm);
        }
    }

    function setupTableNavigation() {
        setTimeout(() => {
            const inputs = document.querySelectorAll('#cart-table input:not([readonly]), #cart-table select');
            
            inputs.forEach((input, index) => {
                input.removeEventListener('keydown', handleTableKeyDown);
                input.addEventListener('keydown', handleTableKeyDown);
            });
            
            const searchInput = document.getElementById('product-search-input');
            if (searchInput && document.activeElement !== searchInput) {
                setTimeout(() => searchInput.focus(), 200);
            }
        }, 50);
    }

    function handleTableKeyDown(e) {
        const inputs = Array.from(document.querySelectorAll('#cart-table input:not([readonly]), #cart-table select'));
        const currentIndex = inputs.indexOf(e.target);
        
        if (currentIndex === -1) return;
        
        const keyActions = {
            'ArrowDown': () => {
                e.preventDefault();
                const nextRow = findNextRowInput(e.target, 1);
                if (nextRow) nextRow.focus();
            },
            'ArrowUp': () => {
                e.preventDefault();
                const prevRow = findNextRowInput(e.target, -1);
                if (prevRow) prevRow.focus();
            },
            'ArrowRight': () => {
                e.preventDefault();
                const nextInput = inputs[currentIndex + 1];
                if (nextInput && nextInput.closest('tr') === e.target.closest('tr')) {
                    nextInput.focus();
                }
            },
            'ArrowLeft': () => {
                e.preventDefault();
                const prevInput = inputs[currentIndex - 1];
                if (prevInput && prevInput.closest('tr') === e.target.closest('tr')) {
                    prevInput.focus();
                }
            },
            'Tab': (e) => {
                e.preventDefault();
                const nextIndex = e.shiftKey ? currentIndex - 1 : currentIndex + 1;
                if (nextIndex >= 0 && nextIndex < inputs.length) {
                    inputs[nextIndex].focus();
                }
            },
            'Enter': (e) => {
                e.preventDefault();
                if (e.target.id === 'product-search-input') {
                    addProductFromSearchInput();
                } else {
                    const nextInput = inputs[currentIndex + 1];
                    if (nextInput) {
                        nextInput.focus();
                    }
                }
            }
        };
        
        const action = keyActions[e.key];
        if (action) action(e);
    }

    function findNextRowInput(currentInput, direction) {
        const currentRow = currentInput.closest('tr');
        const allRows = Array.from(document.querySelectorAll('#cart-table tr'));
        const currentRowIndex = allRows.indexOf(currentRow);
        const nextRowIndex = currentRowIndex + direction;
        
        if (nextRowIndex >= 0 && nextRowIndex < allRows.length) {
            const nextRow = allRows[nextRowIndex];
            const inputsInRow = Array.from(nextRow.querySelectorAll('input:not([readonly]), select'));
            
            if (inputsInRow.length > 0) {
                const currentColumnIndex = Array.from(currentRow.querySelectorAll('input:not([readonly]), select')).indexOf(currentInput);
                const targetIndex = Math.min(currentColumnIndex, inputsInRow.length - 1);
                return inputsInRow[targetIndex] || inputsInRow[0];
            }
        }
        return null;
    }

    function showUnitOptions(itemId) {
        const item = currentCart.find(i => i.id === itemId);
        if (!item) return;
        
        const currentPieces = item.qty * (item.piecesPerUnit || 1);
        
        Swal.fire({
            title: 'تعديل الوحدة والقطع',
            html: `
                <div style="text-align:right">
                    <label class="form-label">الوحدة</label>
                    <select id="unit-type" class="form-select mb-2">
                        <option value="piece" ${item.unit === 'piece' ? 'selected' : ''}>قطعة</option>
                        <option value="kg" ${item.unit === 'kg' ? 'selected' : ''}>كيلو</option>
                        <option value="box" ${item.unit === 'box' ? 'selected' : ''}>علبة</option>
                        <option value="pack" ${item.unit === 'pack' ? 'selected' : ''}>كرتونة</option>
                        <option value="liter" ${item.unit === 'liter' ? 'selected' : ''}>لتر</option>
                    </select>
                    
                    <label class="form-label">عدد القطع الكلي</label>
                    <input type="number" id="total-pieces-input" class="form-control mb-2" 
                           value="${currentPieces.toFixed(2)}" min="0.1" step="any">
                    
                    <label class="form-label">عدد القطع لكل وحدة</label>
                    <input type="number" id="pieces-per-unit" class="form-control mb-2" 
                           value="${item.piecesPerUnit || 1}" min="1" step="1">
                    
                    <label class="form-label">سعر الوحدة</label>
                    <input type="number" id="unit-price" class="form-control mb-2" 
                           value="${item.price}" min="0" step="any">
                    
                    <label class="form-label">الخصم %</label>
                    <input type="number" id="unit-discount" class="form-control mb-2" 
                           value="${item.discount}" min="0" max="100" step="1">
                    
                    <div class="alert alert-info mt-2">
                        <strong>المجموع المقدر:</strong> 
                        <span id="estimated-total">${formatCurrency(item.total)}</span> دج
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'تحديث',
            cancelButtonText: 'إلغاء',
            didOpen: () => {
                document.getElementById('total-pieces-input').addEventListener('input', updateEstimatedTotal);
                document.getElementById('pieces-per-unit').addEventListener('input', updateEstimatedTotal);
                document.getElementById('unit-price').addEventListener('input', updateEstimatedTotal);
                document.getElementById('unit-discount').addEventListener('input', updateEstimatedTotal);
                
                function updateEstimatedTotal() {
                    const totalPieces = parseNumber(document.getElementById('total-pieces-input').value);
                    const piecesPerUnit = parseNumber(document.getElementById('pieces-per-unit').value) || 1;
                    const unitPrice = parseNumber(document.getElementById('unit-price').value);
                    const discount = parseNumber(document.getElementById('unit-discount').value);
                    
                    const qty = totalPieces / piecesPerUnit;
                    const total = qty * unitPrice * (1 - discount / 100);
                    
                    document.getElementById('estimated-total').textContent = formatCurrency(total);
                }
            },
            preConfirm: () => {
                const newUnit = document.getElementById('unit-type').value;
                const totalPieces = parseNumber(document.getElementById('total-pieces-input').value);
                const piecesPerUnit = parseInt(document.getElementById('pieces-per-unit').value) || 1;
                const unitPrice = parseNumber(document.getElementById('unit-price').value);
                const discount = parseNumber(document.getElementById('unit-discount').value);
                
                if (totalPieces <= 0) {
                    Swal.showValidationMessage('عدد القطع يجب أن يكون أكبر من 0');
                    return false;
                }
                
                const qty = totalPieces / piecesPerUnit;
                
                return { newUnit, piecesPerUnit, qty, unitPrice, discount };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const { newUnit, piecesPerUnit, qty, unitPrice, discount } = result.value;
                
                item.unit = newUnit;
                item.piecesPerUnit = piecesPerUnit;
                item.qty = qty;
                item.price = unitPrice;
                item.discount = discount > 100 ? 100 : discount;
                item.total = item.qty * item.price * (1 - item.discount / 100);
                
                saveCurrentCart();
                renderCart();
                updateRemainingAmount();
                
                showNotification('نجاح', 'تم تحديث معلومات الوحدة');
            }
        });
    }

    function updateTotals() {
        const totalDiscount = currentCart.reduce((sum, item) => {
            return sum + (item.qty * item.price * item.discount / 100);
        }, 0);
        
        const grandTotal = currentCart.reduce((sum, item) => sum + (item.total || 0), 0);
        
        const totalPieces = currentCart.reduce((sum, item) => {
            const piecesPerUnit = item.piecesPerUnit || 1;
            return sum + (item.qty * piecesPerUnit);
        }, 0);
        
        const totalDiscountEl = document.getElementById('total-discount');
        const grandTotalEl = document.getElementById('grand-total');
        const finalGrandTotalEl = document.getElementById('final-grand-total');
        const totalPiecesEl = document.getElementById('total-pieces');
        
        if (totalDiscountEl) totalDiscountEl.textContent = formatCurrency(totalDiscount);
        if (grandTotalEl) grandTotalEl.textContent = formatCurrency(grandTotal);
        if (finalGrandTotalEl) finalGrandTotalEl.textContent = formatCurrency(grandTotal);
        if (totalPiecesEl) totalPiecesEl.textContent = totalPieces;
        
        updateRemainingAmount();
    }

    function updateRemainingAmount() {
        const paidAmountEl = document.getElementById('paid-amount');
        const remainingEl = document.getElementById('remaining-amount');
        
        if (!paidAmountEl || !remainingEl) return;
        
        const paidAmount = parseNumber(paidAmountEl.value);
        const grandTotal = currentCart.reduce((sum, item) => sum + (item.total || 0), 0);
        
        const remaining = paidAmount - grandTotal;
        
        if (remaining < 0) {
            remainingEl.textContent = formatCurrency(Math.abs(remaining)) + ' دين';
            remainingEl.style.color = 'red';
        } else {
            remainingEl.textContent = formatCurrency(remaining) + ' باقي';
            remainingEl.style.color = 'green';
        }
    }

    // =======================================================================
    // الجزء 10: البحث عن المنتجات (للتوافق)
    // =======================================================================
    
    function searchProducts(term) {
        // تم إلغاء هذه الوظيفة - يتم البحث داخل الجدول فقط
        return;
    }
    
    function selectProduct(name) {
        // تم إلغاء هذه الوظيفة
        return;
    }
    
    function openAddCustomerModal() {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'إضافة عميل جديد',
                html: `
                    <div style="text-align:right">
                        <input type="text" id="new-customer-name" class="swal2-input" placeholder="اسم العميل">
                        <input type="text" id="new-customer-phone" class="swal2-input" placeholder="رقم الهاتف">
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'حفظ',
                cancelButtonText: 'إلغاء',
                preConfirm: () => {
                    const name = document.getElementById('new-customer-name').value;
                    const phone = document.getElementById('new-customer-phone').value;
                    
                    if (!name) {
                        Swal.showValidationMessage('اسم العميل مطلوب');
                        return false;
                    }
                    
                    return { name, phone };
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    const newCustomer = {
                        id: Date.now().toString(),
                        name: result.value.name,
                        phone: result.value.phone,
                        fullname: result.value.name
                    };
                    
                    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
                    customers.push(newCustomer);
                    localStorage.setItem('customers', JSON.stringify(customers));
                    
                    if (window.customerModule?.loadCustomers) {
                        window.customerModule.loadCustomers();
                    }
                    
                    loadCustomersDropdown();
                    addActiveCustomer(newCustomer);
                    showNotification('نجاح', 'تم إضافة العميل');
                }
            });
        }
    }
    
    function loadCustomersDropdown() {
        const customers = getAllCustomers();
        
        const select = document.getElementById('sale-customer');
        if (select) {
            select.innerHTML = '<option value="">اختر العميل (اختياري)</option>' + 
                customers.map(c => {
                    const customerName = c.fullname || c.name || 'بدون اسم';
                    const customerPhone = c.phone1 || c.phone || '';
                    return `<option value="${c.id}">${customerName} ${customerPhone ? '- ' + customerPhone : ''}</option>`;
                }).join('');
            
            if (currentCustomerId) {
                select.value = currentCustomerId;
            }
        }
    }

    // =======================================================================
    // الجزء 11: إنهاء البيع وإنشاء الفاتورة
    // =======================================================================
    
    function finishSale() {
        if (currentCart.length === 0) {
            showNotification('تنبيه', 'السلة فارغة', 'warning');
            return null;
        }
        
        const paidAmount = parseNumber(document.getElementById('paid-amount')?.value);
        const grandTotal = currentCart.reduce((sum, item) => sum + item.total, 0);
        
        let customerName = 'زبون نقدي';
        let customerId = null;
        
        if (currentCustomerId) {
            const customers = getAllCustomers();
            const customer = customers.find(c => c.id === currentCustomerId);
            if (customer) {
                customerName = customer.fullname || customer.name || 'زبون نقدي';
                customerId = currentCustomerId;
            }
        }
        
        const paymentMethod = document.getElementById('sale-payment-method')?.value || 'cash';
        let paymentText = 'نقدي';
        if (paymentMethod === 'card') paymentText = 'بطاقة';
        if (paymentMethod === 'credit') paymentText = 'آجل';
        
        const totalDiscount = currentCart.reduce((sum, item) => {
            return sum + (item.qty * item.price * item.discount / 100);
        }, 0);
        
        const remaining = paidAmount - grandTotal;
        const debt = remaining < 0 ? Math.abs(remaining) : 0;
        
        const invoice = {
            id: Date.now(),
            number: generateInvoiceNumber(),
            date: new Date().toISOString(),
            customerId: customerId,
            customer: customerName,
            items: [...currentCart],
            subtotal: grandTotal + totalDiscount,
            totalDiscount: totalDiscount,
            grandTotal: grandTotal,
            paidAmount: paidAmount,
            remaining: remaining,
            debt: debt,
            paymentMethod: paymentMethod,
            paymentText: paymentText,
            status: debt > 0 ? 'debt' : 'completed',
            createdBy: 'admin',
            notes: debt > 0 ? `عليه دين قدره ${formatCurrency(debt)} دج` : ''
        };
        
        invoices.push(invoice);
        saveInvoices();
        
        currentCart.forEach(item => {
            if (window.inventoryModule?.removeStock) {
                window.inventoryModule.removeStock(item.productId, item.qty, `فاتورة مبيعات رقم ${invoice.number}`);
            }
        });
        
        if (customerId && debt > 0) {
            if (window.customerModule?.addDebt) {
                window.customerModule.addDebt(customerId, debt);
            }
            
            if (window.customerModule?.updateCustomerStats) {
                window.customerModule.updateCustomerStats(customerId, grandTotal);
            }
        }
        
        const cartKey = currentCustomerId || 'cash_customer';
        customerCarts[cartKey] = [];
        currentCart = [];
        saveCustomerCarts();
        
        renderCart();
        renderActiveCustomers();
        
        const paidAmountInput = document.getElementById('paid-amount');
        if (paidAmountInput) paidAmountInput.value = '0';
        
        if (debt > 0) {
            showNotification('تنبيه', `تمت العملية مع دين: ${formatCurrency(debt)} دج`, 'warning');
        } else if (remaining > 0) {
            showNotification('نجاح', `تمت العملية - الباقي: ${formatCurrency(remaining)} دج`);
        } else {
            showNotification('نجاح', 'تم حفظ الفاتورة');
        }
        
        renderInvoices();
        return invoice;
    }
    
    function finishSaleAndPrint() {
        const invoice = finishSale();
        if (invoice) {
            preparePrint(invoice);
        }
    }
    
    function preparePrint(invoice) {
        const printWindow = window.open('', '_blank');
        
        let itemsHtml = '';
        invoice.items.forEach((item, i) => {
            itemsHtml += `
                <tr>
                    <td>${i + 1}</td>
                    <td>${item.name}</td>
                    <td>${item.qty.toFixed(2)}</td>
                    <td>${formatCurrency(item.price)}</td>
                    <td>${item.discount}%</td>
                    <td>${formatCurrency(item.total)}</td>
                </tr>
            `;
        });
        
        const debtInfo = invoice.debt > 0 ? 
            `<p style="color: red; font-weight: bold;">دين: ${formatCurrency(invoice.debt)} دج</p>` : '';
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <title>فاتورة ${invoice.number}</title>
                <style>
                    body { font-family: Arial; padding: 15px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    h1 { color: #333; font-size: 1.5rem; }
                    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                    th { background: #f5f5f5; padding: 6px; border: 1px solid #ddd; }
                    td { padding: 4px; border: 1px solid #ddd; text-align: center; }
                    .total { font-size: 1rem; font-weight: bold; text-align: left; }
                    .debt { color: red; font-weight: bold; }
                    .footer { text-align: center; margin-top: 30px; color: #999; font-size: 0.8rem; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>سوبر - النظام المتكامل</h1>
                    <h3>فاتورة بيع</h3>
                    <p>رقم: ${invoice.number}</p>
                    <p>التاريخ: ${new Date(invoice.date).toLocaleString('ar-EG')}</p>
                    <p>العميل: ${invoice.customer}</p>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>المنتج</th>
                            <th>الكمية</th>
                            <th>السعر</th>
                            <th>الخصم</th>
                            <th>الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
                
                <div class="total">
                    <p>الإجمالي: ${formatCurrency(invoice.grandTotal)} دج</p>
                    <p>المدفوع: ${formatCurrency(invoice.paidAmount)} دج</p>
                    <p>الباقي: ${formatCurrency(Math.abs(invoice.remaining))} دج</p>
                    ${debtInfo}
                </div>
                
                <div class="footer">
                    <p>شكراً لتسوقكم معنا</p>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
    }

    // =======================================================================
    // الجزء 12: إدارة الفواتير
    // =======================================================================
    
    function getInvoices() {
        return [...invoices].sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    function renderInvoices() {
        const tbody = document.getElementById('sale-invoices-tbody');
        if (!tbody) return;
        
        const sortedInvoices = getInvoices();
        
        if (sortedInvoices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center p-3"><i class="material-icons-round" style="font-size: 2rem; color: #ccc;">receipt</i><br><small class="text-muted">لا توجد فواتير</small></td></tr>';
            return;
        }
        
        tbody.innerHTML = sortedInvoices.map(inv => {
            const debtClass = inv.debt > 0 ? 'text-danger fw-bold' : '';
            const date = new Date(inv.date).toLocaleDateString('ar-EG');
            
            return `
                <tr>
                    <td>${inv.number}</td>
                    <td>${date}</td>
                    <td>${inv.customer}</td>
                    <td>${formatCurrency(inv.grandTotal)}</td>
                    <td>${formatCurrency(inv.paidAmount)}</td>
                    <td class="${debtClass}">${inv.debt > 0 ? formatCurrency(inv.debt) : '0.00'}</td>
                    <td>${inv.paymentText}</td>
                    <td>
                        <button class="btn btn-sm btn-info p-0" onclick="salesModule.showInvoice('${inv.id}')" style="width: 24px; height: 24px;">
                            <i class="material-icons-round" style="font-size: 1rem;">visibility</i>
                        </button>
                        <button class="btn btn-sm btn-danger p-0" onclick="salesModule.deleteInvoice('${inv.id}')" style="width: 24px; height: 24px;">
                            <i class="material-icons-round" style="font-size: 1rem;">delete</i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    function showInvoice(id) {
        const invoice = invoices.find(inv => inv.id == id);
        if (!invoice) return;
        
        let itemsHtml = '';
        invoice.items.forEach((item, i) => {
            itemsHtml += `
                <tr>
                    <td style="padding:4px; border:1px solid #ddd;">${i + 1}</td>
                    <td style="padding:4px; border:1px solid #ddd;">${item.name}</td>
                    <td style="padding:4px; border:1px solid #ddd;">${item.qty.toFixed(2)}</td>
                    <td style="padding:4px; border:1px solid #ddd;">${formatCurrency(item.price)}</td>
                    <td style="padding:4px; border:1px solid #ddd;">${item.discount}%</td>
                    <td style="padding:4px; border:1px solid #ddd;">${formatCurrency(item.total)}</td>
                </tr>
            `;
        });
        
        Swal.fire({
            title: `فاتورة ${invoice.number}`,
            html: `
                <div style="text-align:right; max-height:350px; overflow-y:auto; font-size:0.9rem;">
                    <p><strong>التاريخ:</strong> ${new Date(invoice.date).toLocaleString('ar-EG')}</p>
                    <p><strong>العميل:</strong> ${invoice.customer}</p>
                    <p><strong>طريقة الدفع:</strong> ${invoice.paymentText}</p>
                    <hr>
                    <table style="width:100%; border-collapse:collapse; font-size:0.8rem;">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>المنتج</th>
                                <th>الكمية</th>
                                <th>السعر</th>
                                <th>الخصم</th>
                                <th>الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>
                    <hr>
                    <p><strong>إجمالي الخصم:</strong> ${formatCurrency(invoice.totalDiscount)} دج</p>
                    <p><strong>الإجمالي:</strong> ${formatCurrency(invoice.grandTotal)} دج</p>
                    <p><strong>المدفوع:</strong> ${formatCurrency(invoice.paidAmount)} دج</p>
                    <p><strong>الدين:</strong> <span style="color: ${invoice.debt > 0 ? 'red' : 'green'};">${formatCurrency(invoice.debt || 0)} دج</span></p>
                </div>
            `,
            width: '800px'
        });
    }
    
    function deleteInvoice(id) {
        const invoice = invoices.find(inv => inv.id == id);
        if (!invoice) return;
        
        showConfirmation('تأكيد الحذف', `حذف الفاتورة ${invoice.number}؟`, () => {
            invoices = invoices.filter(inv => inv.id != id);
            saveInvoices();
            renderInvoices();
            showNotification('تم', 'تم حذف الفاتورة');
        });
    }
    
    function searchInvoices() {
        const term = document.getElementById('invoice-search')?.value.toLowerCase() || '';
        const tbody = document.getElementById('sale-invoices-tbody');
        if (!tbody) return;
        
        if (!term) {
            renderInvoices();
            return;
        }
        
        const filtered = invoices.filter(inv => 
            inv.number.toLowerCase().includes(term) ||
            inv.customer.toLowerCase().includes(term)
        );
        
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center p-3">لا توجد نتائج</td></tr>';
            return;
        }
        
        tbody.innerHTML = filtered.map(inv => {
            const debtClass = inv.debt > 0 ? 'text-danger fw-bold' : '';
            const date = new Date(inv.date).toLocaleDateString('ar-EG');
            
            return `
                <tr>
                    <td>${inv.number}</td>
                    <td>${date}</td>
                    <td>${inv.customer}</td>
                    <td>${formatCurrency(inv.grandTotal)}</td>
                    <td>${formatCurrency(inv.paidAmount)}</td>
                    <td class="${debtClass}">${inv.debt > 0 ? formatCurrency(inv.debt) : '0.00'}</td>
                    <td>${inv.paymentText}</td>
                    <td>
                        <button class="btn btn-sm btn-info p-0" onclick="salesModule.showInvoice('${inv.id}')" style="width: 24px; height: 24px;">
                            <i class="material-icons-round" style="font-size: 1rem;">visibility</i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    function getSalesStats() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const todayInvoices = invoices.filter(inv => new Date(inv.date) >= today);
        const monthInvoices = invoices.filter(inv => new Date(inv.date) >= thisMonth);
        
        const totalDebt = invoices.reduce((sum, inv) => sum + (inv.debt || 0), 0);
        
        return {
            total: {
                count: invoices.length,
                amount: invoices.reduce((sum, inv) => sum + inv.grandTotal, 0),
                debt: totalDebt
            },
            today: {
                count: todayInvoices.length,
                amount: todayInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0),
                debt: todayInvoices.reduce((sum, inv) => sum + (inv.debt || 0), 0)
            },
            thisMonth: {
                count: monthInvoices.length,
                amount: monthInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0),
                debt: monthInvoices.reduce((sum, inv) => sum + (inv.debt || 0), 0)
            }
        };
    }

    // =======================================================================
    // الجزء 13: تهيئة الوحدة
    // =======================================================================
    
    function init() {
        console.log('✅ salesModule v7.5 initialized - بحث فوري بحرف واحد');
        
        if (currentCustomerId) {
            currentCart = customerCarts[currentCustomerId] || [];
        } else {
            currentCart = customerCarts['cash_customer'] || [];
        }
        
        renderCart();
        loadCustomersDropdown();
        renderInvoices();
        
        if (activeCustomers.length > 0) {
            const activeCustomer = activeCustomers.find(c => c.active) || activeCustomers[0];
            if (activeCustomer) {
                activeCustomer.active = true;
                currentCustomerId = activeCustomer.id;
                
                const allCustomers = getAllCustomers();
                const fullCustomer = allCustomers.find(c => c.id === activeCustomer.id) || activeCustomer;
                showSelectedCustomerBadge(fullCustomer);
                
                const searchInput = document.getElementById('customer-search');
                if (searchInput) {
                    searchInput.value = fullCustomer.name || activeCustomer.name;
                }
            }
            renderActiveCustomers();
        }
        
        document.addEventListener('click', (e) => {
            const customerResults = document.getElementById('customer-results');
            const customerSearch = document.getElementById('customer-search');
            if (customerResults && !customerResults.contains(e.target) && e.target !== customerSearch) {
                customerResults.style.display = 'none';
            }
            
            const productResults = document.getElementById('product-search-results');
            const productSearch = document.getElementById('product-search-input');
            if (productResults && !productResults.contains(e.target) && e.target !== productSearch) {
                productResults.style.display = 'none';
            }
        });
        
        setupTableNavigation();
    }

    // =======================================================================
    // الجزء 14: الكشف عن الدوال العامة
    // =======================================================================
    
    return {
        cart: currentCart,
        invoices: invoices,
        activeCustomers: activeCustomers,
        currentCustomerId: currentCustomerId,
        
        addToCart: addToCart,
        removeFromCart: removeFromCart,
        clearCart: clearCart,
        finishSale: finishSale,
        finishSaleAndPrint: finishSaleAndPrint,
        searchProducts: searchProducts,
        selectProduct: selectProduct,
        updateRemainingAmount: updateRemainingAmount,
        
        // دوال البحث الفوري
        searchCustomersInstant: searchCustomersInstant,
        searchCustomers: searchCustomersInstant,
        addCustomerDirect: addCustomerDirect,
        
        searchProductsInTable: searchProductsInTable,
        handleProductSearchKeydown: handleProductSearchKeydown,
        addProductFromSearch: addProductFromSearch,
        addProductFromSearchInput: addProductFromSearchInput,
        addProductDirect: addProductDirect,
        showAddProductModal: showAddProductModal,
        
        updateItemQuantity: updateItemQuantity,
        updateItemPieces: updateItemPieces,
        updateItemPrice: updateItemPrice,
        updateItemDiscount: updateItemDiscount,
        updateItemUnit: updateItemUnit,
        showUnitOptions: showUnitOptions,
        
        selectCustomerFromDropdown: selectCustomerFromDropdown,
        clearSelectedCustomer: clearSelectedCustomer,
        openAddCustomerModal: openAddCustomerModal,
        loadCustomers: loadCustomersDropdown,
        
        addActiveCustomer: addActiveCustomer,
        switchActiveCustomer: switchActiveCustomer,
        removeActiveCustomer: removeActiveCustomer,
        clearAllActiveCustomers: clearAllActiveCustomers,
        renderActiveCustomers: renderActiveCustomers,
        
        getInvoices: getInvoices,
        renderInvoices: renderInvoices,
        showInvoice: showInvoice,
        deleteInvoice: deleteInvoice,
        searchInvoices: searchInvoices,
        getSalesStats: getSalesStats,
        
        init: init,
        setupTableNavigation: setupTableNavigation,
        
        // دوال مساعدة
        formatCurrency: formatCurrency,
        parseNumber: parseNumber,
        showNotification: showNotification,
        addProductToCart: addProductToCart
    };
})();

// =======================================================================
// الجزء 15: ربط الوحدة بالنافذة العامة
// =======================================================================
window.salesModule = salesModule;

// دوال مختصرة للاستخدام المباشر من HTML
window.addToCart = () => salesModule.addToCart();
window.clearCart = () => salesModule.clearCart();
window.finishSale = () => salesModule.finishSale();
window.finishSaleAndPrint = () => salesModule.finishSaleAndPrint();
window.searchInvoices = () => salesModule.searchInvoices();
window.searchCustomers = (q) => salesModule.searchCustomersInstant(q);
window.updateRemainingAmount = () => salesModule.updateRemainingAmount();
window.searchProductsInTable = (term) => salesModule.searchProductsInTable(term);
window.handleProductSearchKeydown = (e) => salesModule.handleProductSearchKeydown(e);
window.addProductFromSearch = (element) => salesModule.addProductFromSearch(element);
window.addProductFromSearchInput = () => salesModule.addProductFromSearchInput();
window.addCustomerDirect = (id) => salesModule.addCustomerDirect(id);
window.addProductDirect = (id) => salesModule.addProductDirect(id);

// =======================================================================
// الجزء 16: إضافة CSS للبحث الفوري
// =======================================================================
if (typeof document !== 'undefined') {
    if (!document.getElementById('sales-module-styles')) {
        const style = document.createElement('style');
        style.id = 'sales-module-styles';
        style.textContent = `
            .search-results {
                position: absolute;
                background: white;
                border: 1px solid #ddd;
                border-radius: 6px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                max-height: 250px;
                overflow-y: auto;
                z-index: 1000;
                font-size: 0.8rem;
            }
            
            .search-item, .search-result-item {
                cursor: pointer;
                padding: 8px 12px;
                border-bottom: 1px solid #f0f0f0;
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: all 0.2s;
            }
            
            .search-item:hover, .search-result-item:hover {
                background-color: #007bff;
                color: white;
            }
            
            .search-item:hover .badge, .search-result-item:hover .badge {
                background-color: white !important;
                color: #007bff !important;
            }
            
            .search-item:last-child, .search-result-item:last-child {
                border-bottom: none;
            }
            
            #product-search-row td {
                padding: 6px;
                background: linear-gradient(145deg, #f0f7ff, #e6f0fa);
            }
            
            #product-search-input:focus {
                border-color: #007bff;
                box-shadow: 0 0 0 2px rgba(0,123,255,.1);
            }
            
            .customer-chip {
                transition: all 0.2s;
            }
            
            .customer-chip:hover {
                transform: translateY(-1px);
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
        `;
        document.head.appendChild(style);
    }
}

// =======================================================================
// الجزء 17: تفعيل التهيئة
// =======================================================================
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => salesModule.init());
    document.addEventListener('html-loaded', () => salesModule.init());
}

// =======================================================================
// نهاية الملف
// =======================================================================
