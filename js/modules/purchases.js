// ================== إدارة المشتريات - النسخة النهائية ==================
const purchasesModule = (function() {
    // ================== المتغيرات الخاصة ==================
    let purchaseCart = [];
    let purchases = JSON.parse(localStorage.getItem('ryan_purchases')) || [];
    let currentEditPurchaseIndex = -1;
    
    // ثوابت للتكوين
    const CONFIG = {
        MIN_QUANTITY: 1,
        CURRENCY: 'دج',
        STORAGE_KEYS: {
            PURCHASES: 'ryan_purchases'
        },
        SWAL_TIMER: 1500,
        MAX_CART_ITEMS: 100
    };

    // ================== دوال مساعدة خاصة ==================
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
            position: 'top-end',
            timerProgressBar: true
        });
    }

    function _showConfirmation(title, text, confirmCallback) {
        Swal.fire({
            title: title,
            text: text,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4caf50',
            cancelButtonColor: '#d33',
            confirmButtonText: 'نعم',
            cancelButtonText: 'إلغاء',
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed && confirmCallback) {
                confirmCallback();
            }
        });
    }

    // ================== إظهار القسم الفرعي ==================
    function showSubSection(subId) {
        const parent = document.querySelector('.active-section');
        if (!parent) return;
        
        parent.querySelectorAll('.sub-section').forEach(s => s.style.display = 'none');
        
        const targetSection = document.getElementById(subId);
        if (targetSection) {
            targetSection.style.display = 'block';
        }
        
        const tabs = parent.querySelectorAll('.tab-item');
        tabs.forEach(t => t.classList.remove('active-red', 'active-green', 'active-nardo'));
        
        tabs.forEach(t => {
            if (t.getAttribute('onclick') && t.getAttribute('onclick').includes(subId)) {
                if (parent.id === 'purchases') t.classList.add('active-green');
            }
        });
        
        if (subId === 'purchase-invoices') {
            renderPurchaseInvoices();
        }
        if (subId === 'suppliers' && typeof window.supplierModule !== 'undefined') {
            window.supplierModule.renderSuppliers();
        }
    }

    // ================== إدارة سلة المشتريات ==================
    function _calculateCartTotals() {
        return {
            subtotal: purchaseCart.reduce((sum, item) => sum + (item.qty * item.price), 0),
            total: purchaseCart.reduce((sum, item) => sum + item.total, 0),
            itemCount: purchaseCart.length,
            totalItems: purchaseCart.reduce((sum, item) => sum + item.qty, 0),
            averagePrice: purchaseCart.length > 0 
                ? purchaseCart.reduce((sum, item) => sum + item.price, 0) / purchaseCart.length 
                : 0
        };
    }

    function _validateCartItem(name, price, qty, product = null) {
        const errors = [];
        
        if (!name || name.trim() === '') {
            errors.push('اسم المنتج مطلوب');
        }
        
        if (isNaN(qty) || qty < CONFIG.MIN_QUANTITY) {
            errors.push(`الكمية يجب أن تكون ${CONFIG.MIN_QUANTITY} على الأقل`);
        }
        
        if (isNaN(price) || price <= 0) {
            errors.push('السعر يجب أن يكون أكبر من صفر');
        }
        
        if (price > 1000000) {
            errors.push('السعر كبير جداً');
        }
        
        return errors;
    }

    function _createCartItem(product, name, qty, price) {
        const total = qty * price;
        
        return {
            id: _generateId(),
            productId: product?.id || null,
            name: name,
            qty: qty,
            price: price,
            total: total,
            originalPrice: product?.buyPrice || price,
            unit: product?.unit || 'قطعة',
            addedAt: new Date().toISOString(),
            isCustomPrice: !product
        };
    }

    // ================== API العامة ==================
    function getPurchaseCart() {
        return [...purchaseCart];
    }

    function getPurchaseCartStats() {
        return _calculateCartTotals();
    }

    // ================== البحث الذكي ==================
    function smartSearchPurchase(val) {
        const box = document.getElementById('purchase-search-box');
        if (!box) return;
        
        const searchTerm = val.trim().toLowerCase();
        
        if (searchTerm.length < 1) { 
            box.style.display = 'none'; 
            return; 
        }
        
        // البحث في المخزون
        const matches = window.inventoryModule?.stock.filter(p => 
            p.name.toLowerCase().includes(searchTerm) || 
            (p.barcode && p.barcode.includes(searchTerm))
        ) || [];
        
        if (matches.length > 0) {
            box.innerHTML = matches.map(p => `
                <div class="search-item" onclick="purchasesModule.selectProductPurchase('${p.name}')">
                    <div class="d-flex justify-content-between align-items-center">
                        <b>${p.name}</b>
                        <span class="badge bg-success">${p.qty} ${p.unit}</span>
                    </div>
                    <div class="d-flex justify-content-between small">
                        <span class="text-muted">سعر الشراء: ${p.buyPrice} ${CONFIG.CURRENCY}</span>
                        <span class="text-primary">سعر البيع: ${p.sellPrice} ${CONFIG.CURRENCY}</span>
                    </div>
                </div>
            `).join('');
            box.style.display = 'block';
        } else {
            box.innerHTML = `
                <div class="search-item" onclick="purchasesModule.openQuickAddModal('${val}')">
                    <div class="text-center p-2">
                        <i class="material-icons-round text-success">add_business</i>
                        <div>لا توجد منتجات بهذا الاسم</div>
                        <small class="text-success">انقر لإضافة "${val}" كمنتج جديد</small>
                    </div>
                </div>
            `;
            box.style.display = 'block';
        }
    }

    function selectProductPurchase(name) {
        const searchInput = document.getElementById('purchase-search');
        const priceInput = document.getElementById('purchase-price');
        const qtyInput = document.getElementById('purchase-qty');
        
        if (!searchInput || !priceInput) return;
        
        searchInput.value = name;
        
        const product = window.inventoryModule?.stock.find(p => p.name === name);
        
        if (product) {
            priceInput.value = product.buyPrice;
            priceInput.dataset.originalPrice = product.buyPrice;
            
            // تأثير بصري
            priceInput.style.transition = 'background-color 0.3s';
            priceInput.style.backgroundColor = '#e8f5e9';
            setTimeout(() => priceInput.style.backgroundColor = '', 500);
            
            _showNotification('تم التحديد', `سعر الشراء المسجل: ${product.buyPrice} ${CONFIG.CURRENCY}`, 'info', 2000);
        } else {
            priceInput.value = '';
            delete priceInput.dataset.originalPrice;
        }
        
        document.getElementById('purchase-search-box').style.display = 'none';
        if (qtyInput) qtyInput.focus();
    }

    function openQuickAddModal(productName) {
        if (typeof window.inventoryModule !== 'undefined' && window.inventoryModule.saveQuickProduct) {
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

    // ================== إضافة إلى سلة المشتريات ==================
    function addToPurchaseCart() {
        const searchInput = document.getElementById('purchase-search');
        const priceInput = document.getElementById('purchase-price');
        const qtyInput = document.getElementById('purchase-qty');
        
        if (!searchInput || !priceInput || !qtyInput) {
            _showNotification('خطأ', 'بعض الحقول غير موجودة', 'error');
            return;
        }
        
        const name = searchInput.value.trim();
        let price = parseFloat(priceInput.value) || 0;
        const qty = parseFloat(qtyInput.value) || 0;
        
        // البحث عن المنتج
        const product = window.inventoryModule?.stock.find(p => p.name === name);
        
        // التحقق من صحة البيانات
        const errors = _validateCartItem(name, price, qty, product);
        
        if (errors.length > 0) {
            _showNotification('تنبيه', errors.join(' • '), 'warning');
            return;
        }
        
        // التحقق من الحد الأقصى للسلة
        if (purchaseCart.length >= CONFIG.MAX_CART_ITEMS) {
            _showNotification('تنبيه', `لا يمكن إضافة أكثر من ${CONFIG.MAX_CART_ITEMS} صنف`, 'warning');
            return;
        }
        
        // إذا كان المنتج موجوداً ولم يتم إدخال سعر، استخدم السعر المسجل
        if (product && price === 0) {
            price = product.buyPrice;
        }
        
        // إنشاء عنصر السلة
        const cartItem = _createCartItem(product, name, qty, price);
        purchaseCart.push(cartItem);
        
        // تحديث المخزون (زيادة الكمية)
        if (product && window.inventoryModule) {
            product.qty += qty;
            window.inventoryModule.saveStock();
            window.inventoryModule.addMovement('شراء', name, qty);
        }
        
        // تحديث واجهة المستخدم
        renderPurchaseCart();
        
        // إظهار رسالة نجاح
        _showNotification('تمت الإضافة', `تم إضافة ${name} إلى مشترياتك`, 'success');
        
        // إفراغ الحقول
        searchInput.value = '';
        priceInput.value = '';
        qtyInput.value = '1';
        
        // إخفاء نتائج البحث
        document.getElementById('purchase-search-box').style.display = 'none';
    }

    // ================== عرض سلة المشتريات ==================
    function renderPurchaseCart() {
        const tbody = document.getElementById('purchase-cart-table');
        if (!tbody) return;
        
        if (purchaseCart.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center p-4 text-muted">
                        <i class="material-icons-round" style="font-size: 48px;">shopping_basket</i>
                        <p>سلة المشتريات فارغة</p>
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = purchaseCart.map((item, idx) => {
                const isPriceModified = item.originalPrice && item.originalPrice !== item.price;
                const priceDisplay = isPriceModified 
                    ? `<span class="text-success">${item.price.toFixed(2)}</span> <small class="text-muted text-decoration-line-through">(${item.originalPrice.toFixed(2)})</small>`
                    : `<span>${item.price.toFixed(2)}</span>`;
                
                return `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.qty} ${item.unit}</td>
                    <td>${priceDisplay} ${CONFIG.CURRENCY}</td>
                    <td class="fw-bold text-success">${item.total.toFixed(2)} ${CONFIG.CURRENCY}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="purchasesModule.editPurchaseCartItemPrice('${item.id}')">
                            <i class="material-icons-round" style="font-size:16px;">edit</i>
                        </button>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="purchasesModule.removePurchaseCartItem('${item.id}')">
                            <i class="material-icons-round" style="font-size:16px;">delete</i>
                        </button>
                    </td>
                </tr>
            `}).join('');
        }
        
        // تحديث الإجمالي
        const totals = _calculateCartTotals();
        const grandTotalEl = document.getElementById('purchase-grand-total');
        if (grandTotalEl) {
            grandTotalEl.textContent = totals.total.toFixed(2);
            
            // تأثير بصري
            grandTotalEl.style.transition = 'color 0.3s';
            grandTotalEl.style.color = '#4caf50';
            setTimeout(() => grandTotalEl.style.color = '', 500);
        }
    }

    // ================== حذف عنصر من سلة المشتريات ==================
    function removePurchaseCartItem(itemId) {
        const itemIndex = purchaseCart.findIndex(item => item.id === itemId);
        
        if (itemIndex === -1) {
            _showNotification('خطأ', 'العنصر غير موجود', 'error');
            return;
        }
        
        const item = purchaseCart[itemIndex];
        
        _showConfirmation('تأكيد الحذف', `حذف "${item.name}" من المشتريات؟`, () => {
            // إعادة الكمية من المخزون (نقص)
            if (item.productId && window.inventoryModule) {
                const product = window.inventoryModule.stock.find(p => p.id === item.productId);
                if (product) {
                    product.qty -= item.qty;
                    window.inventoryModule.saveStock();
                }
            }
            
            purchaseCart.splice(itemIndex, 1);
            renderPurchaseCart();
            
            _showNotification('تم', 'تم حذف المنتج من المشتريات', 'success');
        });
    }

    // ================== تعديل سعر عنصر في سلة المشتريات ==================
    function editPurchaseCartItemPrice(itemId) {
        const itemIndex = purchaseCart.findIndex(item => item.id === itemId);
        
        if (itemIndex === -1) {
            _showNotification('خطأ', 'العنصر غير موجود', 'error');
            return;
        }
        
        const item = purchaseCart[itemIndex];
        
        Swal.fire({
            title: 'تعديل سعر الشراء',
            html: `
                <div style="text-align:right">
                    <p><strong>المنتج:</strong> ${item.name}</p>
                    <p><strong>الكمية:</strong> ${item.qty}</p>
                    <hr>
                    <div class="form-group">
                        <label class="form-label">السعر الجديد</label>
                        <div class="input-group">
                            <input type="number" id="edit-price-input" class="form-control" value="${item.price}" min="0.01" step="0.01">
                            <span class="input-group-text">دج</span>
                        </div>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'حفظ',
            cancelButtonText: 'إلغاء',
            confirmButtonColor: '#4caf50',
            preConfirm: () => {
                const newPrice = parseFloat(document.getElementById('edit-price-input').value);
                if (isNaN(newPrice) || newPrice <= 0) {
                    Swal.showValidationMessage('يجب إدخال سعر صحيح أكبر من صفر');
                    return false;
                }
                return newPrice;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const newPrice = result.value;
                const newTotal = item.qty * newPrice;
                
                // تحديث العنصر
                purchaseCart[itemIndex] = { 
                    ...item, 
                    price: newPrice, 
                    total: newTotal,
                    originalPrice: item.originalPrice || item.price
                };
                
                renderPurchaseCart();
                
                _showNotification('تم', 'تم تحديث سعر الشراء', 'success');
            }
        });
    }

    // ================== مسح سلة المشتريات بالكامل ==================
    function clearPurchaseCart() {
        if (purchaseCart.length === 0) {
            _showNotification('تنبيه', 'السلة فارغة', 'info');
            return;
        }
        
        _showConfirmation('تأكيد مسح السلة', 'هل أنت متأكد من مسح جميع المشتريات؟', () => {
            // إعادة الكميات إلى المخزون (نقص)
            if (window.inventoryModule) {
                purchaseCart.forEach(item => {
                    if (item.productId) {
                        const product = window.inventoryModule.stock.find(p => p.id === item.productId);
                        if (product) {
                            product.qty -= item.qty;
                        }
                    }
                });
                window.inventoryModule.saveStock();
            }
            
            purchaseCart = [];
            renderPurchaseCart();
            
            _showNotification('تم', 'تم مسح سلة المشتريات', 'success');
        });
    }

    // ================== إنهاء عملية الشراء والطباعة ==================
    function finishPurchaseAndPrint() {
        if (purchaseCart.length === 0) {
            _showNotification('تنبيه', 'السلة فارغة', 'warning');
            return;
        }
        
        const totals = _calculateCartTotals();
        const now = new Date();
        const invNo = purchases.length + 1;
        
        // الحصول على المورد
        const supplierSelect = document.getElementById('purchase-supplier');
        const supplier = supplierSelect?.options[supplierSelect.selectedIndex]?.text || 'غير محدد';
        const finalSupplier = supplier === '—— اختر المورد (اختياري) ——' ? 'غير محدد' : supplier;
        
        // إنشاء فاتورة الشراء
        const purchase = {
            id: _generateId(),
            number: invNo,
            date: now.toLocaleString('ar-DZ'),
            timestamp: now.toISOString(),
            supplier: finalSupplier,
            items: purchaseCart.map(item => ({ ...item })),
            ...totals,
            paymentMethod: 'نقدي'
        };
        
        purchases.push(purchase);
        localStorage.setItem(CONFIG.STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
        
        // تجهيز الطباعة
        _preparePrintPurchase(purchase, totals);
        
        // طباعة الفاتورة
        window.print();
        
        // تفريغ السلة
        purchaseCart = [];
        renderPurchaseCart();
        
        // تحديث التقارير
        if (typeof window.reportsModule !== 'undefined') {
            window.reportsModule.renderReports();
        }
        
        // تحديث قائمة الفواتير
        if (document.getElementById('purchase-invoices')?.style.display !== 'none') {
            renderPurchaseInvoices();
        }
        
        _showNotification('نجاح', 'تم حفظ فاتورة الشراء', 'success');
    }

    function _preparePrintPurchase(purchase, totals) {
        const elements = {
            'purchase-print-invoice-no': purchase.number,
            'purchase-print-date-time': purchase.date,
            'print-supplier': purchase.supplier,
            'purchase-print-grand-total': _formatCurrency(totals.total)
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        });
        
        const tbody = document.getElementById('purchase-print-cart-items');
        if (tbody) {
            tbody.innerHTML = purchaseCart.map(item => `
                <tr>
                    <td style="text-align:right;">${item.name}</td>
                    <td style="text-align:center;">${item.qty} ${item.unit}</td>
                    <td style="text-align:left;">${_formatCurrency(item.price)}</td>
                    <td style="text-align:left;">${_formatCurrency(item.total)}</td>
                </tr>
            `).join('');
        }
    }

    // ================== فواتير المشتريات ==================
    function renderPurchaseInvoices(filteredInvoices = null) {
        const tbody = document.getElementById('purchase-invoices-tbody');
        if (!tbody) return;
        
        const invs = filteredInvoices || purchases;
        
        if (invs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center p-4 text-muted">
                        <i class="material-icons-round" style="font-size: 48px;">receipt</i>
                        <p>لا توجد فواتير شراء</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = invs.map((pur, index) => {
            const originalIndex = purchases.findIndex(p => p.number === pur.number && p.date === pur.date);
            return `
            <tr>
                <td>#${pur.number}</td>
                <td>${new Date(pur.date).toLocaleDateString('ar-DZ')}</td>
                <td>${pur.supplier}</td>
                <td class="fw-bold text-success">${_formatCurrency(pur.total)}</td>
                <td><span class="badge bg-info">${pur.items.length} أصناف</span></td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="purchasesModule.showPurchaseInvoiceDetails(${pur.number})">
                        <i class="material-icons-round" style="font-size:16px;">visibility</i>
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="purchasesModule.editPurchaseInvoice(${originalIndex})">
                        <i class="material-icons-round" style="font-size:16px;">edit</i>
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="purchasesModule.deletePurchaseInvoice(${originalIndex})">
                        <i class="material-icons-round" style="font-size:16px;">delete</i>
                    </button>
                </td>
            </tr>
        `}).join('');
    }

    // ================== عرض تفاصيل فاتورة الشراء ==================
    function showPurchaseInvoiceDetails(invoiceNumber) {
        const purchase = purchases.find(p => p.number === invoiceNumber);
        
        if (!purchase) {
            _showNotification('خطأ', 'الفاتورة غير موجودة', 'error');
            return;
        }
        
        let itemsHtml = '';
        
        purchase.items.forEach((item, index) => {
            itemsHtml += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.name}</td>
                    <td>${item.qty} ${item.unit}</td>
                    <td>${item.price.toFixed(2)} دج</td>
                    <td>${(item.qty * item.price).toFixed(2)} دج</td>
                </tr>
            `;
        });
        
        const content = `
            <div style="text-align:right; padding:10px;">
                <div class="row mb-3">
                    <div class="col-6">
                        <p><strong>رقم الفاتورة:</strong> #${purchase.number}</p>
                        <p><strong>التاريخ:</strong> ${purchase.date}</p>
                    </div>
                    <div class="col-6">
                        <p><strong>المورد:</strong> ${purchase.supplier}</p>
                        <p><strong>الإجمالي:</strong> ${purchase.total.toFixed(2)} دج</p>
                    </div>
                </div>
                <hr>
                <h6 class="text-center mb-3">تفاصيل المنتجات</h6>
                <div class="table-responsive">
                    <table class="table table-sm table-bordered">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>المنتج</th>
                                <th>الكمية</th>
                                <th>سعر الوحدة</th>
                                <th>الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                        <tfoot>
                            <tr>
                                <th colspan="4" class="text-left">المجموع النهائي:</th>
                                <th>${purchase.total.toFixed(2)} دج</th>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;
        
        // عرض التفاصيل في نافذة منبثقة
        Swal.fire({
            title: `فاتورة شراء رقم ${purchase.number}`,
            html: content,
            width: '800px',
            confirmButtonText: 'إغلاق'
        });
    }

    // ================== البحث في فواتير الشراء ==================
    function searchPurchaseInvoices() {
        const searchInput = document.getElementById('purchase-invoice-search');
        if (!searchInput) return;
        
        const searchTerm = searchInput.value.trim().toLowerCase();
        
        if (searchTerm === '') {
            renderPurchaseInvoices();
            return;
        }
        
        const filtered = purchases.filter(pur => 
            pur.number.toString().includes(searchTerm) ||
            pur.supplier.toLowerCase().includes(searchTerm) ||
            pur.date.includes(searchTerm)
        );
        
        renderPurchaseInvoices(filtered);
    }

    // ================== حذف فاتورة شراء ==================
    function deletePurchaseInvoice(index) {
        if (index < 0 || index >= purchases.length) return;
        
        const purchase = purchases[index];
        
        _showConfirmation('تأكيد الحذف', `حذف فاتورة الشراء رقم ${purchase.number}؟`, () => {
            purchases.splice(index, 1);
            localStorage.setItem(CONFIG.STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
            renderPurchaseInvoices();
            
            if (typeof window.reportsModule !== 'undefined') {
                window.reportsModule.renderReports();
            }
            
            _showNotification('تم', 'تم حذف فاتورة الشراء', 'success');
        });
    }

    // ================== تعديل فاتورة شراء ==================
    function editPurchaseInvoice(index) {
        if (index < 0 || index >= purchases.length) return;
        
        currentEditPurchaseIndex = index;
        const pur = purchases[index];
        
        const numberSpan = document.getElementById('edit-purchase-invoice-number');
        if (numberSpan) numberSpan.textContent = pur.number;

        // التحقق من المنتجات المحذوفة
        const validItems = pur.items.filter(item => 
            !item.productId || (window.inventoryModule && window.inventoryModule.stock.some(p => p.id === item.productId))
        );
        
        if (validItems.length !== pur.items.length) {
            const removedCount = pur.items.length - validItems.length;
            _showNotification('تنبيه', `تم إزالة ${removedCount} منتج غير موجود`, 'warning');
            pur.items = validItems;
        }

        // عرض عناصر التعديل
        const container = document.getElementById('edit-purchase-invoice-items-container');
        if (!container) return;
        
        container.innerHTML = pur.items.map((item, i) => {
            const product = window.inventoryModule?.stock.find(p => p.id === item.productId);
            if (!product && item.productId) return '';
            
            return `
                <div class="edit-item-row p-3 mb-2 border rounded">
                    <div class="row g-2">
                        <div class="col-12">
                            <strong>${item.name}</strong>
                        </div>
                        <div class="col-6">
                            <label class="small">الكمية</label>
                            <input type="number" id="edit-purchase-qty-${i}" value="${item.qty}" min="1" class="form-control">
                        </div>
                        <div class="col-6">
                            <label class="small">السعر</label>
                            <input type="number" id="edit-purchase-price-${i}" value="${item.price}" min="0" step="0.01" class="form-control">
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        if (container.innerHTML === '') {
            container.innerHTML = '<p class="text-danger text-center p-3">لا توجد منتجات صالحة للتعديل</p>';
        }
        
        new bootstrap.Modal(document.getElementById('editPurchaseInvoiceModal')).show();
    }

    // ================== تحديث فاتورة الشراء ==================
    function updatePurchaseInvoice() {
        if (currentEditPurchaseIndex === -1) return;
        
        const pur = purchases[currentEditPurchaseIndex];
        const newItems = [];
        
        // جمع القيم المعدلة
        for (let i = 0; i < pur.items.length; i++) {
            const qtyInput = document.getElementById(`edit-purchase-qty-${i}`);
            const priceInput = document.getElementById(`edit-purchase-price-${i}`);
            
            if (!qtyInput || !priceInput) continue;
            
            const newQty = parseFloat(qtyInput.value);
            const newPrice = parseFloat(priceInput.value);
            
            if (isNaN(newQty) || newQty < 1 || isNaN(newPrice) || newPrice < 0) {
                _showNotification('خطأ', 'قيم غير صحيحة', 'error');
                return;
            }
            
            const total = newQty * newPrice;
            newItems.push({
                ...pur.items[i],
                qty: newQty,
                price: newPrice,
                total: total
            });
        }
        
        // تحديث المخزون
        if (window.inventoryModule) {
            // استعادة الكميات القديمة (نقص)
            pur.items.forEach(item => {
                if (item.productId) {
                    const prod = window.inventoryModule.stock.find(p => p.id === item.productId);
                    if (prod) prod.qty -= item.qty;
                }
            });
            
            // تطبيق الكميات الجديدة (زيادة)
            newItems.forEach(item => {
                if (item.productId) {
                    const prod = window.inventoryModule.stock.find(p => p.id === item.productId);
                    if (prod) prod.qty += item.qty;
                }
            });
            
            window.inventoryModule.saveStock();
        }
        
        // حساب الإجمالي الجديد
        const newTotal = newItems.reduce((sum, i) => sum + i.total, 0);
        
        // تحديث الفاتورة
        purchases[currentEditPurchaseIndex] = { 
            ...pur, 
            items: newItems, 
            total: newTotal,
            subtotal: newTotal
        };
        
        localStorage.setItem(CONFIG.STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
        
        bootstrap.Modal.getInstance(document.getElementById('editPurchaseInvoiceModal'))?.hide();
        
        _showNotification('نجاح', 'تم تعديل فاتورة الشراء', 'success');
        
        renderPurchaseInvoices();
        if (window.inventoryModule) window.inventoryModule.renderStock();
        
        if (typeof window.reportsModule !== 'undefined') {
            window.reportsModule.renderReports();
        }
        
        currentEditPurchaseIndex = -1;
    }

    // ================== البحث الصوتي للمشتريات ==================
    function initVoiceSearch() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn('المتصفح لا يدعم البحث الصوتي');
            return;
        }
        
        const recognition = new SpeechRecognition();
        recognition.lang = 'ar-DZ';
        recognition.interimResults = false;
        recognition.continuous = false;
        recognition.maxAlternatives = 1;
        
        recognition.onstart = () => {
            const micBtn = document.getElementById('mic-purchase');
            if (micBtn) {
                micBtn.classList.add('listening');
                micBtn.innerHTML = '<i class="material-icons-round">mic_off</i>';
                micBtn.style.backgroundColor = '#4caf50';
            }
        };
        
        recognition.onend = () => {
            const micBtn = document.getElementById('mic-purchase');
            if (micBtn) {
                micBtn.classList.remove('listening');
                micBtn.innerHTML = '<i class="material-icons-round">mic</i>';
                micBtn.style.backgroundColor = '';
            }
        };
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const searchInput = document.getElementById('purchase-search');
            
            if (searchInput) {
                searchInput.value = transcript;
                smartSearchPurchase(transcript);
                
                // تأثير بصري
                searchInput.style.transition = 'background-color 0.3s';
                searchInput.style.backgroundColor = '#e8f5e9';
                setTimeout(() => searchInput.style.backgroundColor = '', 500);
            }
        };
        
        recognition.onerror = (event) => {
            console.log('خطأ في التعرف على الصوت:', event.error);
            _showNotification('خطأ', 'فشل التعرف على الصوت', 'error');
        };
        
        const micButton = document.getElementById('mic-purchase');
        if (micButton) {
            micButton.addEventListener('click', (e) => {
                e.preventDefault();
                try {
                    recognition.start();
                } catch (e) {
                    console.log('البحث الصوتي قيد التشغيل بالفعل');
                }
            });
        }
    }

    // ================== تصدير الوحدة ==================
    return {
        purchaseCart: purchaseCart,
        purchases: purchases,
        getPurchaseCart,
        getPurchaseCartStats,
        showSubSection,
        smartSearchPurchase,
        selectProductPurchase,
        openQuickAddModal,
        addToPurchaseCart,
        renderPurchaseCart,
        removePurchaseCartItem,
        editPurchaseCartItemPrice,
        clearPurchaseCart,
        finishPurchaseAndPrint,
        renderPurchaseInvoices,
        searchPurchaseInvoices,
        deletePurchaseInvoice,
        editPurchaseInvoice,
        updatePurchaseInvoice,
        showPurchaseInvoiceDetails,
        initVoiceSearch,
        formatCurrency: _formatCurrency
    };
})();

// ================== تصدير للاستخدام العام ==================
window.purchasesModule = purchasesModule;

// تهيئة تلقائية عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('mic-purchase')) {
        purchasesModule.initVoiceSearch();
    }
});
