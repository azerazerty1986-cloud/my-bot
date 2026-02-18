// ================== إدارة المنتجات - وحدة منفصلة ==================
const productModule = (function() {
    let stock = JSON.parse(localStorage.getItem('ryan_stock')) || [];
    let movements = JSON.parse(localStorage.getItem('ryan_movements')) || [];

    // ================== هيكلة البيانات ==================
    stock = stock.map((p, index) => ({ 
        id: p.id || Date.now() + index, 
        name: p.name || '',
        barcode: p.barcode || '',
        sellPrice: p.sellPrice || 0,
        buyPrice: p.buyPrice || 0,
        wholesalePrice: p.wholesalePrice || 0,
        qty: p.qty || 0,
        minStock: p.minStock || 5,
        unit: p.unit || 'قطعة',
        category: p.category || 'عام',
        location: p.location || '',
        image: p.image || null,
        notes: p.notes || '',
        createdAt: p.createdAt || new Date().toISOString(),
        lastUpdated: p.lastUpdated || new Date().toISOString()
    }));

    // ================== حفظ البيانات ==================
    function saveStock() {
        localStorage.setItem('ryan_stock', JSON.stringify(stock));
    }

    // ================== إضافة حركة مخزون ==================
    function addMovement(type, product, qty) {
        movements.push({
            id: Date.now() + Math.random(),
            date: new Date().toLocaleString('ar-DZ'),
            type: type,
            product: product,
            qty: qty
        });
        if (movements.length > 100) movements = movements.slice(-100);
        localStorage.setItem('ryan_movements', JSON.stringify(movements));
    }

    // ================== دوال مساعدة ==================
    function _showNotification(title, message, type = 'success') {
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

    function _showConfirmation(title, text, confirmCallback) {
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
            if (result.isConfirmed && confirmCallback) {
                confirmCallback();
            }
        });
    }

    // ================== عرض المنتجات ==================
    function renderProducts() {
        const tbody = document.getElementById('stock-tbody');
        if (!tbody) return;

        if (stock.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center p-4 text-muted"><i class="material-icons-round" style="font-size:48px;">inventory</i><p>لا توجد منتجات</p></td></tr>';
            return;
        }

        tbody.innerHTML = stock.map((p, idx) => `
            <tr>
                <td>${p.image ? `<img src="${p.image}" class="product-thumb" onclick="utils.showLargeImage('${p.image}')" style="width:40px;height:40px;object-fit:cover;border-radius:5px;cursor:pointer;">` : 'لا توجد'}</td>
                <td>${p.name}</td>
                <td>${p.category || 'عام'}</td>
                <td>${p.qty} ${p.unit} ${p.qty < p.minStock ? '<span class="badge bg-danger">ناقص</span>' : ''}</td>
                <td>${p.sellPrice} دج</td>
                <td>${p.buyPrice} دج</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="productModule.openEditModal(${idx})"><i class="material-icons-round">edit</i></button>
                    <button class="btn btn-sm btn-danger" onclick="productModule.deleteProduct(${idx})"><i class="material-icons-round">delete</i></button>
                </td>
            </tr>
        `).join('');
    }

    // ================== إضافة منتج جديد ==================
    function saveNewProduct() {
        const name = document.getElementById('new-name')?.value.trim();
        const category = document.getElementById('new-category')?.value || 'عام';
        const sell = parseFloat(document.getElementById('new-sell').value) || 0;
        const buy = parseFloat(document.getElementById('new-buy').value) || 0;
        const wholesale = parseFloat(document.getElementById('new-wholesale')?.value) || 0;
        const qty = parseFloat(document.getElementById('new-qty').value) || 0;
        const unit = document.getElementById('new-unit').value;
        const barcode = document.getElementById('new-barcode').value.trim();
        const minStock = parseInt(document.getElementById('new-min-stock')?.value) || 5;
        const location = document.getElementById('new-location')?.value || '';
        const notes = document.getElementById('new-notes')?.value || '';
        
        if (!name || sell <= 0 || buy <= 0) {
            _showNotification('تنبيه', 'الاسم وسعر البيع والشراء مطلوبة', 'warning');
            return;
        }
        
        if (stock.some(p => p.name === name)) {
            _showNotification('خطأ', 'يوجد منتج بنفس الاسم', 'error');
            return;
        }

        const imageInput = document.getElementById('product-image');
        
        if (imageInput && imageInput.files.length > 0) {
            const reader = new FileReader();
            reader.onload = function(e) {
                finishSave(e.target.result);
            };
            reader.readAsDataURL(imageInput.files[0]);
        } else {
            finishSave(null);
        }

        function finishSave(image) {
            stock.push({
                id: Date.now(),
                name: name,
                category: category,
                barcode: barcode,
                sellPrice: sell,
                buyPrice: buy,
                wholesalePrice: wholesale,
                qty: qty,
                minStock: minStock,
                unit: unit,
                location: location,
                notes: notes,
                image: image,
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            });
            
            saveStock();
            addMovement('إضافة منتج', name, qty);
            
            _showNotification('نجاح', 'تم إضافة المنتج', 'success');
            
            document.querySelectorAll('#add-product input, #add-product select').forEach(i => i.value = '');
            document.getElementById('image-preview').style.display = 'none';
            
            renderProducts();
        }
    }

    // ================== حفظ منتج سريع ==================
    function saveQuickProduct() {
        const mode = document.getElementById('quick-mode')?.value || 'sale';
        const name = document.getElementById('quick-product-name')?.value.trim() || '';
        const sellPrice = parseFloat(document.getElementById('quick-sell-price')?.value) || 0;
        const buyPrice = parseFloat(document.getElementById('quick-buy-price')?.value) || 0;
        const unit = document.getElementById('quick-unit')?.value || 'قطعة';
        const qty = parseFloat(document.getElementById('quick-qty')?.value) || 0;
        const cartQty = parseFloat(document.getElementById('quick-cart-qty')?.value) || 1;
        const discount = parseFloat(document.getElementById('quick-discount')?.value) || 0;

        if (!name || sellPrice <= 0 || buyPrice <= 0) {
            _showNotification('تنبيه', 'الاسم وسعر البيع والشراء مطلوبة', 'warning');
            return;
        }

        const newProduct = {
            id: Date.now(),
            name: name,
            barcode: '',
            sellPrice: sellPrice,
            buyPrice: buyPrice,
            wholesalePrice: 0,
            qty: qty,
            minStock: 5,
            unit: unit,
            category: 'عام',
            location: '',
            image: null,
            notes: '',
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };
        
        stock.push(newProduct);
        saveStock();
        addMovement('إضافة منتج', name, qty);

        if (mode === 'sale') {
            if (cartQty > newProduct.qty) {
                _showNotification('خطأ', 'الكمية المطلوبة أكبر من المتوفر', 'error');
                return;
            }
            const total = cartQty * sellPrice * (1 - discount / 100);
            if (typeof window.salesModule !== 'undefined' && window.salesModule.getCart) {
                const cart = window.salesModule.getCart();
                cart.push({
                    id: Date.now() + Math.random(),
                    productId: newProduct.id,
                    name: name,
                    qty: cartQty,
                    price: sellPrice,
                    discount: discount,
                    total: total
                });
            }
            newProduct.qty -= cartQty;
            saveStock();
            addMovement('بيع', name, cartQty);
            if (typeof window.salesModule !== 'undefined' && window.salesModule.renderCart) {
                window.salesModule.renderCart();
            }
        } else {
            const total = cartQty * buyPrice;
            if (typeof window.purchasesModule !== 'undefined' && window.purchasesModule.getPurchaseCart) {
                const cart = window.purchasesModule.getPurchaseCart();
                cart.push({
                    id: Date.now() + Math.random(),
                    productId: newProduct.id,
                    name: name,
                    qty: cartQty,
                    price: buyPrice,
                    total: total
                });
            }
            newProduct.qty += cartQty;
            saveStock();
            addMovement('شراء', name, cartQty);
            if (typeof window.purchasesModule !== 'undefined' && window.purchasesModule.renderPurchaseCart) {
                window.purchasesModule.renderPurchaseCart();
            }
        }

        bootstrap.Modal.getInstance(document.getElementById('quickAddProductModal')).hide();
        _showNotification('تمت الإضافة', `تم إضافة ${name}`, 'success');
    }

    // ================== فتح نافذة تعديل المنتج ==================
    function openEditModal(idx) {
        const p = stock[idx];
        document.getElementById('edit-product-idx').value = idx;
        document.getElementById('edit-product-name').value = p.name;
        document.getElementById('edit-product-sell').value = p.sellPrice;
        document.getElementById('edit-product-buy').value = p.buyPrice;
        document.getElementById('edit-product-qty').value = p.qty;
        document.getElementById('edit-product-unit').value = p.unit;
        
        const currentImageDiv = document.getElementById('edit-current-image');
        if (currentImageDiv) {
            currentImageDiv.innerHTML = p.image ? `<img src="${p.image}" style="max-width:100px; border-radius:5px;">` : 'لا توجد صورة';
        }
        
        document.getElementById('edit-image-preview').style.display = 'none';
        document.getElementById('edit-product-image').value = '';
        
        new bootstrap.Modal(document.getElementById('editProductModal')).show();
    }

    // ================== تعديل المنتج ==================
    function updateProduct() {
        const idx = document.getElementById('edit-product-idx').value;
        const p = stock[idx];
        
        const newName = document.getElementById('edit-product-name').value.trim();
        const newSell = parseFloat(document.getElementById('edit-product-sell').value);
        const newBuy = parseFloat(document.getElementById('edit-product-buy').value);
        const newQty = parseFloat(document.getElementById('edit-product-qty').value);
        const newUnit = document.getElementById('edit-product-unit').value;

        if (!newName || isNaN(newSell) || isNaN(newBuy) || isNaN(newQty)) {
            _showNotification('خطأ', 'يرجى ملء جميع الحقول', 'error');
            return;
        }

        const fileInput = document.getElementById('edit-product-image');
        if (fileInput.files.length > 0) {
            const reader = new FileReader();
            reader.onload = function(e) {
                p.image = e.target.result;
                finishUpdate();
            };
            reader.readAsDataURL(fileInput.files[0]);
        } else {
            finishUpdate();
        }

        function finishUpdate() {
            p.name = newName;
            p.sellPrice = newSell;
            p.buyPrice = newBuy;
            p.qty = newQty;
            p.unit = newUnit;
            p.lastUpdated = new Date().toISOString();
            
            saveStock();
            bootstrap.Modal.getInstance(document.getElementById('editProductModal')).hide();
            renderProducts();
            
            _showNotification('نجاح', 'تم تعديل المنتج', 'success');
        }
    }

    // ================== حذف المنتج ==================
    function deleteProduct(idx) {
        const product = stock[idx];
        
        _showConfirmation('تأكيد الحذف', `حذف المنتج "${product.name}"؟`, () => {
            stock.splice(idx, 1);
            saveStock();
            renderProducts();
            _showNotification('تم', 'تم حذف المنتج', 'success');
        });
    }

    // ================== البحث عن المنتجات ==================
    function searchProducts() {
        const searchTerm = document.getElementById('search-product')?.value.toLowerCase().trim() || '';
        const categoryFilter = document.getElementById('filter-category')?.value || 'all';
        
        let filtered = stock;
        
        if (searchTerm !== '') {
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(searchTerm) || 
                (p.barcode && p.barcode.toLowerCase().includes(searchTerm))
            );
        }
        
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(p => p.category === categoryFilter);
        }
        
        renderFiltered(filtered);
    }

    function renderFiltered(filtered) {
        const tbody = document.getElementById('stock-tbody');
        if (!tbody) return;

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center p-4 text-muted"><i class="material-icons-round" style="font-size:48px;">search_off</i><p>لا توجد نتائج</p></td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map((p, idx) => {
            const originalIndex = stock.findIndex(item => item.id === p.id);
            const isLowStock = p.qty < p.minStock;
            
            return `
            <tr>
                <td>${p.image ? `<img src="${p.image}" class="product-thumb" onclick="utils.showLargeImage('${p.image}')" style="width:40px;height:40px;object-fit:cover;border-radius:5px;cursor:pointer;">` : 'لا توجد'}</td>
                <td>${p.name}</td>
                <td>${p.category || 'عام'}</td>
                <td class="${isLowStock ? 'low-stock-item' : ''}">${p.qty} ${p.unit}</td>
                <td>${p.sellPrice} دج</td>
                <td>${p.buyPrice} دج</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="productModule.openEditModal(${originalIndex})"><i class="material-icons-round">edit</i></button>
                    <button class="btn btn-sm btn-danger" onclick="productModule.deleteProduct(${originalIndex})"><i class="material-icons-round">delete</i></button>
                </td>
            </tr>
        `}).join('');

        updateStats();
    }

    function updateStats() {
        const totalProducts = stock.length;
        const totalValue = stock.reduce((sum, p) => sum + (p.qty * p.buyPrice), 0);
        const lowStockCount = stock.filter(p => p.qty < p.minStock).length;
        
        const totalEl = document.getElementById('total-products');
        const valueEl = document.getElementById('total-stock-value');
        const lowEl = document.getElementById('low-stock-count');
        
        if (totalEl) totalEl.textContent = totalProducts;
        if (valueEl) valueEl.textContent = totalValue.toFixed(2) + ' دج';
        if (lowEl) lowEl.textContent = lowStockCount;
    }

    // ================== تصدير إلى Excel ==================
    function exportToExcel() {
        if (stock.length === 0) {
            Swal.fire('تنبيه', 'لا توجد منتجات للتصدير', 'warning');
            return;
        }
        
        const data = stock.map((p, index) => ({
            'الرقم': index + 1,
            'المنتج': p.name,
            'الصنف': p.category || 'عام',
            'الكمية': p.qty + ' ' + p.unit,
            'سعر الشراء': p.buyPrice + ' دج',
            'سعر البيع': p.sellPrice + ' دج',
            'الباركود': p.barcode || '-'
        }));
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "المخزون");
        
        const today = new Date();
        const dateStr = `${today.getDate()}-${today.getMonth()+1}-${today.getFullYear()}`;
        XLSX.writeFile(wb, `المخزون_${dateStr}.xlsx`);
        
        Swal.fire({
            icon: 'success',
            title: 'تم التصدير',
            text: 'تم تصدير الملف بنجاح',
            timer: 2000,
            showConfirmButton: false
        });
    }

    // ================== عرض المنتجات الناقصة ==================
    function showLowStock() {
        const lowStock = stock.filter(p => p.qty < p.minStock);
        
        if (lowStock.length === 0) {
            Swal.fire({
                icon: 'success',
                title: 'لا توجد منتجات ناقصة',
                text: 'جميع المنتجات متوفرة',
                timer: 2000,
                showConfirmButton: false
            });
        } else {
            let items = '';
            lowStock.forEach(p => {
                items += `• ${p.name}: ${p.qty} ${p.unit} (الحد الأدنى: ${p.minStock})\n`;
            });
            
            Swal.fire({
                icon: 'warning',
                title: 'المنتجات الناقصة',
                text: items,
                confirmButtonText: 'حسناً'
            });
        }
    }

    // ================== رفع Excel ==================
    function uploadExcelWithMapping() {
        Swal.fire({
            icon: 'info',
            title: 'قريباً',
            text: 'سيتم إضافة رفع Excel قريباً',
            timer: 2000,
            showConfirmButton: false
        });
    }

    return {
        stock,
        movements,
        saveStock,
        addMovement,
        renderProducts,
        saveNewProduct,
        saveQuickProduct,
        openEditModal,
        updateProduct,
        deleteProduct,
        searchProducts,
        showLowStock,
        exportToExcel,
        uploadExcelWithMapping
    };
})();

window.productModule = productModule;
