// ================== inventory.js - إدارة المخزون المتقدمة ==================
// الرقم 20 في ترتيب الملفات - نسخة محسنة مع دعم موقع التخزين

const inventoryModule = (function() {
    // ================== البيانات ==================
    let inventoryLogs = JSON.parse(localStorage.getItem('inventory_logs')) || [];
    let stockAlerts = JSON.parse(localStorage.getItem('stock_alerts')) || [];
    
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
    
    function saveLogs() {
        localStorage.setItem('inventory_logs', JSON.stringify(inventoryLogs));
    }
    
    function saveAlerts() {
        localStorage.setItem('stock_alerts', JSON.stringify(stockAlerts));
    }
    
    // ================== إضافة مخزون ==================
    function addStock(productId, quantity, price = null, notes = '') {
        const product = window.productModule?.getProduct?.(productId);
        if (!product) {
            showNotification('خطأ', 'المنتج غير موجود', 'error');
            return false;
        }
        
        if (quantity <= 0) {
            showNotification('خطأ', 'الكمية يجب أن تكون أكبر من صفر', 'error');
            return false;
        }
        
        const oldQuantity = product.quantity;
        product.quantity += quantity;
        
        if (price && price > 0) {
            product.buyPrice = price;
        }
        
        if (window.productModule?.updateProduct) {
            window.productModule.updateProduct(productId, {
                quantity: product.quantity,
                buyPrice: product.buyPrice
            });
        }
        
        const log = {
            id: Date.now() + Math.random(),
            productId: productId,
            productName: product.name,
            type: 'add',
            quantity: quantity,
            oldQuantity: oldQuantity,
            newQuantity: product.quantity,
            price: price || product.buyPrice,
            notes: notes,
            date: new Date().toISOString(),
            user: 'admin'
        };
        
        inventoryLogs.push(log);
        saveLogs();
        
        showNotification('نجاح', `تم إضافة ${quantity} ${product.unit || 'وحدة'} إلى المخزون`);
        
        if (product.maxStock && product.quantity > product.maxStock) {
            createAlert({
                productId: product.id,
                productName: product.name,
                type: 'max_stock',
                message: `تجاوز الحد الأقصى للمخزون (${product.quantity} > ${product.maxStock})`,
                level: 'warning'
            });
        }
        
        renderInventory();
        return log;
    }
    
    // ================== خصم مخزون ==================
    function removeStock(productId, quantity, notes = '') {
        const product = window.productModule?.getProduct?.(productId);
        if (!product) {
            showNotification('خطأ', 'المنتج غير موجود', 'error');
            return false;
        }
        
        if (quantity <= 0) {
            showNotification('خطأ', 'الكمية يجب أن تكون أكبر من صفر', 'error');
            return false;
        }
        
        if (product.quantity < quantity) {
            showNotification('خطأ', 'الكمية غير متوفرة في المخزون', 'error');
            return false;
        }
        
        const oldQuantity = product.quantity;
        product.quantity -= quantity;
        
        if (window.productModule?.updateProduct) {
            window.productModule.updateProduct(productId, {
                quantity: product.quantity
            });
        }
        
        const log = {
            id: Date.now() + Math.random(),
            productId: productId,
            productName: product.name,
            type: 'remove',
            quantity: -quantity,
            oldQuantity: oldQuantity,
            newQuantity: product.quantity,
            notes: notes,
            date: new Date().toISOString(),
            user: 'admin'
        };
        
        inventoryLogs.push(log);
        saveLogs();
        
        showNotification('نجاح', `تم خصم ${quantity} ${product.unit || 'وحدة'} من المخزون`);
        
        if (product.quantity <= product.minStock) {
            createAlert({
                productId: product.id,
                productName: product.name,
                type: 'min_stock',
                message: `وصل المخزون للحد الأدنى (${product.quantity} <= ${product.minStock})`,
                level: 'danger'
            });
        }
        
        renderInventory();
        return log;
    }
    
    // ================== تعديل المخزون يدوياً ==================
    function adjustStock(productId, newQuantity, notes = '') {
        const product = window.productModule?.getProduct?.(productId);
        if (!product) {
            showNotification('خطأ', 'المنتج غير موجود', 'error');
            return false;
        }
        
        if (newQuantity < 0) {
            showNotification('خطأ', 'الكمية لا يمكن أن تكون سالبة', 'error');
            return false;
        }
        
        const oldQuantity = product.quantity;
        const difference = newQuantity - oldQuantity;
        
        if (difference === 0) {
            showNotification('معلومة', 'لم يتغير شيء', 'info');
            return false;
        }
        
        product.quantity = newQuantity;
        
        if (window.productModule?.updateProduct) {
            window.productModule.updateProduct(productId, {
                quantity: newQuantity
            });
        }
        
        const log = {
            id: Date.now() + Math.random(),
            productId: productId,
            productName: product.name,
            type: difference > 0 ? 'adjust_increase' : 'adjust_decrease',
            quantity: difference,
            oldQuantity: oldQuantity,
            newQuantity: newQuantity,
            notes: notes || 'تعديل يدوي',
            date: new Date().toISOString(),
            user: 'admin'
        };
        
        inventoryLogs.push(log);
        saveLogs();
        
        showNotification('نجاح', `تم تعديل مخزون ${product.name} إلى ${newQuantity}`);
        
        checkProductLimits(product);
        renderInventory();
        return log;
    }
    
    // ================== التحقق من حدود المنتج ==================
    function checkProductLimits(product) {
        if (product.quantity <= product.minStock) {
            createAlert({
                productId: product.id,
                productName: product.name,
                type: 'min_stock',
                message: `المخزون منخفض: ${product.quantity} <= ${product.minStock}`,
                level: 'warning'
            });
        }
        
        if (product.maxStock && product.quantity > product.maxStock) {
            createAlert({
                productId: product.id,
                productName: product.name,
                type: 'max_stock',
                message: `المخزون مرتفع: ${product.quantity} > ${product.maxStock}`,
                level: 'info'
            });
        }
        
        if (product.quantity === 0) {
            createAlert({
                productId: product.id,
                productName: product.name,
                type: 'out_of_stock',
                message: `المنتج نفد من المخزون`,
                level: 'danger'
            });
        }
    }
    
    // ================== إنشاء تنبيه مخزون ==================
    function createAlert(alertData) {
        const existingAlert = stockAlerts.find(a => 
            a.productId == alertData.productId && 
            a.type === alertData.type && 
            a.status === 'active'
        );
        
        if (existingAlert) {
            existingAlert.message = alertData.message;
            existingAlert.date = new Date().toISOString();
            existingAlert.count = (existingAlert.count || 1) + 1;
        } else {
            stockAlerts.push({
                id: Date.now() + Math.random(),
                ...alertData,
                status: 'active',
                date: new Date().toISOString(),
                resolvedAt: null,
                count: 1
            });
        }
        
        saveAlerts();
        renderAlerts();
    }
    
    // ================== حل تنبيه ==================
    function resolveAlert(alertId) {
        const alert = stockAlerts.find(a => a.id == alertId);
        if (alert) {
            alert.status = 'resolved';
            alert.resolvedAt = new Date().toISOString();
            saveAlerts();
            renderAlerts();
            showNotification('تم', 'تم حل التنبيه');
        }
    }
    
    // ================== عرض التنبيهات ==================
    function renderAlerts() {
        const container = document.getElementById('stock-alerts');
        if (!container) return;
        
        const activeAlerts = stockAlerts.filter(a => a.status === 'active');
        
        if (activeAlerts.length === 0) {
            container.innerHTML = '<div class="alert alert-success">لا توجد تنبيهات</div>';
            return;
        }
        
        container.innerHTML = activeAlerts.map(alert => {
            const alertClass = alert.level === 'danger' ? 'alert-danger' : 
                              alert.level === 'warning' ? 'alert-warning' : 'alert-info';
            
            return `
            <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                <strong>${alert.productName}:</strong> ${alert.message}
                <button type="button" class="btn-close" onclick="inventoryModule.resolveAlert('${alert.id}')"></button>
            </div>
        `}).join('');
    }
    
    // ================== عرض المخزون في الجدول (محدث) ==================
    function renderInventory() {
        const tbody = document.getElementById('inventory-tbody');
        if (!tbody) return;
        
        const products = window.productModule?.products || [];
        
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="12" class="text-center p-4">لا توجد منتجات</td></tr>';
            updateStats();
            return;
        }
        
        tbody.innerHTML = products.map((p, index) => {
            const stockStatus = p.quantity <= p.minStock ? 'منخفض' : 'جيد';
            const statusClass = p.quantity <= p.minStock ? 'badge-danger' : 'badge-success';
            const location = p.location || '-';
            const barcode = p.barcode || '-';
            
            return `
            <tr>
                <td>${index + 1}</td>
                <td>
                    ${p.image ? `<img src="${p.image}" style="width:40px; height:40px; border-radius:5px; object-fit:cover;">` : 
                    '<i class="material-icons-round">image</i>'}
                </td>
                <td>${p.name}</td>
                <td>${p.category || 'عام'}</td>
                <td>${p.quantity}</td>
                <td>${p.unit || 'قطعة'}</td>
                <td>${location}</td>
                <td>${formatCurrency(p.sellPrice)}</td>
                <td>${formatCurrency(p.buyPrice)}</td>
                <td>${barcode}</td>
                <td><span class="${statusClass}">${stockStatus}</span></td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="inventoryModule.showProductDetails('${p.id}')">
                        <i class="material-icons-round">visibility</i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="inventoryModule.adjustStockForm('${p.id}')">
                        <i class="material-icons-round">edit</i>
                    </button>
                </td>
            </tr>
        `}).join('');
        
        updateStats();
        updateLowStockPreview();
        updateLocationsFilter();
    }
    
    // ================== عرض تفاصيل المنتج ==================
    function showProductDetails(productId) {
        const product = window.productModule?.getProduct?.(productId);
        if (!product) return;
        
        const productLogs = inventoryLogs.filter(l => l.productId == productId).slice(0, 10);
        
        let logsHtml = '';
        if (productLogs.length > 0) {
            logsHtml = '<h6 class="mt-3">آخر الحركات:</h6><div style="max-height:150px; overflow-y:auto;">';
            productLogs.forEach(log => {
                const typeText = log.type === 'add' ? 'إضافة' : log.type === 'remove' ? 'خصم' : 'تعديل';
                logsHtml += `<div class="small p-1 border-bottom">${new Date(log.date).toLocaleString()} - ${typeText}: ${Math.abs(log.quantity)}</div>`;
            });
            logsHtml += '</div>';
        }
        
        Swal.fire({
            title: product.name,
            html: `
                <div style="text-align:right; max-height:400px; overflow-y:auto;">
                    <p><strong>التصنيف:</strong> ${product.category || 'عام'}</p>
                    <p><strong>الكمية:</strong> ${product.quantity} ${product.unit || 'قطعة'}</p>
                    <p><strong>موقع التخزين:</strong> ${product.location || '-'}</p>
                    <p><strong>سعر البيع:</strong> ${formatCurrency(product.sellPrice)}</p>
                    <p><strong>سعر الشراء:</strong> ${formatCurrency(product.buyPrice)}</p>
                    <p><strong>الباركود:</strong> ${product.barcode || '-'}</p>
                    <p><strong>الحد الأدنى:</strong> ${product.minStock}</p>
                    <p><strong>الحد الأقصى:</strong> ${product.maxStock || 'غير محدد'}</p>
                    ${logsHtml}
                </div>
            `,
            confirmButtonText: 'إغلاق'
        });
    }
    
    // ================== نموذج تعديل المخزون ==================
    function adjustStockForm(productId) {
        const product = window.productModule?.getProduct?.(productId);
        if (!product) return;
        
        Swal.fire({
            title: `تعديل مخزون ${product.name}`,
            html: `
                <div style="text-align:right;">
                    <p>الكمية الحالية: <strong>${product.quantity}</strong></p>
                    <input type="number" id="new-quantity" class="form-control" value="${product.quantity}" min="0">
                    <textarea id="adjust-notes" class="form-control mt-2" placeholder="سبب التعديل" rows="2"></textarea>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'تعديل',
            cancelButtonText: 'إلغاء',
            preConfirm: () => {
                const newQty = parseInt(document.getElementById('new-quantity').value);
                const notes = document.getElementById('adjust-notes').value;
                if (isNaN(newQty) || newQty < 0) {
                    Swal.showValidationMessage('الكمية غير صالحة');
                    return false;
                }
                return { newQty, notes };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                adjustStock(productId, result.value.newQty, result.value.notes);
            }
        });
    }
    
    // ================== تحديث الإحصائيات ==================
    function updateStats() {
        const products = window.productModule?.products || [];
        
        const totalCount = products.length;
        const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);
        const totalValue = products.reduce((sum, p) => sum + (p.buyPrice * p.quantity), 0);
        const lowStock = products.filter(p => p.quantity <= p.minStock).length;
        
        const countEl = document.getElementById('total-products-count');
        const qtyEl = document.getElementById('total-quantity');
        const valueEl = document.getElementById('total-stock-value');
        const lowEl = document.getElementById('low-stock-count');
        
        if (countEl) countEl.textContent = totalCount;
        if (qtyEl) qtyEl.textContent = totalQuantity;
        if (valueEl) valueEl.textContent = formatCurrency(totalValue);
        if (lowEl) lowEl.textContent = lowStock;
    }
    
    // ================== تحديث معاينة المنتجات الناقصة ==================
    function updateLowStockPreview() {
        const container = document.getElementById('low-stock-preview');
        if (!container) return;
        
        const products = window.productModule?.products || [];
        const lowStock = products.filter(p => p.quantity <= p.minStock).slice(0, 5);
        
        if (lowStock.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">لا توجد منتجات ناقصة</p>';
            return;
        }
        
        container.innerHTML = lowStock.map(p => `
            <div class="list-item">
                <span>${p.name}</span>
                <span class="text-danger">${p.quantity} / ${p.minStock}</span>
            </div>
        `).join('');
    }
    
    // ================== تحديث قائمة المواقع للتصفية ==================
    function updateLocationsFilter() {
        const products = window.productModule?.products || [];
        const locations = [...new Set(products.map(p => p.location).filter(l => l))];
        
        const filter = document.getElementById('inventory-location-filter');
        if (filter) {
            filter.innerHTML = '<option value="">جميع المواقع</option>' + 
                locations.map(l => `<option value="${l}">${l}</option>`).join('');
        }
    }
    
    // ================== الحصول على حركات المخزون ==================
    function getInventoryLogs(productId = null, limit = 100) {
        let logs = [...inventoryLogs].sort((a, b) => new Date(b.date) - new Date(a.date));
        if (productId) {
            logs = logs.filter(log => log.productId == productId);
        }
        return logs.slice(0, limit);
    }
    
    // ================== إحصائيات المخزون ==================
    function getInventoryStats() {
        const products = window.productModule?.products || [];
        
        const totalProducts = products.length;
        const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);
        const totalValue = products.reduce((sum, p) => sum + (p.buyPrice * p.quantity), 0);
        const lowStock = products.filter(p => p.quantity <= p.minStock).length;
        const outOfStock = products.filter(p => p.quantity === 0).length;
        
        const today = new Date().toDateString();
        const todayLogs = inventoryLogs.filter(log => new Date(log.date).toDateString() === today);
        
        const todayAdditions = todayLogs.filter(l => l.type === 'add').reduce((sum, l) => sum + l.quantity, 0);
        const todayRemovals = todayLogs.filter(l => l.type === 'remove').reduce((sum, l) => sum + Math.abs(l.quantity), 0);
        
        return {
            totalProducts,
            totalQuantity,
            totalValue: formatCurrency(totalValue),
            lowStock,
            outOfStock,
            todayAdditions,
            todayRemovals,
            todayNet: todayAdditions - todayRemovals,
            alerts: stockAlerts.filter(a => a.status === 'active').length
        };
    }
    
    // ================== تقرير المخزون ==================
    function generateInventoryReport() {
        const products = window.productModule?.products || [];
        const stats = getInventoryStats();
        
        return {
            date: new Date().toISOString(),
            stats,
            products: products.map(p => ({
                name: p.name,
                category: p.category,
                quantity: p.quantity,
                unit: p.unit,
                location: p.location || '-',
                buyPrice: p.buyPrice,
                sellPrice: p.sellPrice,
                value: p.buyPrice * p.quantity,
                status: p.quantity <= p.minStock ? 'منخفض' : 'جيد'
            }))
        };
    }
    
    // ================== التحقق الدوري من المخزون ==================
    function checkAllProducts() {
        const products = window.productModule?.products || [];
        products.forEach(product => checkProductLimits(product));
        showNotification('تم', 'تم التحقق من جميع المنتجات');
    }
    
    // ================== تهيئة الوحدة ==================
    function init() {
        console.log('✅ inventoryModule v2 initialized - الرقم 20');
        console.log(`   عدد حركات المخزون: ${inventoryLogs.length}`);
        
        renderInventory();
        renderAlerts();
        updateStats();
        
        // التحقق الدوري كل 5 دقائق
        setInterval(checkAllProducts, 5 * 60 * 1000);
    }
    
    // ================== واجهة الوحدة ==================
    return {
        inventoryLogs,
        stockAlerts,
        addStock,
        removeStock,
        adjustStock,
        adjustStockForm,
        showProductDetails,
        createAlert,
        resolveAlert,
        renderAlerts,
        renderInventory,
        checkAllProducts,
        getInventoryLogs,
        getInventoryStats,
        generateInventoryReport,
        init
    };
})();

window.inventoryModule = inventoryModule;

// دوال مختصرة
window.resolveAlert = (id) => inventoryModule.resolveAlert(id);
window.adjustStock = (id) => inventoryModule.adjustStockForm(id);

// تهيئة تلقائية
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => inventoryModule.init());
    document.addEventListener('html-loaded', () => inventoryModule.init());
}
