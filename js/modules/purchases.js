// ================== purchases.js - إدارة المشتريات المتقدمة ==================
// الرقم 24 في ترتيب الملفات - نسخة محسنة مع دعم البحث الصوتي

const purchasesModule = (function() {
    // ================== البيانات ==================
    let cart = [];
    let invoices = JSON.parse(localStorage.getItem('purchase_invoices')) || [];
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
    
    // ================== إضافة منتج إلى سلة المشتريات ==================
    function addToCart() {
        const searchInput = document.getElementById('purchase-search');
        const productName = searchInput?.value.trim();
        const price = parseFloat(document.getElementById('purchase-price')?.value) || 0;
        const qty = parseInt(document.getElementById('purchase-qty')?.value) || 1;
        
        if (!productName) {
            showNotification('تنبيه', 'الرجاء إدخال اسم المنتج', 'warning');
            return false;
        }
        
        if (price <= 0) {
            showNotification('تنبيه', 'السعر مطلوب', 'warning');
            return false;
        }
        
        const existingItem = cart.find(item => item.name === productName);
        if (existingItem) {
            existingItem.qty += qty;
            existingItem.price = price;
            existingItem.total = price * existingItem.qty;
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
        document.getElementById('purchase-qty').value = '1';
        
        showNotification('نجاح', 'تم إضافة المنتج');
        updateCartCount();
        return true;
    }
    
    // ================== عرض سلة المشتريات ==================
    function renderCart() {
        const tbody = document.getElementById('purchase-cart-table');
        if (!tbody) return;
        
        if (cart.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4"><i class="material-icons-round" style="font-size:48px;">shopping_cart</i><br>السلة فارغة</td></tr>';
            updateTotal();
            updateCartCount();
            return;
        }
        
        tbody.innerHTML = cart.map((item, index) => `
            <tr>
                <td>${item.name}</td>
                <td>${item.qty}</td>
                <td>${formatCurrency(item.price)}</td>
                <td>${formatCurrency(item.total)}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="purchasesModule.removeFromCart('${item.id}')">
                        <i class="material-icons-round">delete</i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        updateTotal();
        updateCartCount();
    }
    
    // ================== تحديث عداد السلة ==================
    function updateCartCount() {
        const countEl = document.getElementById('purchase-cart-count');
        if (countEl) countEl.textContent = cart.length;
    }
    
    // ================== تحديث المجموع ==================
    function updateTotal() {
        const grandTotal = cart.reduce((sum, item) => sum + item.total, 0);
        const totalEl = document.getElementById('purchase-grand-total');
        if (totalEl) totalEl.textContent = formatCurrency(grandTotal) + ' دج';
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
    
    // ================== إنهاء عملية الشراء ==================
    function finishPurchase() {
        if (cart.length === 0) {
            showNotification('تنبيه', 'السلة فارغة', 'warning');
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
        
        const grandTotal = cart.reduce((sum, item) => sum + item.total, 0);
        
        const invoice = {
            id: Date.now(),
            number: generateInvoiceNumber(),
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
        
        // تحديث المخزون - إضافة المنتجات
        cart.forEach(item => {
            const products = window.productModule?.getAllProducts?.() || [];
            let product = products.find(p => p.name === item.name);
            
            if (product) {
                window.inventoryModule?.addStock(product.id, item.qty, item.price, `فاتورة مشتريات رقم ${invoice.number}`);
                
                // تحديث الحد الأدنى إذا كان أقل
                if (item.minStock && product.minStock < item.minStock) {
                    window.productModule?.updateProduct(product.id, { minStock: item.minStock });
                }
            } else {
                const newProduct = window.productModule?.addProduct({
                    name: item.name,
                    buyPrice: item.price,
                    sellPrice: item.price * 1.3,
                    quantity: item.qty,
                    unit: 'قطعة',
                    category: 'عام',
                    minStock: item.minStock || 5
                });
                
                if (newProduct) {
                    window.inventoryModule?.addStock(newProduct.id, item.qty, item.price, `فاتورة مشتريات رقم ${invoice.number} (منتج جديد)`);
                }
            }
        });
        
        if (supplierId && paymentMethod === 'credit') {
            window.supplierModule?.addDebt?.(supplierId, grandTotal);
        }
        
        if (supplierId) {
            window.supplierModule?.updateSupplierStats?.(supplierId, grandTotal);
        }
        
        cart = [];
        renderCart();
        
        showNotification('نجاح', 'تم حفظ فاتورة الشراء');
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
        const printWindow = window.open('', '_blank');
        
        let itemsHtml = '';
        invoice.items.forEach((item, i) => {
            itemsHtml += `
                <tr>
                    <td>${i + 1}</td>
                    <td>${item.name}</td>
                    <td>${item.qty}</td>
                    <td>${formatCurrency(item.price)}</td>
                    <td>${formatCurrency(item.total)}</td>
                </tr>
            `;
        });
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <title>فاتورة شراء ${invoice.number}</title>
                <style>
                    body { font-family: Arial; padding: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    h1 { color: #333; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th { background: #f5f5f5; padding: 10px; border: 1px solid #ddd; }
                    td { padding: 8px; border: 1px solid #ddd; text-align: center; }
                    .total { font-size: 18px; font-weight: bold; text-align: left; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>سوبر - النظام المتكامل</h1>
                    <h3>فاتورة شراء</h3>
                    <p>رقم: ${invoice.number}</p>
                    <p>التاريخ: ${new Date(invoice.date).toLocaleString('ar-EG')}</p>
                    <p>المورد: ${invoice.supplier}</p>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>المنتج</th>
                            <th>الكمية</th>
                            <th>السعر</th>
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
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
    }
    
    // ================== البحث عن المنتجات (محدث مع دعم الصوت) ==================
    function searchProducts(term) {
        const resultsBox = document.getElementById('purchase-search-box');
        if (!resultsBox) return;
        
        if (!term || term.length < 2) {
            resultsBox.classList.remove('show');
            return;
        }
        
        const products = window.productModule?.getAllProducts?.() || [];
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
                        <small>آخر سعر شراء: ${formatCurrency(p.buyPrice)}</small>
                        ${p.minStock ? `<br><small>الحد الأدنى: ${p.minStock}</small>` : ''}
                    </div>
                </div>
            </div>
        `).join('');
        
        resultsBox.classList.add('show');
    }
    
    // ================== البحث الصوتي ==================
    function voiceSearch() {
        return new Promise((resolve, reject) => {
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                reject('المتصفح لا يدعم البحث الصوتي');
                return;
            }
            
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.lang = 'ar-SA';
            
            recognition.onstart = function() {
                document.getElementById('mic-purchase')?.classList.add('recording');
                Swal.fire({
                    title: '🎤 استمع...',
                    text: 'تحدث الآن',
                    timer: 5000,
                    timerProgressBar: true,
                    showConfirmButton: false
                });
            };
            
            recognition.onresult = function(event) {
                const text = event.results[0][0].transcript;
                resolve(text);
            };
            
            recognition.onerror = function(event) {
                document.getElementById('mic-purchase')?.classList.remove('recording');
                reject(event.error);
            };
            
            recognition.onend = function() {
                document.getElementById('mic-purchase')?.classList.remove('recording');
            };
            
            recognition.start();
        });
    }
    
    // ================== بدء البحث الصوتي ==================
    async function startVoiceSearch() {
        try {
            const text = await voiceSearch();
            document.getElementById('purchase-search').value = text;
            searchProducts(text);
        } catch (error) {
            showNotification('خطأ', 'فشل التعرف على الصوت', 'error');
        }
    }
    
    // ================== اختيار منتج ==================
    function selectProduct(name, price) {
        document.getElementById('purchase-search').value = name;
        document.getElementById('purchase-price').value = price;
        document.getElementById('purchase-search-box').classList.remove('show');
    }
    
    // ================== تحميل الموردين ==================
    function loadSuppliers() {
        const suppliers = window.supplierModule?.getAllSuppliers?.() || [];
        const select = document.getElementById('purchase-supplier');
        
        if (select) {
            select.innerHTML = '<option value="">اختر المورد (اختياري)</option>' + 
                suppliers.map(s => `<option value="${s.id}">${s.company || s.name} ${s.phone ? '- ' + s.phone : ''}</option>`).join('');
        }
    }
    
    // ================== الحصول على الفواتير ==================
    function getInvoices() {
        return [...invoices].sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    // ================== عرض الفواتير ==================
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
                <td>${new Date(inv.date).toLocaleDateString('ar-EG')}</td>
                <td>${inv.supplier}</td>
                <td>${formatCurrency(inv.grandTotal)} دج</td>
                <td>${inv.paymentText}</td>
                <td>${inv.items.length}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="purchasesModule.showInvoice('${inv.id}')">
                        <i class="material-icons-round">visibility</i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="purchasesModule.deleteInvoice('${inv.id}')">
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
                    <td style="padding:8px; border:1px solid #ddd;">${formatCurrency(item.total)}</td>
                </tr>
            `;
        });
        
        Swal.fire({
            title: `فاتورة شراء ${invoice.number}`,
            html: `
                <div style="text-align:right; max-height:400px; overflow-y:auto;">
                    <p><strong>التاريخ:</strong> ${new Date(invoice.date).toLocaleString('ar-EG')}</p>
                    <p><strong>المورد:</strong> ${invoice.supplier}</p>
                    <p><strong>طريقة الدفع:</strong> ${invoice.paymentText}</p>
                    <hr>
                    <table style="width:100%; border-collapse:collapse;">
                        ${itemsHtml}
                    </table>
                    <hr>
                    <h4>الإجمالي: ${formatCurrency(invoice.grandTotal)} دج</h4>
                </div>
            `,
            width: '800px'
        });
    }
    
    // ================== حذف فاتورة ==================
    function deleteInvoice(id) {
        const invoice = invoices.find(inv => inv.id == id);
        if (!invoice) return;
        
        showConfirmation('تأكيد الحذف', `حذف فاتورة الشراء ${invoice.number}؟`, () => {
            invoices = invoices.filter(inv => inv.id != id);
            saveInvoices();
            renderInvoices();
            showNotification('تم', 'تم حذف الفاتورة');
        });
    }
    
    // ================== البحث في الفواتير ==================
    function searchInvoices() {
        const term = document.getElementById('purchase-invoice-search')?.value.toLowerCase() || '';
        const tbody = document.getElementById('purchase-invoices-tbody');
        if (!tbody) return;
        
        if (!term) {
            renderInvoices();
            return;
        }
        
        const filtered = invoices.filter(inv => 
            inv.number.toLowerCase().includes(term) ||
            inv.supplier.toLowerCase().includes(term)
        );
        
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center p-4">لا توجد نتائج</td></tr>';
            return;
        }
        
        tbody.innerHTML = filtered.map(inv => `
            <tr>
                <td>${inv.number}</td>
                <td>${new Date(inv.date).toLocaleDateString('ar-EG')}</td>
                <td>${inv.supplier}</td>
                <td>${formatCurrency(inv.grandTotal)} دج</td>
                <td>${inv.paymentText}</td>
                <td>${inv.items.length}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="purchasesModule.showInvoice('${inv.id}')">عرض</button>
                </td>
            </tr>
        `).join('');
    }
    
    // ================== إحصائيات المشتريات ==================
    function getPurchasesStats() {
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
    
    // ================== تهيئة الوحدة ==================
    function init() {
        console.log('✅ purchasesModule v2 initialized - الرقم 24');
        console.log(`   عدد فواتير الشراء: ${invoices.length}`);
        
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
        cart,
        invoices,
        addToCart,
        removeFromCart,
        clearCart,
        finishPurchase,
        finishPurchaseAndPrint,
        searchProducts,
        selectProduct,
        startVoiceSearch,
        loadSuppliers,
        getInvoices,
        renderInvoices,
        showInvoice,
        deleteInvoice,
        searchInvoices,
        getPurchasesStats,
        init
    };
})();

window.purchasesModule = purchasesModule;

// دوال مختصرة
window.addToPurchaseCart = () => purchasesModule.addToCart();
window.clearPurchaseCart = () => purchasesModule.clearCart();
window.finishPurchase = () => purchasesModule.finishPurchase();
window.finishPurchaseAndPrint = () => purchasesModule.finishPurchaseAndPrint();
window.startVoiceSearchPurchase = () => purchasesModule.startVoiceSearch();

// تهيئة تلقائية
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => purchasesModule.init());
    document.addEventListener('html-loaded', () => purchasesModule.init());
}
