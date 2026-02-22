// ================== sales.js - إدارة المبيعات المتقدمة ==================
// الرقم 23 في ترتيب الملفات - نسخة مع دعم الديون (مبلغ أقل = دين)

const salesModule = (function() {
    // ================== البيانات ==================
    let customerCarts = JSON.parse(localStorage.getItem('customer_carts')) || {};
    let currentCart = [];
    let invoices = JSON.parse(localStorage.getItem('sales_invoices')) || [];
    let activeCustomers = JSON.parse(localStorage.getItem('activeCustomers')) || [];
    let currentCustomerId = localStorage.getItem('currentCustomerId') || null;
    
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
    
    // ================== إدارة السلة حسب العميل ==================
    
    function loadCustomerCart(customerId) {
        if (customerId) {
            currentCart = customerCarts[customerId] || [];
        } else {
            const cashCustomerId = 'cash_customer';
            currentCart = customerCarts[cashCustomerId] || [];
        }
        renderCart();
        updateCartCount();
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
        return customer ? (customer.name || customer.fullname) : 'عميل';
    }
    
    // ================== إدارة العملاء النشطين ==================
    
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
        }
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
                        showSelectedCustomerBadge(nextCustomer);
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
        const customers = window.customerModule?.getAllCustomers?.() || [];
        if (customers.length === 0) {
            const stored = JSON.parse(localStorage.getItem('customers') || '[]');
            customers.push(...stored);
        }
        return customers;
    }
    
    // ================== البحث عن العملاء ==================
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
            
            html += `
                <div class="search-item" onclick='salesModule.addActiveCustomer(${JSON.stringify(customer).replace(/'/g, "\\'")})'>
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
    
    function selectCustomerFromDropdown(customerId) {
        if (!customerId) return;
        
        const customers = getAllCustomers();
        const customer = customers.find(c => c.id === customerId);
        
        if (customer) {
            addActiveCustomer(customer);
        }
    }
    
    // ================== إضافة منتج إلى السلة ==================
    function addToCart() {
        const searchInput = document.getElementById('sale-search');
        const productName = searchInput?.value.trim();
        
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
        
        // إضافة المنتج مع القيم الافتراضية
        const newItem = {
            id: Date.now() + Math.random(),
            productId: product.id,
            name: product.name,
            qty: 1,
            price: product.sellPrice || 0,
            discount: 0,
            total: product.sellPrice || 0,
            stock: product.quantity || 0
        };
        
        currentCart.push(newItem);
        
        saveCurrentCart();
        renderCart();
        renderActiveCustomers();
        
        if (searchInput) searchInput.value = '';
        
        showNotification('نجاح', `تم إضافة المنتج`);
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
    
    function removeFromCart(itemId) {
        currentCart = currentCart.filter(item => item.id !== itemId);
        saveCurrentCart();
        renderCart();
        renderActiveCustomers();
        showNotification('تم', 'تم حذف المنتج');
        updateRemainingAmount();
    }
    
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
    
    // ================== عرض السلة ==================
    function renderCart() {
        const tbody = document.getElementById('cart-table');
        if (!tbody) return;
        
        if (currentCart.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center p-4"><i class="material-icons-round" style="font-size:48px;">shopping_cart</i><br>السلة فارغة</td></tr>';
            updateTotals();
            updateRemainingAmount();
            return;
        }
        
        tbody.innerHTML = currentCart.map((item, index) => {
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.name}</td>
                    <td>
                        <input type="number" id="qty-${item.id}" class="form-control text-center" 
                               value="${item.qty}" min="0.1" step="any"
                               onchange="salesModule.updateItemQuantity('${item.id}', this.value)">
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
                        <span class="badge bg-info">${item.stock}</span>
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
    
    function updateTotals() {
        const totalDiscount = currentCart.reduce((sum, item) => {
            return sum + (item.qty * item.price * item.discount / 100);
        }, 0);
        
        const grandTotal = currentCart.reduce((sum, item) => sum + item.total, 0);
        
        const totalDiscountEl = document.getElementById('total-discount');
        const grandTotalEl = document.getElementById('grand-total');
        const finalGrandTotalEl = document.getElementById('final-grand-total');
        
        if (totalDiscountEl) totalDiscountEl.textContent = formatCurrency(totalDiscount) + ' دج';
        if (grandTotalEl) grandTotalEl.textContent = formatCurrency(grandTotal) + ' دج';
        if (finalGrandTotalEl) finalGrandTotalEl.textContent = formatCurrency(grandTotal) + ' دج';
        
        updateRemainingAmount();
    }
    
    function updateRemainingAmount() {
        const paidAmount = parseFloat(document.getElementById('paid-amount')?.value) || 0;
        const grandTotal = currentCart.reduce((sum, item) => sum + item.total, 0);
        const remaining = paidAmount - grandTotal;
        
        const remainingEl = document.getElementById('remaining-amount');
        if (remainingEl) {
            remainingEl.textContent = formatCurrency(Math.abs(remaining)) + ' دج';
            remainingEl.style.color = remaining >= 0 ? 'green' : 'red';
        }
        
        const paidInput = document.getElementById('paid-amount');
        if (paidInput) {
            if (paidAmount < grandTotal && paidAmount > 0) {
                paidInput.style.borderColor = 'orange';
                paidInput.style.borderWidth = '2px';
            } else if (paidAmount >= grandTotal) {
                paidInput.style.borderColor = 'green';
                paidInput.style.borderWidth = '2px';
            } else {
                paidInput.style.borderColor = '';
                paidInput.style.borderWidth = '';
            }
        }
    }
    
    function updateCartCount() {
        const countEl = document.getElementById('cart-count');
        if (countEl) countEl.textContent = currentCart.length;
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
            const stockClass = p.quantity > 0 ? 'badge-success' : 'badge-danger';
            const stockText = p.quantity > 0 ? `${p.quantity} متوفر` : 'غير متوفر';
            
            return `
                <div class="search-item" onclick="salesModule.selectProduct('${p.name}')">
                    <div style="display: flex; justify-content: space-between; align-items: center; width:100%;">
                        <div>
                            <strong>${p.name}</strong>
                            <br><small class="text-muted">السعر: ${formatCurrency(p.sellPrice)} دج</small>
                        </div>
                        <div>
                            <span class="badge ${stockClass}">${stockText}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        resultsBox.classList.add('show');
    }
    
    function selectProduct(name) {
        document.getElementById('sale-search').value = name;
        document.getElementById('search-box').classList.remove('show');
        addToCart();
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
                addActiveCustomer(newCustomer);
                showNotification('نجاح', 'تم إضافة العميل');
            }
        });
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
    
    // ================== إنهاء البيع ==================
    function finishSale() {
        if (currentCart.length === 0) {
            showNotification('تنبيه', 'السلة فارغة', 'warning');
            return null;
        }
        
        const paidAmount = parseFloat(document.getElementById('paid-amount')?.value) || 0;
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
        
        // تحديث المخزون
        currentCart.forEach(item => {
            if (window.inventoryModule?.removeStock) {
                window.inventoryModule.removeStock(item.productId, item.qty, `فاتورة مبيعات رقم ${invoice.number}`);
            }
        });
        
        // تحديث ديون العميل
        if (customerId && debt > 0) {
            if (window.customerModule?.addDebt) {
                window.customerModule.addDebt(customerId, debt);
            }
            
            // تحديث إحصائيات العميل
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
        
        document.getElementById('paid-amount').value = '';
        
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
                    <td>${item.qty}</td>
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
                    body { font-family: Arial; padding: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    h1 { color: #333; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th { background: #f5f5f5; padding: 10px; border: 1px solid #ddd; }
                    td { padding: 8px; border: 1px solid #ddd; text-align: center; }
                    .total { font-size: 18px; font-weight: bold; text-align: left; margin-top: 20px; }
                    .debt { color: red; font-weight: bold; }
                    .footer { text-align: center; margin-top: 50px; color: #999; }
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
    
    // ================== إدارة الفواتير ==================
    function getInvoices() {
        return [...invoices].sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    function renderInvoices() {
        const tbody = document.getElementById('sale-invoices-tbody');
        if (!tbody) return;
        
        const sortedInvoices = getInvoices();
        
        if (sortedInvoices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center p-4"><i class="material-icons-round" style="font-size:48px;">receipt</i><br>لا توجد فواتير</td></tr>';
            return;
        }
        
        tbody.innerHTML = sortedInvoices.map(inv => {
            const debtClass = inv.debt > 0 ? 'text-danger fw-bold' : '';
            return `
                <tr>
                    <td>${inv.number}</td>
                    <td>${new Date(inv.date).toLocaleDateString('ar-EG')}</td>
                    <td>${inv.customer}</td>
                    <td>${formatCurrency(inv.grandTotal)} دج</td>
                    <td>${formatCurrency(inv.paidAmount)} دج</td>
                    <td class="${debtClass}">${inv.debt > 0 ? formatCurrency(inv.debt) + ' دج' : '0.00 دج'}</td>
                    <td>${inv.paymentText}</td>
                    <td>${inv.items.length}</td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick="salesModule.showInvoice('${inv.id}')">
                            <i class="material-icons-round">visibility</i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="salesModule.deleteInvoice('${inv.id}')">
                            <i class="material-icons-round">delete</i>
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
                    <td style="padding:8px; border:1px solid #ddd;">${i + 1}</td>
                    <td style="padding:8px; border:1px solid #ddd;">${item.name}</td>
                    <td style="padding:8px; border:1px solid #ddd;">${item.qty}</td>
                    <td style="padding:8px; border:1px solid #ddd;">${formatCurrency(item.price)}</td>
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
                    <p><strong>الدين:</strong> <span style="color: ${invoice.debt > 0 ? 'red' : 'green'};">${formatCurrency(invoice.debt || 0)} دج</span></p>
                </div>
            `,
            width: '900px'
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
            tbody.innerHTML = '<tr><td colspan="9" class="text-center p-4">لا توجد نتائج</td></tr>';
            return;
        }
        
        tbody.innerHTML = filtered.map(inv => {
            const debtClass = inv.debt > 0 ? 'text-danger fw-bold' : '';
            return `
                <tr>
                    <td>${inv.number}</td>
                    <td>${new Date(inv.date).toLocaleDateString('ar-EG')}</td>
                    <td>${inv.customer}</td>
                    <td>${formatCurrency(inv.grandTotal)} دج</td>
                    <td>${formatCurrency(inv.paidAmount)} دج</td>
                    <td class="${debtClass}">${inv.debt > 0 ? formatCurrency(inv.debt) + ' دج' : '0.00 دج'}</td>
                    <td>${inv.paymentText}</td>
                    <td>${inv.items.length}</td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick="salesModule.showInvoice('${inv.id}')">عرض</button>
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
    
    // ================== تهيئة الوحدة ==================
    function init() {
        console.log('✅ salesModule v6 initialized - دعم الديون');
        console.log(`   عدد الفواتير: ${invoices.length}`);
        console.log(`   عدد العملاء النشطين: ${activeCustomers.length}`);
        
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
    }
    
    return {
        cart: currentCart,
        invoices,
        activeCustomers,
        currentCustomerId,
        
        addToCart,
        removeFromCart,
        clearCart,
        finishSale,
        finishSaleAndPrint,
        searchProducts,
        selectProduct,
        updateRemainingAmount,
        
        updateItemQuantity,
        updateItemPrice,
        updateItemDiscount,
        
        searchCustomers,
        selectCustomerFromDropdown,
        clearSelectedCustomer,
        openAddCustomerModal,
        loadCustomers: loadCustomersDropdown,
        
        addActiveCustomer,
        switchActiveCustomer,
        removeActiveCustomer,
        clearAllActiveCustomers,
        renderActiveCustomers,
        
        getInvoices,
        renderInvoices,
        showInvoice,
        deleteInvoice,
        searchInvoices,
        getSalesStats,
        
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

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => salesModule.init());
    document.addEventListener('html-loaded', () => salesModule.init());
}
