// ================== إدارة المنتجات ==================
const productsModule = (function() {
    // ================== البيانات ==================
    let products = JSON.parse(localStorage.getItem('inventory_products')) || [];
    let categories = JSON.parse(localStorage.getItem('product_categories')) || [
        { id: 1, name: 'مواد غذائية', parent: null, count: 0 },
        { id: 2, name: 'مشروبات', parent: null, count: 0 },
        { id: 3, name: 'منظفات', parent: null, count: 0 },
        { id: 4, name: 'الكترونيات', parent: null, count: 0 },
        { id: 5, name: 'ملابس', parent: null, count: 0 },
        { id: 6, name: 'أدوات منزلية', parent: null, count: 0 }
    ];
    
    // ================== دوال مساعدة ==================
    function formatCurrency(amount) {
        return Number(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
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
        } else {
            alert(`${title}: ${message}`);
        }
    }
    
    function showConfirmation(title, text, confirmCallback) {
        if (typeof Swal !== 'undefined') {
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
        } else {
            if (confirm(`${title}\n${text}`)) {
                confirmCallback();
            }
        }
    }
    
    // حفظ المنتجات
    function saveProducts() {
        localStorage.setItem('inventory_products', JSON.stringify(products));
        updateStats();
    }
    
    // حفظ التصنيفات
    function saveCategories() {
        localStorage.setItem('product_categories', JSON.stringify(categories));
    }
    
    // ================== إدارة المنتجات ==================
    
    // إضافة منتج جديد
    function addProduct(productData) {
        const newProduct = {
            id: Date.now() + Math.random(),
            name: productData.name || '',
            category: productData.category || 'عام',
            buyPrice: parseFloat(productData.buyPrice) || 0,
            sellPrice: parseFloat(productData.sellPrice) || 0,
            wholesalePrice: parseFloat(productData.wholesalePrice) || 0,
            quantity: parseInt(productData.quantity) || 0,
            unit: productData.unit || 'قطعة',
            minStock: parseInt(productData.minStock) || 5,
            maxStock: parseInt(productData.maxStock) || 100,
            barcode: productData.barcode || '',
            location: productData.location || '',
            notes: productData.notes || '',
            image: productData.image || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        products.push(newProduct);
        saveProducts();
        renderProducts();
        
        showNotification('نجاح', 'تم إضافة المنتج', 'success');
        return newProduct;
    }
    
    // حفظ منتج جديد (من نموذج الإضافة)
    function saveNewProduct() {
        const name = document.getElementById('new-name')?.value.trim();
        const category = document.getElementById('new-category')?.value || 'عام';
        const buyPrice = parseFloat(document.getElementById('new-buy')?.value) || 0;
        const sellPrice = parseFloat(document.getElementById('new-sell')?.value) || 0;
        const wholesalePrice = parseFloat(document.getElementById('new-wholesale')?.value) || 0;
        const quantity = parseInt(document.getElementById('new-qty')?.value) || 0;
        const unit = document.getElementById('new-unit')?.value || 'قطعة';
        const minStock = parseInt(document.getElementById('new-min-stock')?.value) || 5;
        const barcode = document.getElementById('new-barcode')?.value || '';
        const location = document.getElementById('new-location')?.value || '';
        const notes = document.getElementById('new-notes')?.value || '';
        
        if (!name) {
            showNotification('تنبيه', 'اسم المنتج مطلوب', 'warning');
            return false;
        }
        
        if (buyPrice <= 0 || sellPrice <= 0) {
            showNotification('تنبيه', 'سعر الشراء والبيع مطلوبان', 'warning');
            return false;
        }
        
        const newProduct = {
            id: Date.now() + Math.random(),
            name: name,
            category: category,
            buyPrice: buyPrice,
            sellPrice: sellPrice,
            wholesalePrice: wholesalePrice,
            quantity: quantity,
            unit: unit,
            minStock: minStock,
            barcode: barcode,
            location: location,
            notes: notes,
            image: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        products.push(newProduct);
        saveProducts();
        renderProducts();
        
        // مسح الحقول
        document.getElementById('new-name').value = '';
        if (document.getElementById('new-buy')) document.getElementById('new-buy').value = '';
        if (document.getElementById('new-sell')) document.getElementById('new-sell').value = '';
        if (document.getElementById('new-wholesale')) document.getElementById('new-wholesale').value = '';
        if (document.getElementById('new-qty')) document.getElementById('new-qty').value = '0';
        if (document.getElementById('new-barcode')) document.getElementById('new-barcode').value = '';
        if (document.getElementById('new-location')) document.getElementById('new-location').value = '';
        if (document.getElementById('new-notes')) document.getElementById('new-notes').value = '';
        
        showNotification('نجاح', 'تم إضافة المنتج', 'success');
        return true;
    }
    
    // عرض المنتجات
    function renderProducts(filtered = null) {
        const tbody = document.getElementById('products-tbody');
        if (!tbody) return;
        
        const dataToRender = filtered || products;
        
        if (dataToRender.length === 0) {
            tbody.innerHTML = '<tr><td colspan="11" class="text-center p-4"><i class="material-icons-round" style="font-size:48px;">inventory</i><br>لا توجد منتجات</td></tr>';
            updateStats();
            return;
        }
        
        tbody.innerHTML = dataToRender.map((p, index) => {
            const originalIndex = products.findIndex(prod => prod.id === p.id);
            const stockStatus = p.quantity <= p.minStock ? 'منخفض' : 'جيد';
            const statusClass = p.quantity <= p.minStock ? 'badge-danger' : 'badge-success';
            
            return `
            <tr>
                <td>${index + 1}</td>
                <td>
                    ${p.image ? `<img src="${p.image}" style="width:40px; height:40px; border-radius:5px;">` : 
                    '<i class="material-icons-round">image</i>'}
                </td>
                <td>${p.name}</td>
                <td>${p.category || 'عام'}</td>
                <td>${p.quantity} ${p.unit}</td>
                <td>${formatCurrency(p.buyPrice)}</td>
                <td>${formatCurrency(p.sellPrice)}</td>
                <td>${p.unit}</td>
                <td><span class="${statusClass}">${stockStatus}</span></td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="productsModule.editProduct('${p.id}')">
                        <i class="material-icons-round">edit</i>
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="productsModule.deleteProduct('${p.id}')">
                        <i class="material-icons-round">delete</i>
                    </button>
                </td>
            </tr>
        `}).join('');
        
        updateStats();
    }
    
    // تحديث الإحصائيات
    function updateStats() {
        const totalCount = products.length;
        const totalQty = products.reduce((sum, p) => sum + p.quantity, 0);
        const totalValue = products.reduce((sum, p) => sum + (p.buyPrice * p.quantity), 0);
        const lowStock = products.filter(p => p.quantity <= p.minStock).length;
        
        const countEl = document.getElementById('total-products-count');
        const qtyEl = document.getElementById('total-quantity');
        const valueEl = document.getElementById('total-stock-value');
        const lowEl = document.getElementById('low-stock-count');
        
        if (countEl) countEl.textContent = totalCount;
        if (qtyEl) qtyEl.textContent = totalQty;
        if (valueEl) valueEl.textContent = formatCurrency(totalValue);
        if (lowEl) lowEl.textContent = lowStock;
    }
    
    // تعديل منتج
    function editProduct(id) {
        const product = products.find(p => p.id == id);
        if (!product) return;
        
        Swal.fire({
            title: 'تعديل المنتج',
            html: `
                <div style="text-align:right;">
                    <input type="text" id="edit-name" class="form-control mb-2" value="${product.name}" placeholder="اسم المنتج">
                    <div class="row g-2 mb-2">
                        <div class="col-6">
                            <input type="number" id="edit-buy" class="form-control" value="${product.buyPrice}" placeholder="سعر الشراء">
                        </div>
                        <div class="col-6">
                            <input type="number" id="edit-sell" class="form-control" value="${product.sellPrice}" placeholder="سعر البيع">
                        </div>
                    </div>
                    <div class="row g-2 mb-2">
                        <div class="col-6">
                            <input type="number" id="edit-qty" class="form-control" value="${product.quantity}" placeholder="الكمية">
                        </div>
                        <div class="col-6">
                            <input type="number" id="edit-min" class="form-control" value="${product.minStock}" placeholder="الحد الأدنى">
                        </div>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'حفظ',
            cancelButtonText: 'إلغاء',
            preConfirm: () => {
                const name = document.getElementById('edit-name').value.trim();
                if (!name) {
                    Swal.showValidationMessage('اسم المنتج مطلوب');
                    return false;
                }
                return {
                    name: name,
                    buyPrice: parseFloat(document.getElementById('edit-buy').value) || 0,
                    sellPrice: parseFloat(document.getElementById('edit-sell').value) || 0,
                    quantity: parseInt(document.getElementById('edit-qty').value) || 0,
                    minStock: parseInt(document.getElementById('edit-min').value) || 5
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const updated = result.value;
                Object.assign(product, updated);
                product.updatedAt = new Date().toISOString();
                saveProducts();
                renderProducts();
                showNotification('نجاح', 'تم تعديل المنتج', 'success');
            }
        });
    }
    
    // حذف منتج
    function deleteProduct(id) {
        const product = products.find(p => p.id == id);
        if (!product) return;
        
        showConfirmation('تأكيد الحذف', `حذف المنتج "${product.name}"؟`, () => {
            products = products.filter(p => p.id != id);
            saveProducts();
            renderProducts();
            showNotification('تم', 'تم حذف المنتج', 'success');
        });
    }
    
    // البحث عن المنتجات
    function searchProducts() {
        const term = document.getElementById('product-search')?.value.toLowerCase().trim() || '';
        
        if (!term) {
            renderProducts();
            return;
        }
        
        const filtered = products.filter(p => 
            p.name.toLowerCase().includes(term) ||
            (p.barcode && p.barcode.includes(term)) ||
            (p.category && p.category.toLowerCase().includes(term))
        );
        
        renderProducts(filtered);
    }
    
    // تصفية حسب التصنيف
    function filterByCategory() {
        const category = document.getElementById('product-category-filter')?.value || '';
        
        if (!category) {
            renderProducts();
            return;
        }
        
        const filtered = products.filter(p => p.category === category);
        renderProducts(filtered);
    }
    
    // تصدير إلى Excel
    function exportToExcel() {
        if (products.length === 0) {
            showNotification('تنبيه', 'لا توجد منتجات للتصدير', 'warning');
            return;
        }
        
        // تحويل البيانات إلى صيغة CSV
        const headers = ['الاسم', 'التصنيف', 'الكمية', 'الوحدة', 'سعر الشراء', 'سعر البيع', 'الحد الأدنى', 'الباركود'];
        const rows = products.map(p => [
            p.name,
            p.category,
            p.quantity,
            p.unit,
            p.buyPrice,
            p.sellPrice,
            p.minStock,
            p.barcode
        ]);
        
        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        
        // إنشاء رابط تحميل
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        
        showNotification('نجاح', 'تم تصدير المنتجات', 'success');
    }
    
    // ================== إدارة التصنيفات ==================
    
    // إضافة تصنيف
    function addCategory() {
        const name = document.getElementById('new-category-name')?.value.trim();
        const parent = document.getElementById('new-category-parent')?.value || null;
        
        if (!name) {
            showNotification('تنبيه', 'اسم التصنيف مطلوب', 'warning');
            return;
        }
        
        const newCategory = {
            id: Date.now(),
            name: name,
            parent: parent,
            count: 0
        };
        
        categories.push(newCategory);
        saveCategories();
        renderCategories();
        
        document.getElementById('new-category-name').value = '';
        showNotification('نجاح', 'تم إضافة التصنيف', 'success');
    }
    
    // عرض التصنيفات
    function renderCategories() {
        const tbody = document.getElementById('categories-tbody');
        if (!tbody) return;
        
        const parentSelect = document.getElementById('new-category-parent');
        if (parentSelect) {
            parentSelect.innerHTML = '<option value="">تصنيف رئيسي</option>' + 
                categories.filter(c => !c.parent).map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        }
        
        if (categories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4">لا توجد تصنيفات</td></tr>';
            return;
        }
        
        tbody.innerHTML = categories.map((c, index) => {
            const parent = categories.find(p => p.id == c.parent);
            const productCount = products.filter(p => p.category === c.name).length;
            
            return `
            <tr>
                <td>${index + 1}</td>
                <td>${c.name}</td>
                <td>${parent ? parent.name : 'رئيسي'}</td>
                <td>${productCount}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="productsModule.editCategory(${c.id})">
                        <i class="material-icons-round">edit</i>
                    </button>
                </td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="productsModule.deleteCategory(${c.id})">
                        <i class="material-icons-round">delete</i>
                    </button>
                </td>
            </tr>
        `}).join('');
    }
    
    // حذف تصنيف
    function deleteCategory(id) {
        const category = categories.find(c => c.id == id);
        if (!category) return;
        
        // التحقق من عدم وجود منتجات في هذا التصنيف
        const productsInCategory = products.filter(p => p.category === category.name);
        if (productsInCategory.length > 0) {
            showNotification('تنبيه', 'لا يمكن حذف تصنيف يحتوي على منتجات', 'warning');
            return;
        }
        
        showConfirmation('تأكيد الحذف', `حذف التصنيف "${category.name}"؟`, () => {
            categories = categories.filter(c => c.id != id);
            saveCategories();
            renderCategories();
            showNotification('تم', 'تم حذف التصنيف', 'success');
        });
    }
    
    // ================== المنتجات الناقصة ==================
    
    // عرض المنتجات الناقصة
    function loadLowStock() {
        const tbody = document.getElementById('low-stock-tbody');
        if (!tbody) return;
        
        const lowStock = products.filter(p => p.quantity <= p.minStock);
        
        if (lowStock.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center p-4">لا توجد منتجات ناقصة</td></tr>';
            return;
        }
        
        tbody.innerHTML = lowStock.map((p, index) => {
            const shortage = p.minStock - p.quantity;
            return `
            <tr>
                <td>${index + 1}</td>
                <td>${p.name}</td>
                <td>${p.category}</td>
                <td>${p.quantity} ${p.unit}</td>
                <td>${p.minStock}</td>
                <td>${shortage}</td>
                <td><span class="badge-danger">ناقص</span></td>
                <td>
                    <button class="btn btn-sm btn-success" onclick="productsModule.orderProduct('${p.id}')">
                        <i class="material-icons-round">shopping_cart</i>
                    </button>
                </td>
            </tr>
        `}).join('');
    }
    
    // طلب منتج ناقص
    function orderProduct(id) {
        const product = products.find(p => p.id == id);
        if (!product) return;
        
        // التحويل إلى قسم المشتريات مع تعبئة البيانات
        if (typeof purchasesModule !== 'undefined') {
            document.getElementById('purchase-search').value = product.name;
            document.getElementById('purchase-price').value = product.buyPrice;
            document.getElementById('purchase-qty').value = product.minStock - product.quantity;
            
            switchSection('purchases', document.querySelector('[onclick*="purchases"]'));
            showSubSection('purchase-operation');
            
            showNotification('تم', 'تم تعبئة بيانات المنتج في المشتريات', 'success');
        }
    }
    
    // ================== التهيئة ==================
    function init() {
        console.log('✅ productsModule initialized');
        renderProducts();
        renderCategories();
        loadLowStock();
        updateStats();
    }
    
    // ================== واجهة الوحدة ==================
    return {
        products: products,
        categories: categories,
        
        // المنتجات
        addProduct: addProduct,
        saveNewProduct: saveNewProduct,
        renderProducts: renderProducts,
        editProduct: editProduct,
        deleteProduct: deleteProduct,
        searchProducts: searchProducts,
        filterByCategory: filterByCategory,
        exportToExcel: exportToExcel,
        
        // التصنيفات
        addCategory: addCategory,
        renderCategories: renderCategories,
        deleteCategory: deleteCategory,
        
        // المنتجات الناقصة
        loadLowStock: loadLowStock,
        orderProduct: orderProduct,
        
        // تهيئة
        init: init
    };
})();

window.productsModule = productsModule;

// دوال مساعدة للـ HTML
window.saveNewProduct = () => productsModule.saveNewProduct();
window.searchProducts = () => productsModule.searchProducts();
window.filterByCategory = () => productsModule.filterByCategory();
window.exportProductsToExcel = () => productsModule.exportToExcel();
window.addCategory = () => productsModule.addCategory();

// تهيئة تلقائية
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            if (productsModule && productsModule.init) productsModule.init();
        }, 200);
    });
}
