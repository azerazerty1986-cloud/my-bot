// ================== sales.js - إدارة المبيعات المتقدمة ==================
// الرقم 23 في ترتيب الملفات - نسخة محسنة مع دعم سعر الجملة والبحث عن العملاء

const salesModule = (function() {
    // ================== البيانات ==================
    let cart = [];
    let invoices = JSON.parse(localStorage.getItem('sales_invoices')) || [];
    let currentInvoice = null;
    
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
    
    // ================== إضافة منتج إلى السلة (محدث) ==================
    function addToCart() {
        const searchInput = document.getElementById('sale-search');
        const productName = searchInput?.value.trim();
        const qty = parseInt(document.getElementById('sale-qty')?.value) || 1;
        const discount = parseFloat(document.getElementById('sale-discount')?.value) || 0;
        const useWholesale = document.getElementById('use-wholesale')?.checked || false;
        
        if (!productName) {
            showNotification('تنبيه', 'الرجاء اختيار منتج', 'warning');
            return false;
        }
        
        const products = window.productModule?.getAllProducts?.() || [];
        const product = products.find(p => p.name === productName);
        
        if (!product) {
            showNotification('تنبيه', 'المنتج غير موجود', 'warning');
            return false;
        }
        
        // اختيار السعر المناسب (تجزئة أو جملة)
        const price = useWholesale && product.wholesalePrice ? product.wholesalePrice : product.sellPrice;
        const priceType = useWholesale && product.wholesalePrice ? 'جملة' : 'تجزئة';
        
        if (product.quantity < qty) {
            showNotification('تنبيه', 'الكمية غير متوفرة في المخزون', 'warning');
            return false;
        }
        
        const existingItem = cart.find(item => item.productId === product.id);
        if (existingItem) {
            existingItem.qty += qty;
            existingItem.priceType = priceType;
            existingItem.total = (existingItem.price * existingItem.qty) * (1 - existingItem.discount / 100);
        } else {
            cart.push({
                id: Date.now() + Math.random(),
                productId: product.id,
                name: product.name,
                price: price,
                priceType: priceType,
                qty: qty,
                discount: discount,
                total: (price * qty) * (1 - discount / 100)
            });
        }
        
        renderCart();
        
        if (searchInput) searchInput.value = '';
        document.getElementById('sale-qty').value = '1';
        document.getElementById('sale-discount').value = '0';
        
        showNotification('نجاح', `تم إضافة المنتج (${priceType})`);
        updateCartCount();
        return true;
    }
    
    // ================== عرض السلة ==================
    function renderCart() {
        const tbody = document.getElementById('cart-table');
        if (!tbody) return;
        
        if (cart.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4"><i class="material-icons-round" style="font-size:48px;">shopping_cart</i><br>السلة فارغة</td></tr>';
            updateTotals();
            updateCartCount();
            return;
        }
        
        tbody.innerHTML = cart.map((item, index) => `
            <tr>
                <td>${item.name} ${item.priceType ? `<small class="text-muted">(${item.priceType})</small>` : ''}</td>
                <td>${item.qty}</td>
                <td>${formatCurrency(item.price)}</td>
                <td>${item.discount}%</td>
                <td>${formatCurrency(item.total)}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="salesModule.removeFromCart('${item.id}')">
                        <i class="material-icons-round">delete</i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        updateTotals();
        updateCartCount();
    }
    
    // ================== تحديث المجاميع ==================
    function updateTotals() {
        const totalDiscount = cart.reduce((sum, item) => {
            return sum + (item.price * item.qty * item.discount / 100);
        }, 0);
        
        const grandTotal = cart.reduce((sum, item) => sum + item.total, 0);
        
        const totalDiscountEl = document.getElementById('total-discount');
        const grandTotalEl = document.getElementById('grand-total');
        const finalGrandTotalEl = document.getElementById('final-grand-total');
        
        if (totalDiscountEl) totalDiscountEl.textContent = formatCurrency(totalDiscount) + ' دج';
        if (grandTotalEl) grandTotalEl.textContent = formatCurrency(grandTotal) + ' دج';
        if (finalGrandTotalEl) finalGrandTotalEl.textContent = formatCurrency(grandTotal) + ' دج';
    }
    
    // ================== تحديث عداد السلة ==================
    function updateCartCount() {
        const countEl = document.getElementById('cart-count');
        if (countEl) countEl.textContent = cart.length;
    }
    
    // ================== حذف من السلة ==================
    function removeFromCart(itemId) {
        cart = cart.filter(item => item.id !== itemId);
        renderCart();
        showNotification('تم', 'تم حذف المنتج');
    }
    
    // ================== مسح السلة ==================
    function clearCart() {
        if (cart.length === 0) return;
        
        showConfirmation('تأكيد', 'هل تريد تفريغ السلة؟', () => {
            cart = [];
            renderCart();
            showNotification('تم', 'تم تفريغ السلة');
        });
    }
    
    // ================== دوال البحث عن العملاء (جديد) ==================
    
    // بحث العملاء المباشر
    function searchCustomers(query) {
        const resultsDiv = document.getElementById('customer-results');
        if (!resultsDiv) return;
        
        if (!query || query.length < 1) {
            resultsDiv.style.display = 'none';
            resultsDiv.innerHTML = '';
            return;
        }
        
        // جلب العملاء من customerModule
        const customers = window.customerModule?.getAllCustomers?.() || [];
        
        // فلترة النتائج
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
        
        // عرض النتائج
        let html = '';
        results.forEach(customer => {
            const customerName = customer.fullname || customer.name || 'بدون اسم';
            const customerPhone = customer.phone1 || customer.phone || '';
            html += `
                <div class="search-item" onclick="salesModule.selectCustomer('${customer.id}')">
                    <i class="material-icons-round">person</i>
                    <div>
                        <strong>${customerName}</strong>
                        <small class="text-muted d-block">${customerPhone || 'لا يوجد رقم'}</small>
                    </div>
                </div>
            `;
        });
        
        resultsDiv.innerHTML = html;
        resultsDiv.style.display = 'block';
    }
    
    // تحديد عميل
    function selectCustomer(customerId) {
        const customers = window.customerModule?.getAllCustomers?.() || [];
        const customer = customers.find(c => c.id === customerId);
        
        if (!customer) return;
        
        const customerName = customer.fullname || customer.name || 'بدون اسم';
        const customerPhone = customer.phone1 || customer.phone || '';
        
        // تحديث حقل البحث
        const searchInput = document.getElementById('customer-search');
        if (searchInput) {
            searchInput.value = customerName;
        }
        
        // إخفاء نتائج البحث
        const resultsDiv = document.getElementById('customer-results');
        if (resultsDiv) {
            resultsDiv.style.display = 'none';
        }
        
        // تحديث القائمة المنسدلة المخفية
        const selectBox = document.getElementById('sale-customer');
        if (selectBox) {
            // إضافة الخيار إذا لم يكن موجوداً
            if (!selectBox.querySelector(`option[value="${customer.id}"]`)) {
                const option = document.createElement('option');
                option.value = customer.id;
                option.textContent = customerName;
                selectBox.appendChild(option);
            }
            selectBox.value = customer.id;
        }
        
        // عرض شارة العميل المحدد
        showSelectedCustomerBadge(customerName, customerPhone, customer.id);
        
        // رسالة تأكيد
        showNotification('تم التحديد', `العميل: ${customerName}`, 'success');
    }
    
    // عرض شارة العميل المحدد
    function showSelectedCustomerBadge(name, phone, id) {
        const badgeContainer = document.getElementById('selected-customer-badge');
        if (!badgeContainer) return;
        
        const nameSpan = document.getElementById('selected-customer-name');
        if (nameSpan) {
            nameSpan.textContent = name;
        }
        
        badgeContainer.style.display = 'block';
    }
    
    // إلغاء تحديد العميل
    function clearSelectedCustomer() {
        // تفريغ حقل البحث
        const searchInput = document.getElementById('customer-search');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // إخفاء شارة العميل
        const badgeContainer = document.getElementById('selected-customer-badge');
        if (badgeContainer) {
            badgeContainer.style.display = 'none';
        }
        
        // إعادة تعيين القائمة المنسدلة
        const selectBox = document.getElementById('sale-customer');
        if (selectBox) {
            selectBox.value = '';
        }
        
        showNotification('تم', 'تم إلغاء تحديد العميل');
    }
    
    // فتح نافذة إضافة عميل
    function openAddCustomerModal() {
        if (window.customerModule?.openAddModal) {
            window.customerModule.openAddModal();
        } else {
            // بديل إذا لم توجد الدالة
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
                    
                    // حفظ في localStorage مؤقتاً
                    const customers = JSON.parse(localStorage.getItem('customers') || '[]');
                    customers.push(newCustomer);
                    localStorage.setItem('customers', JSON.stringify(customers));
                    
                    // تحديث customerModule إذا وجد
                    if (window.customerModule?.loadCustomers) {
                        window.customerModule.loadCustomers();
                    }
                    
                    selectCustomer(newCustomer.id);
                    showNotification('نجاح', 'تم إضافة العميل');
                }
            });
        }
    }
    
    // تحميل العملاء للقائمة المنسدلة
    function loadCustomers() {
        const customers = window.customerModule?.getAllCustomers?.() || [];
        // محاولة تحميل من localStorage إذا كانت customerModule غير موجودة
        if (customers.length === 0) {
            const stored = JSON.parse(localStorage.getItem('customers') || '[]');
            customers.push(...stored);
        }
        
        const select = document.getElementById('sale-customer');
        
        if (select) {
            select.innerHTML = '<option value="">اختر العميل (اختياري)</option>' + 
                customers.map(c => `<option value="${c.id}">${c.fullname || c.name} ${c.phone1 || c.phone ? '- ' + (c.phone1 || c.phone) : ''}</option>`).join('');
        }
    }
    
    // ================== إنهاء البيع (محدث) ==================
    function finishSale() {
        if (cart.length === 0) {
            showNotification('تنبيه', 'السلة فارغة', 'warning');
            return null;
        }
        
        // الحصول على العميل المحدد
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
            return sum + (item.price * item.qty * item.discount / 100);
        }, 0);
        
        const grandTotal = cart.reduce((sum, item) => sum + item.total, 0);
        
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
            paymentMethod: paymentMethod,
            paymentText: paymentText,
            status: 'completed',
            createdBy: 'admin',
            notes: ''
        };
        
        invoices.push(invoice);
        saveInvoices();
        
        // تحديث المخزون
        cart.forEach(item => {
            window.inventoryModule?.removeStock(item.productId, item.qty, `فاتورة مبيعات رقم ${invoice.number}`);
        });
        
        // تحديث إحصائيات العميل
        if (customerId && paymentMethod === 'credit') {
            window.customerModule?.addDebt?.(customerId, grandTotal);
        }
        
        if (customerId) {
            window.customerModule?.updateCustomerStats?.(customerId, grandTotal);
        }
        
        cart = [];
        renderCart();
        
        // إلغاء تحديد العميل
        clearSelectedCustomer();
        
        showNotification('نجاح', 'تم حفظ الفاتورة');
        return invoice;
    }
    
    // ================== إنهاء البيع والطباعة ==================
    function finishSaleAndPrint() {
        const invoice = finishSale();
        if (invoice) {
            preparePrint(invoice);
        }
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
                    <td>${item.qty}</td>
                    <td>${formatCurrency(item.price)}</td>
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
            const wholesaleInfo = p.wholesalePrice ? 
                `<br><small class="text-success">الجملة: ${formatCurrency(p.wholesalePrice)}</small>` : '';
            
            return `
            <div class="search-item" onclick="salesModule.selectProduct('${p.name}', ${p.sellPrice}, ${p.wholesalePrice || 0}, ${p.quantity})">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${p.name}</strong>
                        ${wholesaleInfo}
                    </div>
                    <div>
                        <span class="badge ${p.quantity > 0 ? 'badge-success' : 'badge-danger'}">
                            ${p.quantity} متوفر
                        </span>
                    </div>
                </div>
            </div>
        `}).join('');
        
        resultsBox.classList.add('show');
    }
    
    // ================== اختيار منتج ==================
    function selectProduct(name, sellPrice, wholesalePrice, quantity) {
        document.getElementById('sale-search').value = name;
        document.getElementById('search-box').classList.remove('show');
        
        // إظهار معلومات المنتج
        Swal.fire({
            icon: 'info',
            title: name,
            html: `
                <div style="text-align:right">
                    <p><strong>سعر التجزئة:</strong> ${formatCurrency(sellPrice)}</p>
                    ${wholesalePrice ? `<p><strong>سعر الجملة:</strong> ${formatCurrency(wholesalePrice)}</p>` : ''}
                    <p><strong>المتوفر:</strong> ${quantity}</p>
                </div>
            `,
            timer: 2000,
            showConfirmButton: false
        });
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
            tbody.innerHTML = '<tr><td colspan="7" class="text-center p-4"><i class="material-icons-round" style="font-size:48px;">receipt</i><br>لا توجد فواتير</td></tr>';
            return;
        }
        
        tbody.innerHTML = sortedInvoices.map(inv => `
            <tr>
                <td>${inv.number}</td>
                <td>${new Date(inv.date).toLocaleDateString('ar-EG')}</td>
                <td>${inv.customer}</td>
                <td>${formatCurrency(inv.grandTotal)} دج</td>
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
                        ${itemsHtml}
                    </table>
                    <hr>
                    <p><strong>إجمالي الخصم:</strong> ${formatCurrency(invoice.totalDiscount)} دج</p>
                    <h4><strong>الإجمالي:</strong> ${formatCurrency(invoice.grandTotal)} دج</h4>
                </div>
            `,
            width: '800px'
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
            tbody.innerHTML = '<tr><td colspan="7" class="text-center p-4">لا توجد نتائج</td></tr>';
            return;
        }
        
        tbody.innerHTML = filtered.map(inv => `
            <tr>
                <td>${inv.number}</td>
                <td>${new Date(inv.date).toLocaleDateString('ar-EG')}</td>
                <td>${inv.customer}</td>
                <td>${formatCurrency(inv.grandTotal)} دج</td>
                <td>${inv.paymentText}</td>
                <td>${inv.items.length}</td>
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
            }
        };
    }
    
    // ================== تهيئة الوحدة (محدثة) ==================
    function init() {
        console.log('✅ salesModule v2 initialized - الرقم 23');
        console.log(`   عدد الفواتير: ${invoices.length}`);
        
        renderCart();
        loadCustomers();
        renderInvoices();
        
        // إغلاق نتائج البحث عند النقر خارجها
        document.addEventListener('click', (e) => {
            const searchBox = document.getElementById('search-box');
            const searchInput = document.getElementById('sale-search');
            if (searchBox && !searchBox.contains(e.target) && e.target !== searchInput) {
                searchBox.classList.remove('show');
            }
            
            // إغلاق نتائج بحث العملاء
            const customerResults = document.getElementById('customer-results');
            const customerSearch = document.getElementById('customer-search');
            if (customerResults && !customerResults.contains(e.target) && e.target !== customerSearch) {
                customerResults.style.display = 'none';
            }
        });
    }
    
    // ================== واجهة الوحدة ==================
    return {
        cart,
        invoices,
        addToCart,
        removeFromCart,
        clearCart,
        finishSale,
        finishSaleAndPrint,
        searchProducts,
        selectProduct,
        searchCustomers,      // دالة بحث العملاء
        selectCustomer,       // دالة تحديد العميل
        clearSelectedCustomer, // دالة إلغاء التحديد
        openAddCustomerModal, // دالة فتح إضافة عميل
        loadCustomers,
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
window.searchCustomers = (q) => salesModule.searchCustomers(q); // دالة مختصرة للبحث عن العملاء

// تهيئة تلقائية
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => salesModule.init());
    document.addEventListener('html-loaded', () => salesModule.init());
}
