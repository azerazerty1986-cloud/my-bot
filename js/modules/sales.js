// ================== sales.js - إدارة المبيعات المتقدمة ==================
// الرقم 23 في ترتيب الملفات - نسخة نهائية شاملة مع جميع التحسينات

const salesModule = (function() {
    // ================== البيانات ==================
    let cart = [];
    let invoices = JSON.parse(localStorage.getItem('sales_invoices')) || [];
    let activeInvoices = JSON.parse(localStorage.getItem('active_invoices')) || [];
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
    
    // ================== إضافة منتج إلى السلة ==================
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
        
        if (product.quantity < actualQty) {
            showNotification('تنبيه', `الكمية غير متوفرة - المتوفر: ${product.quantity} قطعة (${unitStock} ${unitName})`, 'warning');
            return false;
        }
        
        const price = useWholesale && product.wholesalePrice ? product.wholesalePrice : product.sellPrice;
        const priceType = useWholesale && product.wholesalePrice ? 'جملة' : 'تجزئة';
        const unitPrice = price * unitMultiplier;
        
        const existingItemIndex = cart.findIndex(item => item.productId === product.id && item.unit === selectedUnit);
        
        if (existingItemIndex !== -1) {
            cart[existingItemIndex].qty += qty;
            cart[existingItemIndex].actualQty = cart[existingItemIndex].qty * cart[existingItemIndex].unitMultiplier;
            cart[existingItemIndex].total = (cart[existingItemIndex].unitPrice * cart[existingItemIndex].qty) * (1 - cart[existingItemIndex].discount / 100);
        } else {
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
            searchInput.focus();
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
    
    // ================== عرض السلة ==================
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
        
        tbody.innerHTML = cart.map((item) => `
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
        
        attachCartEventListeners();
        updateTotals();
        updateCartCount();
    }
    
    function attachCartEventListeners() {
        document.querySelectorAll('.item-qty').forEach(input => {
            input.removeEventListener('change', handleCartChange);
            input.removeEventListener('keypress', handleEnterKey);
            input.addEventListener('change', handleCartChange);
            input.addEventListener('keypress', handleEnterKey);
        });
        
        document.querySelectorAll('.item-price').forEach(input => {
            input.removeEventListener('change', handleCartChange);
            input.removeEventListener('keypress', handleEnterKey);
            input.addEventListener('change', handleCartChange);
            input.addEventListener('keypress', handleEnterKey);
        });
        
        document.querySelectorAll('.item-discount').forEach(input => {
            input.removeEventListener('change', handleCartChange);
            input.removeEventListener('keypress', handleEnterKey);
            input.addEventListener('change', handleCartChange);
            input.addEventListener('keypress', handleEnterKey);
        });
    }
    
    function handleCartChange(e) {
        const input = e.target;
        updateCartItem(input.dataset.itemId, input.classList.contains('item-qty') ? 'qty' : 
                      input.classList.contains('item-price') ? 'price' : 'discount', input.value);
    }
    
    function handleEnterKey(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleCartChange(e);
            document.getElementById('sale-search').focus();
        }
    }
    
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
        
        const row = document.querySelector(`tr[data-item-id="${itemId}"] .item-total`);
        if (row) row.textContent = formatCurrency(item.total);
        
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
    
    function duplicateItem(itemId) {
        const item = cart.find(item => item.id === itemId);
        if (!item) return;
        
        const newItem = { ...item, id: Date.now() + Math.random(), qty: 1 };
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
    
    function updateTotals() {
        const totalDiscount = cart.reduce((sum, item) => sum + (item.unitPrice * item.qty * item.discount / 100), 0);
        const grandTotal = cart.reduce((sum, item) => sum + item.total, 0);
        
        const totalDiscountEl = document.getElementById('total-discount');
        const grandTotalEl = document.getElementById('grand-total');
        const finalGrandTotalEl = document.getElementById('final-grand-total');
        
        if (totalDiscountEl) totalDiscountEl.textContent = formatCurrency(totalDiscount) + ' دج';
        if (grandTotalEl) grandTotalEl.textContent = formatCurrency(grandTotal) + ' دج';
        if (finalGrandTotalEl) finalGrandTotalEl.textContent = formatCurrency(grandTotal) + ' دج';
        
        updateRemainingAmount();
    }
    
    function updateCartCount() {
        const countEl = document.getElementById('cart-count');
        if (countEl) countEl.textContent = cart.length;
    }
    
    function updateRemainingAmount() {
        const paidAmount = parseFloat(document.getElementById('paid-amount')?.value) || 0;
        const grandTotal = cart.reduce((sum, item) => sum + item.total, 0);
        const remaining = paidAmount - grandTotal;
        
        const remainingEl = document.getElementById('remaining-amount');
        if (remainingEl) {
            remainingEl.textContent = formatCurrency(remaining) + ' دج';
            remainingEl.style.color = remaining >= 0 ? 'green' : 'orange';
        }
        
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
        if (product.unit12 || product.quantity >= 12) options += '<option value="unit12">علبة (12 قطعة)</option>';
        if (product.unit24 || product.quantity >= 24) options += '<option value="unit24">كرتونة (24 قطعة)</option>';
        
        unitSelect.innerHTML = options;
    }
    
    // ================== دوال العملاء ==================
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
        const customerInvoices = loadCustomerInvoices(customerId);
        
        if (customerInvoices.length > 0 && createNewInvoice) {
            showActiveInvoicesForCustomer(customerInvoices, customerName);
        } else if (createNewInvoice) {
            const newInvoice = createNewActiveInvoice(customerId, customerName);
            currentActiveInvoiceId = newInvoice.id;
            cart = newInvoice.items || [];
            renderCart();
        }
        
        document.getElementById('customer-search').value = customerName;
        document.getElementById('customer-results').style.display = 'none';
        
        const selectBox = document.getElementById('sale-customer');
        if (selectBox) selectBox.value = customerId;
        
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
        
        document.getElementById('selected-customer-name').textContent = name;
        badgeContainer.style.display = 'block';
    }
    
    function clearSelectedCustomer(createNew = true) {
        document.getElementById('customer-search').value = '';
        document.getElementById('selected-customer-badge').style.display = 'none';
        
        const selectBox = document.getElementById('sale-customer');
        if (selectBox) selectBox.value = '';
        
        if (createNew) {
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
                if (!name) {
                    Swal.showValidationMessage('اسم العميل مطلوب');
                    return false;
                }
                return { name, phone: document.getElementById('new-customer-phone').value };
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
                
                if (window.customerModule?.loadCustomers) window.customerModule.loadCustomers();
                
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
    
    // ================== البحث عن المنتجات ==================
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
            const wholesaleInfo = p.wholesalePrice ? `<br><small class="text-success">الجملة: ${formatCurrency(p.wholesalePrice)}</small>` : '';
            const stockClass = p.quantity > 0 ? 'badge-success' : 'badge-danger';
            const stockText = p.quantity > 0 ? `${p.quantity} متوفر` : 'غير متوفر';
            
            let unitInfo = '';
            if (p.quantity >= 12) unitInfo += `<br><small class="text-info">علب (12): ${Math.floor(p.quantity/12)}</small>`;
            if (p.quantity >= 24) unitInfo += ` | <small class="text-info">كرتون (24): ${Math.floor(p.quantity/24)}</small>`;
            
            return `
            <div class="search-item" onclick="salesModule.selectProduct('${p.name}', ${p.sellPrice}, ${p.wholesalePrice || 0}, ${p.quantity})">
                <div style="display: flex; justify-content: space-between; align-items: center; width:100%;">
                    <div>
                        <strong>${p.name}</strong>
                        ${wholesaleInfo}
                        ${unitInfo}
                    </div>
                    <div>
                        <span class="badge ${stockClass}">${stockText}</span>
                    </div>
                </div>
            </div>`;
        }).join('');
        
        resultsBox.classList.add('show');
    }
    
    function selectProduct(name, sellPrice, wholesalePrice, quantity) {
        document.getElementById('sale-search').value = name;
        document.getElementById('search-box').classList.remove('show');
        updateProductUnits(name);
        addToCart();
    }
    
    // ================== إنهاء البيع ==================
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
        let paymentText = paymentMethod === 'card' ? 'بطاقة' : paymentMethod === 'credit' ? 'آجل' : 'نقدي';
        
        const totalDiscount = cart.reduce((sum, item) => sum + (item.unitPrice * item.qty * item.discount / 100), 0);
        const remaining = paidAmount - grandTotal;
        const debtAmount = remaining < 0 ? Math.abs(remaining) : 0;
        
        if (paidAmount < grandTotal) {
            return new Promise((resolve) => {
                Swal.fire({
                    title: 'تأكيد الدين',
                    html: `
                        <div style="text-align:right">
                            <p>المبلغ المتبقي: ${formatCurrency(grandTotal - paidAmount)} دج</p>
                            <p>سيتم تسجيله كدين على العميل</p>
                            <label><input type="checkbox" id="confirm-debt" checked> أوافق على تسجيل الدين</label>
                        </div>
                    `,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'نعم، أكمل',
                    cancelButtonText: 'إلغاء'
                }).then((result) => {
                    if (result.isConfirmed) resolve(saveFinishedInvoice(customerId, customerName, paymentMethod, paymentText, grandTotal, totalDiscount, paidAmount, remaining, debtAmount));
                    else resolve(null);
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
            customerId, customer: customerName, items: [...cart],
            subtotal: grandTotal + totalDiscount, totalDiscount, grandTotal,
            paidAmount, remaining, debtAmount, paymentMethod, paymentText,
            status: debtAmount > 0 ? 'partial' : 'completed', createdBy: 'admin',
            notes: debtAmount > 0 ? `باقي دين: ${formatCurrency(debtAmount)} دج` : ''
        };
        
        invoices.push(invoice);
        saveInvoices();
        
        cart.forEach(item => window.inventoryModule?.removeStock(item.productId, item.actualQty, `فاتورة مبيعات رقم ${invoice.number}`));
        
        if (customerId && debtAmount > 0) window.customerModule?.addDebt?.(customerId, debtAmount);
        if (customerId) window.customerModule?.updateCustomerStats?.(customerId, grandTotal);
        
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
        
        showNotification('نجاح', debtAmount > 0 ? `تم حفظ الفاتورة مع دين ${formatCurrency(debtAmount)} دج` : 
                        (remaining > 0 ? `تمت العملية - الباقي: ${formatCurrency(remaining)} دج` : 'تم حفظ الفاتورة'));
        
        return invoice;
    }
    
    function finishSaleAndPrint() {
        finishSale().then(invoice => { if (invoice) preparePrint(invoice); });
    }
    
    function preparePrint(invoice) {
        const printWindow = window.open('', '_blank');
        let itemsHtml = invoice.items.map((item, i) => `
            <tr>
                <td>${i+1}</td>
                <td>${item.name}</td>
                <td>${item.qty} ${item.unitName}</td>
                <td>${formatCurrency(item.unitPrice)}</td>
                <td>${item.discount}%</td>
                <td>${formatCurrency(item.total)}</td>
            </tr>
        `).join('');
        
        printWindow.document.write(`
            <!DOCTYPE html><html dir="rtl"><head><title>فاتورة ${invoice.number}</title>
            <style>body{font-family:Arial;padding:20px}.header{text-align:center;margin-bottom:30px}
            table{width:100%;border-collapse:collapse;margin:20px 0}
            th{background:#f5f5f5;padding:10px;border:1px solid #ddd}
            td{padding:8px;border:1px solid #ddd;text-align:center}
            .total{font-size:18px;font-weight:bold;text-align:left;margin-top:20px}
            .footer{text-align:center;margin-top:50px;color:#999}
            .debt{color:orange;font-weight:bold}</style></head>
            <body><div class="header"><h1>سوبر - النظام المتكامل</h1><h3>فاتورة بيع</h3>
            <p>رقم: ${invoice.number}</p><p>التاريخ: ${new Date(invoice.date).toLocaleString('ar-EG')}</p>
            <p>العميل: ${invoice.customer}</p></div>
            <table><thead><tr><th>#</th><th>المنتج</th><th>الكمية</th><th>السعر</th><th>الخصم</th><th>الإجمالي</th></tr></thead>
            <tbody>${itemsHtml}</tbody></table>
            <div class="total"><p>الإجمالي: ${formatCurrency(invoice.grandTotal)} دج</p>
            <p>المدفوع: ${formatCurrency(invoice.paidAmount)} دج</p>
            <p>الباقي: ${formatCurrency(invoice.remaining)} دج</p>
            ${invoice.debtAmount > 0 ? `<p class="debt">دين: ${formatCurrency(invoice.debtAmount)} دج</p>` : ''}</div>
           
