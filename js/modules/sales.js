// ================== sales.js - إدارة المبيعات ==================
// الرقم 22 في ترتيب الملفات - يعتمد على utils.js, product.js, customer.js, inventory.js

const salesModule = (function() {
    // ================== البيانات ==================
    let cart = []; // سلة المبيعات الحالية
    let invoices = JSON.parse(localStorage.getItem('sales_invoices')) || []; // فواتير المبيعات
    let currentInvoice = null; // الفاتورة الحالية (للتعديل)
    
    // ================== دوال مساعدة داخلية ==================
    function saveInvoices() {
        localStorage.setItem('sales_invoices', JSON.stringify(invoices));
    }
    
    // ================== إضافة منتج إلى السلة ==================
    function addToCart() {
        const searchInput = document.getElementById('sale-search');
        const productName = searchInput?.value.trim();
        const qty = parseInt(document.getElementById('sale-qty')?.value) || 1;
        const discount = parseFloat(document.getElementById('sale-discount')?.value) || 0;
        
        if (!productName) {
            utilsModule.showNotification('تنبيه', 'الرجاء اختيار منتج', 'warning');
            return false;
        }
        
        // البحث عن المنتج في product.js
        const products = window.productModule?.getAllProducts() || [];
        const product = products.find(p => p.name === productName);
        
        if (!product) {
            utilsModule.showNotification('تنبيه', 'المنتج غير موجود', 'warning');
            return false;
        }
        
        // التحقق من الكمية في المخزون
        if (product.quantity < qty) {
            utilsModule.showNotification('تنبيه', 'الكمية غير متوفرة في المخزون', 'warning');
            return false;
        }
        
        // التحقق من وجود المنتج في السلة مسبقاً
        const existingItem = cart.find(item => item.productId === product.id);
        if (existingItem) {
            existingItem.qty += qty;
            existingItem.total = (existingItem.price * existingItem.qty) * (1 - existingItem.discount / 100);
        } else {
            // إضافة إلى السلة
            const cartItem = {
                id: utilsModule.generateId(),
                productId: product.id,
                name: product.name,
                price: product.sellPrice,
                qty: qty,
                discount: discount,
                total: (product.sellPrice * qty) * (1 - discount / 100)
            };
            cart.push(cartItem);
        }
        
        renderCart();
        
        // مسح حقل البحث
        if (searchInput) searchInput.value = '';
        
        utilsModule.showNotification('نجاح', 'تم إضافة المنتج');
        return true;
    }
    
    // ================== عرض السلة ==================
    function renderCart() {
        const tbody = document.getElementById('cart-table');
        if (!tbody) return;
        
        if (cart.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4"><i class="material-icons-round" style="font-size:48px;">shopping_cart</i><br>السلة فارغة</td></tr>';
            updateTotals();
            return;
        }
        
        tbody.innerHTML = cart.map((item, index) => `
            <tr>
                <td>${item.name}</td>
                <td>${item.qty}</td>
                <td>${utilsModule.formatCurrency(item.price)}</td>
                <td>${item.discount}%</td>
                <td>${utilsModule.formatCurrency(item.total)}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="salesModule.removeFromCart('${item.id}')">
                        <i class="material-icons-round">delete</i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        updateTotals();
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
        
        if (totalDiscountEl) totalDiscountEl.textContent = utilsModule.formatCurrency(totalDiscount);
        if (grandTotalEl) grandTotalEl.textContent = utilsModule.formatCurrency(grandTotal);
        if (finalGrandTotalEl) finalGrandTotalEl.textContent = utilsModule.formatCurrency(grandTotal);
    }
    
    // ================== حذف من السلة ==================
    function removeFromCart(itemId) {
        cart = cart.filter(item => item.id !== itemId);
        renderCart();
        utilsModule.showNotification('تم', 'تم حذف المنتج');
    }
    
    // ================== مسح السلة ==================
    function clearCart() {
        if (cart.length === 0) return;
        
        utilsModule.showConfirmation('تأكيد', 'هل تريد تفريغ السلة؟', () => {
            cart = [];
            renderCart();
            utilsModule.showNotification('تم', 'تم تفريغ السلة');
        });
    }
    
    // ================== إنهاء البيع ==================
    function finishSale() {
        if (cart.length === 0) {
            utilsModule.showNotification('تنبيه', 'السلة فارغة', 'warning');
            return null;
        }
        
        const customerSelect = document.getElementById('sale-customer');
        const customerId = customerSelect?.value;
        const customerName = customerSelect?.options[customerSelect.selectedIndex]?.text || 'زبون نقدي';
        
        const paymentMethod = document.getElementById('sale-payment-method')?.value || 'cash';
        let paymentText = 'نقدي';
        if (paymentMethod === 'card') paymentText = 'بطاقة';
        if (paymentMethod === 'credit') paymentText = 'آجل';
        
        // حساب المجاميع
        const totalDiscount = cart.reduce((sum, item) => {
            return sum + (item.price * item.qty * item.discount / 100);
        }, 0);
        
        const grandTotal = cart.reduce((sum, item) => sum + item.total, 0);
        
        // إنشاء فاتورة جديدة
        const invoice = {
            id: utilsModule.generateId(),
            number: utilsModule.generateInvoiceNumber('SALE'),
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
        
        // تحديث المخزون (خصم الكميات)
        cart.forEach(item => {
            window.inventoryModule?.removeStock(item.productId, item.qty, `فاتورة مبيعات رقم ${invoice.number}`);
        });
        
        // تحديث إحصائيات العميل إذا كان موجوداً
        if (customerId && paymentMethod === 'credit') {
            window.customerModule?.addDebt(customerId, grandTotal);
        }
        
        if (customerId) {
            window.customerModule?.updateCustomerStats(customerId, grandTotal);
        }
        
        // مسح السلة
        cart = [];
        renderCart();
        
        utilsModule.showNotification('نجاح', 'تم حفظ الفاتورة');
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
        // تعبئة بيانات الطباعة
        const dateTimeEl = document.getElementById('print-date-time');
        const invoiceNoEl = document.getElementById('print-invoice-no');
        const customerEl = document.getElementById('print-customer');
        const tbody = document.getElementById('print-cart-items');
        const totalDiscountEl = document.getElementById('print-total-discount');
        const grandTotalEl = document.getElementById('print-grand-total');
        
        if (dateTimeEl) dateTimeEl.textContent = utilsModule.formatDate(invoice.date);
        if (invoiceNoEl) invoiceNoEl.textContent = invoice.number;
        if (customerEl) customerEl.textContent = invoice.customer;
        
        if (tbody) {
            tbody.innerHTML = invoice.items.map((item, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${item.name}</td>
                    <td>${item.qty}</td>
                    <td>${utilsModule.formatCurrency(item.price)}</td>
                    <td>${item.discount}%</td>
                    <td>${utilsModule.formatCurrency(item.total)}</td>
                </tr>
            `).join('');
        }
        
        if (totalDiscountEl) totalDiscountEl.textContent = utilsModule.formatCurrency(invoice.totalDiscount);
        if (grandTotalEl) grandTotalEl.textContent = utilsModule.formatCurrency(invoice.grandTotal);
        
        // طباعة
        setTimeout(() => {
            window.print();
        }, 100);
    }
    
    // ================== البحث الذكي عن المنتجات ==================
    function searchProducts(term) {
        const resultsBox = document.getElementById('search-box');
        if (!resultsBox) return;
        
        if (!term || term.length < 2) {
            resultsBox.classList.remove('show');
            return;
        }
        
        const products = window.productModule?.getAllProducts() || [];
        const results = products.filter(p => 
            p.name.toLowerCase().includes(term.toLowerCase())
        ).slice(0, 5);
        
        if (results.length === 0) {
            resultsBox.innerHTML = '<div class="search-item text-muted">لا توجد نتائج</div>';
            resultsBox.classList.add('show');
            return;
        }
        
        resultsBox.innerHTML = results.map(p => `
            <div class="search-item" onclick="salesModule.selectProduct('${p.name}', ${p.sellPrice}, ${p.quantity})">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${p.name}</strong><br>
                        <small>السعر: ${utilsModule.formatCurrency(p.sellPrice)}</small>
                    </div>
                    <div>
                        <span class="badge ${p.quantity > 0 ? 'badge-success' : 'badge-danger'}">
                            ${p.quantity} متوفر
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
        
        resultsBox.classList.add('show');
    }
    
    // ================== اختيار منتج من البحث ==================
    function selectProduct(name, price, quantity) {
        const searchInput = document.getElementById('sale-search');
        if (searchInput) searchInput.value = name;
        
        const resultsBox = document.getElementById('search-box');
        if (resultsBox) resultsBox.classList.remove('show');
        
        // إظهار معلومات المنتج
        utilsModule.showNotification(name, `السعر: ${utilsModule.formatCurrency(price)} - المتوفر: ${quantity}`, 'info');
    }
    
    // ================== تحميل قائمة العملاء ==================
    function loadCustomers() {
        const customers = window.customerModule?.getAllCustomers() || [];
        const select = document.getElementById('sale-customer');
        
        if (select) {
            select.innerHTML = '<option value="">اختر العميل (اختياري)</option>' + 
                customers.map(c => `<option value="${c.id}">${c.name} ${c.phone ? '- ' + c.phone : ''}</option>`).join('');
        }
    }
    
    // ================== الحصول على جميع الفواتير ==================
    function getInvoices() {
        return [...invoices].sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    // ================== الحصول على فاتورة محددة ==================
    function getInvoice(id) {
        return invoices.find(inv => inv.id == id);
    }
    
    // ================== عرض فواتير المبيعات ==================
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
                <td>${utilsModule.formatDate(inv.date)}</td>
                <td>${inv.customer}</td>
                <td>${utilsModule.formatCurrency(inv.grandTotal)}</td>
                <td>${inv.items.length}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="salesModule.showInvoice('${inv.id}')">
                        <i class="material-icons-round">visibility</i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="salesModule.editInvoice('${inv.id}')">
                        <i class="material-icons-round">edit</i>
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="salesModule.deleteInvoice('${inv.id}')">
                        <i class="material-icons-round">delete</i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    // ================== عرض فاتورة محددة ==================
    function showInvoice(id) {
        const invoice = getInvoice(id);
        if (!invoice) return;
        
        let itemsHtml = '';
        invoice.items.forEach((item, i) => {
            itemsHtml += `
                <tr>
                    <td style="padding:5px; border:1px solid #ddd;">${i + 1}</td>
                    <td style="padding:5px; border:1px solid #ddd;">${item.name}</td>
                    <td style="padding:5px; border:1px solid #ddd;">${item.qty}</td>
                    <td style="padding:5px; border:1px solid #ddd;">${utilsModule.formatCurrency(item.price)}</td>
                    <td style="padding:5px; border:1px solid #ddd;">${item.discount}%</td>
                    <td style="padding:5px; border:1px solid #ddd;">${utilsModule.formatCurrency(item.total)}</td>
                </tr>
            `;
        });
        
        Swal.fire({
            title: `فاتورة ${invoice.number}`,
            html: `
                <div style="text-align:right; max-height:400px; overflow-y:auto;">
                    <p><strong>التاريخ:</strong> ${utilsModule.formatDate(invoice.date)}</p>
                    <p><strong>العميل:</strong> ${invoice.customer}</p>
                    <p><strong>طريقة الدفع:</strong> ${invoice.paymentText}</p>
                    <hr>
                    <table style="width:100%; border-collapse:collapse; text-align:center;">
                        <thead>
                            <tr style="background:#f5f5f5;">
                                <th style="padding:5px; border:1px solid #ddd;">#</th>
                                <th style="padding:5px; border:1px solid #ddd;">المنتج</th>
                                <th style="padding:5px; border:1px solid #ddd;">الكمية</th>
                                <th style="padding:5px; border:1px solid #ddd;">السعر</th>
                                <th style="padding:5px; border:1px solid #ddd;">الخصم</th>
                                <th style="padding:5px; border:1px solid #ddd;">الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>
                    <hr>
                    <p><strong>إجمالي الخصم:</strong> ${utilsModule.formatCurrency(invoice.totalDiscount)}</p>
                    <h4><strong>الإجمالي النهائي:</strong> ${utilsModule.formatCurrency(invoice.grandTotal)}</h4>
                </div>
            `,
            width: '800px',
            showCancelButton: true,
            confirmButtonText: 'طباعة',
            cancelButtonText: 'إغلاق',
            cancelButtonColor: '#3085d6',
            confirmButtonColor: '#28a745'
        }).then((result) => {
            if (result.isConfirmed) {
                preparePrint(invoice);
            }
        });
    }
    
    // ================== تعديل فاتورة ==================
    function editInvoice(id) {
        const invoice = getInvoice(id);
        if (!invoice) return;
        
        // تحميل الفاتورة في السلة للتعديل
        currentInvoice = invoice;
        cart = JSON.parse(JSON.stringify(invoice.items)); // نسخة عميقة
        renderCart();
        
        // التبديل إلى قسم عملية البيع
        const saleOperation = document.getElementById('sale-operation');
        if (saleOperation) {
            document.querySelectorAll('.sub-section').forEach(s => s.style.display = 'none');
            saleOperation.style.display = 'block';
        }
        
        utilsModule.showNotification('معلومة', 'يمكنك تعديل الفاتورة الآن', 'info');
    }
    
    // ================== حذف فاتورة ==================
    function deleteInvoice(id) {
        const invoice = getInvoice(id);
        if (!invoice) return;
        
        utilsModule.showConfirmation('تأكيد الحذف', `حذف الفاتورة ${invoice.number}؟`, () => {
            invoices = invoices.filter(inv => inv.id != id);
            saveInvoices();
            renderInvoices();
            utilsModule.showNotification('تم', 'تم حذف الفاتورة');
        });
    }
    
    // ================== البحث في الفواتير ==================
    function searchInvoices() {
        const searchInput = document.getElementById('invoice-search');
        const term = searchInput?.value.toLowerCase().trim() || '';
        const tbody = document.getElementById('sale-invoices-tbody');
        
        if (!tbody) return;
        
        if (term === '') {
            renderInvoices();
            return;
        }
        
        const filtered = invoices.filter(inv => 
            inv.number.toLowerCase().includes(term) ||
            inv.customer.toLowerCase().includes(term) ||
            utilsModule.formatDate(inv.date).includes(term)
        );
        
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center p-4">لا توجد نتائج</td></tr>';
            return;
        }
        
        tbody.innerHTML = filtered.map(inv => `
            <tr>
                <td>${inv.number}</td>
                <td>${utilsModule.formatDate(inv.date)}</td>
                <td>${inv.customer}</td>
                <td>${utilsModule.formatCurrency(inv.grandTotal)}</td>
                <td>${inv.items.length}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="salesModule.showInvoice('${inv.id}')">
                        عرض
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="salesModule.deleteInvoice('${inv.id}')">
                        حذف
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    // ================== إحصائيات المبيعات ==================
    function getSalesStats() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisYear = new Date(now.getFullYear(), 0, 1);
        
        const todayInvoices = invoices.filter(inv => new Date(inv.date) >= today);
        const monthInvoices = invoices.filter(inv => new Date(inv.date) >= thisMonth);
        const yearInvoices = invoices.filter(inv => new Date(inv.date) >= thisYear);
        
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
            thisYear: {
                count: yearInvoices.length,
                amount: yearInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0)
            },
            average: invoices.length > 0 
                ? invoices.reduce((sum, inv) => sum + inv.grandTotal, 0) / invoices.length 
                : 0
        };
    }
    
    // ================== تصدير الفواتير إلى CSV ==================
    function exportToCSV() {
        const headers = ['رقم الفاتورة', 'التاريخ', 'العميل', 'المبلغ', 'طريقة الدفع', 'عدد الأصناف'];
        const data = invoices.map(inv => ({
            number: inv.number,
            date: utilsModule.formatDate(inv.date),
            customer: inv.customer,
            amount: inv.grandTotal,
            payment: inv.paymentText,
            items: inv.items.length
        }));
        
        utilsModule.exportToCSV(data, 'sales_invoices', headers);
    }
    
    // ================== تهيئة الوحدة ==================
    function init() {
        console.log('✅ salesModule initialized - الرقم 22');
        console.log(`   عدد فواتير المبيعات: ${invoices.length}`);
        console.log(`   إجمالي المبيعات: ${utilsModule.formatCurrency(invoices.reduce((sum, inv) => sum + inv.grandTotal, 0))}`);
        
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
        });
    }
    
    // ================== واجهة الوحدة ==================
    return {
        // البيانات
        cart,
        invoices,
        
        // عمليات السلة
        addToCart,
        removeFromCart,
        clearCart,
        
        // إنهاء البيع
        finishSale,
        finishSaleAndPrint,
        
        // بحث
        searchProducts,
        selectProduct,
        
        // العملاء
        loadCustomers,
        
        // الفواتير
        getInvoices,
        getInvoice,
        renderInvoices,
        showInvoice,
        editInvoice,
        deleteInvoice,
        searchInvoices,
        
        // إحصائيات
        getSalesStats,
        
        // تصدير
        exportToCSV,
        
        // تهيئة
        init
    };
})();

// ================== تصدير للاستخدام العام ==================
window.salesModule = salesModule;

// ================== دوال مختصرة للاستخدام في HTML ==================
window.addToCart = () => salesModule.addToCart();
window.removeFromCart = (id) => salesModule.removeFromCart(id);
window.clearCart = () => salesModule.clearCart();
window.finishSale = () => salesModule.finishSale();
window.finishSaleAndPrint = () => salesModule.finishSaleAndPrint();
window.searchInvoices = () => salesModule.searchInvoices();

// ================== تهيئة تلقائية ==================
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        if (salesModule && salesModule.init) {
            salesModule.init();
        }
    });
    
    document.addEventListener('html-loaded', function() {
        if (salesModule && salesModule.init) {
            salesModule.init();
        }
    });
}
