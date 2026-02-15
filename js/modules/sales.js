// ================== إدارة المبيعات - نسخة محسنة ==================
const salesModule = (function() {
    // ================== المتغيرات الخاصة ==================
    let cart = [];
    let invoices = JSON.parse(localStorage.getItem('ryan_invoices')) || [];
    let currentEditInvoiceIndex = -1;
    
    // ثوابت للتكوين
    const CONFIG = {
        MAX_DISCOUNT: 100,
        MIN_QUANTITY: 1,
        CURRENCY: 'دج',
        STORAGE_KEYS: {
            INVOICES: 'ryan_invoices'
        },
        SWAL_TIMER: 1500,
        ANIMATION_DURATION: 300
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
            confirmButtonText: 'نعم، متأكد',
            cancelButtonText: 'إلغاء',
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed && confirmCallback) {
                confirmCallback();
            }
        });
    }

    // ================== إدارة السلة المتقدمة ==================
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
        
        if (!name || name.trim() === '') {
            errors.push('اسم المنتج مطلوب');
        }
        
        if (isNaN(qty) || qty < CONFIG.MIN_QUANTITY) {
            errors.push(`الكمية يجب أن تكون ${CONFIG.MIN_QUANTITY} على الأقل`);
        }
        
        if (product && qty > product.qty) {
            errors.push(`الكمية المتوفرة: ${product.qty} ${product.unit || ''}`);
        }
        
        if (isNaN(price) || price <= 0) {
            errors.push('السعر يجب أن يكون أكبر من صفر');
        }
        
        if (isNaN(discount) || discount < 0 || discount > CONFIG.MAX_DISCOUNT) {
            errors.push(`الخصم يجب أن يكون بين 0 و ${CONFIG.MAX_DISCOUNT}%`);
        }
        
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

    // ================== API العامة ==================
    function getCart() {
        return [...cart]; // إرجاع نسخة وليس المرجع الأصلي
    }

    function getCartStats() {
        return _calculateCartTotals();
    }

    // ================== البحث الذكي المحسن ==================
    function smartSearch(val) {
        const box = document.getElementById('search-box');
        if (!box) return;
        
        const searchTerm = val.trim().toLowerCase();
        
        if (searchTerm.length < 1) { 
            box.style.display = 'none'; 
            return; 
        }
        
        // بحث متقدم مع ترتيب النتائج حسب الأقرب
        const matches = inventoryModule.stock
            .map(p => ({
                ...p,
                score: p.name.toLowerCase().includes(searchTerm) ? 2 : 
                       (p.barcode && p.barcode.includes(searchTerm)) ? 1 : 0
            }))
            .filter(p => p.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 10); // حد أقصى 10 نتائج
        
        if (matches.length > 0) {
            box.innerHTML = matches.map(p => `
                <div class="search-item animate__animated animate__fadeIn" onclick="salesModule.selectProduct('${p.name}')">
                    <div class="d-flex justify-content-between align-items-center">
                        <b>${p.name}</b>
                        ${p.qty < 5 ? '<span class="badge bg-danger">مخزون محدود</span>' : ''}
                    </div>
                    <div class="d-flex justify-content-between small">
                        <span class="text-muted">مخزون: ${p.qty} ${p.unit}</span>
                        <span class="text-primary">بيع: ${p.sellPrice} ${CONFIG.CURRENCY}</span>
                    </div>
                </div>
            `).join('');
            box.style.display = 'block';
        } else {
            box.innerHTML = `
                <div class="search-item" onclick="salesModule.openQuickAddModal('${val}')">
                    <div class="text-center p-2">
                        <i class="material-icons-round text-primary">add_circle</i>
                        <div>لا توجد منتجات بهذا الاسم</div>
                        <small class="text-primary">انقر لإضافة "${val}" كمنتج جديد</small>
                    </div>
                </div>
            `;
            box.style.display = 'block';
        }
    }

    function selectProduct(name) {
        const searchInput = document.getElementById('sale-search');
        const priceInput = document.getElementById('sale-price');
        const qtyInput = document.getElementById('sale-qty');
        
        if (!searchInput || !priceInput) return;
        
        searchInput.value = name;
        
        const product = inventoryModule.stock.find(p => p.name === name);
        
        if (product) {
            priceInput.value = product.sellPrice;
            priceInput.dataset.originalPrice = product.sellPrice;
            
            // تأثير بصري
            priceInput.style.transition = 'background-color 0.3s';
            priceInput.style.backgroundColor = '#e8f5e9';
            setTimeout(() => priceInput.style.backgroundColor = '', 500);
        } else {
            priceInput.value = '';
            delete priceInput.dataset.originalPrice;
        }
        
        document.getElementById('search-box').style.display = 'none';
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
            document.getElementById('quick-mode').value = 'sale';
            
            new bootstrap.Modal(document.getElementById('quickAddProductModal')).show();
        }
    }

    // ================== إضافة إلى السلة محسنة ==================
    function addToCart() {
        // الحصول على العناصر
        const searchInput = document.getElementById('sale-search');
        const priceInput = document.getElementById('sale-price');
        const qtyInput = document.getElementById('sale-qty');
        const discountInput = document.getElementById('sale-discount');
        
        if (!searchInput || !priceInput || !qtyInput) {
            _showNotification('خطأ', 'بعض الحقول غير موجودة', 'error');
            return;
        }
        
        const name = searchInput.value.trim();
        let price = parseFloat(priceInput.value) || 0;
        const qty = parseFloat(qtyInput.value) || 0;
        const discount = parseFloat(discountInput.value) || 0;
        
        // البحث عن المنتج
        const product = inventoryModule.stock.find(p => p.name === name);
        
        // التحقق من صحة البيانات
        const errors = _validateCartItem(name, price, qty, discount, product);
        
        if (errors.length > 0) {
            _showNotification('تنبيه', errors.join(' • '), 'warning');
            return;
        }
        
        // إذا كان المنتج موجوداً ولم يتم إدخال سعر، استخدم السعر المسجل
        if (product && price === 0) {
            price = product.sellPrice;
        }
        
        // إذا كان المنتج غير موجود ويوجد سعر
        if (!product && price <= 0) {
            _showNotification('تنبيه', 'الرجاء إدخال سعر للمنتج', 'warning');
            return;
        }
        
        // إنشاء عنصر السلة
        const cartItem = _createCartItem(product, name, qty, price, discount);
        cart.push(cartItem);
        
        // تحديث المخزون إذا كان المنتج موجوداً
        if (product) {
            product.qty -= qty;
            inventoryModule.saveStock();
            inventoryModule.addMovement('بيع', name, qty);
        }
        
        // تحديث واجهة المستخدم
        renderCart();
        
        // إظهار رسالة نجاح
        _showNotification('تمت الإضافة', `تم إضافة ${name} إلى السلة`, 'success');
        
        // إفراغ الحقول
        searchInput.value = '';
        priceInput.value = '';
        qtyInput.value = '';
        if (discountInput) discountInput.value = '';
        
        // إخفاء نتائج البحث
        document.getElementById('search-box').style.display = 'none';
    }

    // ================== عرض السلة محسن ==================
    function renderCart() {
        const tbody = document.getElementById('cart-table');
        if (!tbody) return;
        
        if (cart.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center p-4 text-muted">
                        <i class="material-icons-round" style="font-size: 48px;">shopping_cart</i>
                        <p>السلة فارغة</p>
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = cart.map((item, idx) => {
                const isPriceModified = item.originalPrice && item.originalPrice !== item.price;
                const priceDisplay = isPriceModified 
                    ? `<span class="text-danger">${item.price.toFixed(2)}</span> <small class="text-muted text-decoration-line-through">(${item.originalPrice.toFixed(2)})</small>`
                    : `<span>${item.price.toFixed(2)}</span>`;
                
                return `
                <tr class="animate__animated animate__fadeIn">
                    <td>${item.name}</td>
                    <td>${item.qty} ${item.unit}</td>
                    <td>${priceDisplay} ${CONFIG.CURRENCY}</td>
                    <td>${item.discount}%</td>
                    <td class="fw-bold">${item.total.toFixed(2)} ${CONFIG.CURRENCY}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="salesModule.removeCartItem('${item.id}')">
                            <i class="material-icons-round" style="font-size:16px;">delete</i>
                        </button>
                    </td>
                </tr>
            `}).join('');
        }
        
        // تحديث الإحصائيات
        const totals = _calculateCartTotals();
        
        const elements = {
            'total-discount': totals.totalDiscount,
            'grand-total': totals.total,
            'final-grand-total': totals.total
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value.toFixed(2);
        });
    }

    // ================== حذف عنصر من السلة محسن ==================
    function removeCartItem(itemId) {
        const itemIndex = cart.findIndex(item => item.id === itemId);
        
        if (itemIndex === -1) {
            _showNotification('خطأ', 'العنصر غير موجود', 'error');
            return;
        }
        
        const item = cart[itemIndex];
        
        _showConfirmation('تأكيد الحذف', `حذف "${item.name}" من السلة؟`, () => {
            // إعادة الكمية إلى المخزون
            if (item.productId) {
                const product = inventoryModule.stock.find(p => p.id === item.productId);
                if (product) {
                    product.qty += item.qty;
                    inventoryModule.saveStock();
                }
            }
            
            cart.splice(itemIndex, 1);
            renderCart();
            
            _showNotification('تم', 'تم حذف المنتج من السلة', 'success');
        });
    }

    // ================== مسح السلة محسن ==================
    function clearCart() {
        if (cart.length === 0) {
            _showNotification('تنبيه', 'السلة فارغة', 'info');
            return;
        }
        
        _showConfirmation('تأكيد مسح السلة', 'هل أنت متأكد من مسح جميع العناصر؟', () => {
            // إعادة الكميات إلى المخزون
            cart.forEach(item => {
                if (item.productId) {
                    const product = inventoryModule.stock.find(p => p.id === item.productId);
                    if (product) product.qty += item.qty;
                }
            });
            
            cart = [];
            inventoryModule.saveStock();
            renderCart();
            
            _showNotification('تم', 'تم مسح السلة', 'success');
        });
    }

    // ================== إنهاء البيع والطباعة محسن ==================
    function finishSaleAndPrint() {
        if (cart.length === 0) {
            _showNotification('تنبيه', 'السلة فارغة', 'warning');
            return;
        }
        
        // التحقق من صحة السلة
        const invalidItems = cart.filter(item => {
            if (!item.productId) return false;
            const product = inventoryModule.stock.find(p => p.id === item.productId);
            return product && product.qty < 0;
        });
        
        if (invalidItems.length > 0) {
            _showNotification('خطأ', 'بعض المنتجات بها مشكلة في المخزون', 'error');
            return;
        }
        
        const totals = _calculateCartTotals();
        const now = new Date();
        const invNo = invoices.length + 1;
        
        // الحصول على العميل
        const customerSelect = document.getElementById('sale-customer');
        const customer = customerSelect?.options[customerSelect.selectedIndex]?.text || 'غير محدد';
        const finalCustomer = customer === 'اختر العميل' ? 'نقدي' : customer;
        
        // إنشاء الفاتورة
        const invoice = {
            id: _generateId(),
            number: invNo,
            date: now.toLocaleString('ar-DZ'),
            timestamp: now.toISOString(),
            customer: finalCustomer,
            items: cart.map(item => ({ ...item })),
            ...totals,
            paymentMethod: 'نقدي',
            cashier: 'المستخدم'
        };
        
        invoices.push(invoice);
        localStorage.setItem(CONFIG.STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
        
        // تجهيز الطباعة
        _preparePrintInvoice(invoice, totals);
        
        // طباعة الفاتورة
        window.print();
        
        // تفريغ السلة
        cart = [];
        renderCart();
        
        // تحديث التقارير
        if (typeof reportsModule !== 'undefined') {
            reportsModule.renderReports();
        }
        
        // تحديث قائمة الفواتير
        if (document.getElementById('sale-invoices')?.style.display !== 'none') {
            renderSaleInvoices();
        }
        
        _showNotification('نجاح', 'تم حفظ الفاتورة', 'success');
    }

    function _preparePrintInvoice(invoice, totals) {
        const elements = {
            'print-invoice-no': invoice.number,
            'print-date-time': invoice.date,
            'print-customer': invoice.customer,
            'print-grand-total': _formatCurrency(totals.total),
            'print-total-discount': _formatCurrency(totals.totalDiscount)
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        });
        
        const tbody = document.getElementById('print-cart-items');
        if (tbody) {
            tbody.innerHTML = cart.map(item => `
                <tr>
                    <td style="text-align:right;">${item.name}</td>
                    <td style="text-align:center;">${item.qty}</td>
                    <td style="text-align:left;">${_formatCurrency(item.price)}</td>
                    <td style="text-align:left;">${item.discount}%</td>
                    <td style="text-align:left;">${_formatCurrency(item.total)}</td>
                </tr>
            `).join('');
        }
    }

    // ================== فواتير المبيعات محسنة ==================
    function renderSaleInvoices(filteredInvoices = null) {
        const tbody = document.getElementById('sale-invoices-tbody');
        if (!tbody) return;
        
        const invs = filteredInvoices || invoices;
        
        if (invs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center p-4 text-muted">
                        <i class="material-icons-round" style="font-size: 48px;">receipt</i>
                        <p>لا توجد فواتير</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = invs.map((inv, index) => {
            const originalIndex = invoices.findIndex(i => i.number === inv.number && i.date === inv.date);
            return `
            <tr>
                <td>#${inv.number}</td>
                <td>${new Date(inv.date).toLocaleDateString('ar-DZ')}</td>
                <td>${inv.customer}</td>
                <td class="fw-bold">${_formatCurrency(inv.total)}</td>
                <td><span class="badge bg-info">${inv.items.length} أصناف</span></td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="salesModule.editInvoice(${originalIndex})">
                        <i class="material-icons-round" style="font-size:16px;">edit</i>
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="salesModule.deleteInvoice(${originalIndex})">
                        <i class="material-icons-round" style="font-size:16px;">delete</i>
                    </button>
                </td>
            </tr>
        `}).join('');
    }

    function searchInvoices() {
        const searchInput = document.getElementById('invoice-search');
        if (!searchInput) return;
        
        const searchTerm = searchInput.value.trim().toLowerCase();
        
        if (searchTerm === '') {
            renderSaleInvoices();
            return;
        }
        
        const filtered = invoices.filter(inv => 
            inv.number.toString().includes(searchTerm) ||
            inv.customer.toLowerCase().includes(searchTerm) ||
            inv.date.includes(searchTerm)
        );
        
        renderSaleInvoices(filtered);
    }

    function deleteInvoice(index) {
        if (index < 0 || index >= invoices.length) return;
        
        const invoice = invoices[index];
        
        _showConfirmation('تأكيد الحذف', `حذف الفاتورة رقم ${invoice.number}؟`, () => {
            invoices.splice(index, 1);
            localStorage.setItem(CONFIG.STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
            renderSaleInvoices();
            
            if (typeof reportsModule !== 'undefined') {
                reportsModule.renderReports();
            }
            
            _showNotification('تم', 'تم حذف الفاتورة', 'success');
        });
    }

    function editInvoice(index) {
        if (index < 0 || index >= invoices.length) return;
        
        currentEditInvoiceIndex = index;
        const inv = invoices[index];
        
        const numberSpan = document.getElementById('edit-invoice-number');
        if (numberSpan) numberSpan.textContent = inv.number;

        // التحقق من المنتجات المحذوفة
        const validItems = inv.items.filter(item => 
            !item.productId || inventoryModule.stock.some(p => p.id === item.productId)
        );
        
        if (validItems.length !== inv.items.length) {
            const removedCount = inv.items.length - validItems.length;
            _showNotification('تنبيه', `تم إزالة ${removedCount} منتج غير موجود`, 'warning');
            inv.items = validItems;
        }

        // عرض عناصر التعديل
        const container = document.getElementById('edit-invoice-items-container');
        if (!container) return;
        
        container.innerHTML = inv.items.map((item, i) => {
            const product = inventoryModule.stock.find(p => p.id === item.productId);
            if (!product) return '';
            
            return `
                <div class="edit-item-row p-3 mb-2 border rounded">
                    <div class="row g-2">
                        <div class="col-12">
                            <strong>${item.name}</strong>
                        </div>
                        <div class="col-4">
                            <label class="small">الكمية</label>
                            <input type="number" id="edit-qty-${i}" value="${item.qty}" min="1" class="form-control">
                        </div>
                        <div class="col-4">
                            <label class="small">السعر</label>
                            <input type="number" id="edit-price-${i}" value="${item.price}" min="0" step="0.01" class="form-control">
                        </div>
                        <div class="col-4">
                            <label class="small">الخصم %</label>
                            <input type="number" id="edit-discount-${i}" value="${item.discount || 0}" min="0" max="100" class="form-control">
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        if (container.innerHTML === '') {
            container.innerHTML = '<p class="text-danger text-center p-3">لا توجد منتجات صالحة للتعديل</p>';
        }
        
        new bootstrap.Modal(document.getElementById('editInvoiceModal')).show();
    }

    function updateInvoice() {
        if (currentEditInvoiceIndex === -1) return;
        
        const inv = invoices[currentEditInvoiceIndex];
        const newItems = [];
        
        // جمع القيم المعدلة
        for (let i = 0; i < inv.items.length; i++) {
            const qtyInput = document.getElementById(`edit-qty-${i}`);
            const priceInput = document.getElementById(`edit-price-${i}`);
            const discountInput = document.getElementById(`edit-discount-${i}`);
            
            if (!qtyInput || !priceInput || !discountInput) continue;
            
            const newQty = parseFloat(qtyInput.value);
            const newPrice = parseFloat(priceInput.value);
            const newDiscount = parseFloat(discountInput.value) || 0;
            
            if (isNaN(newQty) || newQty < 1 || isNaN(newPrice) || newPrice < 0 || newDiscount > 100) {
                _showNotification('خطأ', 'قيم غير صحيحة', 'error');
                return;
            }
            
            const total = newQty * newPrice * (1 - newDiscount / 100);
            newItems.push({
                ...inv.items[i],
                qty: newQty,
                price: newPrice,
                discount: newDiscount,
                total: total
            });
        }
        
        // استعادة الكميات القديمة
        inv.items.forEach(item => {
            if (item.productId) {
                const prod = inventoryModule.stock.find(p => p.id === item.productId);
                if (prod) prod.qty += item.qty;
            }
        });
        
        // التحقق من الكميات الجديدة
        let stockOk = true;
        newItems.forEach(item => {
            if (!item.productId) return;
            const prod = inventoryModule.stock.find(p => p.id === item.productId);
            if (prod && item.qty > prod.qty) {
                _showNotification('خطأ', `الكمية المطلوبة لـ ${item.name} غير متوفرة`, 'error');
                stockOk = false;
            }
        });
        
        if (!stockOk) {
            // إعادة الكميات القديمة
            inv.items.forEach(item => {
                if (item.productId) {
                    const prod = inventoryModule.stock.find(p => p.id === item.productId);
                    if (prod) prod.qty -= item.qty;
                }
            });
            return;
        }
        
        // تطبيق الكميات الجديدة
        newItems.forEach(item => {
            if (item.productId) {
                const prod = inventoryModule.stock.find(p => p.id === item.productId);
                if (prod) prod.qty -= item.qty;
            }
        });
        
        // حساب الإجماليات الجديدة
        const totals = {
            subtotal: newItems.reduce((sum, i) => sum + (i.qty * i.price), 0),
            totalDiscount: newItems.reduce((sum, i) => sum + (i.qty * i.price * (i.discount / 100)), 0),
            total: newItems.reduce((sum, i) => sum + i.total, 0)
        };
        
        // تحديث الفاتورة
        invoices[currentEditInvoiceIndex] = {
            ...inv,
            items: newItems,
            ...totals
        };
        
        localStorage.setItem(CONFIG.STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
        inventoryModule.saveStock();
        
        bootstrap.Modal.getInstance(document.getElementById('editInvoiceModal'))?.hide();
        
        _showNotification('نجاح', 'تم تعديل الفاتورة', 'success');
        
        renderSaleInvoices();
        inventoryModule.renderStock();
        
        if (typeof reportsModule !== 'undefined') {
            reportsModule.renderReports();
        }
        
        currentEditInvoiceIndex = -1;
    }

    // ================== البحث الصوتي المحسن ==================
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
            const micBtn = document.getElementById('mic-sale');
            if (micBtn) {
                micBtn.classList.add('listening');
                micBtn.innerHTML = '<i class="material-icons-round">mic_off</i>';
            }
        };
        
        recognition.onend = () => {
            const micBtn = document.getElementById('mic-sale');
            if (micBtn) {
                micBtn.classList.remove('listening');
                micBtn.innerHTML = '<i class="material-icons-round">mic</i>';
            }
        };
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const searchInput = document.getElementById('sale-search');
            
            if (searchInput) {
                searchInput.value = transcript;
                smartSearch(transcript);
                
                // تأثير بصري
                searchInput.style.backgroundColor = '#e8f5e9';
                setTimeout(() => searchInput.style.backgroundColor = '', 500);
            }
        };
        
        recognition.onerror = (event) => {
            console.log('خطأ في التعرف على الصوت:', event.error);
            _showNotification('خطأ', 'فشل التعرف على الصوت', 'error');
        };
        
        const micButton = document.getElementById('mic-sale');
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
        // الحالة
        cart: cart,
        invoices: invoices,
        
        // الدوال الأساسية
        getCart,
        getCartStats,
        
        // البحث
        smartSearch,
        selectProduct,
        openQuickAddModal,
        
        // إدارة السلة
        addToCart,
        renderCart,
        removeCartItem,
        clearCart,
        
        // إنهاء البيع
        finishSaleAndPrint,
        
        // إدارة الفواتير
        renderSaleInvoices,
        searchInvoices,
        deleteInvoice,
        editInvoice,
        updateInvoice,
        
        // البحث الصوتي
        initVoiceSearch,
        
        // دوال مساعدة (للاستخدام في وحدات أخرى)
        formatCurrency: _formatCurrency
    };
})();

// ================== تصدير للاستخدام العام ==================
window.salesModule = salesModule;

// تهيئة تلقائية عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('mic-sale')) {
        salesModule.initVoiceSearch();
    }
});
