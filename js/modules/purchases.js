// ================== إدارة المشتريات ==================
const purchasesModule = (function() {
    let purchaseCart = [];
    let purchases = JSON.parse(localStorage.getItem('ryan_purchases')) || [];
    let currentEditPurchaseIndex = -1;

    function getPurchaseCart() {
        return purchaseCart;
    }

    function showSubSection(subId) {
        utils.showSubSection(subId);
    }

    function smartSearchPurchase(val) {
        const box = document.getElementById('purchase-search-box');
        if (val.length < 1) { box.style.display = 'none'; return; }
        const matches = inventoryModule.stock.filter(p => p.name.toLowerCase().includes(val.toLowerCase()) || (p.barcode && p.barcode.includes(val)));
        if (matches.length > 0) {
            box.innerHTML = matches.map(p => `
                <div class="search-item" onclick="purchasesModule.selectProductPurchase('${p.name}')">
                    <b>${p.name}</b>
                    <div class="d-flex justify-content-between small text-muted">
                        <span>مخزون: ${p.qty} ${p.unit}</span>
                        <span>شراء: ${p.buyPrice} دج</span>
                    </div>
                </div>
            `).join('');
            box.style.display = 'block';
        } else {
            box.innerHTML = `
                <div class="search-item" onclick="inventoryModule.saveQuickProduct('purchase', '${val}')">
                    <b>لا توجد منتجات بهذا الاسم</b>
                    <div class="text-primary">+ انقر لإضافة "${val}" كمنتج جديد</div>
                </div>
            `;
            box.style.display = 'block';
        }
    }

    function selectProductPurchase(name) {
        document.getElementById('purchase-search').value = name;
        document.getElementById('purchase-search-box').style.display = 'none';
        document.getElementById('purchase-qty').focus();
    }

    function addToPurchaseCart() {
        const name = document.getElementById('purchase-search').value.trim();
        const qty = parseFloat(document.getElementById('purchase-qty').value) || 0;
        if (!name || qty <= 0) {
            Swal.fire('تنبيه', 'أدخل المنتج والكمية', 'warning');
            return;
        }
        const product = inventoryModule.stock.find(p => p.name === name);
        if (!product) {
            Swal.fire('خطأ', 'المنتج غير موجود', 'error');
            return;
        }
        const total = qty * product.buyPrice;
        purchaseCart.push({
            id: Date.now() + Math.random(),
            productId: product.id,
            name,
            qty,
            price: product.buyPrice,
            total
        });
        product.qty += qty;
        inventoryModule.saveStock();
        inventoryModule.addMovement('شراء', name, qty);
        renderPurchaseCart();
        document.getElementById('purchase-search').value = '';
        document.getElementById('purchase-qty').value = '';
    }

    function renderPurchaseCart() {
        const tbody = document.getElementById('purchase-cart-table');
        tbody.innerHTML = purchaseCart.map((item, idx) => `
            <tr>
                <td>${item.name}</td>
                <td>${item.qty}</td>
                <td>${item.price.toFixed(2)} دج</td>
                <td>${item.total.toFixed(2)} دج</td>
                <td><button class="btn btn-sm btn-primary" onclick="purchasesModule.editPurchaseCartItemPrice(${idx})"><i class="material-icons-round" style="font-size:16px;">edit</i></button></td>
                <td><button class="btn btn-sm btn-danger" onclick="purchasesModule.removePurchaseCartItem(${idx})"><i class="material-icons-round" style="font-size:16px;">delete</i></button></td>
            </tr>
        `).join('');
        const total = purchaseCart.reduce((sum, i) => sum + i.total, 0);
        document.getElementById('purchase-grand-total').textContent = total.toFixed(2);
    }

    function removePurchaseCartItem(idx) {
        const item = purchaseCart[idx];
        Swal.fire({
            title: 'تأكيد الحذف',
            text: `هل أنت متأكد من حذف "${item.name}" من سلة المشتريات؟`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed) {
                const prod = inventoryModule.stock.find(p => p.id === item.productId);
                if (prod) prod.qty -= item.qty;
                purchaseCart.splice(idx, 1);
                inventoryModule.saveStock();
                renderPurchaseCart();
                Swal.fire('تم الحذف', 'تم حذف المنتج من سلة المشتريات', 'success');
            }
        });
    }

    function editPurchaseCartItemPrice(index) {
        const item = purchaseCart[index];
        Swal.fire({
            title: 'تعديل تكلفة الشراء',
            input: 'number',
            inputLabel: 'السعر الجديد (دج)',
            inputValue: item.price,
            showCancelButton: true,
            confirmButtonText: 'حفظ',
            cancelButtonText: 'إلغاء',
            inputValidator: (value) => {
                if (!value || value <= 0) return 'يجب إدخال سعر صحيح أكبر من صفر';
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const newPrice = parseFloat(result.value);
                const newTotal = item.qty * newPrice;
                purchaseCart[index] = { ...item, price: newPrice, total: newTotal };
                renderPurchaseCart();
                Swal.fire('تم', 'تم تحديث التكلفة', 'success');
            }
        });
    }

    function clearPurchaseCart() {
        if (purchaseCart.length === 0) return;
        Swal.fire({
            title: 'تأكيد مسح السلة',
            text: 'هل أنت متأكد من مسح جميع العناصر من سلة المشتريات؟',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'نعم، امسح',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed) {
                purchaseCart.forEach(item => {
                    const p = inventoryModule.stock.find(pr => pr.id === item.productId);
                    if (p) p.qty -= item.qty;
                });
                purchaseCart = [];
                inventoryModule.saveStock();
                renderPurchaseCart();
                Swal.fire('تم', 'تم مسح السلة', 'success');
            }
        });
    }

    function finishPurchaseAndPrint() {
        if (purchaseCart.length === 0) {
            Swal.fire('تنبيه', 'السلة فارغة', 'warning');
            return;
        }
        const total = purchaseCart.reduce((sum, i) => sum + i.total, 0);
        const now = new Date();
        const invNo = purchases.length + 1;
        const supplierSelect = document.getElementById('purchase-supplier');
        const selectedOption = supplierSelect.options[supplierSelect.selectedIndex];
        const supplierName = selectedOption ? selectedOption.text : 'غير محدد';
        const supplier = supplierName === 'اختر المورد' ? 'غير محدد' : supplierName;
        const purchase = {
            number: invNo,
            date: now.toLocaleString('ar-DZ'),
            supplier,
            items: purchaseCart.map(item => ({ ...item })),
            total
        };
        purchases.push(purchase);
        localStorage.setItem('ryan_purchases', JSON.stringify(purchases));

        document.getElementById('purchase-print-invoice-no').textContent = invNo;
        document.getElementById('purchase-print-date-time').textContent = purchase.date;
        document.getElementById('print-supplier').textContent = supplier;
        document.getElementById('purchase-print-grand-total').textContent = total.toFixed(2) + ' دج';
        document.getElementById('purchase-print-cart-items').innerHTML = purchaseCart.map(it => `
            <tr>
                <td style="text-align:right;">${it.name}</td>
                <td style="text-align:center;">${it.qty}</td>
                <td style="text-align:left;">${it.price.toFixed(2)} دج</td>
                <td style="text-align:left;">${it.total.toFixed(2)} دج</td>
            </tr>
        `).join('');
        window.print();

        purchaseCart = [];
        renderPurchaseCart();
        reportsModule.renderReports();
        if (document.getElementById('purchase-invoices').style.display !== 'none') renderPurchaseInvoices();
        Swal.fire('نجاح', 'تم حفظ فاتورة الشراء', 'success');
    }

    function renderPurchaseInvoices() {
        const tbody = document.getElementById('purchase-invoices-tbody');
        tbody.innerHTML = purchases.map((pur, index) => `
            <tr>
                <td>${pur.number}</td>
                <td>${pur.date}</td>
                <td>${pur.supplier}</td>
                <td>${pur.total.toFixed(2)} دج</td>
                <td>${pur.items.length}</td>
                <td><button class="btn btn-sm btn-warning" onclick="purchasesModule.editPurchaseInvoice(${index})"><i class="material-icons-round" style="font-size:16px;">edit</i></button></td>
                <td><button class="btn btn-sm btn-danger" onclick="purchasesModule.deletePurchaseInvoice(${index})"><i class="material-icons-round" style="font-size:16px;">delete</i></button></td>
            </tr>
        `).join('');
    }

    function deletePurchaseInvoice(index) {
        Swal.fire({
            title: 'تأكيد الحذف',
            text: 'هل أنت متأكد من حذف فاتورة الشراء هذه نهائياً؟',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'نعم، احذف',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed) {
                purchases.splice(index, 1);
                localStorage.setItem('ryan_purchases', JSON.stringify(purchases));
                renderPurchaseInvoices();
                reportsModule.renderReports();
                Swal.fire('تم الحذف', 'تم حذف الفاتورة', 'success');
            }
        });
    }

    function editPurchaseInvoice(index) {
        currentEditPurchaseIndex = index;
        const pur = purchases[index];
        document.getElementById('edit-purchase-invoice-number').textContent = pur.number;

        const missingProducts = pur.items.filter(item => !inventoryModule.stock.some(p => p.id === item.productId));
        if (missingProducts.length > 0) {
            Swal.fire({
                title: 'منتجات محذوفة',
                html: `المنتجات التالية غير موجودة في المخزن وسيتم إزالتها: <b>${missingProducts.map(m => m.name).join('، ')}</b>`,
                icon: 'warning',
                confirmButtonText: 'موافق'
            });
            pur.items = pur.items.filter(item => inventoryModule.stock.some(p => p.id === item.productId));
        }

        const container = document.getElementById('edit-purchase-invoice-items-container');
        container.innerHTML = pur.items.map((item, i) => {
            const product = inventoryModule.stock.find(p => p.id === item.productId);
            if (!product) return '';
            return `
                <div class="edit-item-row">
                    <strong>${item.name}</strong><br>
                    الكمية: <input type="number" id="edit-purchase-qty-${i}" value="${item.qty}" min="0" step="1" class="form-control d-inline" style="width:80px;">
                    السعر: <input type="number" id="edit-purchase-price-${i}" value="${item.price}" min="0" step="0.01" class="form-control d-inline" style="width:100px;">
                </div>
            `;
        }).join('');
        if (container.innerHTML === '') {
            container.innerHTML = '<p class="text-danger">لا توجد منتجات صالحة للتعديل.</p>';
        }
        new bootstrap.Modal(document.getElementById('editPurchaseInvoiceModal')).show();
    }

    function updatePurchaseInvoice() {
        if (currentEditPurchaseIndex === -1) return;
        const pur = purchases[currentEditPurchaseIndex];
        const newItems = [];
        let valid = true;

        for (let i = 0; i < pur.items.length; i++) {
            const product = inventoryModule.stock.find(p => p.id === pur.items[i].productId);
            if (!product) continue;
            const qtyInput = document.getElementById(`edit-purchase-qty-${i}`);
            const priceInput = document.getElementById(`edit-purchase-price-${i}`);
            if (!qtyInput || !priceInput) continue;
            const newQty = parseFloat(qtyInput.value);
            const newPrice = parseFloat(priceInput.value);
            if (isNaN(newQty) || newQty < 0 || isNaN(newPrice) || newPrice < 0) {
                Swal.fire('خطأ', 'الرجاء إدخال قيم صحيحة', 'error');
                valid = false;
                break;
            }
            const total = newQty * newPrice;
            newItems.push({
                ...pur.items[i],
                qty: newQty,
                price: newPrice,
                total
            });
        }
        if (!valid) return;

        pur.items.forEach(item => {
            const prod = inventoryModule.stock.find(p => p.id === item.productId);
            if (prod) prod.qty -= item.qty;
        });

        newItems.forEach(item => {
            const prod = inventoryModule.stock.find(p => p.id === item.productId);
            if (prod) prod.qty += item.qty;
        });

        const newTotal = newItems.reduce((sum, i) => sum + i.total, 0);
        purchases[currentEditPurchaseIndex] = { ...pur, items: newItems, total: newTotal };
        localStorage.setItem('ryan_purchases', JSON.stringify(purchases));
        inventoryModule.saveStock();
        bootstrap.Modal.getInstance(document.getElementById('editPurchaseInvoiceModal')).hide();
        Swal.fire('نجاح', 'تم تعديل فاتورة الشراء وتحديث المخزن', 'success');
        renderPurchaseInvoices();
        inventoryModule.renderStock();
        reportsModule.renderReports();
        currentEditPurchaseIndex = -1;
    }

    function initVoiceSearch() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.lang = 'ar-DZ';
            recognition.interimResults = false;
            recognition.onresult = (event) => {
                document.getElementById('purchase-search').value = event.results[0][0].transcript;
                smartSearchPurchase(event.results[0][0].transcript);
            };
            document.getElementById('mic-purchase').addEventListener('click', () => recognition.start());
        }
    }

    return {
        purchaseCart,
        getPurchaseCart,
        showSubSection,
        smartSearchPurchase,
        selectProductPurchase,
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
        initVoiceSearch
    };
})();
