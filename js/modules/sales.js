// =======================================================================
// ملف: sales.js - نظام إدارة المبيعات المتقدم مع دعم الديون والوحدات
// الإصدار: 6.1 - محسن مع إصلاح المشاكل ودعم كامل للوحدات
// =======================================================================

// =======================================================================
// الجزء 1: تعريف الوحدة الرئيسية وهيكل البيانات الأساسي
// =======================================================================
const salesModule = (function() {
    
    // =======================================================================
    // الجزء 2: تهيئة البيانات واسترجاعها من التخزين المحلي
    // =======================================================================
    let customerCarts = JSON.parse(localStorage.getItem('customer_carts')) || {};  // سلات جميع العملاء
    let currentCart = [];                           // السلة الحالية المعروضة
    let invoices = JSON.parse(localStorage.getItem('sales_invoices')) || [];     // جميع فواتير المبيعات
    let activeCustomers = JSON.parse(localStorage.getItem('activeCustomers')) || []; // العملاء النشطين حالياً
    let currentCustomerId = localStorage.getItem('currentCustomerId') || null;    // معرف العميل الحالي

    // =======================================================================
    // الجزء 3: الدوال المساعدة الأساسية (تنسيق العملات، إنشاء الأرقام، الإشعارات)
    // =======================================================================
    
    // دالة تنسيق العملة: تحويل الرقم إلى صيغة دينار جزائري مع فواصل الآلاف
    function formatCurrency(amount) {
        if (amount === undefined || amount === null) amount = 0;
        return Number(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }
    
    // دالة إنشاء رقم فاتورة فريد: SALE-YYMMDD-RRR (مثال: SALE-240215-123)
    function generateInvoiceNumber() {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `SALE-${year}${month}${day}-${random}`;
    }
    
    // دالة عرض الإشعارات باستخدام SweetAlert
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
            console.log(`[${type}] ${title}: ${message}`);
        }
    }
    
    // دالة عرض نافذة تأكيد قبل تنفيذ عملية مهمة
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
    
    // دوال حفظ البيانات في التخزين المحلي
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
    
    // تحميل سلة عميل معين
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
    
    // حفظ السلة الحالية
    function saveCurrentCart() {
        const cartKey = currentCustomerId || 'cash_customer';
        customerCarts[cartKey] = [...currentCart];
        saveCustomerCarts();
    }
    
    // التبديل بين سلات العملاء
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
    
    // الحصول على اسم العميل بواسطة المعرف
    function getCustomerNameById(customerId) {
        if (!customerId) return 'زبون نقدي';
        const allCustomers = getAllCustomers();
        const customer = allCustomers.find(c => c.id === customerId);
        return customer ? (customer.name || customer.fullname || 'عميل') : 'عميل';
    }
    
    // تحديث عداد السلة
    function updateCartCount() {
        const cartCountEl = document.getElementById('cart-count');
        if (cartCountEl) {
            cartCountEl.textContent = currentCart.length;
        }
    }

    // =======================================================================
    // الجزء 5: إدارة العملاء النشطين (الذي يتم التعامل معهم حالياً)
    // =======================================================================
    
    // إضافة عميل جديد إلى قائمة العملاء النشطين
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
    }
    
    // إخفاء نتائج البحث عن العملاء
    function hideCustomerResults() {
        const resultsDiv = document.getElementById('customer-results');
        if (resultsDiv) resultsDiv.style.display = 'none';
    }
    
    // عرض العملاء النشطين في الواجهة
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
                '<i class="material-icons-round" style="font-size: 16px;">check_circle</i>' : 
                '<i class="material-icons-round" style="font-size: 16px;">radio_button_unchecked</i>';
            
            const cartCount = (customerCarts[customer.id] || []).length;
            const cartBadge = cartCount > 0 ? `<span class="badge bg-warning text-dark ms-1">${cartCount}</span>` : '';
            
            html += `
                <div class="customer-chip p-2 rounded ${activeClass}" 
                     onclick="salesModule.switchActiveCustomer('${customer.id}')"
                     style="cursor: pointer; display: inline-flex; align-items: center; gap: 5px; border: 1px solid #dee2e6; margin: 2px;">
                    ${activeIcon}
                    <span>${customer.name}</span>
                    ${cartBadge}
                    <small class="${customer.active ? 'text-white-50' : 'text-muted'}">${customer.phone}</small>
                    <i class="material-icons-round" style="font-size: 16px; cursor: pointer;" 
                       onclick="event.stopPropagation(); salesModule.removeActiveCustomer('${customer.id}')">close</i>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    // التبديل بين العملاء النشطين
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
    
    // إزالة عميل من قائمة النشطين
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
    
    // مسح جميع العملاء النشطين
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
    
    // إخفاء واجهة العميل المحدد
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
        if (paidAmount) paidAmount.value = '';
    }
    
    // عرض شارة العميل المحدد
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
    
    // إلغاء تحديد العميل الحالي
    function clearSelectedCustomer() {
        if (currentCustomerId) {
            removeActiveCustomer(currentCustomerId);
        } else {
            clearSelectedCustomerUI();
        }
    }
    
    // الحصول على جميع العملاء من الوحدة الرئيسية
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
    // الجزء 6: البحث عن العملاء
    // =======================================================================
    function searchCustomers(query) {
        const resultsDiv = document.getElementById('customer-results');
        if (!resultsDiv) return;
        
        if (!query || query.length < 1) {
            resultsDiv.style.display = 'none';
            return;
        }
        
        const customers = getAllCustomers();
        
        const filtered = customers.filter(c => 
            (c.name && c.name.toLowerCase().includes(query.toLowerCase())) ||
            (c.fullname && c.fullname.toLowerCase().includes(query.toLowerCase())) ||
            (c.phone && c.phone.includes(query)) ||
            (c.phone1 && c.phone1.includes(query))
        ).slice(0, 5);
        
        if (filtered.length === 0) {
            resultsDiv.innerHTML = '<div class="search-item">لا توجد نتائج</div>';
            resultsDiv.style.display = 'block';
            return;
        }
        
        let html = '';
        filtered.forEach(customer => {
            const isActive = activeCustomers.some(ac => ac.id === customer.id);
            const activeIcon = isActive ? '🟢' : '⚪';
            const customerName = customer.name || customer.fullname || 'بدون اسم';
            const customerPhone = customer.phone || customer.phone1 || '';
            const cartCount = (customerCarts[customer.id] || []).length;
            const cartInfo = cartCount > 0 ? ` (${cartCount} منتج)` : '';
            
            // استخدام JSON.stringify بشكل آمن
            const customerStr = JSON.stringify(customer).replace(/'/g, "\\'").replace(/"/g, '&quot;');
            
            html += `
                <div class="search-item" onclick='salesModule.addActiveCustomer(${customerStr})'>
                    <i class="material-icons-round">person</i>
                    <div style="flex:1">
                        <div>${customerName} ${activeIcon} ${cartInfo}</div>
                        <small>${customerPhone || 'لا يوجد هاتف'}</small>
                    </div>
                    ${isActive ? '<span class="badge bg-success">نشط</span>' : ''}
                </div>
            `;
        });
        
        resultsDiv.innerHTML = html;
        resultsDiv.style.display = 'block';
    }
    
    // اختيار عميل من القائمة المنسدلة
    function selectCustomerFromDropdown(customerId) {
        if (!customerId) return;
        
        const customers = getAllCustomers();
        const customer = customers.find(c => c.id === customerId);
        
        if (customer) {
            addActiveCustomer(customer);
        }
    }

    // =======================================================================
    // الجزء 7: إضافة منتج إلى السلة وإدارة عناصر السلة
    // =======================================================================
    
    // إضافة منتج إلى السلة الحالية
    function addToCart() {
        const searchInput = document.getElementById('sale-search');
        const productName = searchInput?.value.trim();
        
        if (!productName) {
            showNotification('تنبيه', 'الرجاء اختيار منتج', 'warning');
            return false;
        }
        
        // البحث عن المنتج
        let products = [];
        if (window.productModule && typeof window.productModule.getAllProducts === 'function') {
            products = window.productModule.getAllProducts() || [];
        } else {
            products = JSON.parse(localStorage.getItem('products') || '[]');
        }
        
        const product = products.find(p => 
            p.name === productName || 
            p.barcode === productName ||
            (p.name && p.name.toLowerCase() === productName.toLowerCase())
        );
        
        if (!product) {
            showNotification('تنبيه', 'المنتج غير موجود', 'warning');
            return false;
        }
        
        // التحقق من المخزون
        if (product.quantity <= 0) {
            showNotification('تنبيه', 'المنتج غير متوفر في المخزون', 'warning');
            return false;
        }
        
        // إضافة المنتج مع معلومات الوحدة
        const newItem = {
            id: Date.now() + Math.random(),
            productId: product.id,
            name: product.name,
            qty: 1,
            unit: product.unit || 'piece', // الوحدة الافتراضية
            piecesPerUnit: product.piecesPerUnit || 1, // عدد القطع لكل وحدة
            basePrice: product.sellPrice || 0, // السعر الأساسي للوحدة
            price: product.sellPrice || 0,
            discount: 0,
            total: product.sellPrice || 0,
            stock: product.quantity || 0,
            unitOptions: product.unitOptions || [] // خيارات الوحدات المتاحة
        };
        
        currentCart.push(newItem);
        
        saveCurrentCart();
        renderCart();
        renderActiveCustomers();
        
        if (searchInput) searchInput.value = '';
        
        // إخفاء نتائج البحث
        const searchBox = document.getElementById('search-box');
        if (searchBox) searchBox.classList.remove('show');
        
        showNotification('نجاح', `تم إضافة المنتج (${newItem.unit === 'piece' ? 'قطعة' : newItem.unit})`);
        updateRemainingAmount();
        return true;
    }
    
    // تحديث كمية المنتج
    function updateItemQuantity(itemId, newQty) {
        const item = currentCart.find(i => i.id === itemId);
        if (!item) return;
        
        newQty = parseFloat(newQty) || 0;
        if (newQty <= 0) {
            removeFromCart(itemId);
            return;
        }
        
        // التحقق من المخزون
        if (newQty > item.stock) {
            showNotification('تنبيه', `الكمية المطلوبة أكبر من المخزون (${item.stock})`, 'warning');
            newQty = item.stock;
            document.getElementById(`qty-${itemId}`).value = newQty;
        }
        
        item.qty = newQty;
        item.total = item.qty * item.price * (1 - item.discount / 100);
        
        saveCurrentCart();
        renderCart();
        updateRemainingAmount();
    }
    
    // تحديث سعر المنتج
    function updateItemPrice(itemId, newPrice) {
        const item = currentCart.find(i => i.id === itemId);
        if (!item) return;
        
        newPrice = parseFloat(newPrice) || 0;
        if (newPrice < 0) newPrice = 0;
        
        item.price = newPrice;
        item.total = item.qty * item.price * (1 - item.discount / 100);
        
        saveCurrentCart();
        renderCart();
        updateRemainingAmount();
    }
    
    // تحديث خصم المنتج
    function updateItemDiscount(itemId, newDiscount) {
        const item = currentCart.find(i => i.id === itemId);
        if (!item) return;
        
        newDiscount = parseFloat(newDiscount) || 0;
        if (newDiscount > 100) newDiscount = 100;
        if (newDiscount < 0) newDiscount = 0;
        
        item.discount = newDiscount;
        item.total = item.qty * item.price * (1 - item.discount / 100);
        
        saveCurrentCart();
        renderCart();
        updateRemainingAmount();
    }
    
    // حذف منتج من السلة
    function removeFromCart(itemId) {
        currentCart = currentCart.filter(item => item.id !== itemId);
        saveCurrentCart();
        renderCart();
        renderActiveCustomers();
        updateRemainingAmount();
        showNotification('تم', 'تم حذف المنتج');
    }
    
    // تفريغ السلة الحالية
    function clearCart() {
        if (currentCart.length === 0) return;
        
        showConfirmation('تأكيد', 'هل تريد تفريغ السلة الحالية؟', () => {
            currentCart = [];
            saveCurrentCart();
            renderCart();
            renderActiveCustomers();
            document.getElementById('paid-amount').value = '';
            showNotification('تم', 'تم تفريغ السلة');
            updateRemainingAmount();
        });
    }

    // =======================================================================
    // الجزء 8: عرض السلة وتحديث الإجماليات مع دعم الوحدات
    // =======================================================================

    // عرض محتويات السلة في الجدول مع معلومات الوحدة
    function renderCart() {
        const tbody = document.getElementById('cart-table');
        if (!tbody) return;
        
        if (currentCart.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="text-center p-4"><i class="material-icons-round" style="font-size:48px;">shopping_cart</i><br>السلة فارغة</td></tr>';
            updateTotals();
            updateRemainingAmount();
            return;
        }
        
        tbody.innerHTML = currentCart.map((item, index) => {
            // تحديد نص الوحدة للعرض
            let unitText = 'قطعة';
            if (item.unit === 'kg') unitText = 'كيلو';
            else if (item.unit === 'box') unitText = 'علبة';
            else if (item.unit === 'pack') unitText = 'كرتونة';
            else if (item.unit === 'liter') unitText = 'لتر';
            
            // حساب عدد القطع
            const piecesCount = item.piecesPerUnit ? item.qty * item.piecesPerUnit : item.qty;
            
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td class="text-end">${item.name}</td>
                    <td>
                        <div class="d-flex align-items-center gap-1 justify-content-center">
                            <input type="number" id="qty-${item.id}" class="form-control text-center" 
                                   value="${item.qty}" min="0.1" step="any"
                                   onchange="salesModule.updateItemQuantity('${item.id}', this.value)"
                                   style="width: 80px;">
                            <button class="btn btn-sm btn-outline-primary" onclick="salesModule.showUnitOptions('${item.id}')" title="تعديل الوحدة">
                                <i class="material-icons-round" style="font-size: 16px;">expand_more</i>
                            </button>
                        </div>
                    </td>
                    <td>
                        <select id="unit-${item.id}" class="form-select form-select-sm" 
                                onchange="salesModule.updateItemUnit('${item.id}', this.value)">
                            <option value="piece" ${item.unit === 'piece' ? 'selected' : ''}>قطعة</option>
                            <option value="kg" ${item.unit === 'kg' ? 'selected' : ''}>كيلو</option>
                            <option value="box" ${item.unit === 'box' ? 'selected' : ''}>علبة</option>
                            <option value="pack" ${item.unit === 'pack' ? 'selected' : ''}>كرتونة</option>
                            <option value="liter" ${item.unit === 'liter' ? 'selected' : ''}>لتر</option>
                        </select>
                    </td>
                    <td>
                        <span class="badge bg-secondary" id="pieces-${item.id}">
                            ${piecesCount} قطعة
                        </span>
                        <small class="d-block text-muted">
                            ${item.piecesPerUnit ? item.piecesPerUnit + ' قطعة/وحدة' : ''}
                        </small>
                    </td>
                    <td>
                        <input type="number" id="price-${item.id}" class="form-control text-center" 
                               value="${item.price}" min="0" step="any"
                               onchange="salesModule.updateItemPrice('${item.id}', this.value)">
                    </td>
                    <td>${formatCurrency(item.total)} دج</td>
                    <td>
                        <input type="number" id="discount-${item.id}" class="form-control text-center" 
                               value="${item.discount}" min="0" max="100" step="1"
                               onchange="salesModule.updateItemDiscount('${item.id}', this.value)">
                    </td>
                    <td>
                        <div class="text-center">
                            <span class="badge bg-info d-block">${item.stock}</span>
                            <small class="text-muted">${unitText}</small>
                        </div>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="salesModule.removeFromCart('${item.id}')">
                            <i class="material-icons-round">delete</i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        updateTotals();
    }

    // تحديث وحدة المنتج
    function updateItemUnit(itemId, newUnit) {
        const item = currentCart.find(i => i.id === itemId);
        if (!item) return;
        
        const oldUnit = item.unit;
        item.unit = newUnit;
        
        // تحديث عدد القطع بناءً على الوحدة الجديدة
        if (newUnit === 'piece') {
            item.piecesPerUnit = 1;
        } else if (newUnit === 'kg') {
            item.piecesPerUnit = 1000; // 1 كيلو = 1000 جرام
        } else if (newUnit === 'box') {
            item.piecesPerUnit = 24; // علبة تحتوي على 24 قطعة
        } else if (newUnit === 'pack') {
            item.piecesPerUnit = 12; // كرتونة تحتوي على 12 قطعة
        } else if (newUnit === 'liter') {
            item.piecesPerUnit = 1000; // 1 لتر = 1000 مل
        }
        
        // إعادة حساب السعر إذا تغيرت الوحدة
        if (oldUnit !== newUnit && item.basePrice) {
            item.price = item.basePrice * (item.piecesPerUnit || 1);
        }
        
        item.total = item.qty * item.price * (1 - item.discount / 100);
        
        saveCurrentCart();
        renderCart();
        updateRemainingAmount();
    }

    // عرض خيارات الوحدة المتقدمة
    function showUnitOptions(itemId) {
        const item = currentCart.find(i => i.id === itemId);
        if (!item) return;
        
        // تحديد نص الوحدة للعرض
        let unitText = 'قطعة';
        if (item.unit === 'kg') unitText = 'كيلو';
        else if (item.unit === 'box') unitText = 'علبة';
        else if (item.unit === 'pack') unitText = 'كرتونة';
        else if (item.unit === 'liter') unitText = 'لتر';
        
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
                    
                    <label class="form-label">عدد القطع لكل وحدة</label>
                    <input type="number" id="pieces-per-unit" class="form-control mb-2" 
                           value="${item.piecesPerUnit || 1}" min="1" step="1">
                    
                    <label class="form-label">الكمية (بالوحدة المختارة)</label>
                    <input type="number" id="unit-quantity" class="form-control mb-2" 
                           value="${item.qty}" min="0.1" step="any">
                    
                    <label class="form-label">سعر الوحدة</label>
                    <input type="number" id="unit-price" class="form-control mb-2" 
                           value="${item.price}" min="0" step="any">
                           
                    <label class="form-label">الخصم %</label>
                    <input type="number" id="unit-discount" class="form-control mb-2" 
                           value="${item.discount}" min="0" max="100" step="1">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'تحديث',
            cancelButtonText: 'إلغاء',
            preConfirm: () => {
                const newUnit = document.getElementById('unit-type').value;
                const piecesPerUnit = parseInt(document.getElementById('pieces-per-unit').value) || 1;
                const newQty = parseFloat(document.getElementById('unit-quantity').value) || 1;
                const newPrice = parseFloat(document.getElementById('unit-price').value) || 0;
                const newDiscount = parseFloat(document.getElementById('unit-discount').value) || 0;
                
                return { newUnit, piecesPerUnit, newQty, newPrice, newDiscount };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const { newUnit, piecesPerUnit, newQty, newPrice, newDiscount } = result.value;
                
                item.unit = newUnit;
                item.piecesPerUnit = piecesPerUnit;
                item.qty = newQty;
                item.price = newPrice;
                item.discount = newDiscount > 100 ? 100 : newDiscount;
                item.total = item.qty * item.price * (1 - item.discount / 100);
                
                saveCurrentCart();
                renderCart();
                updateRemainingAmount();
                
                showNotification('نجاح', 'تم تحديث معلومات الوحدة');
            }
        });
    }

    // تحديث إجماليات السلة مع حساب إجمالي القطع
    function updateTotals() {
        const totalDiscount = currentCart.reduce((sum, item) => {
            return sum + (item.qty * item.price * item.discount / 100);
        }, 0);
        
        const grandTotal = currentCart.reduce((sum, item) => sum + (item.total || 0), 0);
        
        // حساب إجمالي عدد القطع
        const totalPieces = currentCart.reduce((sum, item) => {
            const piecesPerUnit = item.piecesPerUnit || 1;
            return sum + (item.qty * piecesPerUnit);
        }, 0);
        
        const totalDiscountEl = document.getElementById('total-discount');
        const grandTotalEl = document.getElementById('grand-total');
        const finalGrandTotalEl = document.getElementById('final-grand-total');
        const totalPiecesEl = document.getElementById('total-pieces');
        
        if (totalDiscountEl) totalDiscountEl.textContent = formatCurrency(totalDiscount) + ' دج';
        if (grandTotalEl) grandTotalEl.textContent = formatCurrency(grandTotal) + ' دج';
        if (finalGrandTotalEl) finalGrandTotalEl.textContent = formatCurrency(grandTotal) + ' دج';
        if (totalPiecesEl) totalPiecesEl.textContent = totalPieces.toLocaleString() + ' قطعة';
        
        updateRemainingAmount();
    }

    // تحديث المبلغ المتبقي
    function updateRemainingAmount() {
        const paidAmountEl = document.getElementById('paid-amount');
        const remainingEl = document.getElementById('remaining-amount');
        
        if (!paidAmountEl || !remainingEl) return;
        
        const paidAmount = parseFloat(paidAmountEl.value) || 0;
        const grandTotal = currentCart.reduce((sum, item) => sum + (item.total || 0), 0);
        
        const remaining = paidAmount - grandTotal;
        
        if (remaining < 0) {
            remainingEl.textContent = formatCurrency(Math.abs(remaining)) + ' دج (دين)';
            remainingEl.style.color = 'red';
        } else {
            remainingEl.textContent = formatCurrency(remaining) + ' دج (باقي)';
            remainingEl.style.color = 'green';
        }
    }

    // =======================================================================
    // الجزء 9: البحث عن المنتجات
    // =======================================================================
    function searchProducts(term) {
        const resultsBox = document.getElementById('search-box');
        if (!resultsBox) return;
        
        if (!term || term.length < 2) {
            resultsBox.classList.remove('show');
            return;
        }
        
        // الحصول على المنتجات
        let products = [];
        if (window.productModule && typeof window.productModule.getAllProducts === 'function') {
            products = window.productModule.getAllProducts() || [];
        } else {
            products = JSON.parse(localStorage.getItem('products') || '[]');
        }
        
        const results = products.filter(p => 
            (p.name && p.name.toLowerCase().includes(term.toLowerCase())) ||
            (p.barcode && p.barcode.includes(term))
        ).slice(0, 5);
        
        if (results.length === 0) {
            resultsBox.innerHTML = '<div class="search-item text-muted">لا توجد نتائج</div>';
            resultsBox.classList.add('show');
            return;
        }
        
        resultsBox.innerHTML = results.map(p => {
            const stockClass = p.quantity > 0 ? 'bg-success' : 'bg-danger';
            const stockText = p.quantity > 0 ? `${p.quantity} متوفر` : 'غير متوفر';
