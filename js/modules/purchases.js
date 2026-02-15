// ================== إدارة المشتريات - نسخة محسنة ==================
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
            confirmButtonText: 'نعم، متأكد',
            cancelButtonText: 'إلغاء',
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed && confirmCallback) {
                confirmCallback();
            }
        });
    }

    // ================== إدارة سلة المشتريات المتقدمة ==================
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

    // ================== البحث الذكي المحسن ==================
    function smartSearchPurchase(val) {
        const box = document.getElementById('purchase-search-box');
        if (!box) return;
        
        const searchTerm = val.trim().toLowerCase();
        
        if (searchTerm.length < 1) { 
            box.style.display = 'none'; 
            return; 
        }
        
        const matches = inventoryModule.stock
            .map(p => ({
                ...p,
                score: p.name.toLowerCase().includes(searchTerm) ? 2 : 
                       (p.barcode && p.barcode.includes(searchTerm)) ? 1 : 0
            }))
            .filter(p => p.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
        
        if (matches.length > 0) {
            box.innerHTML = matches.map(p => `
                <div class="search-item animate__animated animate__fadeIn" onclick="purchasesModule.selectProductPurchase('${p.name}')">
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
        
        const product = inventoryModule.stock.find(p => p.name === name);
        
        if (product) {
            priceInput.value = product.buyPrice;
            priceInput.dataset.originalPrice = product.buyPrice;
            
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
        if (typeof inventoryModule !== 'undefined' && inventoryModule.saveQuickProduct) {
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

    // ================== إضافة إلى سلة المشتريات محسنة ==================
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
        
        const product = inventoryModule.stock.find(p => p.name === name);
        
        const errors = _validateCartItem(name, price, qty, product);
        
        if (errors.length > 0) {
            _showNotification('تنبيه', errors.join(' • '), 'warning');
            return;
        }
        
        if (purchaseCart.length >= CONFIG.MAX_CART_ITEMS) {
            _showNotification('تنبيه', `لا يمكن إضافة أكثر من ${CONFIG.MAX_CART_ITEMS} صنف`, 'warning');
            return;
        }
        
        if (product && price === 0) {
            price = product.buyPrice;
        }
        
        const cartItem = _createCartItem(product, name, qty, price);
        purchaseCart.push(cartItem);
        
        if (product) {
            product.qty += qty;
            inventoryModule.saveStock();
            inventoryModule.addMovement('شراء', name, qty);
        }
        
        renderPurchaseCart();
        
        _showNotification('تمت الإضافة', `تم إضافة ${name} إلى مشترياتك`, 'success');
        
        searchInput.value = '';
        priceInput.value = '';
        qtyInput.value = '';
        
        document.getElementById('purchase-search-box').style.display = 'none';
    }

    // ================== عرض سلة المشتريات محسن ==================
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
                <tr class="animate__animated animate__fadeIn">
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
        
        const totals = _calculateCartTotals();
        const grandTotalEl = document.getElementById('purchase-grand-total');
        if (grandTotalEl) {
            grandTotalEl.textContent = totals.total.toFixed(2);
            
            grandTotalEl.style.transition = 'color 0.3s';
            grandTotalEl.style.color = '#4caf50';
            setTimeout(() => grandTotalEl.style.color = '', 500);
        }
    }

    // ================== حذف عنصر من سلة المشتريات محسن ==================
    function removePurchaseCartItem(itemId) {
        const itemIndex = purchaseCart.findIndex(item => item.id === itemId);
        
        if (itemIndex === -1) {
            _showNotification('خطأ', 'العنصر غير موجود', 'error');
            return;
        }
        
        const item = purchaseCart[itemIndex];
        
        _showConfirmation('تأكيد الحذف', `حذف "${item.name}" من المشتريات؟`, () => {
            if (item.productId) {
                const product = inventoryModule.stock.find(p => p.id === item.productId);
                if (product) {
                    product.qty -= item.qty;
                    inventoryModule.saveStock();
                }
            }
            
            purchaseCart.splice(itemIndex, 1);
            renderPurchaseCart();
            
            _showNotification('تم', 'تم حذف المنتج من المشتريات', 'success');
        });
    }

    // ================== تعديل سعر عنصر في سلة المشتريات محسن ==================
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
                <div class="text-right">
                    <label>المنتج: <strong>${item.name}</strong></label><br>
                    <label>الكمية: ${item.qty}</label>
                </div>
            `,
            input: 'number',
            inputLabel: 'السعر الجديد (دج)',
            inputValue: item.price,
            inputAttributes: {
                min: 0.01,
                step: 0.01,
                dir: 'ltr'
            },
            showCancelButton: true,
            confirmButtonText: 'حفظ',
            cancelButtonText: 'إلغاء',
            confirmButtonColor: '#4caf50',
            preConfirm: (value) => {
                const newPrice = parseFloat(value);
                if (isNaN(newPrice) || newPrice <= 0) {
                    Swal.showValidationMessage('يجب إدخال سعر صحيح أكبر من صفر');
                    return false;
                }
                return newPrice;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const newPrice = result.value;
                const oldPrice = item.price;
                const newTotal = item.qty * newPrice;
                
                purchaseCart[itemIndex] = { 
                    ...item, 
                    price: newPrice, 
                    total: newTotal,
                    originalPrice: item.originalPrice || oldPrice
                };
                
                if (item.productId) {
                    inventoryModule.addMovement('تعديل سعر شراء', item.name, 0);
                }
                
                renderPurchaseCart();
                
                _showNotification('تم', 'تم تحديث سعر الشراء', 'success');
            }
        });
    }

    // ================== مسح سلة المشتريات بالكامل محسن ==================
    function clearPurchaseCart() {
        if (purchaseCart.length === 0) {
            _showNotification('تنبيه', 'السلة فارغة', 'info');
            return;
        }
        
        _showConfirmation('تأكيد مسح السلة', 'هل أنت متأكد من مسح جميع المشتريات؟', () => {
            purchaseCart.forEach(item => {
                if (item.productId) {
                    const product = inventoryModule.stock.find(p => p.id === item.productId);
                    if (product) {
                        product.qty -= item.qty;
                    }
                }
            });
            
            purchaseCart = [];
            inventoryModule.saveStock();
            renderPurchaseCart();
            
            _showNotification('تم', 'تم مسح سلة المشتريات', 'success');
        });
    }

    // ================== إنهاء عملية الشراء والطباعة محسن ==================
    function finishPurchaseAndPrint() {
        if (purchaseCart.length === 0) {
            _showNotification('تنبيه', 'السلة فارغة', 'warning');
            return;
        }
        
        const totals = _calculateCartTotals();
        const now = new Date();
        const invNo = purchases.length + 1;
        
        const supplierSelect = document.getElementById('purchase-supplier');
        const supplier = supplierSelect?.options[supplierSelect.selectedIndex]?.text || 'غير محدد';
        const finalSupplier = supplier === 'اختر المورد' ? 'غير محدد' : supplier;
        
        const purchase = {
            id: _generateId(),
            number: invNo,
            date: now.toLocaleString('ar-DZ'),
            timestamp: now.toISOString(),
            supplier: finalSupplier,
            items: purchaseCart.map(item => ({ ...item })),
            ...totals,
            paymentMethod: 'نقدي',
            notes: ''
        };
        
        purchases.push(purchase);
        localStorage.setItem(CONFIG.STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
        
        _preparePrintPurchase(purchase, totals);
        
        window.print();
        
        purchaseCart = [];
        renderPurchaseCart();
        
        if (typeof reportsModule !== 'undefined') {
            reportsModule.renderReports();
        }
        
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

    // ================== فواتير المشتريات محسنة ==================
    function renderPurchaseInvoices() {
        const tbody = document.getElementById('purchase-invoices-tbody');
        if (!tbody) return;
        
        if (purchases.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center p-4 text-muted">
                        <i class="material-icons-round" style="font-size: 48px;">receipt</i>
                        <p>لا توجد فواتير مشتريات</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = purchases.map((pur, index) => `
            <tr>
                <td>#${pur.number}</td>
                <td>${new Date(pur.date).toLocaleDateString('ar-DZ')}</td>
                <td>${pur.supplier}</td>
                <td class="fw-bold text-success">${_formatCurrency(pur.total)}</td>
                <td><span class="badge bg-info">${pur.items.length} أصناف</span></td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="purchasesModule.editPurchaseInvoice(${index})">
                        <i class="material-icons-round" style="font-size:16px;">edit</i>
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="purchasesModule.deletePurchaseInvoice(${index})">
                        <i class="material-icons-round" style="font-size:16px;">delete</i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    function deletePurchaseInvoice(index) {
        if (index < 0 || index >= purchases.length) return;
        
        const purchase = purchases[index];
        
        _showConfirmation('تأكيد الحذف', `حذف فاتورة الشراء رقم ${purchase.number}؟`, () => {
            purchases.splice(index, 1);
            localStorage.setItem(CONFIG.STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
            renderPurchaseInvoices();
            
            if (typeof reportsModule !== 'undefined') {
                reportsModule.renderReports();
            }
            
            _showNotification('تم', 'تم حذف فاتورة الشراء', 'success');
        });
    }

    function editPurchaseInvoice(index) {
        if (index < 0 || index >= purchases.length) return;
        
        currentEditPurchaseIndex = index;
        const pur = purchases[index];
        
        const numberSpan = document.getElementById('edit-purchase-invoice-number');
        if (numberSpan) numberSpan.textContent = pur.number;

        const validItems = pur.items.filter(item => 
            !item.productId || inventoryModule.stock.some(p => p.id === item.productId)
        );
        
        if (validItems.length !== pur.items.length) {
            const removedCount = pur.items.length - validItems.length;
            _showNotification('تنبيه', `تم إزالة ${removedCount} منتج غير موجود`, 'warning');
            pur.items = validItems;
        }

        const container = document.getElementById('edit-purchase-invoice-items-container');
        if (!container) return;
        
        container.innerHTML = pur.items.map((item, i) => {
            const product = inventoryModule.stock.find(p => p.id === item.productId);
            if (!product) return '';
            
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

    function updatePurchaseInvoice() {
        if (currentEditPurchaseIndex === -1) return;
        
        const pur = purchases[currentEditPurchaseIndex];
        const newItems = [];
        
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
        
        pur.items.forEach(item => {
            if (item.productId) {
                const prod = inventoryModule.stock.find(p => p.id === item.productId);
                if (prod) prod.qty -= item.qty;
            }
        });
        
        newItems.forEach(item => {
            if (item.productId) {
                const prod = inventoryModule.stock.find(p => p.id === item.productId);
                if (prod) prod.qty += item.qty;
            }
        });
        
        const newTotal = newItems.reduce((sum, i) => sum + i.total, 0);
        
        purchases[currentEditPurchaseIndex] = { 
            ...pur, 
            items: newItems, 
            total: newTotal,
            subtotal: newTotal
        };
        
        localStorage.setItem(CONFIG.STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
        inventoryModule.saveStock();
        
        bootstrap.Modal.getInstance(document.getElementById('editPurchaseInvoiceModal'))?.hide();
        
        _showNotification('نجاح', 'تم تعديل فاتورة الشراء', 'success');
        
        renderPurchaseInvoices();
        inventoryModule.renderStock();
        
        if (typeof reportsModule !== 'undefined') {
            reportsModule.renderReports();
        }
        
        currentEditPurchaseIndex = -1;
    }

    // ================== البحث الصوتي المحسن للمشتريات ==================
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

    // ================== دالة showSubSection ==================
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
        if (subId === 'suppliers' && typeof supplierModule !== 'undefined') {
            supplierModule.renderSuppliers();
        }
    }

    // ================== تصدير الوحدة ==================
    return {
        purchaseCart: purchaseCart,
        purchases: purchases,
        getPurchaseCart,
        getPurchaseCartStats,
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
        deletePurchaseInvoice,
        editPurchaseInvoice,
        updatePurchaseInvoice,
        initVoiceSearch,
        showSubSection,
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
