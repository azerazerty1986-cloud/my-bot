// ================== إدارة المبيعات - نسخة كاملة ==================
const salesModule = (function() {
    let cart = [];
    let invoices = JSON.parse(localStorage.getItem('ryan_invoices')) || [];
    let currentEditInvoiceIndex = -1;
    
    const CONFIG = {
        MAX_DISCOUNT: 100,
        MIN_QUANTITY: 1,
        CURRENCY: 'دج',
        STORAGE_KEYS: {
            INVOICES: 'ryan_invoices'
        },
        SWAL_TIMER: 1500
    };

    // ================== دوال مساعدة ==================
    function _formatCurrency(amount) {
        return `${Number(amount).toFixed(2)} ${CONFIG.CURRENCY}`;
    }

    function _generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    function _showNotification(title, message, type = 'success', timer = CONFIG.SWAL_TIMER) {
        Swal.fire({
            icon: type,
            title: title,
            text: message,
            timer: timer,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });
    }

    function _showConfirmation(title, text, confirmCallback) {
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
            if (result.isConfirmed && confirmCallback) {
                confirmCallback();
            }
        });
    }

    // ================== إدارة السلة ==================
    function _calculateCartTotals() {
        return {
            subtotal: cart.reduce((sum, item) => sum + (item.qty * item.price), 0),
            totalDiscount: cart.reduce((sum, item) => sum + (item.qty * item.price * (item.discount / 100)), 0),
            total: cart.reduce((sum, item) => sum + item.total, 0),
            itemCount: cart.length,
            totalItems: cart.reduce((sum, item) => sum + item.qty, 0)
        };
    }

    function _validateCartItem(name, price, qty, discount, product = null) {
        const errors = [];
        
        if (!name || name.trim() === '') errors.push('اسم المنتج مطلوب');
        if (isNaN(qty) || qty < CONFIG.MIN_QUANTITY) errors.push(`الكمية يجب أن تكون ${CONFIG.MIN_QUANTITY} على الأقل`);
        if (product && qty > product.qty) errors.push(`الكمية المتوفرة: ${product.qty} ${product.unit || ''}`);
        if (isNaN(price) || price <= 0) errors.push('السعر يجب أن يكون أكبر من صفر');
        if (isNaN(discount) || discount < 0 || discount > CONFIG.MAX_DISCOUNT) errors.push(`الخصم يجب أن يكون بين 0 و ${CONFIG.MAX_DISCOUNT}%`);
        
        return errors;
    }

    function _createCartItem(product, name, qty, price, discount) {
        const total = qty * price * (1 - discount / 100);
        
        return {
            id: _generateId(),
            productId: product?.id || null,
            name: name,
            qty: qty,
            price: price,
            discount: discount,
            total: total,
            originalPrice: product?.sellPrice || price,
            unit: product?.unit || 'قطعة',
            addedAt: new Date().toISOString(),
            isCustomPrice: !product
        };
    }

    function getCart() {
        return [...cart];
    }

    // ================== إظهار القسم الفرعي ==================
    function showSubSection(subId) {
        const parent = document.querySelector('.active-section');
        if (!parent) return;
        
        parent.querySelectorAll('.sub-section').forEach(s => s.style.display = 'none');
        const target = document.getElementById(subId);
        if (target) target.style.display = 'block';
        
        const tabs = parent.querySelectorAll('.tab-item');
        tabs.forEach(t => t.classList.remove('active-red', 'active-green', 'active-nardo'));
        tabs.forEach(t => {
            if (t.getAttribute('onclick')?.includes(subId) && parent.id === 'sales') t.classList.add('active-red');
        });
        
        if (subId === 'sale-invoices') renderSaleInvoices();
        if (subId === 'customers' && typeof window.customerModule !== 'undefined') window.customerModule.renderCustomers();
    }

    // ================== البحث الذكي ==================
    function smartSearch(val) {
        const box = document.getElementById('search-box');
        if (!box) return;
        
        const searchTerm = val.trim().toLowerCase();
        if (searchTerm.length < 1) { box.style.display = 'none'; return; }
        
        const matches = window.inventoryModule?.stock.filter(p => 
            p.name.toLowerCase().includes(searchTerm) || (p.barcode && p.barcode.includes(searchTerm))
        ) || [];
        
        if (matches.length > 0) {
            box.innerHTML = matches.map(p => `
                <div class="search-item" onclick="salesModule.selectProduct('${p.name}')">
                    <div><b>${p.name}</b> ${p.qty < 5 ? '<span class="badge bg-danger">مخزون محدود</span>' : ''}</div>
                    <div class="small"><span class="text-muted">مخزون: ${p.qty} ${p.unit}</span> <span class="text-primary">بيع: ${p.sellPrice} ${CONFIG.CURRENCY}</span></div>
                </div>
            `).join('');
            box.style.display = 'block';
        } else {
            box.innerHTML = `<div class="search-item" onclick="salesModule.openQuickAddModal('${val}')"><div class="text-center">لا توجد منتجات<br><small class="text-primary">انقر لإضافة "${val}" كمنتج جديد</small></div></div>`;
            box.style.display = 'block';
        }
    }

    function selectProduct(name) {
        document.getElementById('sale-search').value = name;
        const product = window.inventoryModule?.stock.find(p => p.name === name);
        if (product) document.getElementById('sale-price').value = product.sellPrice;
        document.getElementById('search-box').style.display = 'none';
        document.getElementById('sale-qty').focus();
    }

    function openQuickAddModal(productName) {
        if (window.inventoryModule?.saveQuickProduct) {
            document.getElementById('quick-product-name').value = productName;
            document.getElementById('quick-sell-price').value = '';
            document.getElementById('quick-buy-price').value = '';
            document.getElementById('quick-unit').value = 'قطعة';
            document.getElementById('quick-qty').value = '0';
            document.getElementById('quick-cart-qty').value = '1';
            document.getElementById('quick-discount').value = '0';
            document.getElementById('quick-mode').value = 'sale';
            new bootstrap.Modal(document.getElementById('quickAddProductModal')).show();
        }
    }

    // ================== إضافة إلى السلة ==================
    function addToCart() {
        const searchInput = document.getElementById('sale-search');
        const priceInput = document.getElementById('sale-price');
        const qtyInput = document.getElementById('sale-qty');
        const discountInput = document.getElementById('sale-discount');
        
        if (!searchInput || !priceInput || !qtyInput) return;
        
        const name = searchInput.value.trim();
        let price = parseFloat(priceInput.value) || 0;
        const qty = parseFloat(qtyInput.value) || 0;
        const discount = parseFloat(discountInput.value) || 0;
        const product = window.inventoryModule?.stock.find(p => p.name === name);
        
        const errors = _validateCartItem(name, price, qty, discount, product);
        if (errors.length > 0) return _showNotification('تنبيه', errors.join(' • '), 'warning');
        
        if (product && price === 0) price = product.sellPrice;
        if (!product && price <= 0) return _showNotification('تنبيه', 'الرجاء إدخال سعر للمنتج', 'warning');
        
        const cartItem = _createCartItem(product, name, qty, price, discount);
        cart.push(cartItem);
        
        if (product) {
            product.qty -= qty;
            if (window.inventoryModule) {
                window.inventoryModule.saveStock();
                window.inventoryModule.addMovement('بيع', name, qty);
            }
        }
        
        renderCart();
        _showNotification('تمت الإضافة', `تم إضافة ${name} إلى السلة`, 'success');
        
        searchInput.value = ''; priceInput.value = ''; qtyInput.value = '1'; discountInput.value = '0';
        document.getElementById('search-box').style.display = 'none';
    }

    // ================== عرض السلة ==================
    function renderCart() {
        const tbody = document.getElementById('cart-table');
        if (!tbody) return;
        
        if (cart.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4"><i class="material-icons-round" style="font-size:48px;">shopping_cart</i><p>السلة فارغة</p></td></tr>';
        } else {
            tbody.innerHTML = cart.map((item, idx) => `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.qty} ${item.unit}</td>
                    <td>${item.price.toFixed(2)} ${CONFIG.CURRENCY}</td>
                    <td>${item.discount}%</td>
                    <td class="fw-bold">${item.total.toFixed(2)} ${CONFIG.CURRENCY}</td>
                    <td><button class="btn btn-sm btn-danger" onclick="salesModule.removeCartItem('${item.id}')"><i class="material-icons-round">delete</i></button></td>
                </tr>
            `).join('');
        }
        
        const totals = _calculateCartTotals();
        ['total-discount', 'grand-total', 'final-grand-total'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = totals.total.toFixed(2);
        });
    }

    function removeCartItem(itemId) {
        const itemIndex = cart.findIndex(item => item.id === itemId);
        if (itemIndex === -1) return;
        
        const item = cart[itemIndex];
        _showConfirmation('تأكيد الحذف', `حذف "${item.name}" من السلة؟`, () => {
            if (item.productId && window.inventoryModule) {
                const product = window.inventoryModule.stock.find(p => p.id === item.productId);
                if (product) product.qty += item.qty;
                window.inventoryModule.saveStock();
            }
            cart.splice(itemIndex, 1);
            renderCart();
            _showNotification('تم', 'تم حذف المنتج من السلة', 'success');
        });
    }

    function clearCart() {
        if (cart.length === 0) return _showNotification('تنبيه', 'السلة فارغة', 'info');
        _showConfirmation('تأكيد مسح السلة', 'هل أنت متأكد من مسح جميع العناصر؟', () => {
            if (window.inventoryModule) {
                cart.forEach(item => {
                    if (item.productId) {
                        const product = window.inventoryModule.stock.find(p => p.id === item.productId);
                        if (product) product.qty += item.qty;
                    }
                });
                window.inventoryModule.saveStock();
            }
            cart = [];
            renderCart();
            _showNotification('تم', 'تم مسح السلة', 'success');
        });
    }

    function finishSaleAndPrint() {
        if (cart.length === 0) return _showNotification('تنبيه', 'السلة فارغة', 'warning');
        
        const totals = _calculateCartTotals();
        const now = new Date();
        const invNo = invoices.length + 1;
        const customerSelect = document.getElementById('sale-customer');
        const customer = customerSelect?.options[customerSelect.selectedIndex]?.text || 'نقدي';
        
        const invoice = {
            id: _generateId(),
            number: invNo,
            date: now.toLocaleString('ar-DZ'),
            timestamp: now.toISOString(),
            customer: customer === '—— اختر العميل (اختياري) ——' ? 'نقدي' : customer,
            items: cart.map(item => ({ ...item })),
            ...totals
        };
        
        invoices.push(invoice);
        localStorage.setItem(CONFIG.STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
        
        _preparePrintInvoice(invoice, totals);
        window.print();
        
        cart = [];
        renderCart();
        if (window.reportsModule) window.reportsModule.renderReports();
        renderSaleInvoices();
        _showNotification('نجاح', 'تم حفظ الفاتورة', 'success');
    }

    function _preparePrintInvoice(invoice, totals) {
        document.getElementById('print-invoice-no').textContent = invoice.number;
        document.getElementById('print-date-time').textContent = invoice.date;
        document.getElementById('print-customer').textContent = invoice.customer;
        document.getElementById('print-grand-total').textContent = _formatCurrency(totals.total);
        document.getElementById('print-total-discount').textContent = _formatCurrency(totals.totalDiscount);
        document.getElementById('print-cart-items').innerHTML = cart.map(item => `
            <tr><td style="text-align:right;">${item.name}</td><td style="text-align:center;">${item.qty}</td><td style="text-align:left;">${_formatCurrency(item.price)}</td><td style="text-align:left;">${item.discount}%</td><td style="text-align:left;">${_formatCurrency(item.total)}</td></tr>
        `).join('');
    }

    function renderSaleInvoices() {
        const tbody = document.getElementById('sale-invoices-tbody');
        if (!tbody) return;
        
        if (invoices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center p-4"><i class="material-icons-round" style="font-size:48px;">receipt</i><p>لا توجد فواتير</p></td></tr>';
            return;
        }
        
        tbody.innerHTML = invoices.map((inv, index) => `
            <tr>
                <td>#${inv.number}</td>
                <td>${new Date(inv.date).toLocaleDateString('ar-DZ')}</td>
                <td>${inv.customer}</td>
                <td class="fw-bold">${_formatCurrency(inv.total)}</td>
                <td>${inv.items.length}</td>
                <td><button class="btn btn-sm btn-info" onclick="salesModule.showInvoiceDetails(${inv.number})"><i class="material-icons-round">visibility</i></button></td>
                <td><button class="btn btn-sm btn-warning" onclick="salesModule.editInvoice(${index})"><i class="material-icons-round">edit</i></button></td>
                <td><button class="btn btn-sm btn-danger" onclick="salesModule.deleteInvoice(${index})"><i class="material-icons-round">delete</i></button></td>
            </tr>
        `).join('');
    }

    function searchInvoices() {
        const search = document.getElementById('invoice-search')?.value.trim().toLowerCase() || '';
        if (!search) return renderSaleInvoices();
        const filtered = invoices.filter(inv => 
            inv.number.toString().includes(search) || 
            inv.customer.toLowerCase().includes(search) || 
            inv.date.includes(search)
        );
        renderSaleInvoices(filtered);
    }

    function showInvoiceDetails(number) {
        const inv = invoices.find(i => i.number === number);
        if (!inv) return;
        
        let items = '';
        inv.items.forEach((item, i) => {
            items += `<tr><td>${i+1}</td><td>${item.name}</td><td>${item.qty}</td><td>${item.price.toFixed(2)} دج</td><td>${item.discount}%</td><td>${item.total.toFixed(2)} دج</td></tr>`;
        });
        
        Swal.fire({
            title: `فاتورة رقم ${inv.number}`,
            html: `<div style="text-align:right"><p>العميل: ${inv.customer}</p><p>التاريخ: ${inv.date}</p><p>الإجمالي: ${inv.total.toFixed(2)} دج</p><hr><table style="width:100%"><thead><tr><th>#</th><th>المنتج</th><th>الكمية</th><th>السعر</th><th>الخصم</th><th>الإجمالي</th></tr></thead><tbody>${items}</tbody></table></div>`,
            width: '700px',
            confirmButtonText: 'إغلاق'
        });
    }

    function deleteInvoice(index) {
        if (index < 0 || index >= invoices.length) return;
        const inv = invoices[index];
        _showConfirmation('تأكيد الحذف', `حذف الفاتورة رقم ${inv.number}؟`, () => {
            invoices.splice(index, 1);
            localStorage.setItem(CONFIG.STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
            renderSaleInvoices();
            if (window.reportsModule) window.reportsModule.renderReports();
            _showNotification('تم', 'تم حذف الفاتورة', 'success');
        });
    }

    function editInvoice(index) {
        currentEditInvoiceIndex = index;
        const inv = invoices[index];
        document.getElementById('edit-invoice-number').textContent = inv.number;
        
        const container = document.getElementById('edit-invoice-items-container');
        container.innerHTML = inv.items.map((item, i) => `
            <div class="edit-item-row p-2 mb-2 border rounded">
                <strong>${item.name}</strong><br>
                الكمية: <input type="number" id="edit-qty-${i}" value="${item.qty}" min="1" style="width:80px;">
                السعر: <input type="number" id="edit-price-${i}" value="${item.price}" min="0" style="width:100px;">
                الخصم: <input type="number" id="edit-discount-${i}" value="${item.discount}" min="0" max="100" style="width:80px;">
            </div>
        `).join('');
        
        new bootstrap.Modal(document.getElementById('editInvoiceModal')).show();
    }

    function updateInvoice() {
        if (currentEditInvoiceIndex === -1) return;
        const inv = invoices[currentEditInvoiceIndex];
        const newItems = [];
        
        for (let i = 0; i < inv.items.length; i++) {
            const qty = parseFloat(document.getElementById(`edit-qty-${i}`).value);
            const price = parseFloat(document.getElementById(`edit-price-${i}`).value);
            const discount = parseFloat(document.getElementById(`edit-discount-${i}`).value) || 0;
            if (isNaN(qty) || qty < 1 || isNaN(price) || price < 0 || discount > 100) return _showNotification('خطأ', 'قيم غير صحيحة', 'error');
            newItems.push({ ...inv.items[i], qty, price, discount, total: qty * price * (1 - discount/100) });
        }
        
        inv.items.forEach(item => {
            if (item.productId && window.inventoryModule) {
                const prod = window.inventoryModule.stock.find(p => p.id === item.productId);
                if (prod) prod.qty += item.qty;
            }
        });
        
        newItems.forEach(item => {
            if (item.productId && window.inventoryModule) {
                const prod = window.inventoryModule.stock.find(p => p.id === item.productId);
                if (prod) prod.qty -= item.qty;
            }
        });
        
        const total = newItems.reduce((sum, i) => sum + i.total, 0);
        inv.items = newItems;
        inv.total = total;
        
        localStorage.setItem(CONFIG.STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
        if (window.inventoryModule) window.inventoryModule.saveStock();
        
        bootstrap.Modal.getInstance(document.getElementById('editInvoiceModal'))?.hide();
        _showNotification('نجاح', 'تم تعديل الفاتورة', 'success');
        renderSaleInvoices();
        currentEditInvoiceIndex = -1;
    }

    function initVoiceSearch() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        
        const recognition = new SpeechRecognition();
        recognition.lang = 'ar-DZ';
        recognition.onresult = (e) => {
            document.getElementById('sale-search').value = e.results[0][0].transcript;
            smartSearch(e.results[0][0].transcript);
        };
        document.getElementById('mic-sale')?.addEventListener('click', () => recognition.start());
    }

    return {
        cart, invoices, getCart, showSubSection, smartSearch, selectProduct, openQuickAddModal,
        addToCart, renderCart, removeCartItem, clearCart, finishSaleAndPrint,
        renderSaleInvoices, searchInvoices, deleteInvoice, editInvoice, updateInvoice,
        showInvoiceDetails, initVoiceSearch
    };
})();

window.salesModule = salesModule;
document.addEventListener('DOMContentLoaded', () => salesModule.initVoiceSearch());
