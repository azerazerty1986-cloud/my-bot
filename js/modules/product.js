// ================== product.js - إدارة المنتجات ==================
// الرقم 18 في ترتيب الملفات - يعتمد على utils.js

const productModule = (function() {
    // ================== البيانات ==================
    let products = JSON.parse(localStorage.getItem('products')) || [];
    let categories = JSON.parse(localStorage.getItem('categories')) || [
        { id: 1, name: 'مواد غذائية', count: 0 },
        { id: 2, name: 'مشروبات', count: 0 },
        { id: 3, name: 'منظفات', count: 0 },
        { id: 4, name: 'الكترونيات', count: 0 },
        { id: 5, name: 'ملابس', count: 0 },
        { id: 6, name: 'أدوات منزلية', count: 0 }
    ];
    
    // ================== دوال مساعدة داخلية ==================
    function saveProducts() {
        localStorage.setItem('products', JSON.stringify(products));
        updateCategoriesCount();
    }
    
    function saveCategories() {
        localStorage.setItem('categories', JSON.stringify(categories));
    }
    
    function updateCategoriesCount() {
        // تحديث عدد المنتجات في كل تصنيف
        const categoryCount = {};
        products.forEach(p => {
            categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
        });
        
        categories = categories.map(cat => ({
            ...cat,
            count: categoryCount[cat.name] || 0
        }));
        
        saveCategories();
    }
    
    // ================== إضافة منتج جديد ==================
    function addProduct(productData) {
        // التحقق من البيانات المطلوبة
        if (!productData.name) {
            utilsModule.showNotification('خطأ', 'اسم المنتج مطلوب', 'error');
            return null;
        }
        
        if (!productData.buyPrice || productData.buyPrice <= 0) {
            utilsModule.showNotification('خطأ', 'سعر الشراء مطلوب', 'error');
            return null;
        }
        
        if (!productData.sellPrice || productData.sellPrice <= 0) {
            utilsModule.showNotification('خطأ', 'سعر البيع مطلوب', 'error');
            return null;
        }
        
        // إنشاء كائن المنتج الجديد
        const newProduct = {
            id: utilsModule.generateId(),
            name: productData.name,
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
            description: productData.description || '',
            notes: productData.notes || '',
            image: productData.image || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        products.push(newProduct);
        saveProducts();
        
        utilsModule.showNotification('نجاح', 'تم إضافة المنتج');
        renderProducts();
        
        return newProduct;
    }
    
    // ================== إضافة منتج من النموذج ==================
    function addNewProduct() {
        const name = document.getElementById('new-product-name')?.value;
        const category = document.getElementById('new-product-category')?.value;
        const buyPrice = document.getElementById('new-product-buy')?.value;
        const sellPrice = document.getElementById('new-product-sell')?.value;
        const wholesalePrice = document.getElementById('new-product-wholesale')?.value;
        const quantity = document.getElementById('new-product-qty')?.value;
        const unit = document.getElementById('new-product-unit')?.value;
        const minStock = document.getElementById('new-product-min-stock')?.value;
        const barcode = document.getElementById('new-product-barcode')?.value;
        const location = document.getElementById('new-product-location')?.value;
        const notes = document.getElementById('new-product-notes')?.value;
        
        if (!name) {
            utilsModule.showNotification('تنبيه', 'اسم المنتج مطلوب', 'warning');
            return;
        }
        
        addProduct({
            name,
            category,
            buyPrice,
            sellPrice,
            wholesalePrice,
            quantity,
            unit,
            minStock,
            barcode,
            location,
            notes
        });
        
        // مسح الحقول
        document.getElementById('new-product-name').value = '';
        if (document.getElementById('new-product-buy')) document.getElementById('new-product-buy').value = '';
        if (document.getElementById('new-product-sell')) document.getElementById('new-product-sell').value = '';
        if (document.getElementById('new-product-qty')) document.getElementById('new-product-qty').value = '0';
    }
    
    // ================== الحصول على جميع المنتجات ==================
    function getAllProducts() {
        return [...products];
    }
    
    // ================== الحصول على منتج بواسطة ID ==================
    function getProduct(id) {
        return products.find(p => p.id == id);
    }
    
    // ================== الحصول على منتج بواسطة الباركود ==================
    function getProductByBarcode(barcode) {
        return products.find(p => p.barcode === barcode);
    }
    
    // ================== تحديث منتج ==================
    function updateProduct(id, updatedData) {
        const index = products.findIndex(p => p.id == id);
        if (index === -1) {
            utilsModule.showNotification('خطأ', 'المنتج غير موجود', 'error');
            return null;
        }
        
        products[index] = {
            ...products[index],
            ...updatedData,
            updatedAt: new Date().toISOString()
        };
        
        saveProducts();
        utilsModule.showNotification('نجاح', 'تم تحديث المنتج');
        renderProducts();
        
        return products[index];
    }
    
    // ================== حذف منتج ==================
    function deleteProduct(id) {
        const product = getProduct(id);
        if (!product) return false;
        
        utilsModule.showConfirmation(
            'تأكيد الحذف',
            `هل أنت متأكد من حذف المنتج "${product.name}"؟`,
            () => {
                products = products.filter(p => p.id != id);
                saveProducts();
                utilsModule.showNotification('تم', 'تم حذف المنتج');
                renderProducts();
            }
        );
        
        return true;
    }
    
    // ================== البحث عن المنتجات ==================
    function searchProducts(term) {
        if (!term || term.length < 2) {
            renderProducts();
            return;
        }
        
        term = term.toLowerCase();
        const filtered = products.filter(p => 
            p.name.toLowerCase().includes(term) ||
            (p.barcode && p.barcode.includes(term)) ||
            (p.category && p.category.toLowerCase().includes(term))
        );
        
        renderProducts(filtered);
        
        // إظهار نتائج البحث في القائمة المنسدلة
        const searchBox = document.getElementById('search-box');
        if (searchBox && filtered.length > 0) {
            searchBox.innerHTML = filtered.slice(0, 5).map(p => `
                <div class="search-item" onclick="selectProduct('${p.id}')">
                    <strong>${p.name}</strong><br>
                    <small>السعر: ${utilsModule.formatCurrency(p.sellPrice)} | المخزون: ${p.quantity}</small>
                </div>
            `).join('');
            searchBox.classList.add('show');
        }
    }
    
    // ================== تصفية حسب التصنيف ==================
    function filterByCategory(category) {
        if (!category || category === '') {
            renderProducts();
            return;
        }
        
        const filtered = products.filter(p => p.category === category);
        renderProducts(filtered);
    }
    
    // ================== عرض المنتجات في الجدول ==================
    function renderProducts(filteredProducts = null) {
        const tbody = document.getElementById('products-tbody');
        if (!tbody) return;
        
        const dataToRender = filteredProducts || products;
        
        if (dataToRender.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center p-4">لا توجد منتجات</td></tr>';
            updateStats();
            return;
        }
        
        tbody.innerHTML = dataToRender.map((p, index) => {
            const stockStatus = p.quantity <= p.minStock ? 'منخفض' : 'جيد';
            const statusClass = p.quantity <= p.minStock ? 'badge-danger' : 'badge-success';
            
            return `
            <tr>
                <td>${index + 1}</td>
                <td>${p.name}</td>
                <td>${p.category || 'عام'}</td>
                <td>${p.quantity} ${p.unit}</td>
                <td>${p.unit}</td>
                <td>${utilsModule.formatCurrency(p.buyPrice)}</td>
                <td>${utilsModule.formatCurrency(p.sellPrice)}</td>
                <td><span class="${statusClass}">${stockStatus}</span></td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="productModule.editProduct('${p.id}')">
                        <i class="material-icons-round">edit</i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="productModule.deleteProduct('${p.id}')">
                        <i class="material-icons-round">delete</i>
                    </button>
                </td>
            </tr>
        `}).join('');
        
        updateStats();
    }
    
    // ================== عرض المنتجات في جدول المخزون ==================
    function renderInventoryTable() {
        const tbody = document.getElementById('inventory-tbody');
        if (!tbody) return;
        
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="text-center p-4">لا توجد منتجات</td></tr>';
            return;
        }
        
        tbody.innerHTML = products.map((p, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${p.name}</td>
                <td>${p.category || 'عام'}</td>
                <td>${p.quantity} ${p.unit}</td>
                <td>${p.unit}</td>
                <td>${utilsModule.formatCurrency(p.sellPrice)}</td>
                <td>${utilsModule.formatCurrency(p.buyPrice)}</td>
                <td>${p.quantity <= p.minStock ? '⚠️ ناقص' : '✓ جيد'}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="productModule.editProduct('${p.id}')">
                        تعديل
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    // ================== تحديث الإحصائيات ==================
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
        if (valueEl) valueEl.textContent = utilsModule.formatCurrency(totalValue);
        if (lowEl) lowEl.textContent = lowStock;
    }
    
    // ================== الحصول على المنتجات الناقصة ==================
    function getLowStockProducts() {
        return products.filter(p => p.quantity <= p.minStock);
    }
    
    // ================== تعديل منتج ==================
    function editProduct(id) {
        const product = getProduct(id);
        if (!product) return;
        
        // تعبئة النموذج
        document.getElementById('edit-product-id').value = product.id;
        document.getElementById('edit-product-name').value = product.name;
        document.getElementById('edit-product-sell').value = product.sellPrice;
        document.getElementById('edit-product-buy').value = product.buyPrice;
        document.getElementById('edit-product-qty').value = product.quantity;
        document.getElementById('edit-product-unit').value = product.unit;
        
        // إظهار النافذة
        const modal = document.getElementById('editProductModal');
        if (modal) {
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
        }
    }
    
    // ================== حفظ التعديلات ==================
    function saveEdit() {
        const id = document.getElementById('edit-product-id').value;
        const name = document.getElementById('edit-product-name').value;
        const sellPrice = document.getElementById('edit-product-sell').value;
        const buyPrice = document.getElementById('edit-product-buy').value;
        const quantity = document.getElementById('edit-product-qty').value;
        const unit = document.getElementById('edit-product-unit').value;
        
        if (!name) {
            utilsModule.showNotification('تنبيه', 'اسم المنتج مطلوب', 'warning');
            return;
        }
        
        updateProduct(id, {
            name,
            sellPrice: parseFloat(sellPrice),
            buyPrice: parseFloat(buyPrice),
            quantity: parseInt(quantity),
            unit
        });
        
        // إغلاق النافذة
        const modal = document.getElementById('editProductModal');
        if (modal) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            bsModal.hide();
        }
    }
    
    // ================== إضافة تصنيف ==================
    function addCategory() {
        const name = document.getElementById('new-category-name')?.value;
        
        if (!name) {
            utilsModule.showNotification('تنبيه', 'اسم التصنيف مطلوب', 'warning');
            return;
        }
        
        const newCategory = {
            id: utilsModule.generateId(),
            name: name,
            count: 0
        };
        
        categories.push(newCategory);
        saveCategories();
        renderCategories();
        
        document.getElementById('new-category-name').value = '';
        utilsModule.showNotification('نجاح', 'تم إضافة التصنيف');
    }
    
    // ================== عرض التصنيفات ==================
    function renderCategories() {
        const tbody = document.getElementById('categories-tbody');
        if (!tbody) return;
        
        if (categories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center p-4">لا توجد تصنيفات</td></tr>';
            return;
        }
        
        tbody.innerHTML = categories.map((cat, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${cat.name}</td>
                <td>${cat.count || 0}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="productModule.deleteCategory('${cat.id}')">
                        حذف
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    // ================== حذف تصنيف ==================
    function deleteCategory(id) {
        const category = categories.find(c => c.id == id);
        if (!category) return;
        
        // التحقق من عدم وجود منتجات في هذا التصنيف
        const productsInCategory = products.filter(p => p.category === category.name);
        if (productsInCategory.length > 0) {
            utilsModule.showNotification('تنبيه', 'لا يمكن حذف تصنيف يحتوي على منتجات', 'warning');
            return;
        }
        
        utilsModule.showConfirmation('تأكيد الحذف', `حذف التصنيف "${category.name}"؟`, () => {
            categories = categories.filter(c => c.id != id);
            saveCategories();
            renderCategories();
            utilsModule.showNotification('تم', 'تم حذف التصنيف');
        });
    }
    
    // ================== تصدير المنتجات إلى CSV ==================
    function exportToCSV() {
        const headers = ['الاسم', 'التصنيف', 'الكمية', 'الوحدة', 'سعر الشراء', 'سعر البيع', 'الحد الأدنى', 'الباركود'];
        const data = products.map(p => ({
            name: p.name,
            category: p.category,
            quantity: p.quantity,
            unit: p.unit,
            buyPrice: p.buyPrice,
            sellPrice: p.sellPrice,
            minStock: p.minStock,
            barcode: p.barcode
        }));
        
        utilsModule.exportToCSV(data, 'products', headers);
    }
    
    // ================== تهيئة الوحدة ==================
    function init() {
        console.log('✅ productModule initialized - الرقم 18');
        console.log(`   عدد المنتجات: ${products.length}`);
        
        // عرض المنتجات إذا كان الجدول موجوداً
        if (document.getElementById('products-tbody')) {
            renderProducts();
        }
        
        if (document.getElementById('inventory-tbody')) {
            renderInventoryTable();
        }
        
        if (document.getElementById('categories-tbody')) {
            renderCategories();
        }
        
        updateStats();
    }
    
    // ================== واجهة الوحدة ==================
    return {
        // البيانات
        products,
        categories,
        
        // إضافة
        addProduct,
        addNewProduct,
        
        // استعلام
        getAllProducts,
        getProduct,
        getProductByBarcode,
        getLowStockProducts,
        
        // تحديث
        updateProduct,
        deleteProduct,
        
        // بحث وتصفية
        searchProducts,
        filterByCategory,
        
        // عرض
        renderProducts,
        renderInventoryTable,
        
        // تصنيفات
        addCategory,
        renderCategories,
        deleteCategory,
        
        // تصدير
        exportToCSV,
        
        // تعديل
        editProduct,
        saveEdit,
        
        // تهيئة
        init
    };
})();

// ================== تصدير للاستخدام العام ==================
window.productModule = productModule;

// ================== دوال مختصرة للاستخدام في HTML ==================
window.selectProduct = function(id) {
    const product = productModule.getProduct(id);
    if (product) {
        document.getElementById('sale-search').value = product.name;
        document.getElementById('search-box')?.classList.remove('show');
    }
};

window.saveProductEdit = () => productModule.saveEdit();

// ================== تهيئة تلقائية ==================
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        if (productModule && productModule.init) {
            productModule.init();
        }
    });
    
    // الاستماع لحدث تحميل HTML
    document.addEventListener('html-loaded', function() {
        if (productModule && productModule.init) {
            productModule.init();
        }
    });
}
