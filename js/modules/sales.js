// ================== إدارة المبيعات ==================
const salesModule = (function() {
    let cart = [];
    let invoices = JSON.parse(localStorage.getItem('ryan_invoices')) || [];
    let currentEditInvoiceIndex = -1;

    function getCart() {
        return cart;
    }

    function showSubSection(subId) {
        utils.showSubSection(subId);
    }

    // البحث الذكي
    function smartSearch(val) {
        const box = document.getElementById('search-box');
        if (val.length < 1) { box.style.display = 'none'; return; }
        const matches = inventoryModule.stock.filter(p => p.name.toLowerCase().includes(val.toLowerCase()) || (p.barcode && p.barcode.includes(val)));
        if (matches.length > 0) {
            box.innerHTML = matches.map(p => `
                <div class="search-item" onclick="salesModule.selectProduct('${p.name}')">
                    <b>${p.name}</b>
                    <div class="d-flex justify-content-between small text-muted">
                        <span>مخزون: ${p.qty} ${p.unit}</span>
                        <span>بيع: ${p.sellPrice} دج</span>
                    </div>
                </div>
            `).join('');
            box.style.display = 'block';
        } else {
            box.innerHTML = `
                <div class="search-item" onclick="inventoryModule.saveQuickProduct('sale', '${val}')">
                    <b>لا توجد منتجات بهذا الاسم</b>
                    <div class="text-primary">+ انقر لإضافة "${val}" كمنتج جديد</div>
                </div>
            `;
            box.style.display = 'block';
        }
    }

    function selectProduct(name) {
        document.getElementById('sale-search').value = name;
        document.getElementById('search-box').style.display = 'none';
        document.getElementById('sale-qty').focus();
    }

    // إدارة السلة
    function addToCart() {
        const name = document.getElementById('sale-search').value.trim();
        const qty = parseFloat(document.getElementById('sale-qty').value) || 0;
        const discount = parseFloat(document.getElementById('sale-discount').value) || 0;
        if (!name || qty <= 0) {
            Swal.fire('تنبيه', 'أدخل المنتج والكمية', 'warning');
            return;
        }
        if (discount > 100) {
            Swal.fire('تنبيه', 'الخصم لا يتجاوز 100%', 'warning');
            return;
        }
        const product = inventoryModule.stock.find(p => p.name === name);
        if (!product) {
            Swal.fire('خطأ', 'المنتج غير موجود', 'error');
            return;
        }
        if (qty > product.qty) {
            Swal.fire('خطأ', 'الكمية غير كافية في المخزون', 'error');
            return;
        }
        const total = qty * product.sellPrice * (1 - discount / 100);
        cart.push({
            id: Date.now() + Math.random(),
            productId: product.id,
            name,
            qty,
            price: product.sellPrice,
            discount,
            total
        });
        product.qty -= qty;
        inventoryModule.saveStock();
        inventoryModule.addMovement('بيع', name, qty);
        renderCart();
        document.getElementById('sale-search').value = '';
        document.getElementById('sale-qty').value = '';
        document.getElementById('sale-discount').value = '';
    }

    function renderCart() {
        const tbody = document.getElementById('cart-table');
        tbody.innerHTML = cart.map((item, idx) => `
            <tr>
                <td>${item.name}</td>
                <td>${item.qty}</td>
                <td>${item.price.toFixed(2)} دج</td>
                <td>${item.discount}%</td>
                <td>${item.total.toFixed(2)} دج</td>
                <td><button class="btn btn-sm btn-danger" onclick="salesModule.removeCartItem(${idx})"><i class="material-icons-round" style="font-size:16px;">delete</i></button></td>
            </tr>
        `).join('');
        const totalDiscount = cart.reduce((sum, i) => sum + (i.qty * i.price * (i.discount / 100)), 0);
        const grandTotal = cart.reduce((sum, i) => sum + i.total, 0);
        document.getElementById('total-discount').textContent = totalDiscount.toFixed(2);
        document.getElementById('grand-total').textContent = grandTotal.toFixed(2);
        document.getElementById('final-grand-total').textContent = grandTotal.toFixed(2);
    }

    function removeCartItem(idx) {
        const item = cart[idx];
        Swal.fire({
            title: 'تأكيد الحذف',
            text: `هل أنت متأكد من حذف "${item.name}" من السلة؟`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed) {
                const prod = inventoryModule.stock.find(p => p.id === item.productId);
                if (prod) prod.qty += item.qty;
                cart.splice(idx, 1);
                inventoryModule.saveStock();
                renderCart();
                Swal.fire('تم الحذف', 'تم حذف المنتج من السلة', 'success');
            }
        });
    }

    function clearCart() {
        if (cart.length === 0) return;
        Swal.fire({
            title: 'تأكيد مسح السلة',
            text: 'هل أنت متأكد من مسح جميع العناصر من السلة؟',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'نعم، امسح',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed) {
                cart.forEach(item => {
                    const p = inventoryModule.stock.find(pr => pr.id === item.productId);
                    if (p) p.qty += item.qty;
                });
                cart = [];
                inventoryModule.saveStock();
                renderCart();
                Swal.fire('تم', 'تم مسح السلة', 'success');
            }
        });
    }

    function finishSaleAndPrint() {
        if (cart.length === 0) {
            Swal.fire('تنبيه', 'السلة فارغة', 'warning');
            return;
        }
        const total = cart.reduce((sum, i) => sum + i.total, 0);
        const totalDiscount = cart.reduce((sum, i) => sum + (i.qty * i.price * (i.discount / 100)), 0);
        const now = new Date();
        const invNo = invoices.length + 1;
        const customerSelect = document.getElementById('sale-customer');
        const selectedOption = customerSelect.options[customerSelect.selectedIndex];
        const customerName = selectedOption ? selectedOption.text : 'غير محدد';
        const customer = customerName === 'اختر العميل' ? 'غير محدد' : customerName;
        const invoice = {
            number: invNo,
            date: now.toLocaleString('ar-DZ'),
            customer,
            items: cart.map(item => ({ ...item })),
            total,
            totalDiscount
        };
        invoices.push(invoice);
        localStorage.setItem('ryan_invoices', JSON.stringify(invoices));

        document.getElementById('print-invoice-no').textContent = invNo;
        document.getElementById('print-date-time').textContent = invoice.date;
        document.getElementById('print-customer').textContent = customer;
        document.getElementById('print-grand-total').textContent = total.toFixed(2) + ' دج';
        document.getElementById('print-total-discount').textContent = totalDiscount.toFixed(2) + ' دج';
        document.getElementById('print-cart-items').innerHTML = cart.map(it => `
            <tr>
                <td style="text-align:right;">${it.name}</td>
                <td style="text-align:center;">${it.qty}</td>
                <td style="text-align:left;">${it.price.toFixed(2)} دج</td>
                <td style="text-align:left;">${it.discount}%</td>
                <td style="text-align:left;">${it.total.toFixed(2)} دج</td>
            </tr>
        `).join('');
        window.print();

        cart = [];
        renderCart();
        reportsModule.renderReports();
        if (document.getElementById('sale-invoices').style.display !== 'none') renderSaleInvoices();
        Swal.fire('نجاح', 'تم حفظ الفاتورة', 'success');
    }

    // فواتير المبيعات
    function renderSaleInvoices(filteredInvoices = null) {
        const tbody = document.getElementById('sale-invoices-tbody');
        const invs = filteredInvoices || invoices;
        tbody.innerHTML = invs.map((inv, index) => {
            const originalIndex = invoices.findIndex(i => i.number === inv.number && i.date === inv.date);
            return `
            <tr>
                <td>${inv.number}</td>
                <td>${inv.date}</td>
                <td>${inv.customer}</td>
                <td>${inv.total.toFixed(2)} دج</td>
                <td>${inv.items.length}</td>
                <td><button class="btn btn-sm btn-warning" onclick="salesModule.editInvoice(${originalIndex})"><i class="material-icons-round" style="font-size:16px;">edit</i></button></td>
                <td><button class="btn btn-sm btn-danger" onclick="salesModule.deleteInvoice(${originalIndex})"><i class="material-icons-round" style="font-size:16px;">delete</i></button></td>
            </tr>
        `}).join('');
    }

    function searchInvoices() {
        const searchTerm = document.getElementById('invoice-search').value.trim().toLowerCase();
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
        Swal.fire({
            title: 'تأكيد الحذف',
            text: 'هل أنت متأكد من حذف هذه الفاتورة نهائياً؟',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed) {
                invoices.splice(index, 1);
                localStorage.setItem('ryan_invoices', JSON.stringify(invoices));
                renderSaleInvoices();
                reportsModule.renderReports();
                Swal.fire('تم الحذف', 'تم حذف الفاتورة', 'success');
            }
        });
    }

    function editInvoice(index) {
        currentEditInvoiceIndex = index;
        const inv = invoices[index];
        document.getElementById('edit-invoice-number').textContent = inv.number;

        const missingProducts = inv.items.filter(item => !inventoryModule.stock.some(p => p.id === item.productId));
        if (missingProducts.length > 0) {
            Swal.fire({
                title: 'منتجات محذوفة',
                html: `المنتجات التالية غير موجودة في المخزن ولا يمكن تعديلها: <b>${missingProducts.map(m => m.name).join('، ')}</b><br>سيتم إزالتها من الفاتورة تلقائياً.`,
                icon: 'warning',
                confirmButtonText: 'موافق'
            });
            inv.items = inv.items.filter(item => inventoryModule.stock.some(p => p.id === item.productId));
        }

        const container = document.getElementById('edit-invoice-items-container');
        container.innerHTML = inv.items.map((item, i) => {
            const product = inventoryModule.stock.find(p => p.id === item.productId);
            if (!product) return '';
            return `
                <div class="edit-item-row">
                    <strong>${item.name}</strong><br>
                    الكمية: <input type="number" id="edit-qty-${i}" value="${item.qty}" min="1" class="form-control d-inline" style="width:80px;">
                    السعر: <input type="number" id="edit-price-${i}" value="${item.price}" min="0" step="0.01" class="form-control d-inline" style="width:100px;">
                    الخصم %: <input type="number" id="edit-discount-${i}" value="${item.discount || 0}" min="0" max="100" class="form-control d-inline" style="width:80px;">
                </div>
            `;
        }).join('');
        if (container.innerHTML === '') {
            container.innerHTML = '<p class="text-danger">لا توجد منتجات صالحة للتعديل.</p>';
        }
        new bootstrap.Modal(document.getElementById('editInvoiceModal')).show();
    }

    function updateInvoice() {
        if (currentEditInvoiceIndex === -1) return;
        const inv = invoices[currentEditInvoiceIndex];
        const newItems = [];
        let valid = true;

        for (let i = 0; i < inv.items.length; i++) {
            const product = inventoryModule.stock.find(p => p.id === inv.items[i].productId);
            if (!product) continue;
            const qtyInput = document.getElementById(`edit-qty-${i}`);
            const priceInput = document.getElementById(`edit-price-${i}`);
            const discountInput = document.getElementById(`edit-discount-${i}`);
            if (!qtyInput || !priceInput || !discountInput) continue;
            const newQty = parseFloat(qtyInput.value);
            const newPrice = parseFloat(priceInput.value);
            const newDiscount = parseFloat(discountInput.value) || 0;
            if (isNaN(newQty) || newQty < 0 || isNaN(newPrice) || newPrice < 0 || newDiscount > 100) {
                Swal.fire('خطأ', 'الرجاء إدخال قيم صحيحة', 'error');
                valid = false;
                break;
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
        if (!valid) return;

        inv.items.forEach(item => {
            const prod = inventoryModule.stock.find(p => p.id === item.productId);
            if (prod) prod.qty += item.qty;
        });

        let stockOk = true;
        newItems.forEach(item => {
            const prod = inventoryModule.stock.find(p => p.id === item.productId);
            if (prod && item.qty > prod.qty) {
                Swal.fire('خطأ', `الكمية الجديدة للمنتج ${item.name} تتجاوز المتوفر في المخزن (${prod.qty})`, 'error');
                stockOk = false;
            }
        });
        if (!stockOk) {
            inv.items.forEach(item => {
                const prod = inventoryModule.stock.find(p => p.id === item.productId);
                if (prod) prod.qty -= item.qty;
            });
            return;
        }

        newItems.forEach(item => {
            const prod = inventoryModule.stock.find(p => p.id === item.productId);
            if (prod) prod.qty -= item.qty;
        });

        const newTotal = newItems.reduce((sum, i) => sum + i.total, 0);
        const newTotalDiscount = newItems.reduce((sum, i) => sum + (i.qty * i.price * (i.discount / 100)), 0);
        invoices[currentEditInvoiceIndex] = {
            ...inv,
            items: newItems,
            total: newTotal,
            totalDiscount: newTotalDiscount
        };
        localStorage.setItem('ryan_invoices', JSON.stringify(invoices));
        inventoryModule.saveStock();
        bootstrap.Modal.getInstance(document.getElementById('editInvoiceModal')).hide();
        Swal.fire('نجاح', 'تم تعديل الفاتورة وتحديث المخزن', 'success');
        renderSaleInvoices();
        inventoryModule.renderStock();
        reportsModule.renderReports();
        currentEditInvoiceIndex = -1;
    }

    // إعداد البحث الصوتي
    function initVoiceSearch() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.lang = 'ar-DZ';
            recognition.interimResults = false;
            recognition.onresult = (event) => {
                document.getElementById('sale-search').value = event.results[0][0].transcript;
                smartSearch(event.results[0][0].transcript);
            };
            document.getElementById('mic-sale').addEventListener('click', () => recognition.start());
        }
    }

    return {
        cart,
        getCart,
        showSubSection,
        smartSearch,
        selectProduct,
        addToCart,
        renderCart,
        removeCartItem,
        clearCart,
        finishSaleAndPrint,
        renderSaleInvoices,
        searchInvoices,
        deleteInvoice,
        editInvoice,
        updateInvoice,
        initVoiceSearch
    };
})();
