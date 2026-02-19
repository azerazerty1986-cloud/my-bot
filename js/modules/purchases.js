// ================== إدارة المشتريات ==================
const purchasesModule = (function() {
    // ================== البيانات ==================
    let cart = [];
    let invoices = JSON.parse(localStorage.getItem('purchase_invoices')) || [];
    
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
        return `PUR-${year}${month}${day}-${random}`;
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
        localStorage.setItem('purchase_invoices', JSON.stringify(invoices));
    }
    
    // ================== عمليات السلة ==================
    
    function addToCart() {
        const searchInput = document.getElementById('purchase-search');
        const productName = searchInput?.value.trim();
        const price = parseFloat(document.getElementById('purchase-price')?.value) || 0;
        const qty = parseInt(document.getElementById('purchase-qty')?.value) || 1;
        
        if (!productName) {
            showNotification('تنبيه', 'الرجاء إدخال اسم المنتج', 'warning');
            return;
        }
        
        if (price <= 0) {
            showNotification('تنبيه', 'السعر مطلوب', 'warning');
            return;
        }
        
        const existingItem = cart.find(item => item.name === productName);
        if (existingItem) {
            existingItem.qty += qty;
            existingItem.price = price;
            existingItem.total = existingItem.price * existingItem.qty;
        } else {
            cart.push({
                id: Date.now() + Math.random(),
                name: productName,
                price: price,
                qty: qty,
                total: price * qty
            });
        }
        
        renderCart();
        if (searchInput) searchInput.value = '';
        document.getElementById('purchase-price').value = '';
        showNotification('نجاح', 'تم إضافة المنتج', 'success');
    }
    
    function renderCart() {
        const tbody = document.getElementById('purchase-cart-table');
        if (!tbody) return;
        
        if (cart.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4">السلة فارغة</td></tr>';
            updateTotal();
            return;
        }
        
        tbody.innerHTML = cart.map((item, index) => `
            <tr>
                <td>${item.name}</td>
                <td>${item.qty}</td>
                <td>${formatCurrency(item.price)}</td>
                <td>${formatCurrency(item.total)}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="purchasesModule.removeFromCart(${index})">
                        <i class="material-icons-round">delete</i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        updateTotal();
    }
    
    function updateTotal() {
        const total = cart.reduce((sum, item) => sum + item.total, 0);
        const el = document.getElementById('purchase-grand-total');
        if (el) el.textContent = formatCurrency(total);
    }
    
    function removeFromCart(index) {
        cart.splice(index, 1);
        renderCart();
        showNotification('تم', 'تم حذف المنتج', 'success');
    }
    
    function clearCart() {
        if (cart.length === 0) return;
        showConfirmation('تأكيد', 'تفريغ السلة؟', () => {
            cart = [];
            renderCart();
            showNotification('تم', 'تم تفريغ السلة', 'success');
        });
    }
    
    function finishPurchaseAndPrint() {
        if (cart.length === 0) {
            showNotification('تنبيه', 'السلة فارغة', 'warning');
            return;
        }
        
        const supplierSelect = document.getElementById('purchase-supplier');
        const supplierName = supplierSelect?.options[supplierSelect.selectedIndex]?.text || 'مورد';
        const grandTotal = cart.reduce((sum, item) => sum + item.total, 0);
        
        const invoice = {
            id: Date.now(),
            number: generateInvoiceNumber(),
            date: new Date().toISOString(),
            supplier: supplierName,
            items: [...cart],
            grandTotal: grandTotal
        };
        
        invoices.push(invoice);
        saveInvoices();
        
        // تحديث المخزون
        const products = window.productsModule?.products || [];
        cart.forEach(item => {
            const product = products.find(p => p.name === item.name);
            if (product) {
                product.quantity += item.qty;
                product.buyPrice = item.price;
            } else {
                products.push({
                    id: Date.now() + Math.random(),
                    name: item.name,
                    buyPrice: item.price,
                    sellPrice: item.price * 1.3,
                    quantity: item.qty,
                    unit: 'قطعة',
                    category: 'عام',
                    minStock: 5
                });
            }
        });
        if (window.productsModule?.saveProducts) window.productsModule.saveProducts();
        
        // طباعة
        preparePrint(invoice);
        
        cart = [];
        renderCart();
        showNotification('نجاح', 'تم حفظ الفاتورة', 'success');
    }
    
    function preparePrint(invoice) {
        document.getElementById('purchase-print-date-time').textContent = new Date(invoice.date).toLocaleString('ar-EG');
        document.getElementById('purchase-print-invoice-no').textContent = invoice.number;
        document.getElementById('print-supplier').textContent = invoice.supplier;
        
        const tbody = document.getElementById('purchase-print-cart-items');
        tbody.innerHTML = invoice.items.map((item, i) => `
            <tr>
                <td>${i+1}</td>
                <td>${item.name}</td>
                <td>${item.qty}</td>
                <td>${formatCurrency(item.price)}</td>
                <td>${formatCurrency(item.total)}</td>
            </tr>
        `).join('');
        
        document.getElementById('purchase-print-grand-total').textContent = formatCurrency(invoice.grandTotal);
        setTimeout(() => window.print(), 100);
    }
    
    function smartSearch(term) {
        const resultsBox = document.getElementById('purchase-search-box');
        if (!resultsBox) return;
        
        if (!term || term.length < 2) {
            resultsBox.classList.remove('show');
            return;
        }
        
        const products = window.productsModule?.products || [];
        const results = products.filter(p => 
            p.name.toLowerCase().includes(term.toLowerCase())
        ).slice(0, 5);
        
        if (results.length === 0) {
            resultsBox.innerHTML = '<div class="search-item">لا توجد نتائج</div>';
            resultsBox.classList.add('show');
            return;
        }
        
        resultsBox.innerHTML = results.map(p => `
            <div class="search-item" onclick="purchasesModule.selectProduct('${p.name}', ${p.buyPrice})">
                <div><strong>${p.name}</strong> - آخر سعر: ${formatCurrency(p.buyPrice)}</div>
            </div>
        `).join('');
        
        resultsBox.classList.add('show');
    }
    
    function selectProduct(name, price) {
        document.getElementById('purchase-search').value = name;
        document.getElementById('purchase-price').value = price;
        document.getElementById('purchase-search-box').classList.remove('show');
    }
    
    // ================== الفواتير ==================
    
    function loadInvoices() {
        const tbody = document.getElementById('purchase-invoices-tbody');
        if (!tbody) return;
        
        if (invoices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center p-4">لا توجد فواتير</td></tr>';
            return;
        }
        
        const sorted = [...invoices].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        tbody.innerHTML = sorted.map((inv, i) => {
            const originalIndex = invoices.findIndex(x => x.id === inv.id);
            return `
            <tr>
                <td>${inv.number}</td>
                <td>${new Date(inv.date).toLocaleDateString('ar-EG')}</td>
                <td>${inv.supplier}</td>
                <td>${formatCurrency(inv.grandTotal)}</td>
                <td>${inv.items.length}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="purchasesModule.showInvoice(${originalIndex})">
                        عرض
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="purchasesModule.deleteInvoice(${originalIndex})">
                        حذف
                    </button>
                </td>
            </tr>
        `}).join('');
    }
    
    function showInvoice(index) {
        const inv = invoices[index];
        if (!inv) return;
        
        let itemsHtml = '';
        inv.items.forEach((item, i) => {
            itemsHtml += `
                <tr>
                    <td>${i+1}</td>
                    <td>${item.name}</td>
                    <td>${item.qty}</td>
                    <td>${formatCurrency(item.price)}</td>
                    <td>${formatCurrency(item.total)}</td>
                </tr>
            `;
        });
        
        Swal.fire({
            title: `فاتورة ${inv.number}`,
            html: `
                <div style="text-align:right">
                    <p>التاريخ: ${new Date(inv.date).toLocaleString('ar-EG')}</p>
                    <p>المورد: ${inv.supplier}</p>
                    <hr>
                    <table style="width:100%">${itemsHtml}</table>
                    <hr>
                    <p>الإجمالي: ${formatCurrency(inv.grandTotal)}</p>
                </div>
            `,
            width: '800px'
        });
    }
    
    function deleteInvoice(index) {
        showConfirmation('تأكيد', 'حذف الفاتورة؟', () => {
            invoices.splice(index, 1);
            saveInvoices();
            loadInvoices();
            showNotification('تم', 'تم حذف الفاتورة', 'success');
        });
    }
    
    // ================== الموردين ==================
    
    function loadSuppliersList() {
        const suppliers = window.supplierModule?.suppliers || [];
        const select = document.getElementById('purchase-supplier');
        if (select) {
            select.innerHTML = '<option value="">اختر المورد</option>' + 
                suppliers.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
        }
    }
    
    function addSupplier() {
        const name = document.getElementById('new-supplier')?.value.trim();
        const phone = document.getElementById('new-supplier-phone')?.value.trim() || '';
        
        if (!name) {
            showNotification('تنبيه', 'اسم المورد مطلوب', 'warning');
            return;
        }
        
        if (window.supplierModule) {
            window.supplierModule.suppliers.push({
                id: Date.now(),
                name: name,
                phone: phone
            });
            window.supplierModule.saveSuppliers?.();
            window.supplierModule.renderSuppliers?.();
            
            document.getElementById('new-supplier').value = '';
            document.getElementById('new-supplier-phone').value = '';
            
            loadSuppliersList();
            showNotification('نجاح', 'تم إضافة المورد', 'success');
        }
    }
    
    function renderSuppliers() {
        const tbody = document.getElementById('suppliers-tbody');
        if (!tbody) return;
        
        const suppliers = window.supplierModule?.suppliers || [];
        
        if (suppliers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center p-4">لا يوجد موردين</td></tr>';
            return;
        }
        
        tbody.innerHTML = suppliers.map((s, idx) => `
            <tr>
                <td>${s.name}</td>
                <td>${s.phone || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="purchasesModule.deleteSupplier(${idx})">
                        حذف
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    function deleteSupplier(index) {
        const suppliers = window.supplierModule?.suppliers;
        if (!suppliers) return;
        
        showConfirmation('تأكيد', 'حذف المورد؟', () => {
            suppliers.splice(index, 1);
            window.supplierModule.saveSuppliers?.();
            renderSuppliers();
            loadSuppliersList();
            showNotification('تم', 'تم حذف المورد', 'success');
        });
    }
    
    // ================== التهيئة ==================
    function init() {
        console.log('✅ purchasesModule initialized');
        renderCart();
        loadSuppliersList();
        loadInvoices();
        renderSuppliers();
        
        document.addEventListener('click', (e) => {
            const box = document.getElementById('purchase-search-box');
            const input = document.getElementById('purchase-search');
            if (box && !box.contains(e.target) && e.target !== input) {
                box.classList.remove('show');
            }
        });
    }
    
    return {
        cart: cart,
        invoices: invoices,
        addToCart: addToCart,
        removeFromCart: removeFromCart,
        clearCart: clearCart,
        finishPurchaseAndPrint: finishPurchaseAndPrint,
        smartSearch: smartSearch,
        selectProduct: selectProduct,
        loadInvoices: loadInvoices,
        showInvoice: showInvoice,
        deleteInvoice: deleteInvoice,
        loadSuppliersList: loadSuppliersList,
        addSupplier: addSupplier,
        renderSuppliers: renderSuppliers,
        deleteSupplier: deleteSupplier,
        init: init
    };
})();

window.purchasesModule = purchasesModule;

// دوال HTML
window.addToPurchaseCart = () => purchasesModule.addToCart();
window.clearPurchaseCart = () => purchasesModule.clearCart();
window.finishPurchaseAndPrint = () => purchasesModule.finishPurchaseAndPrint();
window.smartSearchPurchase = (term) => purchasesModule.smartSearch(term);
window.addSupplier = () => purchasesModule.addSupplier();

// تهيئة
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(() => purchasesModule.init(), 200));
}
