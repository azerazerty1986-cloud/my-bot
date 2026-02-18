// ================== إدارة المشتريات - نسخة كاملة ==================
const purchasesModule = (function() {
    let purchaseCart = [];
    let purchases = JSON.parse(localStorage.getItem('ryan_purchases')) || [];
    let currentEditPurchaseIndex = -1;
    
    const CONFIG = {
        MIN_QUANTITY: 1,
        CURRENCY: 'دج',
        STORAGE_KEYS: { PURCHASES: 'ryan_purchases' },
        SWAL_TIMER: 1500
    };

    // ================== دوال مساعدة ==================
    function _formatCurrency(amount) {
        return `${Number(amount).toFixed(2)} ${CONFIG.CURRENCY}`;
    }

    function _generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    function _showNotification(title, message, type = 'success') {
        Swal.fire({ icon: type, title, text: message, timer: 2000, showConfirmButton: false, toast: true, position: 'top-end' });
    }

    function _showConfirmation(title, text, confirmCallback) {
        Swal.fire({
            title, text, icon: 'warning', showCancelButton: true,
            confirmButtonColor: '#4caf50', cancelButtonColor: '#d33',
            confirmButtonText: 'نعم', cancelButtonText: 'إلغاء'
        }).then(r => r.isConfirmed && confirmCallback?.());
    }

    // ================== إدارة السلة ==================
    function _calculateCartTotals() {
        return {
            subtotal: purchaseCart.reduce((s, i) => s + i.qty * i.price, 0),
            total: purchaseCart.reduce((s, i) => s + i.total, 0),
            itemCount: purchaseCart.length,
            totalItems: purchaseCart.reduce((s, i) => s + i.qty, 0)
        };
    }

    function _validateCartItem(name, price, qty) {
        const e = [];
        if (!name?.trim()) e.push('اسم المنتج مطلوب');
        if (isNaN(qty) || qty < 1) e.push('الكمية يجب أن تكون 1 على الأقل');
        if (isNaN(price) || price <= 0) e.push('السعر يجب أن يكون أكبر من صفر');
        return e;
    }

    function _createCartItem(product, name, qty, price) {
        return {
            id: _generateId(),
            productId: product?.id || null,
            name, qty, price,
            total: qty * price,
            originalPrice: product?.buyPrice || price,
            unit: product?.unit || 'قطعة',
            addedAt: new Date().toISOString()
        };
    }

    function getPurchaseCart() { return [...purchaseCart]; }

    // ================== إظهار القسم الفرعي ==================
    function showSubSection(subId) {
        const p = document.querySelector('.active-section');
        if (!p) return;
        p.querySelectorAll('.sub-section').forEach(s => s.style.display = 'none');
        document.getElementById(subId).style.display = 'block';
        
        p.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active-green'));
        p.querySelectorAll('.tab-item').forEach(t => {
            if (t.getAttribute('onclick')?.includes(subId) && p.id === 'purchases') t.classList.add('active-green');
        });
        
        if (subId === 'purchase-invoices') renderPurchaseInvoices();
        if (subId === 'suppliers' && window.supplierModule) window.supplierModule.renderSuppliers();
    }

    // ================== البحث الذكي ==================
    function smartSearchPurchase(val) {
        const box = document.getElementById('purchase-search-box');
        if (!box) return;
        
        const term = val.trim().toLowerCase();
        if (term.length < 1) { box.style.display = 'none'; return; }
        
        const matches = window.inventoryModule?.stock.filter(p => 
            p.name.toLowerCase().includes(term) || (p.barcode && p.barcode.includes(term))
        ) || [];
        
        if (matches.length > 0) {
            box.innerHTML = matches.map(p => `
                <div class="search-item" onclick="purchasesModule.selectProductPurchase('${p.name}')">
                    <div><b>${p.name}</b> <span class="badge bg-success">${p.qty} ${p.unit}</span></div>
                    <div class="small"><span class="text-muted">شراء: ${p.buyPrice} ${CONFIG.CURRENCY}</span> <span class="text-primary">بيع: ${p.sellPrice} ${CONFIG.CURRENCY}</span></div>
                </div>
            `).join('');
            box.style.display = 'block';
        } else {
            box.innerHTML = `<div class="search-item" onclick="purchasesModule.openQuickAddModal('${val}')"><div class="text-center">لا توجد منتجات<br><small class="text-success">انقر لإضافة "${val}" كمنتج جديد</small></div></div>`;
            box.style.display = 'block';
        }
    }

    function selectProductPurchase(name) {
        document.getElementById('purchase-search').value = name;
        const product = window.inventoryModule?.stock.find(p => p.name === name);
        if (product) document.getElementById('purchase-price').value = product.buyPrice;
        document.getElementById('purchase-search-box').style.display = 'none';
        document.getElementById('purchase-qty').focus();
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
            document.getElementById('quick-mode').value = 'purchase';
            new bootstrap.Modal(document.getElementById('quickAddProductModal')).show();
        }
    }

    // ================== إضافة إلى السلة ==================
    function addToPurchaseCart() {
        const search = document.getElementById('purchase-search');
        const priceInp = document.getElementById('purchase-price');
        const qtyInp = document.getElementById('purchase-qty');
        if (!search || !priceInp || !qtyInp) return;
        
        const name = search.value.trim();
        let price = parseFloat(priceInp.value) || 0;
        const qty = parseFloat(qtyInp.value) || 0;
        const product = window.inventoryModule?.stock.find(p => p.name === name);
        
        const err = _validateCartItem(name, price, qty);
        if (err.length) return _showNotification('تنبيه', err.join(' • '), 'warning');
        
        if (product && price === 0) price = product.buyPrice;
        
        purchaseCart.push(_createCartItem(product, name, qty, price));
        
        if (product && window.inventoryModule) {
            product.qty += qty;
            window.inventoryModule.saveStock();
            window.inventoryModule.addMovement('شراء', name, qty);
        }
        
        renderPurchaseCart();
        _showNotification('تمت الإضافة', `تم إضافة ${name} إلى مشترياتك`, 'success');
        
        search.value = ''; priceInp.value = ''; qtyInp.value = '1';
        document.getElementById('purchase-search-box').style.display = 'none';
    }

    function renderPurchaseCart() {
        const tbody = document.getElementById('purchase-cart-table');
        if (!tbody) return;
        
        if (purchaseCart.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4"><i class="material-icons-round" style="font-size:48px;">shopping_basket</i><p>سلة المشتريات فارغة</p></td></tr>';
        } else {
            tbody.innerHTML = purchaseCart.map((item, idx) => `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.qty} ${item.unit}</td>
                    <td>${item.price.toFixed(2)} ${CONFIG.CURRENCY}</td>
                    <td class="fw-bold text-success">${item.total.toFixed(2)} ${CONFIG.CURRENCY}</td>
                    <td><button class="btn btn-sm btn-primary" onclick="purchasesModule.editPurchaseCartItemPrice('${item.id}')"><i class="material-icons-round">edit</i></button></td>
                    <td><button class="btn btn-sm btn-danger" onclick="purchasesModule.removePurchaseCartItem('${item.id}')"><i class="material-icons-round">delete</i></button></td>
                </tr>
            `).join('');
        }
        
        const total = _calculateCartTotals().total;
        const el = document.getElementById('purchase-grand-total');
        if (el) el.textContent = total.toFixed(2);
    }

    function removePurchaseCartItem(itemId) {
        const idx = purchaseCart.findIndex(i => i.id === itemId);
        if (idx === -1) return;
        const item = purchaseCart[idx];
        _showConfirmation('تأكيد الحذف', `حذف "${item.name}" من المشتريات؟`, () => {
            if (item.productId && window.inventoryModule) {
                const p = window.inventoryModule.stock.find(p => p.id === item.productId);
                if (p) p.qty -= item.qty;
                window.inventoryModule.saveStock();
            }
            purchaseCart.splice(idx, 1);
            renderPurchaseCart();
            _showNotification('تم', 'تم حذف المنتج', 'success');
        });
    }

    function editPurchaseCartItemPrice(itemId) {
        const idx = purchaseCart.findIndex(i => i.id === itemId);
        if (idx === -1) return;
        const item = purchaseCart[idx];
        
        Swal.fire({
            title: 'تعديل السعر',
            input: 'number',
            inputValue: item.price,
            showCancelButton: true,
            confirmButtonText: 'حفظ',
            preConfirm: (v) => {
                const np = parseFloat(v);
                if (isNaN(np) || np <= 0) return Swal.showValidationMessage('سعر صحيح مطلوب');
                return np;
            }
        }).then(r => {
            if (r.isConfirmed) {
                const np = r.value;
                purchaseCart[idx] = { ...item, price: np, total: item.qty * np };
                renderPurchaseCart();
                _showNotification('تم', 'تم تحديث السعر', 'success');
            }
        });
    }

    function clearPurchaseCart() {
        if (!purchaseCart.length) return _showNotification('تنبيه', 'السلة فارغة', 'info');
        _showConfirmation('تأكيد المسح', 'مسح جميع المشتريات؟', () => {
            if (window.inventoryModule) {
                purchaseCart.forEach(item => {
                    if (item.productId) {
                        const p = window.inventoryModule.stock.find(p => p.id === item.productId);
                        if (p) p.qty -= item.qty;
                    }
                });
                window.inventoryModule.saveStock();
            }
            purchaseCart = [];
            renderPurchaseCart();
            _showNotification('تم', 'تم مسح السلة', 'success');
        });
    }

    function finishPurchaseAndPrint() {
        if (!purchaseCart.length) return _showNotification('تنبيه', 'السلة فارغة', 'warning');
        
        const totals = _calculateCartTotals();
        const now = new Date();
        const invNo = purchases.length + 1;
        const supplierSelect = document.getElementById('purchase-supplier');
        const supplier = supplierSelect?.options[supplierSelect.selectedIndex]?.text || 'غير محدد';
        
        const purchase = {
            id: _generateId(), number: invNo, date: now.toLocaleString('ar-DZ'),
            supplier: supplier === '—— اختر المورد (اختياري) ——' ? 'غير محدد' : supplier,
            items: purchaseCart.map(i => ({ ...i })), ...totals
        };
        
        purchases.push(purchase);
        localStorage.setItem(CONFIG.STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
        
        document.getElementById('purchase-print-invoice-no').textContent = invNo;
        document.getElementById('purchase-print-date-time').textContent = purchase.date;
        document.getElementById('print-supplier').textContent = purchase.supplier;
        document.getElementById('purchase-print-grand-total').textContent = _formatCurrency(totals.total);
        document.getElementById('purchase-print-cart-items').innerHTML = purchaseCart.map(item => `
            <tr><td style="text-align:right;">${item.name}</td><td style="text-align:center;">${item.qty}</td><td style="text-align:left;">${_formatCurrency(item.price)}</td><td style="text-align:left;">${_formatCurrency(item.total)}</td></tr>
        `).join('');
        
        window.print();
        purchaseCart = [];
        renderPurchaseCart();
        if (window.reportsModule) window.reportsModule.renderReports();
        renderPurchaseInvoices();
        _showNotification('نجاح', 'تم حفظ فاتورة الشراء', 'success');
    }

    function renderPurchaseInvoices() {
        const tbody = document.getElementById('purchase-invoices-tbody');
        if (!tbody) return;
        
        if (purchases.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center p-4"><i class="material-icons-round" style="font-size:48px;">receipt</i><p>لا توجد فواتير شراء</p></td></tr>';
            return;
        }
        
        tbody.innerHTML = purchases.map((pur, idx) => `
            <tr>
                <td>#${pur.number}</td>
                <td>${new Date(pur.date).toLocaleDateString('ar-DZ')}</td>
                <td>${pur.supplier}</td>
                <td class="fw-bold text-success">${_formatCurrency(pur.total)}</td>
                <td>${pur.items.length}</td>
                <td><button class="btn btn-sm btn-info" onclick="purchasesModule.showPurchaseDetails(${pur.number})"><i class="material-icons-round">visibility</i></button></td>
                <td><button class="btn btn-sm btn-warning" onclick="purchasesModule.editPurchaseInvoice(${idx})"><i class="material-icons-round">edit</i></button></td>
                <td><button class="btn btn-sm btn-danger" onclick="purchasesModule.deletePurchaseInvoice(${idx})"><i class="material-icons-round">delete</i></button></td>
            </tr>
        `).join('');
    }

    function showPurchaseDetails(number) {
        const pur = purchases.find(p => p.number === number);
        if (!pur) return;
        
        let items = '';
        pur.items.forEach((item, i) => {
            items += `<tr><td>${i+1}</td><td>${item.name}</td><td>${item.qty}</td><td>${item.price.toFixed(2)} دج</td><td>${(item.qty * item.price).toFixed(2)} دج</td></tr>`;
        });
        
        Swal.fire({
            title: `فاتورة شراء رقم ${pur.number}`,
            html: `<div style="text-align:right"><p>المورد: ${pur.supplier}</p><p>التاريخ: ${pur.date}</p><p>الإجمالي: ${pur.total.toFixed(2)} دج</p><hr><table style="width:100%"><thead><tr><th>#</th><th>المنتج</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead><tbody>${items}</tbody></table></div>`,
            width: '700px',
            confirmButtonText: 'إغلاق'
        });
    }

    function deletePurchaseInvoice(index) {
        if (index < 0 || index >= purchases.length) return;
        const pur = purchases[index];
        _showConfirmation('تأكيد الحذف', `حذف فاتورة الشراء رقم ${pur.number}؟`, () => {
            purchases.splice(index, 1);
            localStorage.setItem(CONFIG.STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
            renderPurchaseInvoices();
            if (window.reportsModule) window.reportsModule.renderReports();
            _showNotification('تم', 'تم حذف الفاتورة', 'success');
        });
    }

    function editPurchaseInvoice(index) {
        currentEditPurchaseIndex = index;
        const pur = purchases[index];
        document.getElementById('edit-purchase-invoice-number').textContent = pur.number;
        
        const container = document.getElementById('edit-purchase-invoice-items-container');
        container.innerHTML = pur.items.map((item, i) => `
            <div class="edit-item-row p-2 mb-2 border rounded">
                <strong>${item.name}</strong><br>
                الكمية: <input type="number" id="edit-purchase-qty-${i}" value="${item.qty}" min="1" style="width:80px;">
                السعر: <input type="number" id="edit-purchase-price-${i}" value="${item.price}" min="0" style="width:100px;">
            </div>
        `).join('');
        
        new bootstrap.Modal(document.getElementById('editPurchaseInvoiceModal')).show();
    }

    function updatePurchaseInvoice() {
        if (currentEditPurchaseIndex === -1) return;
        const pur = purchases[currentEditPurchaseIndex];
        const newItems = [];
        
        for (let i = 0; i < pur.items.length; i++) {
            const qty = parseFloat(document.getElementById(`edit-purchase-qty-${i}`).value);
            const price = parseFloat(document.getElementById(`edit-purchase-price-${i}`).value);
            if (isNaN(qty) || qty < 1 || isNaN(price) || price < 0) return _showNotification('خطأ', 'قيم غير صحيحة', 'error');
            newItems.push({ ...pur.items[i], qty, price, total: qty * price });
        }
        
        if (window.inventoryModule) {
            pur.items.forEach(item => {
                if (item.productId) {
                    const p = window.inventoryModule.stock.find(p => p.id === item.productId);
                    if (p) p.qty -= item.qty;
                }
            });
            newItems.forEach(item => {
                if (item.productId) {
                    const p = window.inventoryModule.stock.find(p => p.id === item.productId);
                    if (p) p.qty += item.qty;
                }
            });
            window.inventoryModule.saveStock();
        }
        
        const total = newItems.reduce((s, i) => s + i.total, 0);
        purchases[currentEditPurchaseIndex] = { ...pur, items: newItems, total };
        localStorage.setItem(CONFIG.STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
        
        bootstrap.Modal.getInstance(document.getElementById('editPurchaseInvoiceModal'))?.hide();
        _showNotification('نجاح', 'تم تعديل الفاتورة', 'success');
        renderPurchaseInvoices();
        currentEditPurchaseIndex = -1;
    }

    function initVoiceSearch() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        const rec = new SpeechRecognition();
        rec.lang = 'ar-DZ';
        rec.onresult = e => {
            document.getElementById('purchase-search').value = e.results[0][0].transcript;
            smartSearchPurchase(e.results[0][0].transcript);
        };
        document.getElementById('mic-purchase')?.addEventListener('click', () => rec.start());
    }

    return {
        purchaseCart, purchases, getPurchaseCart, showSubSection, smartSearchPurchase,
        selectProductPurchase, openQuickAddModal, addToPurchaseCart, renderPurchaseCart,
        removePurchaseCartItem, editPurchaseCartItemPrice, clearPurchaseCart,
        finishPurchaseAndPrint, renderPurchaseInvoices, deletePurchaseInvoice,
        editPurchaseInvoice, updatePurchaseInvoice, showPurchaseDetails, initVoiceSearch
    };
})();

window.purchasesModule = purchasesModule;
document.addEventListener('DOMContentLoaded', () => purchasesModule.initVoiceSearch());
