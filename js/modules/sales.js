// ================== إدارة المبيعات ==================
const salesModule = (function() {
    // ================== البيانات ==================
    let cart = [];
    let invoices = JSON.parse(localStorage.getItem('sales_invoices')) || [];
    
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
    
    // حفظ الفواتير
    function saveInvoices() {
        localStorage.setItem('sales_invoices', JSON.stringify(invoices));
    }
    
    // ================== عمليات السلة ==================
    
    function addToCart() {
        const searchInput = document.getElementById('sale-search');
        const productName = searchInput?.value.trim();
        const qty = parseInt(document.getElementById('sale-qty')?.value) || 1;
        const discount = parseFloat(document.getElementById('sale-discount')?.value) || 0;
        
        if (!productName) {
            showNotification('تنبيه', 'الرجاء اختيار منتج', 'warning');
            return;
        }
        
        const products = window.productsModule?.products || [];
        const product = products.find(p => p.name === productName);
        
        if (!product) {
            showNotification('تنبيه', 'المنتج غير موجود', 'warning');
            return;
        }
        
        if (product.quantity < qty) {
            showNotification('تنبيه', 'الكمية غير متوفرة', 'warning');
            return;
        }
        
        const existingItem = cart.find(item => item.name === productName);
        if (existingItem) {
            existingItem.qty += qty;
            existingItem.total = (existingItem.price * existingItem.qty) * (1 - existingItem.discount / 100);
        } else {
            cart.push({
                id: Date.now() + Math.random(),
                productId: product.id,
                name: product.name,
                price: product.sellPrice,
                qty: qty,
                discount: discount,
                total: (product.sellPrice * qty) * (1 - discount / 100)
            });
        }
        
        renderCart();
        if (searchInput) searchInput.value = '';
        showNotification('نجاح', 'تم إضافة المنتج', 'success');
    }
    
    function renderCart() {
        const tbody = document.getElementById('cart-table');
        if (!tbody) return;
        
        if (cart.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4">السلة فارغة</td></tr>';
            updateTotals();
            return;
        }
        
        tbody.innerHTML = cart.map((item, index) => `
            <tr>
                <td>${item.name}</td>
                <td>${item.qty}</td>
                <td>${formatCurrency(item.price)}</td>
                <td>${item.discount}%</td>
                <td>${formatCurrency(item.total)}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="salesModule.removeFromCart(${index})">
                        <i class="material-icons-round">delete</i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        updateTotals();
    }
    
    function updateTotals() {
        const totalDiscount = cart.reduce((sum, item) => 
            sum + (item.price * item.qty * item.discount / 100), 0);
        const grandTotal = cart.reduce((sum, item) => sum + item.total, 0);
        
        const totalDiscountEl = document.getElementById('total-discount');
        const grandTotalEl = document.getElementById('grand-total');
        const finalGrandTotalEl = document.getElementById('final-grand-total');
        
        if (totalDiscountEl) totalDiscountEl.textContent = formatCurrency(totalDiscount);
        if (grandTotalEl) grandTotalEl.textContent = formatCurrency(grandTotal);
        if (finalGrandTotalEl) finalGrandTotalEl.textContent = formatCurrency(grandTotal);
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
    
    function finishSaleAndPrint() {
        if (cart.length === 0) {
            showNotification('تنبيه', 'السلة فارغة', 'warning');
            return;
        }
        
        const customerSelect = document.getElementById('sale-customer');
        const customerName = customerSelect?.options[customerSelect.selectedIndex]?.text || 'زبون نقدي';
        
        const paymentMethod = document.getElementById('sale-payment-method')?.value || 'cash';
        const paymentText = paymentMethod === 'cash' ? 'نقدي' : paymentMethod === 'card' ? 'بطاقة' : 'آجل';
        
        const totalDiscount = cart.reduce((sum, item) => 
            sum + (item.price * item.qty * item.discount / 100), 0);
        const grandTotal = cart.reduce((sum, item) => sum + item.total, 0);
        
        const invoice = {
            id: Date.now(),
            number: generateInvoiceNumber(),
            date: new Date().toISOString(),
            customer: customerName,
            items: [...cart],
            totalDiscount: totalDiscount,
            grandTotal: grandTotal,
            paymentMethod: paymentMethod,
            paymentText: paymentText
        };
        
        invoices.push(invoice);
        saveInvoices();
        
        // تحديث المخزون
        const products = window.productsModule?.products || [];
        cart.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            if (product) product.quantity -= item.qty;
        });
        if (window.productsModule?.saveProducts) window.productsModule.saveProducts();
        
        // طباعة
        preparePrint(invoice);
        
        cart = [];
        renderCart();
        showNotification('نجاح', 'تم حفظ الفاتورة', 'success');
    }
    
    function preparePrint(invoice) {
        const dateTimeEl = document.getElementById('print-date-time');
        const invoiceNoEl = document.getElementById('print-invoice-no');
        const customerEl = document.getElementById('print-customer');
        const tbody = document.getElementById('print-cart-items');
        
        if (dateTimeEl) dateTimeEl.textContent = new Date(invoice.date).toLocaleString('ar-EG');
        if (invoiceNoEl) invoiceNoEl.textContent = invoice.number;
        if (customerEl) customerEl.textContent = invoice.customer;
        
        if (tbody) {
            tbody.innerHTML = invoice.items.map((item, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${item.name}</td>
                    <td>${item.qty}</td>
                    <td>${formatCurrency(item.price)}</td>
                    <td>${item.discount}%</td>
                    <td>${formatCurrency(item.total)}</td>
                </tr>
            `).join('');
        }
        
        setTimeout(() => window.print(), 100);
    }
    
    function smartSearch(term) {
        const resultsBox = document.getElementById('search-box');
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
            <div class="search-item" onclick="salesModule.selectProduct('${p.name}', ${p.sellPrice}, ${p.quantity})">
                <div><strong>${p.name}</strong> - ${formatCurrency(p.sellPrice)} (${p.quantity} متوفر)</div>
            </div>
        `).join('');
        
        resultsBox.classList.add('show');
    }
    
    function selectProduct(name, price, quantity) {
        document.getElementById('sale-search').value = name;
        document.getElementById('search-box').classList.remove('show');
    }
    
    // ================== الفواتير ==================
    
    function loadInvoices() {
        const tbody = document.getElementById('sale-invoices-tbody');
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
                <td>${inv.customer}</td>
                <td>${formatCurrency(inv.grandTotal)}</td>
                <td>${inv.items.length}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="salesModule.showInvoice(${originalIndex})">
                        <i class="material-icons-round">visibility</i>
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="salesModule.deleteInvoice(${originalIndex})">
                        <i class="material-icons-round">delete</i>
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
                    <td>${item.discount}%</td>
                    <td>${formatCurrency(item.total)}</td>
                </tr>
            `;
        });
        
        Swal.fire({
            title: `فاتورة ${inv.number}`,
            html: `
                <div style="text-align:right">
                    <p>التاريخ: ${new Date(inv.date).toLocaleString('ar-EG')}</p>
                    <p>العميل: ${inv.customer}</p>
                    <p>طريقة الدفع: ${inv.paymentText}</p>
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
    
    function searchInvoices() {
        const term = document.getElementById('invoice-search')?.value.toLowerCase() || '';
        const tbody = document.getElementById('sale-invoices-tbody');
        if (!tbody) return;
        
        const filtered = invoices.filter(inv => 
            inv.number.toLowerCase().includes(term) ||
            inv.customer.toLowerCase().includes(term)
        );
        
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">لا توجد نتائج</td></tr>';
            return;
        }
        
        tbody.innerHTML = filtered.map((inv, i) => {
            const originalIndex = invoices.findIndex(x => x.id === inv.id);
            return `
            <tr>
                <td>${inv.number}</td>
                <td>${new Date(inv.date).toLocaleDateString()}</td>
                <td>${inv.customer}</td>
                <td>${formatCurrency(inv.grandTotal)}</td>
                <td>${inv.items.length}</td>
                <td><button class="btn btn-sm btn-warning" onclick="salesModule.showInvoice(${originalIndex})">عرض</button></td>
                <td><button class="btn btn-sm btn-danger" onclick="salesModule.deleteInvoice(${originalIndex})">حذف</button></td>
            </tr>
        `}).join('');
    }
    
    // ================== العملاء ==================
    
    function loadCustomersList() {
        const customers = window.customerModule?.customers || [];
        const select = document.getElementById('sale-customer');
        if (select) {
            select.innerHTML = '<option value="">اختر العميل</option>' + 
                customers.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        }
    }
    
    function addCustomer() {
        const name = document.getElementById('new-customer')?.value.trim();
        const phone = document.getElementById('new-customer-phone')?.value.trim() || '';
        
        if (!name) {
            showNotification('تنبيه', 'اسم العميل مطلوب', 'warning');
            return;
        }
        
        if (window.customerModule) {
            window.customerModule.customers.push({
                id: Date.now(),
                name: name,
                phone: phone
            });
            window.customerModule.saveCustomers?.();
            window.customerModule.renderCustomers?.();
            
            document.getElementById('new-customer').value = '';
            document.getElementById('new-customer-phone').value = '';
            
            loadCustomersList();
            showNotification('نجاح', 'تم إضافة العميل', 'success');
        }
    }
    
    function renderCustomers() {
        const tbody = document.getElementById('customers-tbody');
        if (!tbody) return;
        
        const customers = window.customerModule?.customers || [];
        
        if (customers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center p-4">لا يوجد عملاء</td></tr>';
            return;
        }
        
        tbody.innerHTML = customers.map((c, idx) => `
            <tr>
                <td>${c.name}</td>
                <td>${c.phone || '-'}</td>
                <td>${c.invoices || 0}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="salesModule.deleteCustomer(${idx})">
                        <i class="material-icons-round">delete</i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    function deleteCustomer(index) {
        const customers = window.customerModule?.customers;
        if (!customers) return;
        
        showConfirmation('تأكيد', 'حذف العميل؟', () => {
            customers.splice(index, 1);
            window.customerModule.saveCustomers?.();
            renderCustomers();
            loadCustomersList();
            showNotification('تم', 'تم حذف العميل', 'success');
        });
    }
    
    // ================== التهيئة ==================
    function init() {
        console.log('✅ salesModule initialized');
        renderCart();
        loadCustomersList();
        loadInvoices();
        renderCustomers();
        
        document.addEventListener('click', (e) => {
            const box = document.getElementById('search-box');
            const input = document.getElementById('sale-search');
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
        finishSaleAndPrint: finishSaleAndPrint,
        smartSearch: smartSearch,
        selectProduct: selectProduct,
        loadInvoices: loadInvoices,
        showInvoice: showInvoice,
        deleteInvoice: deleteInvoice,
        searchInvoices: searchInvoices,
        loadCustomersList: loadCustomersList,
        addCustomer: addCustomer,
        renderCustomers: renderCustomers,
        deleteCustomer: deleteCustomer,
        init: init
    };
})();

window.salesModule = salesModule;

// دوال HTML
window.addToCart = () => salesModule.addToCart();
window.clearCart = () => salesModule.clearCart();
window.finishSaleAndPrint = () => salesModule.finishSaleAndPrint();
window.smartSearch = (term) => salesModule.smartSearch(term);
window.searchInvoices = () => salesModule.searchInvoices();
window.addCustomer = () => salesModule.addCustomer();

// تهيئة
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(() => salesModule.init(), 200));
}
