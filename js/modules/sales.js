// ================== sales.js - إدارة المبيعات المتقدمة ==================
// الرقم 23 في ترتيب الملفات - نسخة محسنة مع دعم سعر الجملة والمخزون والمبلغ المسدد ووحدات المنتج

const salesModule = (function() {
    // ================== البيانات ==================
    let cart = [];
    let invoices = JSON.parse(localStorage.getItem('sales_invoices')) || [];
    let currentInvoice = null;
    let activeInvoices = JSON.parse(localStorage.getItem('active_invoices')) || []; // فواتير نشطة متعددة
    let currentActiveInvoiceId = null;
    
    // ================== دوال مساعدة ==================
    function formatCurrency(amount) {
        return Number(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
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
    
    function saveInvoices() {
        localStorage.setItem('sales_invoices', JSON.stringify(invoices));
    }
    
    function saveActiveInvoices() {
        localStorage.setItem('active_invoices', JSON.stringify(activeInvoices));
    }
    
    // ================== إدارة الفواتير النشطة ==================
    function createNewActiveInvoice(customerId = null, customerName = 'زبون نقدي') {
        const invoiceId = Date.now().toString();
        const newInvoice = {
            id: invoiceId,
            number: generateInvoiceNumber(),
            date: new Date().toISOString(),
            customerId: customerId,
            customer: customerName,
            items: [],
            createdBy: 'admin',
            status: 'active'
        };
        
        activeInvoices.push(newInvoice);
        saveActiveInvoices();
        return newInvoice;
    }
    
    function switchActiveInvoice(invoiceId) {
        const invoice = activeInvoices.find(inv => inv.id === invoiceId);
        if (invoice) {
            currentActiveInvoiceId = invoiceId;
            cart = invoice.items || [];
            
            // تحديث واجهة العميل
            if (invoice.customerId) {
                selectCustomer(invoice.customerId, false);
            } else {
                clearSelectedCustomer(false);
            }
            
            renderCart();
            updateActiveInvoicesDropdown();
            updateTotals();
            showNotification('تم التبديل', `الفاتورة: ${invoice.number}`);
        }
    }
    
    function loadCustomerInvoices(customerId) {
        return activeInvoices.filter(inv => inv.customerId === customerId && inv.status === 'active');
    }
    
    function updateActiveInvoicesDropdown() {
        const dropdown = document.getElementById('active-invoices-list');
        if (!dropdown) return;
        
        if (activeInvoices.length === 0) {
            dropdown.innerHTML = '<option value="">لا توجد فواتير نشطة</option>';
            return;
        }
        
        let html = '';
        activeInvoices.forEach(inv => {
            const total = inv.items.reduce((sum, item) => sum + item.total, 0);
            const selected = inv.id === currentActiveInvoiceId ? 'selected' : '';
            html += `<option value="${inv.id}" ${selected}>${inv.customer} - ${formatCurrency(total)} دج</option>`;
        });
        
        dropdown.innerHTML = html;
    }
    
    // حذف فاتورة نشطة
    function deleteActiveInvoice(invoiceId) {
        const invoice = activeInvoices.find(inv => inv.id === invoiceId);
        if (!invoice) return;
        
        showConfirmation('تأكيد الحذف', `حذف الفاتورة النشطة للعميل ${invoice.customer}؟`, () => {
            activeInvoices = activeInvoices.filter(inv => inv.id !== invoiceId);
            saveActiveInvoices();
            
            if (currentActiveInvoiceId === invoiceId) {
                if (activeInvoices.length > 0) {
                    switchActiveInvoice(activeInvoices[0].id);
                } else {
                    const newInvoice = createNewActiveInvoice(null, 'زبون نقدي');
                    currentActiveInvoiceId = newInvoice.id;
                    cart = [];
                    renderCart();
                }
            }
            
            updateActiveInvoicesDropdown();
            showNotification('تم', 'تم حذف الفاتورة النشطة');
        });
    }
    
    // ================== إضافة منتج إلى السلة مع دعم الوحدات ==================
    function addToCart() {
        const searchInput = document.getElementById('sale-search');
        const productName = searchInput?.value.trim();
        let qty = parseInt(document.getElementById('sale-qty')?.value) || 1;
        const discount = parseFloat(document.getElementById('sale-discount')?.value) || 0;
        const useWholesale = document.getElementById('use-wholesale')?.checked || false;
        const selectedUnit = document.getElementById('product-unit')?.value || 'piece';
        
        if (!productName) {
            showNotification('تنبيه', 'الرجاء اختيار منتج', 'warning');
            return false;
        }
        
        const products = window.productModule?.getAllProducts?.() || [];
        const product = products.find(p => p.name === productName || p.barcode === productName);
        
        if (!product) {
            showNotification('تنبيه', 'المنتج غير موجود', 'warning');
            return false;
        }
        
        // معالجة الوحدات المختلفة
        let unitMultiplier = 1;
        let unitName = 'قطعة';
        let unitStock = product.quantity;
        
        if (selectedUnit === 'unit12') {
            unitMultiplier = 12;
            unitName = 'علبة (12)';
            unitStock = Math.floor(product.quantity / 12);
        } else if (selectedUnit === 'unit24') {
            unitMultiplier = 24;
            unitName = 'كرتونة (24)';
            unitStock = Math.floor(product.quantity / 24);
        }
        
        const actualQty = qty * unitMultiplier;
        
        // التحقق من المخزون
        if (product.quantity < actualQty) {
            showNotification('تنبيه', `الكمية غير متوفرة - المتوفر: ${product.quantity} قطعة (${unitStock} ${unitName})`, 'warning');
            return false;
        }
        
        // اختيار السعر المناسب (تجزئة أو جملة)
        const price = useWholesale && product.wholesalePrice ? product.wholesalePrice : product.sellPrice;
        const priceType = useWholesale && product.wholesalePrice ? 'جملة' : 'تجزئة';
        const unitPrice = price * unitMultiplier;
        
        // البحث عن المنتج في السلة
        const existingItemIndex = cart.findIndex(item => item.productId === product.id && item.unit === selectedUnit);
        
        if (existingItemIndex !== -1) {
            // تحديث الكمية إذا كان المنتج موجوداً
            cart[existingItemIndex].qty += qty;
            cart[existingItemIndex].actualQty = cart[existingItemIndex].qty * cart[existingItemIndex].unitMultiplier;
            cart[existingItemIndex].total = (cart[existingItemIndex].unitPrice * cart[existingItemIndex].qty) * (1 - cart[existingItemIndex].discount / 100);
        } else {
            // إضافة منتج جديد
            cart.push({
                id: Date.now() + Math.random(),
                productId: product.id,
                name: product.name,
                unit: selectedUnit,
                unitName: unitName,
                unitMultiplier: unitMultiplier,
                price: price,
                unitPrice: unitPrice,
                priceType: priceType,
                qty: qty,
                actualQty: actualQty,
                discount: discount,
                total: (unitPrice * qty) * (1 - discount / 100),
                stock: product.quantity,
                unitStock: unitStock,
                sellPrice: product.sellPrice,
                wholesalePrice: product.wholesalePrice
            });
        }
        
        // تحديث الفاتورة النشطة
        if (currentActiveInvoiceId) {
            const activeInvoice = activeInvoices.find(inv => inv.id === currentActiveInvoiceId);
            if (activeInvoice) {
                activeInvoice.items = [...cart];
                saveActiveInvoices();
            }
        }
        
        renderCart();
        
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus(); // التركيز على حقل البحث للإضافة السريعة
        }
        document.getElementById('sale-qty').value = '1';
        document.getElementById('sale-discount').value = '0';
        
        showNotification('نجاح', `تم إضافة المنتج (${unitName}) - السعر: ${formatCurrency(unitPrice)} دج`);
        updateCartCount();
        updateTotals();
        updateRemainingAmount();
        updateActiveInvoicesDropdown();
        return true;
    }
    
    // ================== عرض السلة مع إمكانية التعديل المباشر ==================
    function renderCart() {
        const tbody = document.getElementById('cart-table');
        if (!tbody) return;
        
        if (cart.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center p-4"><i class="material-icons-round" style="font-size:48px;">shopping_cart</i><br>السلة فارغة</td></tr>';
            updateTotals();
            updateCartCount();
            updateRemainingAmount();
            return;
        }
        
        tbody.innerHTML = cart.map((item, index) => `
            <tr data-item-id="${item.id}">
                <td>${item.name}</td>
                <td>
                    <input type="number" class="form-control form-control-sm item-qty" 
                           value="${item.qty}" min="1" 
                           data-item-id="${item.id}"
                           style="width:80px">
                    <small>${item.unitName}</small>
                </td>
                <td>
                    <input type="number" class="form-control form-control-sm item-price" 
                           value="${item.unitPrice}" min="0" step="0.01"
                           data-item-id="${item.id}">
                </td>
                <td>
                    <input type="number" class="form-control form-control-sm item-discount" 
                           value="${item.discount}" min="0" max="100"
                           data-item-id="${item.id}">
                </td>
                <td class="item-total">${formatCurrency(item.total)}</td>
                <td><small class="badge bg-info">مخزون: ${item.unitStock} ${item.unitName}</small></td>
                <td><small class="badge bg-secondary">${item.priceType}</small></td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="salesModule.duplicateItem('${item.id}')" title="تكرار">
                        <i class="material-icons-round">content_copy</i>
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="salesModule.removeFromCart('${item.id}')">
                        <i class="material-icons-round">delete</i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        // إضافة مستمعات الأحداث للتعديل المباشر
        setTimeout(() => {
            document.querySelectorAll('.item-qty').forEach(input => {
                input.addEventListener('change', function() {
                    updateCartItem(this.dataset.itemId, 'qty', this.value);
                });
                input.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        updateCartItem(this.dataset.itemId, 'qty', this.value);
                        document.getElementById('sale-search').focus();
                    }
                });
            });
            
            document.querySelectorAll('.item-price').forEach(input => {
                input.addEventListener('change', function() {
                    updateCartItem(this.dataset.itemId, 'price', this.value);
                });
                input.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        updateCartItem(this.dataset.itemId, 'price', this.value);
                        document.getElementById('sale-search').focus();
                    }
                });
            });
            
            document.querySelectorAll('.item-discount').forEach(input => {
                input.addEventListener('change', function() {
                    updateCartItem(this.dataset.itemId, 'discount', this.value);
                });
                input.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        updateCartItem(this.dataset.itemId, 'discount', this.value);
                        document.getElementById('sale-search').focus();
                    }
                });
            });
        }, 100);
        
        updateTotals();
        updateCartCount();
    }
    
    // ================== تحديث عنصر في السلة ==================
    function updateCartItem(itemId, field, value) {
        const itemIndex = cart.findIndex(item => item.id === itemId);
        if (itemIndex === -1) return;
        
        const item = cart[itemIndex];
        
        switch(field) {
            case 'qty':
                item.qty = parseInt(value) || 1;
                item.actualQty = item.qty * item.unitMultiplier;
                break;
            case 'price':
                item.unitPrice = parseFloat(value) || 0;
                item.price = item.unitPrice / item.unitMultiplier;
                break;
            case 'discount':
                item.discount = parseFloat(value) || 0;
                break;
        }
        
        item.total = (item.unitPrice * item.qty) * (1 - item.discount / 100);
        
        // تحديث العرض
        const row = document.querySelector(`tr[data-item-id="${itemId}"] .item-total`);
        if (row) {
            row.textContent = formatCurrency(item.total);
        }
        
        // تحديث الفاتورة النشطة
        if (currentActiveInvoiceId) {
            const activeInvoice = activeInvoices.find(inv => inv.id === currentActiveInvoiceId);
            if (activeInvoice) {
                activeInvoice.items = [...cart];
                saveActiveInvoices();
            }
        }
        
        updateTotals();
        updateRemainingAmount();
        updateActiveInvoicesDropdown();
    }
    
    // ================== تكرار عنصر ==================
    function duplicateItem(itemId) {
        const item = cart.find(item => item.id === itemId);
        if (!item) return;
        
        const newItem = {
            ...item,
            id: Date.now() + Math.random(),
            qty: 1
        };
        newItem.total = (newItem.unitPrice * newItem.qty) * (1 - newItem.discount / 100);
        
        cart.push(newItem);
        
        if (currentActiveInvoiceId) {
            const activeInvoice = activeInvoices.find(inv => inv.id === currentActiveInvoiceId);
            if (activeInvoice) {
                activeInvoice.items = [...cart];
                saveActiveInvoices();
            }
        }
        
        renderCart();
        showNotification('تم', 'تم تكرار العنصر');
    }
    
    // ================== تحديث المجاميع (تصحيح الخطأ) ==================
    function updateTotals() {
        const totalDiscount = cart.reduce((sum, item) => {
            return sum + (item.unitPrice * item.qty * item.discount / 100);
        }, 0);
        
        const grandTotal = cart.reduce((sum, item) => sum + item.total, 0);
        
        const totalDiscountEl = document.getElementById('total-discount');
        const grandTotalEl = document.getElementById('grand-total');
        const finalGrandTotalEl = document.getElementById('final-grand-total');
        
        if (totalDiscountEl) totalDiscountEl.textContent = formatCurrency(totalDiscount) + ' دج';
        if (grandTotalEl) grandTotalEl.textContent = formatCurrency(grandTotal) + ' دج';
        if (finalGrandTotalEl) finalGrandTotalEl.textContent = formatCurrency(grandTotal) + ' دج';
        
        updateRemainingAmount();
    }
    
    // ================== تحديث عداد السلة ==================
    function updateCartCount() {
        const countEl = document.getElementById('cart-count');
        if (countEl) countEl.textContent = cart.length;
    }
    
    // ================== حساب المبلغ المتبقي مع إمكانية الدين ==================
    function updateRemainingAmount() {
        const paidAmount = parseFloat(document.getElementById('paid-amount')?.value) || 0;
        const grandTotal = cart.reduce((sum, item) => sum + item.total, 0);
        const remaining = paidAmount - grandTotal;
        
        const remainingEl = document.getElementById('remaining-amount');
        if (remainingEl) {
            remainingEl.textContent = formatCurrency(remaining) + ' دج';
            remainingEl.style.color = remaining >= 0 ? 'green' : 'orange';
        }
        
        // إظهار رسالة دين إذا كان المبلغ أقل
        const debtMessage = document.getElementById('debt-message');
        if (debtMessage) {
            if (paidAmount < grandTotal && paidAmount > 0) {
                const debtAmount = grandTotal - paidAmount;
                debtMessage.innerHTML = `<div class="alert alert-warning">سيتم تسجيل ${formatCurrency(debtAmount)} دج كدين على العميل</div>`;
                debtMessage.style.display = 'block';
            } else {
                debtMessage.style.display = 'none';
            }
        }
    }
    
    // ================== حذف من السلة ==================
    function removeFromCart(itemId) {
        cart = cart.filter(item => item.id !== itemId);
        
        if (currentActiveInvoiceId) {
            const activeInvoice = activeInvoices.find(inv => inv.id === currentActiveInvoiceId);
            if (activeInvoice) {
                activeInvoice.items = [...cart];
                saveActiveInvoices();
            }
        }
        
        renderCart();
        showNotification('تم', 'تم حذف المنتج');
        updateTotals();
        updateRemainingAmount();
        updateActiveInvoicesDropdown();
    }
    
    // ================== مسح السلة ==================
    function clearCart() {
        if (cart.length === 0) return;
        
        showConfirmation('تأكيد', 'هل تريد تفريغ السلة؟', () => {
            cart = [];
            
            if (currentActiveInvoiceId) {
                const activeInvoice = activeInvoices.find(inv => inv.id === currentActiveInvoiceId);
                if (activeInvoice) {
                    activeInvoice.items = [];
                    saveActiveInvoices();
                }
            }
            
            renderCart();
            document.getElementById('paid-amount').value = '';
            showNotification('تم', 'تم تفريغ السلة');
            updateTotals();
            updateRemainingAmount();
            updateActiveInvoicesDropdown();
        });
    }
    
    // ================== تحديث وحدات المنتج عند اختيار منتج ==================
    function updateProductUnits(productName) {
        const products = window.productModule?.getAllProducts?.() || [];
        const product = products.find(p => p.name === productName);
        
        const unitSelect = document.getElementById('product-unit');
        if (!unitSelect) return;
        
        if (!product) {
            unitSelect.innerHTML = '<option value="piece">قطعة</option>';
            return;
        }
        
        let options = '<option value="piece">قطعة</option>';
        
        if (product.unit12 || product.quantity >= 12) {
            options += '<option value="unit12">علبة (12 قطعة)</option>';
        }
        if (product.unit24 || product.quantity >= 24) {
            options += '<option value="unit24">كرتونة (24 قطعة)</option>';
        }
        
        unitSelect.innerHTML = options;
    }
    
    // ================== دوال البحث عن العملاء مع قائمة منسدلة ==================
    
    function searchCustomers(query) {
        const resultsDiv = document.getElementById('customer-results');
        if (!resultsDiv) return;
        
        if (!query || query.length < 1) {
            resultsDiv.style.display = 'none';
            resultsDiv.innerHTML = '';
            return;
        }
        
        const customers = window.customerModule?.getAllCustomers?.() || [];
        
        const results = customers.filter(c => 
            (c.fullname && c.fullname.toLowerCase().includes(query.toLowerCase())) ||
            (c.name && c.name.toLowerCase().includes(query.toLowerCase())) ||
            (c.phone1 && c.phone1.includes(query)) ||
            (c.phone && c.phone.includes(query))
        ).slice(0, 5);
        
        if (results.length === 0) {
            resultsDiv.innerHTML = '<div class="search-item text-center text-muted">لا توجد نتائج</div>';
            resultsDiv.style.display = 'block';
            return;
        }
        
        let html = '';
        results.forEach(customer => {
            const customerName = customer.fullname || customer.name || 'بدون اسم';
            const customerPhone = customer.phone1 || customer.phone || '';
            const customerInvoices = loadCustomerInvoices(customer.id);
            const hasActiveInvoices = customerInvoices.length > 0;
            
            html += `
                <div class="search-item" onclick="salesModule.selectCustomer('${customer.id}')">
                    <i class="material-icons-round">person</i>
                    <div>
                        <strong>${customerName}</strong>
                        <small class="text-muted d-block">${customerPhone || 'لا يوجد رقم'}</small>
                        ${hasActiveInvoices ? '<small class="badge bg-warning">فواتير نشطة</small>' : ''}
                    </div>
                </div>
            `;
        });
        
        resultsDiv.innerHTML = html;
        resultsDiv.style.display = 'block';
    }
    
    function selectCustomer(customerId, createNewInvoice = true) {
        const customers = window.customerModule?.getAllCustomers?.() || [];
        const customer = customers.find(c => c.id === customerId);
        
        if (!customer) return;
        
        const customerName = customer.fullname || customer.name || 'بدون اسم';
        
        // التحقق من وجود فواتير نشطة للعميل
        const customerInvoices = loadCustomerInvoices(customerId);
        
        if (customerInvoices.length > 0 && createNewInvoice) {
            // عرض الفواتير النشطة للاختيار
            showActiveInvoicesForCustomer(customerInvoices, customerName);
        } else if (createNewInvoice) {
            // إنشاء فاتورة جديدة
            const newInvoice = createNewActiveInvoice(customerId, customerName);
            currentActiveInvoiceId = newInvoice.id;
            cart = newInvoice.items || [];
            renderCart();
        }
        
        // تحديث واجهة العميل
        const searchInput = document.getElementById('customer-search');
        if (searchInput) {
            searchInput.value = customerName;
        }
        
        const resultsDiv = document.getElementById('customer-results');
        if (resultsDiv) {
            resultsDiv.style.display = 'none';
        }
        
        const selectBox = document.getElementById('sale-customer');
        if (selectBox) {
            selectBox.value = customerId;
        }
        
        showSelectedCustomerBadge(customerName, customer.phone1 || customer.phone || '', customer.id);
        updateActiveInvoicesDropdown();
        
        showNotification('تم التحديد', `العميل: ${customerName}`, 'success');
    }
    
    function showActiveInvoicesForCustomer(invoices, customerName) {
        let options = '';
        invoices.forEach(inv => {
            const total = inv.items.reduce((sum, item) => sum + item.total, 0);
            options += `<div class="search-item" onclick="salesModule.switchActiveInvoice('${inv.id}')">
                <i class="material-icons-round">receipt</i>
                <div>
                    <strong>فاتورة ${inv.number}</strong>
                    <small class="text-muted d-block">${formatCurrency(total)} دج</small>
                </div>
            </div>`;
        });
        
        Swal.fire({
            title: `فواتير نشطة للعميل ${customerName}`,
            html: `
                <div style="text-align:right; max-height:300px; overflow-y:auto;">
                    ${options}
                    <hr>
                    <button class="btn btn-primary" onclick="createNewInvoiceForCustomer('${customerName}')">فاتورة جديدة</button>
                </div>
            `,
            showConfirmButton: false,
            showCancelButton: true,
            cancelButtonText: 'إلغاء'
        });
    }
    
    function selectCustomerFromDropdown(customerId) {
        if (!customerId) {
            clearSelectedCustomer(true);
            return;
        }
        selectCustomer(customerId, true);
    }
    
    function showSelectedCustomerBadge(name, phone, id) {
        const badgeContainer = document.getElementById('selected-customer-badge');
        if (!badgeContainer) return;
        
        const nameSpan = document.getElementById('selected-customer-name');
        if (nameSpan) {
            nameSpan.textContent = name;
        }
        
        badgeContainer.style.display = 'block';
    }
    
    function clearSelectedCustomer(createNew = true) {
        const searchInput = document.getElementById('customer-search');
        if (searchInput) {
            searchInput.value = '';
        }
        
        const badgeContainer = document.getElementById('selected-customer-badge');
        if (badgeContainer) {
            badgeContainer.style.display = 'none';
        }
        
        const selectBox = document.getElementById('sale-customer');
        if (selectBox) {
            selectBox.value = '';
        }
        
        if (createNew) {
            // إنشاء فاتورة جديدة بدون عميل
            const newInvoice = createNewActiveInvoice(null, 'زبون نقدي');
            currentActiveInvoiceId = newInvoice.id;
            cart = newInvoice.items || [];
            renderCart();
            updateActiveInvoicesDropdown();
        }
        
        showNotification('تم', 'فاتورة جديدة');
    }
    
    function openAddCustomerModal() {
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
                selectCustomer(newCustomer.id, true);
                showNotification('نجاح', 'تم إضافة العميل');
            }
        });
    }
    
    function loadCustomersDropdown() {
        const customers = window.customerModule?.getAllCustomers?.() || [];
        
        if (customers.length === 0) {
            const stored = JSON.parse(localStorage.getItem('customers') || '[]');
            customers.push(...stored);
        }
        
        const select = document.getElementById('sale-customer');
        if (select) {
            select.innerHTML = '<option value="">اختر العميل (اختياري)</option>' + 
                customers.map(c => {
                    const customerName = c.fullname || c.name || 'بدون اسم';
                    const customerPhone = c.phone1 || c.phone || '';
                    return `<option value="${c.id}">${customerName} ${customerPhone ? '- ' + customerPhone : ''}</option>`;
                }).join('');
        }
    }
    
    // ================== البحث عن المنتجات مع إدخال مباشر ==================
    function searchProducts(term) {
        const resultsBox = document.getElementById('search-box');
        if (!resultsBox) return;
        
        if (!term || term.length < 2) {
            resultsBox.classList.remove('show');
            return;
        }
        
        const products = window.productModule?.getAllProducts?.() || [];
        const results = products.filter(p => 
            p.name.toLowerCase().includes(term.toLowerCase()) ||
            (p.barcode && p.barcode.includes(term))
        ).slice(0, 5);
        
        if (results.length === 0) {
            resultsBox.innerHTML = '<div class="search-item text-muted">لا توجد نتائج</div>';
            resultsBox.classList.add('show');
            return;
        }
        
        resultsBox.innerHTML = results.map(p => {
            const wholesaleInfo = p.wholesalePrice ? 
                `<br><small class="text-success">الجملة: ${formatCurrency(p.wholesalePrice)}</small>` : '';
            const stockClass = p.quantity > 0 ? 'badge-success' : 'badge-danger';
            const stockText = p.quantity > 0 ? `${p.quantity} متوفر` : 'غير متوفر';
            
            let unitInfo = '';
            if (p.quantity >= 12) {
                unitInfo += `<br><small class="text-info">علب (12): ${Math.floor(p.quantity/12)}</small>`;
            }
            if (p.quantity >= 24) {
                unitInfo += ` | <small class="text-info">كرتون (24): ${Math.floor(p.quantity/24)}</small>`;
            }
            
            return `
            <div class="search-item" onclick="salesModule.selectProduct('${p.name}', ${p.sellPrice}, ${p.wholesalePrice || 0}, ${p.quantity})">
                <div style="display: flex; justify-content: space-between; align-items: center; width:100%;">
                    <div>
                        <strong>${p.name}</strong>
                        ${wholesaleInfo}
                        ${unitInfo}
                    </div>
                    <div>
                        <span class="badge ${stockClass}">
                            ${stockText}
                        </span>
                    </div>
                </div>
            </div>
        `}).join('');
        
        resultsBox.classList.add('show');
    }
    
    function selectProduct(name, sellPrice, wholesalePrice, quantity) {
        document.getElementById('sale-search').value = name;
        document.getElementById('search-box').classList.remove('show');
        
        updateProductUnits(name);
        
        // إضافة المنتج مباشرة
        addToCart();
    }
    
    // ================== إنهاء البيع مع إمكانية الدين ==================
    function finishSale() {
        if (cart.length === 0) {
            showNotification('تنبيه', 'السلة فارغة', 'warning');
            return null;
        }
        
        const paidAmount = parseFloat(document.getElementById('paid-amount')?.value) || 0;
        const grandTotal = cart.reduce((sum, item) => sum + item.total, 0);
        
        const customerSelect = document.getElementById('sale-customer');
        const customerId = customerSelect?.value;
        
        let customerName = 'زبون نقدي';
        if (customerId) {
            const customers = window.customerModule?.getAllCustomers?.() || [];
            const customer = customers.find(c => c.id === customerId);
            customerName = customer?.fullname || customer?.name || 'زبون نقدي';
        }
        
        const paymentMethod = document.getElementById('sale-payment-method')?.value || 'cash';
        let paymentText = 'نقدي';
        if (paymentMethod === 'card') paymentText = 'بطاقة';
        if (paymentMethod === 'credit') paymentText = 'آجل';
        
        const totalDiscount = cart.reduce((sum, item) => {
            return sum + (item.unitPrice * item.qty * item.discount / 100);
        }, 0);
        
        const remaining = paidAmount - grandTotal;
        const debtAmount = remaining < 0 ? Math.abs(remaining) : 0;
        
        // تأكيد إذا كان هناك دين
        if (paidAmount < grandTotal) {
            return new Promise((resolve) => {
                Swal.fire({
                    title: 'تأكيد الدين',
                    html: `
                        <div style="text-align:right">
                            <p>المبلغ المتبقي: ${formatCurrency(grandTotal - paidAmount)} دج</p>
                            <p>سيتم تسجيله كدين على العميل</p>
                            <label>
                                <input type="checkbox" id="confirm-debt" checked> 
                                أوافق على تسجيل الدين
                            </label>
                        </div>
                    `,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'نعم، أكمل',
                    cancelButtonText: 'إلغاء'
                }).then((result) => {
                    if (result.isConfirmed) {
                        const invoice = saveFinishedInvoice(customerId, customerName, paymentMethod, paymentText, grandTotal, totalDiscount, paidAmount, remaining, debtAmount);
                        resolve(invoice);
                    } else {
                        resolve(null);
                    }
                });
            });
        } else {
            return saveFinishedInvoice(customerId, customerName, paymentMethod, paymentText, grandTotal, totalDiscount, paidAmount, remaining, debtAmount);
        }
    }
    
    function saveFinishedInvoice(customerId, customerName, paymentMethod, paymentText, grandTotal, totalDiscount, paidAmount, remaining, debtAmount) {
        const invoice = {
            id: Date.now(),
            number: generateInvoiceNumber(),
            date: new Date().toISOString(),
            customerId: customerId,
            customer: customerName,
            items: [...cart],
            subtotal: grandTotal + totalDiscount,
            totalDiscount: totalDiscount,
            grandTotal: grandTotal,
            paidAmount: paidAmount,
            remaining: remaining,
            debtAmount: debtAmount,
            paymentMethod: paymentMethod,
            paymentText: paymentText,
            status: debtAmount > 0 ? 'partial' : 'completed',
            createdBy: 'admin',
            notes: debtAmount > 0 ? `باقي دين: ${formatCurrency(debtAmount)} دج` : ''
        };
        
        invoices.push(invoice);
        saveInvoices();
        
        // تحديث المخزون
        cart.forEach(item => {
            window.inventoryModule?.removeStock(item.productId, item.actualQty, `فاتورة مبيعات رقم ${invoice.number}`);
        });
        
        // تحديث ديون العميل
        if (customerId && debtAmount > 0) {
            window.customerModule?.addDebt?.(customerId, debtAmount);
        }
        
        if (customerId) {
            window.customerModule?.updateCustomerStats?.(customerId, grandTotal);
        }
        
        // إزالة الفاتورة من النشطة
        if (currentActiveInvoiceId) {
            activeInvoices = activeInvoices.filter(inv => inv.id !== currentActiveInvoiceId);
            saveActiveInvoices();
        }
        
        cart = [];
        renderCart();
        
        clearSelectedCustomer(true);
        document.getElementById('paid-amount').value = '';
        currentActiveInvoiceId = null;
        updateActiveInvoicesDropdown();
        
        if (debtAmount > 0) {
            showNotification('نجاح', `تم حفظ الفاتورة مع دين ${formatCurrency(debtAmount)} دج`);
        } else if (remaining > 0) {
            showNotification('نجاح', `تمت العملية - الباقي: ${formatCurrency(remaining)} دج`);
        } else {
            showNotification('نجاح', 'تم حفظ الفاتورة');
        }
        
        return invoice;
    }
    
    function finishSaleAndPrint() {
        finishSale().then(invoice => {
            if (invoice) {
                preparePrint(invoice);
            }
        });
    }
    
    // ================== تجهيز الطباعة ==================
    function preparePrint(invoice) {
        const printWindow = window.open('', '_blank');
        
        let itemsHtml = '';
        invoice.items.forEach((item, i) => {
            itemsHtml += `
                <tr>
                    <td>${i + 1}</td>
                    <td>${item.name}</td>
                    <td>${item.qty} ${item.unitName}</td>
                    <td>${formatCurrency(item.unitPrice)}</td>
                    <td>${item.discount}%</td>
                    <td>${formatCurrency(item.total)}</td>
                </tr>
            `;
        });
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <title>فاتورة ${invoice.number}</title>
                <style>
                    body { font-family: Arial; padding: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    h1 { color: #333; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th { background: #f5f5f5; padding: 10px; border: 1px solid #ddd; }
                    td { padding: 8px; border: 1px solid #ddd; text-align: center; }
                    .total { font-size: 18px; font-weight: bold; text-align: left; margin-top: 20px; }
                    .footer { text-align: center; margin-top: 50px; color: #999; }
                    .debt { color: orange; font-weight: bold; }
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
                    <p>الباقي: ${formatCurrency(invoice.remaining)} دج</p>
                    ${invoice.debtAmount > 0 ? `<p class="debt">دين: ${formatCurrency(invoice.debtAmount)} دج</p>` : ''}
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
    
    // ================== الحصول على الفواتير ==================
    function getInvoices() {
        return [...invoices].sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    // ================== عرض الفواتير ==================
    function renderInvoices() {
        const tbody = document.getElementById('sale-invoices-tbody');
        if (!tbody) return;
        
        const sortedInvoices = getInvoices();
        
        if (sortedInvoices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="text-center p-4"><i class="material-icons-round" style="font-size:48px;">receipt</i><br>لا توجد فواتير</td></tr>';
            return;
        }
        
        tbody.innerHTML = sortedInvoices.map(inv => `
            <tr>
                <td>${inv.number}</td>
                <td>${new Date(inv.date).toLocaleDateString('ar-EG')}</td>
                <td>${inv.customer}</td>
                <td>${formatCurrency(inv.grandTotal)} دج</td>
                <td>${formatCurrency(inv.paidAmount)} دج</td>
                <td style="color: ${inv.remaining > 0 ? 'green' : 'black'}">${formatCurrency(inv.remaining)} دج</td>
                <td>${inv.paymentText}</td>
                <td>${inv.items.length}</td>
                <td>${inv.debtAmount > 0 ? `<span class="badge bg-warning">دين ${formatCurrency(inv.debtAmount)}</span>` : '-'}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="salesModule.showInvoice('${inv.id}')">
                        <i class="material-icons-round">visibility</i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="salesModule.deleteInvoice('${inv.id}')">
                        <i class="material-icons-round">delete</i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    // ================== عرض فاتورة ==================
    function showInvoice(id) {
        const invoice = invoices.find(inv => inv.id == id);
        if (!invoice) return;
        
        let itemsHtml = '';
        invoice.items.forEach((item, i) => {
            itemsHtml += `
                <tr>
                    <td style="padding:8px; border:1px solid #ddd;">${i + 1}</td>
                    <td style="padding:8px; border:1px solid #ddd;">${item.name}</td>
                    <td style="padding:8px; border:1px solid #ddd;">${item.qty} ${item.unitName}</td>
                    <td style="padding:8px; border:1px solid #ddd;">${formatCurrency(item.unitPrice)}</td>
                    <td style="padding:8px; border:1px solid #ddd;">${item.discount}%</td>
                    <td style="padding:8px; border:1px solid #ddd;">${formatCurrency(item.total)}</td>
                </tr>
            `;
        });
        
        Swal.fire({
            title: `فاتورة ${invoice.number}`,
            html: `
                <div style="text-align:right; max-height:400px; overflow-y:auto;">
                    <p><strong>التاريخ:</strong> ${new Date(invoice.date).toLocaleString('ar-EG')}</p>
                    <p><strong>العميل:</strong> ${invoice.customer}</p>
                    <p><strong>طريقة الدفع:</strong> ${invoice.paymentText}</p>
                    <hr>
                    <table style="width:100%; border-collapse:collapse;">
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
                    <p><strong>الباقي:</strong> ${formatCurrency(invoice.remaining)} دج</p>
                    ${invoice.debtAmount > 0 ? `<p class="text-warning"><strong>دين:</strong> ${formatCurrency(invoice.debtAmount)} دج</p>` : ''}
                </div>
            `,
            width: '900px'
        });
    }
    
    // ================== حذف فاتورة ==================
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
    
    // ================== البحث في الفواتير ==================
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
            tbody.innerHTML = '<tr><td colspan="10" class="text-center p-4">لا توجد نتائج</td></tr>';
            return;
        }
        
        tbody.innerHTML = filtered.map(inv => `
            <tr>
                <td>${inv.number}</td>
                <td>${new Date(inv.date).toLocaleDateString('ar-EG')}</td>
                <td>${inv.customer}</td>
                <td>${formatCurrency(inv.grandTotal)} دج</td>
                <td>${formatCurrency(inv.paidAmount)} دج</td>
                <td>${formatCurrency(inv.remaining)} دج</td>
                <td>${inv.paymentText}</td>
                <td>${inv.items.length}</td>
                <td>${inv.debtAmount > 0 ? 'دين' : '-'}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="salesModule.showInvoice('${inv.id}')">عرض</button>
                </td>
            </tr>
        `).join('');
    }
    
    // ================== إحصائيات المبيعات ==================
    function getSalesStats() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const todayInvoices = invoices.filter(inv => new Date(inv.date) >= today);
        const monthInvoices = invoices.filter(inv => new Date(inv.date) >= thisMonth);
        
        return {
            total: {
                count: invoices.length,
                amount: invoices.reduce((sum, inv) => sum + inv.grandTotal, 0)
            },
            today: {
                count: todayInvoices.length,
                amount: todayInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0)
            },
            thisMonth: {
                count: monthInvoices.length,
                amount: monthInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0)
            },
            totalDebts: invoices.reduce((sum, inv) => sum + (inv.debtAmount || 0), 0)
        };
    }
    
    // ================== تهيئة الوحدة ==================
    function init() {
        console.log('✅ salesModule v4 initialized - الرقم 23');
        console.log(`   عدد الفواتير: ${invoices.length}`);
        console.log(`   فواتير نشطة: ${activeInvoices.length}`);
        
        // ترقية الفواتير القديمة إذا لزم الأمر
        if (activeInvoices.length === 0) {
            const newInvoice = createNewActiveInvoice(null, 'زبون نقدي');
            currentActiveInvoiceId = newInvoice.id;
        } else {
            currentActiveInvoiceId = activeInvoices[0].id;
            cart = activeInvoices[0].items || [];
        }
        
        renderCart();
        loadCustomersDropdown();
        renderInvoices();
        updateActiveInvoicesDropdown();
        updateTotals();
        
        // إضافة زر حذف للفواتير النشطة
        const activeInvoicesContainer = document.getElementById('active-invoices-list')?.parentNode;
        if (activeInvoicesContainer && !document.getElementById('delete-active-invoice')) {
            const deleteBtn = document.createElement('button');
            deleteBtn.id = 'delete-active-invoice';
            deleteBtn.className = 'btn btn-danger';
            deleteBtn.innerHTML = '<i class="material-icons-round">delete</i>';
            deleteBtn.onclick = () => {
                if (currentActiveInvoiceId) {
                    deleteActiveInvoice(currentActiveInvoiceId);
                }
            };
            activeInvoicesContainer.appendChild(deleteBtn);
        }
        
        document.addEventListener('click', (e) => {
            const searchBox = document.getElementById('search-box');
            const searchInput = document.getElementById('sale-search');
            if (searchBox && !searchBox.contains(e.target) && e.target !== searchInput) {
                searchBox.classList.remove('show');
            }
            
            const customerResults = document.getElementById('customer-results');
            const customerSearch = document.getElementById('customer-search');
            if (customerResults && !customerResults.contains(e.target) && e.target !== customerSearch) {
                customerResults.style.display = 'none';
            }
        });
        
        // إضافة مستمع لحدث Enter في حقل البحث
        const searchInput = document.getElementById('sale-search');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addToCart();
                }
            });
        }
        
        // تحديث المجاميع كل ثانية
        setInterval(updateTotals, 1000);
    }
    
    // ================== واجهة الوحدة ==================
    return {
        cart,
        invoices,
        activeInvoices,
        addToCart,
        removeFromCart,
        clearCart,
        updateCartItem,
        duplicateItem,
        finishSale,
        finishSaleAndPrint,
        searchProducts,
        selectProduct,
        updateProductUnits,
        searchCustomers,
        selectCustomer,
        selectCustomerFromDropdown,
        clearSelectedCustomer,
        openAddCustomerModal,
        loadCustomers: loadCustomersDropdown,
        getInvoices,
        renderInvoices,
        showInvoice,
        deleteInvoice,
        searchInvoices,
        getSalesStats,
        updateRemainingAmount,
        switchActiveInvoice,
        deleteActiveInvoice,
        init
    };
})();

window.salesModule = salesModule;

// دوال مختصرة
window.addToCart = () => salesModule.addToCart();
window.clearCart = () => salesModule.clearCart();
window.finishSale = () => salesModule.finishSale();
window.finishSaleAndPrint = () => salesModule.finishSaleAndPrint();
window.searchInvoices = () => salesModule.searchInvoices();
window.searchCustomers = (q) => salesModule.searchCustomers(q);
window.updateRemainingAmount = () => salesModule.updateRemainingAmount();

// تهيئة تلقائية
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => salesModule.init());
    document.addEventListener('html-loaded', () => salesModule.init()));
}
