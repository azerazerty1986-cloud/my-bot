// ================== إدارة المبيعات ==================
const salesModule = (function() {
    // سلة المبيعات
    let cart = [];
    let invoices = JSON.parse(localStorage.getItem('ryan_invoices')) || [];
    let currentEditInvoiceIndex = -1;

    // دالة للحصول على السلة (للاستخدام من الوحدات الأخرى)
    function getCart() {
        return cart;
    }

    // دالة لإظهار القسم الفرعي
    function showSubSection(subId) {
        if (typeof utils !== 'undefined') {
            utils.showSubSection(subId);
        }
    }

    // ================== البحث الذكي ==================
    function smartSearch(val) {
        const box = document.getElementById('search-box');
        if (val.length < 1) { 
            box.style.display = 'none'; 
            return; 
        }
        
        const matches = inventoryModule.stock.filter(p => 
            p.name.toLowerCase().includes(val.toLowerCase()) || 
            (p.barcode && p.barcode.includes(val))
        );
        
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
                <div class="search-item" onclick="salesModule.openQuickAddModal('${val}')">
                    <b>لا توجد منتجات بهذا الاسم</b>
                    <div class="text-primary">+ انقر لإضافة "${val}" كمنتج جديد</div>
                </div>
            `;
            box.style.display = 'block';
        }
    }

    // دالة اختيار المنتج من搜索结果
    function selectProduct(name) {
        document.getElementById('sale-search').value = name;
        
        // البحث عن المنتج في المخزون
        const product = inventoryModule.stock.find(p => p.name === name);
        
        if (product) {
            // جلب السعر المسجل من المخزون
            document.getElementById('sale-price').value = product.sellPrice;
        } else {
            // إذا لم يوجد المنتج، اترك حقل السعر فارغاً
            document.getElementById('sale-price').value = '';
        }
        
        document.getElementById('search-box').style.display = 'none';
        document.getElementById('sale-qty').focus();
    }

    // فتح نافذة الإضافة السريعة
    function openQuickAddModal(productName) {
        if (typeof inventoryModule !== 'undefined') {
            // تعبئة الحقول
            document.getElementById('quick-product-name').value = productName;
            document.getElementById('quick-sell-price').value = '';
            document.getElementById('quick-buy-price').value = '';
            document.getElementById('quick-unit').value = 'قطعة';
            document.getElementById('quick-qty').value = '0';
            document.getElementById('quick-cart-qty').value = '1';
            document.getElementById('quick-discount').value = '0';
            document.getElementById('quick-mode').value = 'sale';
            
            // فتح المودال
            new bootstrap.Modal(document.getElementById('quickAddProductModal')).show();
        }
    }

    // ================== إضافة إلى السلة ==================
    function addToCart() {
        // الحصول على القيم من حقول الإدخال
        const name = document.getElementById('sale-search').value.trim();
        let price = parseFloat(document.getElementById('sale-price').value) || 0;
        const qty = parseFloat(document.getElementById('sale-qty').value) || 0;
        const discount = parseFloat(document.getElementById('sale-discount').value) || 0;
        
        // التحقق من المدخلات الأساسية
        if (!name || qty <= 0) {
            Swal.fire({
                icon: 'warning',
                title: 'تنبيه',
                text: 'أدخل المنتج والكمية'
            });
            return;
        }
        
        // التحقق من الخصم
        if (discount > 100) {
            Swal.fire({
                icon: 'warning',
                title: 'تنبيه',
                text: 'الخصم لا يتجاوز 100%'
            });
            return;
        }
        
        // البحث عن المنتج في المخزون
        const product = inventoryModule.stock.find(p => p.name === name);
        
        // إذا كان المنتج موجوداً في المخزون
        if (product) {
            // التحقق من الكمية
            if (qty > product.qty) {
                Swal.fire({
                    icon: 'error',
                    title: 'خطأ',
                    text: `الكمية غير كافية في المخزون. المتوفر: ${product.qty} ${product.unit}`
                });
                return;
            }
            
            // إذا لم يتم إدخال سعر، استخدم السعر المسجل
            if (price === 0) {
                price = product.sellPrice;
            }
            
            // حساب الإجمالي مع الخصم
            const total = qty * price * (1 - discount / 100);
            
            // إضافة المنتج إلى السلة
            cart.push({
                id: Date.now() + Math.random(),
                productId: product.id,
                name: name,
                qty: qty,
                price: price,
                discount: discount,
                total: total,
                originalPrice: product.sellPrice, // حفظ السعر الأصلي للرجوع إليه
                unit: product.unit
            });
            
            // تحديث المخزون (نقص الكمية)
            product.qty -= qty;
            inventoryModule.saveStock();
            inventoryModule.addMovement('بيع', name, qty);
            
            // رسالة نجاح
            Swal.fire({
                icon: 'success',
                title: 'تمت الإضافة',
                text: `تم إضافة ${name} إلى السلة`,
                timer: 1000,
                showConfirmButton: false
            });
        } 
        // إذا كان المنتج غير موجود في المخزون
        else {
            if (price <= 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'تنبيه',
                    text: 'الرجاء إدخال سعر للمنتج'
                });
                return;
            }
            
            // حساب الإجمالي مع الخصم
            const total = qty * price * (1 - discount / 100);
            
            // إضافة المنتج إلى السلة
            cart.push({
                id: Date.now() + Math.random(),
                productId: null,
                name: name,
                qty: qty,
                price: price,
                discount: discount,
                total: total,
                isCustomPrice: true,
                unit: 'قطعة'
            });
            
            // رسالة نجاح
            Swal.fire({
                icon: 'success',
                title: 'تمت الإضافة',
                text: `تم إضافة ${name} إلى السلة (سعر مخصص)`,
                timer: 1000,
                showConfirmButton: false
            });
        }
        
        // تحديث عرض السلة
        renderCart();
        
        // إفراغ حقول الإدخال
        document.getElementById('sale-search').value = '';
        document.getElementById('sale-price').value = '';
        document.getElementById('sale-qty').value = '';
        document.getElementById('sale-discount').value = '';
        
        // إخفاء نتائج البحث
        document.getElementById('search-box').style.display = 'none';
    }

    // ================== عرض السلة ==================
    function renderCart() {
        const tbody = document.getElementById('cart-table');
        if (!tbody) return;
        
        tbody.innerHTML = cart.map((item, idx) => {
            // تحديد إذا كان السعر معدلاً عن السعر الأصلي
            let priceDisplay = '';
            if (item.originalPrice && item.originalPrice !== item.price) {
                priceDisplay = `${item.price.toFixed(2)} دج <small style="color:#999; text-decoration:line-through;">(${item.originalPrice.toFixed(2)})</small>`;
            } else {
                priceDisplay = `${item.price.toFixed(2)} دج`;
            }
            
            return `
            <tr>
                <td>${item.name}</td>
                <td>${item.qty}</td>
                <td>${priceDisplay}</td>
                <td>${item.discount}%</td>
                <td>${item.total.toFixed(2)} دج</td>
                <td><button class="btn btn-sm btn-danger" onclick="salesModule.removeCartItem(${idx})"><i class="material-icons-round" style="font-size:16px;">delete</i></button></td>
            </tr>
        `}).join('');
        
        // حساب الإجماليات
        const totalDiscount = cart.reduce((sum, i) => sum + (i.qty * i.price * (i.discount / 100)), 0);
        const grandTotal = cart.reduce((sum, i) => sum + i.total, 0);
        
        // تحديث العناصر في الصفحة
        const totalDiscountEl = document.getElementById('total-discount');
        const grandTotalEl = document.getElementById('grand-total');
        const finalGrandTotalEl = document.getElementById('final-grand-total');
        
        if (totalDiscountEl) totalDiscountEl.textContent = totalDiscount.toFixed(2);
        if (grandTotalEl) grandTotalEl.textContent = grandTotal.toFixed(2);
        if (finalGrandTotalEl) finalGrandTotalEl.textContent = grandTotal.toFixed(2);
    }

    // ================== حذف عنصر من السلة ==================
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
                // إعادة الكمية إلى المخزون إذا كان المنتج موجوداً
                if (item.productId) {
                    const prod = inventoryModule.stock.find(p => p.id === item.productId);
                    if (prod) prod.qty += item.qty;
                    inventoryModule.saveStock();
                }
                
                cart.splice(idx, 1);
                renderCart();
                
                Swal.fire({
                    icon: 'success',
                    title: 'تم الحذف',
                    text: 'تم حذف المنتج من السلة',
                    timer: 1000,
                    showConfirmButton: false
                });
            }
        });
    }

    // ================== مسح السلة بالكامل ==================
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
                // إعادة الكميات إلى المخزون
                cart.forEach(item => {
                    if (item.productId) {
                        const p = inventoryModule.stock.find(pr => pr.id === item.productId);
                        if (p) p.qty += item.qty;
                    }
                });
                
                cart = [];
                inventoryModule.saveStock();
                renderCart();
                
                Swal.fire({
                    icon: 'success',
                    title: 'تم',
                    text: 'تم مسح السلة',
                    timer: 1000,
                    showConfirmButton: false
                });
            }
        });
    }

    // ================== إنهاء البيع والطباعة ==================
    function finishSaleAndPrint() {
        if (cart.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'تنبيه',
                text: 'السلة فارغة'
            });
            return;
        }
        
        // حساب الإجماليات
        const total = cart.reduce((sum, i) => sum + i.total, 0);
        const totalDiscount = cart.reduce((sum, i) => sum + (i.qty * i.price * (i.discount / 100)), 0);
        
        const now = new Date();
        const invNo = invoices.length + 1;
        
        // الحصول على اسم العميل
        const customerSelect = document.getElementById('sale-customer');
        const selectedOption = customerSelect.options[customerSelect.selectedIndex];
        const customerName = selectedOption ? selectedOption.text : 'غير محدد';
        const customer = customerName === 'اختر العميل' ? 'غير محدد' : customerName;
        
        // إنشاء الفاتورة
        const invoice = {
            number: invNo,
            date: now.toLocaleString('ar-DZ'),
            customer: customer,
            items: cart.map(item => ({ ...item })),
            total: total,
            totalDiscount: totalDiscount
        };
        
        invoices.push(invoice);
        localStorage.setItem('ryan_invoices', JSON.stringify(invoices));

        // تجهيز منطقة الطباعة
        document.getElementById('print-invoice-no').textContent = invNo;
        document.getElementById('print-date-time').textContent = invoice.date;
        document.getElementById('print-customer').textContent = customer;
        document.getElementById('print-grand-total').textContent = total.toFixed(2) + ' دج';
        document.getElementById('print-total-discount').textContent = totalDiscount.toFixed(2) + ' دج';
        
        // تجهيز عناصر الفاتورة للطباعة
        document.getElementById('print-cart-items').innerHTML = cart.map(it => `
            <tr>
                <td style="text-align:right;">${it.name}</td>
                <td style="text-align:center;">${it.qty}</td>
                <td style="text-align:left;">${it.price.toFixed(2)} دج</td>
                <td style="text-align:left;">${it.discount}%</td>
                <td style="text-align:left;">${it.total.toFixed(2)} دج</td>
            </tr>
        `).join('');
        
        // طباعة الفاتورة
        window.print();

        // تفريغ السلة
        cart = [];
        renderCart();
        
        // تحديث التقارير
        if (typeof reportsModule !== 'undefined') {
            reportsModule.renderReports();
        }
        
        // تحديث قائمة الفواتير إذا كانت مفتوحة
        if (document.getElementById('sale-invoices') && 
            document.getElementById('sale-invoices').style.display !== 'none') {
            renderSaleInvoices();
        }
        
        Swal.fire({
            icon: 'success',
            title: 'نجاح',
            text: 'تم حفظ الفاتورة',
            timer: 1500,
            showConfirmButton: false
        });
    }

    // ================== فواتير المبيعات ==================
    function renderSaleInvoices(filteredInvoices = null) {
        const tbody = document.getElementById('sale-invoices-tbody');
        if (!tbody) return;
        
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

    // ================== البحث في الفواتير ==================
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

    // ================== حذف فاتورة ==================
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
                if (typeof reportsModule !== 'undefined') {
                    reportsModule.renderReports();
                }
                Swal.fire({
                    icon: 'success',
                    title: 'تم الحذف',
                    text: 'تم حذف الفاتورة',
                    timer: 1000,
                    showConfirmButton: false
                });
            }
        });
    }

    // ================== تعديل فاتورة ==================
    function editInvoice(index) {
        currentEditInvoiceIndex = index;
        const inv = invoices[index];
        document.getElementById('edit-invoice-number').textContent = inv.number;

        // التحقق من وجود المنتجات في المخزون
        const missingProducts = inv.items.filter(item => 
            !inventoryModule.stock.some(p => p.id === item.productId)
        );
        
        if (missingProducts.length > 0) {
            Swal.fire({
                title: 'منتجات محذوفة',
                html: `المنتجات التالية غير موجودة في المخزن ولا يمكن تعديلها: <b>${missingProducts.map(m => m.name).join('، ')}</b><br>سيتم إزالتها من الفاتورة تلقائياً.`,
                icon: 'warning',
                confirmButtonText: 'موافق'
            });
            // إزالة المنتجات المحذوفة
            inv.items = inv.items.filter(item => 
                inventoryModule.stock.some(p => p.id === item.productId)
            );
        }

        // عرض عناصر الفاتورة للتعديل
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

    // ================== تحديث الفاتورة بعد التعديل ==================
    function updateInvoice() {
        if (currentEditInvoiceIndex === -1) return;
        
        const inv = invoices[currentEditInvoiceIndex];
        const newItems = [];
        let valid = true;

        // جمع القيم المعدلة
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
                Swal.fire({
                    icon: 'error',
                    title: 'خطأ',
                    text: 'الرجاء إدخال قيم صحيحة'
                });
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

        // استعادة الكميات القديمة للمخزون
        inv.items.forEach(item => {
            const prod = inventoryModule.stock.find(p => p.id === item.productId);
            if (prod) prod.qty += item.qty;
        });

        // التحقق من الكميات الجديدة
        let stockOk = true;
        newItems.forEach(item => {
            const prod = inventoryModule.stock.find(p => p.id === item.productId);
            if (prod && item.qty > prod.qty) {
                Swal.fire({
                    icon: 'error',
                    title: 'خطأ',
                    text: `الكمية الجديدة للمنتج ${item.name} تتجاوز المتوفر في المخزن (${prod.qty})`
                });
                stockOk = false;
            }
        });
        
        if (!stockOk) {
            // إعادة الكميات القديمة
            inv.items.forEach(item => {
                const prod = inventoryModule.stock.find(p => p.id === item.productId);
                if (prod) prod.qty -= item.qty;
            });
            return;
        }

        // تطبيق الكميات الجديدة
        newItems.forEach(item => {
            const prod = inventoryModule.stock.find(p => p.id === item.productId);
            if (prod) prod.qty -= item.qty;
        });

        // حساب الإجماليات الجديدة
        const newTotal = newItems.reduce((sum, i) => sum + i.total, 0);
        const newTotalDiscount = newItems.reduce((sum, i) => sum + (i.qty * i.price * (i.discount / 100)), 0);
        
        // تحديث الفاتورة
        invoices[currentEditInvoiceIndex] = {
            ...inv,
            items: newItems,
            total: newTotal,
            totalDiscount: newTotalDiscount
        };
        
        localStorage.setItem('ryan_invoices', JSON.stringify(invoices));
        inventoryModule.saveStock();
        
        bootstrap.Modal.getInstance(document.getElementById('editInvoiceModal')).hide();
        
        Swal.fire({
            icon: 'success',
            title: 'نجاح',
            text: 'تم تعديل الفاتورة وتحديث المخزن',
            timer: 1500,
            showConfirmButton: false
        });
        
        renderSaleInvoices();
        inventoryModule.renderStock();
        
        if (typeof reportsModule !== 'undefined') {
            reportsModule.renderReports();
        }
        
        currentEditInvoiceIndex = -1;
    }

    // ================== تهيئة البحث الصوتي ==================
    function initVoiceSearch() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.lang = 'ar-DZ';
            recognition.interimResults = false;
            
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                document.getElementById('sale-search').value = transcript;
                smartSearch(transcript);
            };
            
            recognition.onerror = (event) => {
                console.log('خطأ في التعرف على الصوت:', event.error);
            };
            
            const micButton = document.getElementById('mic-sale');
            if (micButton) {
                micButton.addEventListener('click', () => {
                    try {
                        recognition.start();
                        micButton.classList.add('listening');
                        setTimeout(() => micButton.classList.remove('listening'), 3000);
                    } catch (e) {
                        console.log('البحث الصوتي قيد التشغيل بالفعل');
                    }
                });
            }
        } else {
            console.log('المتصفح لا يدعم البحث الصوتي');
        }
    }

    // ================== إرجاع الدوال العامة ==================
    return {
        cart: cart,
        getCart: getCart,
        showSubSection: showSubSection,
        smartSearch: smartSearch,
        selectProduct: selectProduct,
        openQuickAddModal: openQuickAddModal,
        addToCart: addToCart,
        renderCart: renderCart,
        removeCartItem: removeCartItem,
        clearCart: clearCart,
        finishSaleAndPrint: finishSaleAndPrint,
        renderSaleInvoices: renderSaleInvoices,
        searchInvoices: searchInvoices,
        deleteInvoice: deleteInvoice,
        editInvoice: editInvoice,
        updateInvoice: updateInvoice,
        initVoiceSearch: initVoiceSearch
    };
})();

// تعريف المتغير العام للاستخدام في HTML
window.salesModule = salesModule;
