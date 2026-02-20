// ================== purchases.js - إدارة المشتريات ==================
// الرقم 23 في ترتيب الملفات - يعتمد على utils.js, product.js, supplier.js, inventory.js

const purchasesModule = (function() {
    // ================== البيانات ==================
    let cart = []; // سلة المشتريات الحالية
    let invoices = JSON.parse(localStorage.getItem('purchase_invoices')) || []; // فواتير المشتريات
    let currentInvoice = null; // الفاتورة الحالية (للتعديل)
    
    // ================== دوال مساعدة داخلية ==================
    function saveInvoices() {
        localStorage.setItem('purchase_invoices', JSON.stringify(invoices));
    }
    
    // ================== إضافة منتج إلى سلة المشتريات ==================
    function addToCart() {
        const searchInput = document.getElementById('purchase-search');
        const productName = searchInput?.value.trim();
        const price = parseFloat(document.getElementById('purchase-price')?.value) || 0;
        const qty = parseInt(document.getElementById('purchase-qty')?.value) || 1;
        
        if (!productName) {
            utilsModule.showNotification('تنبيه', 'الرجاء إدخال اسم المنتج', 'warning');
            return false;
        }
        
        if (price <= 0) {
            utilsModule.showNotification('تنبيه', 'السعر مطلوب', 'warning');
            return false;
        }
        
        // التحقق من وجود المنتج في السلة مسبقاً
        const existingItem = cart.find(item => item.name === productName);
        if (existingItem) {
            existingItem.qty += qty;
            existingItem.price = price;
            existingItem.total = price * existingItem.qty;
        } else {
            // إضافة إلى السلة
            const cartItem = {
                id: utilsModule.generateId(),
                name: productName,
                price: price,
                qty: qty,
                total: price * qty
            };
            cart.push(cartItem);
        }
        
        renderCart();
        
        // مسح الحقول
        if (searchInput) searchInput.value = '';
        document.getElementById('purchase-price').value = '';
        document.getElementById('purchase-qty').value = '1';
        
        utilsModule.showNotification('نجاح', 'تم إضافة المنتج');
        return true;
    }
    
    // ================== عرض سلة المشتريات ==================
    function renderCart() {
        const tbody = document.getElementById('purchase-cart-table');
        if (!tbody) return;
        
        if (cart.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4"><i class="material-icons-round" style="font-size:48px;">shopping_cart</i><br>السلة فارغة</td></tr>';
            updateTotal();
            return;
        }
        
        tbody.innerHTML = cart.map((item, index) => `
            <tr>
                <td>${item.name}</td>
                <td>${item.qty}</td>
                <td>${utilsModule.formatCurrency(item.price)}</td>
                <td>${utilsModule.formatCurrency(item.total)}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="purchasesModule.removeFromCart('${item.id}')">
                        <i class="material-icons-round">delete</i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        updateTotal();
    }
    
    // ================== تحديث المجموع ==================
    function updateTotal() {
        const grandTotal = cart.reduce((sum, item) => sum + item.total, 0);
        const totalEl = document.getElementById('purchase-grand-total');
        if (totalEl) totalEl.textContent = utilsModule.formatCurrency(grandTotal);
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
    
    // ================== إنهاء عملية الشراء ==================
    function finishPurchase() {
        if (cart.length === 0) {
            utilsModule.showNotification('تنبيه', 'السلة فارغة', 'warning');
            return null;
        }
        
        const supplierSelect = document.getElementById('purchase-supplier');
        const supplierId = supplierSelect?.value;
        const supplierName = supplierSelect?.options[supplierSelect.selectedIndex]?.text || 'مورد';
        
        const paymentMethod = document.getElementById('purchase-payment-method')?.value || 'cash';
        let paymentText = 'نقدي';
        if (paymentMethod === 'check') paymentText = 'شيك';
        if (paymentMethod === 'transfer') paymentText = 'تحويل';
        if (paymentMethod === 'credit') paymentText = 'آجل';
        
        // حساب المجموع
        const grandTotal = cart.reduce((sum, item) => sum + item.total, 0);
        
        // إنشاء فاتورة جديدة
        const invoice = {
            id: utilsModule.generateId(),
            number: utilsModule.generateInvoiceNumber('PUR'),
            date: new Date().toISOString(),
            supplierId: supplierId,
            supplier: supplierName,
            items: [...cart],
            grandTotal: grandTotal,
            paymentMethod: paymentMethod,
            paymentText: paymentText,
            status: 'completed',
            createdBy: 'admin',
            notes: ''
        };
        
        invoices.push(invoice);
        saveInvoices();
        
        // تحديث المخزون (إضافة الكميات)
        cart.forEach(item => {
            // البحث عن المنتج في product.js
            const products = window.productModule?.getAllProducts() || [];
            let product = products.find(p => p.name === item.name);
            
            if (product) {
                // إضافة للمخزون
                window.inventoryModule?.addStock(product.id, item.qty, item.price, `فاتورة مشتريات رقم ${invoice.number}`);
            } else {
                // إنشاء منتج جديد
                const newProduct = window.productModule?.addProduct({
                    name: item.name,
                    buyPrice: item.price,
                    sellPrice: item.price * 1.3, // هامش ربح 30%
                    quantity: item.qty,
                    category: 'عام',
                    unit: 'قطعة',
                    minStock: 5
                });
                
                if (newProduct) {
                    window.inventoryModule?.addStock(newProduct.id, item.qty, item.price, `فاتورة مشتريات رقم ${invoice.number} (منتج جديد)`);
                }
            }
        });
        
        // تحديث إحصائيات المورد إذا كان موجوداً
        if (supplierId && paymentMethod === 'credit') {
            window.supplierModule?.addDebt(supplierId, grandTotal);
        }
        
        if (supplierId) {
            window.supplierModule?.updateSupplierStats(supplierId, grandTotal);
        }
        
        // مسح السلة
        cart = [];
        renderCart();
        
        utilsModule.showNotification('نجاح', 'تم حفظ فاتورة الشراء');
        return invoice;
    }
    
    // ================== إنهاء الشراء والطباعة ==================
    function finishPurchaseAndPrint() {
        const invoice = finishPurchase();
        if (invoice) {
            preparePrint(invoice);
        }
    }
    
    // ================== تجهيز طباعة فاتورة الشراء ==================
    function preparePrint(invoice) {
        const dateTimeEl = document.getElementById('purchase-print-date-time');
        const invoiceNoEl = document.getElementById('purchase-print-invoice-no');
        const supplierEl = document.getElementById('print-supplier');
        const tbody = document.getElementById('purchase-print-cart-items');
        const grandTotalEl = document.getElementById('purchase-print-grand-total');
        
        if (dateTimeEl) dateTimeEl.textContent = utilsModule.formatDate(invoice.date);
        if (invoiceNoEl) invoiceNoEl.textContent = invoice.number;
        if (supplierEl) supplierEl.textContent = invoice.supplier;
        
        if (tbody) {
            tbody.innerHTML = invoice.items.map((item, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${item.name}</td>
                    <td>${item.qty}</td>
                    <td>${utilsModule.formatCurrency(item.price)}</td>
                    <td>${utilsModule.formatCurrency(item.total)}</td>
                </tr>
            `).join('');
        }
        
        if (grandTotalEl) grandTotalEl.textContent = utilsModule.formatCurrency(invoice.grandTotal);
        
        setTimeout(() => {
            window.print();
        }, 100);
    }
    
    // ================== البحث الذكي عن المنتجات ==================
    function searchProducts(term) {
        const resultsBox = document.getElementById('purchase-search-box');
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
            <div class="search-item" onclick="purchasesModule.selectProduct('${p.name}', ${p.buyPrice})">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${p.name}</strong><br>
                        <small>آخر سعر شراء: ${utilsModule.formatCurrency(p.buyPrice)}</small>
                    </div>
                </div>
            </div>
        `).join('');
        
        resultsBox.classList.add('show');
    }
    
    // ================== اختيار منتج من البحث ==================
    function selectProduct(name, price) {
        const searchInput = document.getElementById('purchase-search');
        if (searchInput) searchInput.value = name;
        
        const priceInput = document.getElementById('purchase-price');
        if (priceInput) priceInput.value = price;
        
        const resultsBox = document.getElementById('purchase-search-box');
        if (resultsBox) resultsBox.classList.remove('show');
    }
    
    // ================== تحميل قائمة الموردين ==================
    function loadSuppliers() {
        const suppliers = window.supplierModule?.getAllSuppliers() || [];
        const select = document.getElementById('purchase-supplier');
        
        if (select) {
            select.innerHTML = '<option value="">اختر المورد (اختياري)</option>' + 
                suppliers.map(s => `<option value="${s.id}">${s.name} ${s.phone ? '- ' + s.phone : ''}</option>`).join('');
        }
    }
    
    // ================== الحصول على جميع فواتير الشراء ==================
    function getInvoices() {
        return [...invoices].sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    // ================== الحصول على فاتورة شراء محددة ==================
    function getInvoice(id) {
        return invoices.find(inv => inv.id == id);
    }
    
    // ================== عرض فواتير الشراء ==================
    function renderInvoices() {
        const tbody = document.getElementById('purchase-invoices-tbody');
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
                <td>${inv.supplier}</td>
                <td>${utilsModule.formatCurrency(inv.grandTotal)}</td>
                <td>${inv.items.length}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="purchasesModule.showInvoice('${inv.id}')">
                        <i class="material-icons-round">visibility</i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="purchasesModule.editInvoice('${inv.id}')">
                        <i class="material-icons-round">edit</i>
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="purchasesModule.deleteInvoice('${inv.id}')">
                        <i class="material-icons-round">delete</i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    // ================== عرض فاتورة شراء محددة ==================
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
                    <td style="padding:5px; border:1px solid #ddd;">${utilsModule.formatCurrency(item.total)}</td>
                </tr>
            `;
        });
        
        Swal.fire({
            title: `فاتورة شراء ${invoice.number}`,
            html: `
                <div style="text-align:right; max-height:400px; overflow-y:auto;">
                    <p><strong>التاريخ:</strong> ${utilsModule.formatDate(invoice.date)}</p>
                    <p><strong>المورد:</strong> ${invoice.supplier}</p>
                    <p><strong>طريقة الدفع:</strong> ${invoice.paymentText}</p>
                    <hr>
                    <table style="width:100%; border-collapse:collapse; text-align:center;">
                        <thead>
                            <tr style="background:#f5f5f5;">
                                <th style="padding:5px; border:1px solid #ddd;">#</th>
                                <th style="padding:5px; border:1px solid #ddd;">المنتج</th>
                                <th style="padding:5px; border:1px solid #ddd;">الكمية</th>
                                <th style="padding:5px; border:1px solid #ddd;">السعر</th>
                                <th style="padding:5px; border:1px solid #ddd;">الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>
                    <hr>
                    <h4><strong>الإجمالي:</strong> ${utilsModule.formatCurrency(invoice.grandTotal)}</h4>
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
    
    // ================== تعديل فاتورة شراء ==================
    function editInvoice(id) {
        const invoice = getInvoice(id);
        if (!invoice) return;
        
        // تحميل الفاتورة في السلة للتعديل
        currentInvoice = invoice;
        cart = JSON.parse(JSON.stringify(invoice.items)); // نسخة عميقة
        renderCart();
        
        // تعبئة بيانات المورد
        const supplierSelect = document.getElementById('purchase-supplier');
        if (supplierSelect && invoice.supplierId) {
            supplierSelect.value = invoice.supplierId;
        }
        
        // التبديل إلى قسم عملية الشراء
        const purchaseOperation = document.getElementById('purchase-operation');
        if (purchaseOperation) {
            document.querySelectorAll('.sub-section').forEach(s => s.style.display = 'none');
            purchaseOperation.style.display = 'block';
        }
        
        utilsModule.showNotification('معلومة', 'يمكنك تعديل الفاتورة الآن', 'info');
    }
    
    // ================== حذف فاتورة شراء ==================
    function deleteInvoice(id) {
        const invoice = getInvoice(id);
        if (!invoice) return;
        
        utilsModule.showConfirmation('تأكيد الحذف', `حذف فاتورة الشراء ${invoice.number}؟`, () => {
            invoices = invoices.filter(inv => inv.id != id);
            saveInvoices();
            renderInvoices();
            utilsModule.showNotification('تم', 'تم حذف الفاتورة');
        });
    }
    
    // ================== البحث في فواتير الشراء ==================
    function searchInvoices() {
        const searchInput = document.getElementById('purchase-invoice-search');
        const term = searchInput?.value.toLowerCase().trim() || '';
        const tbody = document.getElementById('purchase-invoices-tbody');
        
        if (!tbody) return;
        
        if (term === '') {
            renderInvoices();
            return;
        }
        
        const filtered = invoices.filter(inv => 
            inv.number.toLowerCase().includes(term) ||
            inv.supplier.toLowerCase().includes(term) ||
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
                <td>${inv.supplier}</td>
                <td>${utilsModule.formatCurrency(inv.grandTotal)}</td>
                <td>${inv.items.length}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="purchasesModule.showInvoice('${inv.id}')">
                        عرض
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="purchasesModule.deleteInvoice('${inv.id}')">
                        حذف
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    // ================== إحصائيات المشتريات ==================
    function getPurchasesStats() {
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
    
    // ================== تصدير فواتير الشراء إلى CSV ==================
    function exportToCSV() {
        const headers = ['رقم الفاتورة', 'التاريخ', 'المورد', 'المبلغ', 'طريقة الدفع', 'عدد الأصناف'];
        const data = invoices.map(inv => ({
            number: inv.number,
            date: utilsModule.formatDate(inv.date),
            supplier: inv.supplier,
            amount: inv.grandTotal,
            payment: inv.paymentText,
            items: inv.items.length
        }));
        
        utilsModule.exportToCSV(data, 'purchase_invoices', headers);
    }
    
    // ================== تهيئة الوحدة ==================
    function init() {
        console.log('✅ purchasesModule initialized - الرقم 23');
        console.log(`   عدد فواتير الشراء: ${invoices.length}`);
        console.log(`   إجمالي المشتريات: ${utilsModule.formatCurrency(invoices.reduce((sum, inv) => sum + inv.grandTotal, 0))}`);
        
        renderCart();
        loadSuppliers();
        renderInvoices();
        
        // إغلاق نتائج البحث عند النقر خارجها
        document.addEventListener('click', (e) => {
            const searchBox = document.getElementById('purchase-search-box');
            const searchInput = document.getElementById('purchase-search');
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
        
        // إنهاء الشراء
        finishPurchase,
        finishPurchaseAndPrint,
        
        // بحث
        searchProducts,
        selectProduct,
        
        // الموردين
        loadSuppliers,
        
        // الفواتير
        getInvoices,
        getInvoice,
        renderInvoices,
        showInvoice,
        editInvoice,
        deleteInvoice,
        searchInvoices,
        
        // إحصائيات
        getPurchasesStats,
        
        // تصدير
        exportToCSV,
        
        // تهيئة
        init
    };
})();

// ================== تصدير للاستخدام العام ==================
window.purchasesModule = purchasesModule;

// ================== دوال مختصرة للاستخدام في HTML ==================
window.addToPurchaseCart = () => purchasesModule.addToCart();
window.removeFromPurchaseCart = (id) => purchasesModule.removeFromCart(id);
window.clearPurchaseCart = () => purchasesModule.clearCart();
window.finishPurchase = () => purchasesModule.finishPurchase();
window.finishPurchaseAndPrint = () => purchasesModule.finishPurchaseAndPrint();
window.searchPurchaseInvoices = () => purchasesModule.searchInvoices();

// ================== تهيئة تلقائية ==================
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        if (purchasesModule && purchasesModule.init) {
            purchasesModule.init();
        }
    });
    
    document.addEventListener('html-loaded', function() {
        if (purchasesModule && purchasesModule.init) {
            purchasesModule.init();
        }
    });
}
