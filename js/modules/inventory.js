// ================== inventory.js - إدارة المخزون ==================
// الرقم 19 في ترتيب الملفات - يعتمد على utils.js و product.js

const inventoryModule = (function() {
    // ================== البيانات ==================
    let inventoryLogs = JSON.parse(localStorage.getItem('inventory_logs')) || [];
    let stockAlerts = JSON.parse(localStorage.getItem('stock_alerts')) || [];
    
    // ================== دوال مساعدة داخلية ==================
    function saveLogs() {
        localStorage.setItem('inventory_logs', JSON.stringify(inventoryLogs));
    }
    
    function saveAlerts() {
        localStorage.setItem('stock_alerts', JSON.stringify(stockAlerts));
    }
    
    // ================== إضافة مخزون ==================
    function addStock(productId, quantity, price = null, notes = '') {
        // التحقق من وجود المنتج
        const product = window.productModule?.getProduct(productId);
        if (!product) {
            utilsModule.showNotification('خطأ', 'المنتج غير موجود', 'error');
            return false;
        }
        
        if (quantity <= 0) {
            utilsModule.showNotification('خطأ', 'الكمية يجب أن تكون أكبر من صفر', 'error');
            return false;
        }
        
        // تحديث كمية المنتج
        const oldQuantity = product.quantity;
        product.quantity += quantity;
        
        // تحديث سعر الشراء إذا تم توفيره
        if (price && price > 0) {
            product.buyPrice = price;
        }
        
        // حفظ التغييرات في product.js
        if (window.productModule?.updateProduct) {
            window.productModule.updateProduct(productId, {
                quantity: product.quantity,
                buyPrice: product.buyPrice
            });
        }
        
        // تسجيل الحركة في المخزون
        const log = {
            id: utilsModule.generateId(),
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
        
        utilsModule.showNotification('نجاح', `تم إضافة ${quantity} ${product.unit} إلى المخزون`);
        
        // التحقق من تجاوز الحد الأقصى
        if (product.maxStock && product.quantity > product.maxStock) {
            createAlert({
                productId: product.id,
                productName: product.name,
                type: 'max_stock',
                message: `تجاوز الحد الأقصى للمخزون (${product.quantity} > ${product.maxStock})`,
                level: 'warning'
            });
        }
        
        return log;
    }
    
    // ================== خصم مخزون ==================
    function removeStock(productId, quantity, notes = '') {
        // التحقق من وجود المنتج
        const product = window.productModule?.getProduct(productId);
        if (!product) {
            utilsModule.showNotification('خطأ', 'المنتج غير موجود', 'error');
            return false;
        }
        
        if (quantity <= 0) {
            utilsModule.showNotification('خطأ', 'الكمية يجب أن تكون أكبر من صفر', 'error');
            return false;
        }
        
        if (product.quantity < quantity) {
            utilsModule.showNotification('خطأ', 'الكمية غير متوفرة في المخزون', 'error');
            return false;
        }
        
        // تحديث كمية المنتج
        const oldQuantity = product.quantity;
        product.quantity -= quantity;
        
        // حفظ التغييرات في product.js
        if (window.productModule?.updateProduct) {
            window.productModule.updateProduct(productId, {
                quantity: product.quantity
            });
        }
        
        // تسجيل الحركة في المخزون
        const log = {
            id: utilsModule.generateId(),
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
        
        utilsModule.showNotification('نجاح', `تم خصم ${quantity} ${product.unit} من المخزون`);
        
        // التحقق من الوصول للحد الأدنى
        if (product.quantity <= product.minStock) {
            createAlert({
                productId: product.id,
                productName: product.name,
                type: 'min_stock',
                message: `وصل المخزون للحد الأدنى (${product.quantity} <= ${product.minStock})`,
                level: 'danger'
            });
        }
        
        return log;
    }
    
    // ================== تعديل المخزون يدوياً ==================
    function adjustStock(productId, newQuantity, notes = '') {
        const product = window.productModule?.getProduct(productId);
        if (!product) {
            utilsModule.showNotification('خطأ', 'المنتج غير موجود', 'error');
            return false;
        }
        
        if (newQuantity < 0) {
            utilsModule.showNotification('خطأ', 'الكمية لا يمكن أن تكون سالبة', 'error');
            return false;
        }
        
        const oldQuantity = product.quantity;
        const difference = newQuantity - oldQuantity;
        
        if (difference === 0) {
            utilsModule.showNotification('معلومة', 'لم يتغير شيء', 'info');
            return false;
        }
        
        // تحديث كمية المنتج
        product.quantity = newQuantity;
        
        // حفظ التغييرات في product.js
        if (window.productModule?.updateProduct) {
            window.productModule.updateProduct(productId, {
                quantity: newQuantity
            });
        }
        
        // تسجيل الحركة في المخزون
        const log = {
            id: utilsModule.generateId(),
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
        
        utilsModule.showNotification('نجاح', `تم تعديل مخزون ${product.name} إلى ${newQuantity}`);
        
        // التحقق من الحدود
        checkProductLimits(product);
        
        return log;
    }
    
    // ================== التحقق من حدود المنتج ==================
    function checkProductLimits(product) {
        // التحقق من الحد الأدنى
        if (product.quantity <= product.minStock) {
            createAlert({
                productId: product.id,
                productName: product.name,
                type: 'min_stock',
                message: `المخزون منخفض: ${product.quantity} <= ${product.minStock}`,
                level: 'warning'
            });
        }
        
        // التحقق من الحد الأقصى
        if (product.maxStock && product.quantity > product.maxStock) {
            createAlert({
                productId: product.id,
                productName: product.name,
                type: 'max_stock',
                message: `المخزون مرتفع: ${product.quantity} > ${product.maxStock}`,
                level: 'info'
            });
        }
        
        // التحقق من نفاد المخزون
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
        // التحقق من وجود تنبيه مشابه لم يتم حله
        const existingAlert = stockAlerts.find(a => 
            a.productId == alertData.productId && 
            a.type === alertData.type && 
            a.status === 'active'
        );
        
        if (existingAlert) {
            // تحديث التنبيه الموجود
            existingAlert.message = alertData.message;
            existingAlert.date = new Date().toISOString();
            existingAlert.count = (existingAlert.count || 1) + 1;
        } else {
            // إنشاء تنبيه جديد
            stockAlerts.push({
                id: utilsModule.generateId(),
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
            utilsModule.showNotification('تم', 'تم حل التنبيه');
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
    
    // ================== جرد المخزون ==================
    function startInventoryCount() {
        const products = window.productModule?.getAllProducts() || [];
        
        // إنشاء جلسة جرد جديدة
        const inventorySession = {
            id: utilsModule.generateId(),
            date: new Date().toISOString(),
            items: products.map(p => ({
                productId: p.id,
                productName: p.name,
                systemQuantity: p.quantity,
                actualQuantity: p.quantity,
                difference: 0,
                counted: false
            })),
            status: 'in_progress',
            completedAt: null
        };
        
        // حفظ جلسة الجرد
        const sessions = JSON.parse(localStorage.getItem('inventory_sessions')) || [];
        sessions.push(inventorySession);
        localStorage.setItem('inventory_sessions', JSON.stringify(sessions));
        
        return inventorySession;
    }
    
    // ================== تحديث كمية الجرد ==================
    function updateInventoryCount(sessionId, productId, actualQuantity) {
        const sessions = JSON.parse(localStorage.getItem('inventory_sessions')) || [];
        const session = sessions.find(s => s.id == sessionId);
        
        if (!session) return false;
        
        const item = session.items.find(i => i.productId == productId);
        if (item) {
            item.actualQuantity = actualQuantity;
            item.difference = actualQuantity - item.systemQuantity;
            item.counted = true;
            
            localStorage.setItem('inventory_sessions', JSON.stringify(sessions));
            
            // إذا كان هناك فرق، نقترح تعديل المخزون
            if (item.difference !== 0) {
                utilsModule.showConfirmation(
                    'فرق في الجرد',
                    `الفرق: ${item.difference} وحدة. هل تريد تعديل المخزون؟`,
                    () => {
                        adjustStock(productId, actualQuantity, 'تعديل بعد الجرد');
                    }
                );
            }
        }
        
        return session;
    }
    
    // ================== إنهاء جرد ==================
    function completeInventoryCount(sessionId) {
        const sessions = JSON.parse(localStorage.getItem('inventory_sessions')) || [];
        const session = sessions.find(s => s.id == sessionId);
        
        if (!session) return false;
        
        session.status = 'completed';
        session.completedAt = new Date().toISOString();
        
        localStorage.setItem('inventory_sessions', JSON.stringify(sessions));
        
        // حساب إحصائيات الجرد
        const totalItems = session.items.length;
        const countedItems = session.items.filter(i => i.counted).length;
        const itemsWithDiff = session.items.filter(i => i.difference !== 0);
        
        utilsModule.showNotification(
            'تم الجرد',
            `تم جرد ${countedItems} من ${totalItems} منتج، وجود فروق في ${itemsWithDiff.length} منتج`
        );
        
        return session;
    }
    
    // ================== الحصول على حركات المخزون ==================
    function getInventoryLogs(productId = null, limit = 100) {
        let logs = [...inventoryLogs].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (productId) {
            logs = logs.filter(log => log.productId == productId);
        }
        
        return logs.slice(0, limit);
    }
    
    // ================== عرض حركات المخزون ==================
    function renderInventoryLogs(containerId, productId = null) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const logs = getInventoryLogs(productId, 50);
        
        if (logs.length === 0) {
            container.innerHTML = '<tr><td colspan="6" class="text-center p-4">لا توجد حركات مخزون</td></tr>';
            return;
        }
        
        container.innerHTML = logs.map(log => {
            const typeText = log.type === 'add' ? 'إضافة' : 
                            log.type === 'remove' ? 'خصم' : 'تعديل';
            const typeClass = log.type === 'add' ? 'badge-success' : 
                             log.type === 'remove' ? 'badge-danger' : 'badge-warning';
            
            return `
            <tr>
                <td>${utilsModule.formatDate(log.date)}</td>
                <td>${log.productName}</td>
                <td><span class="${typeClass}">${typeText}</span></td>
                <td>${Math.abs(log.quantity)}</td>
                <td>${log.oldQuantity} → ${log.newQuantity}</td>
                <td>${log.notes || '-'}</td>
            </tr>
        `}).join('');
    }
    
    // ================== إحصائيات المخزون ==================
    function getInventoryStats() {
        const products = window.productModule?.getAllProducts() || [];
        
        const totalProducts = products.length;
        const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);
        const totalValue = products.reduce((sum, p) => sum + (p.buyPrice * p.quantity), 0);
        const lowStock = products.filter(p => p.quantity <= p.minStock).length;
        const outOfStock = products.filter(p => p.quantity === 0).length;
        
        // حركات اليوم
        const today = new Date().toDateString();
        const todayLogs = inventoryLogs.filter(log => 
            new Date(log.date).toDateString() === today
        );
        
        const todayAdditions = todayLogs.filter(l => l.type === 'add').reduce((sum, l) => sum + l.quantity, 0);
        const todayRemovals = todayLogs.filter(l => l.type === 'remove').reduce((sum, l) => sum + Math.abs(l.quantity), 0);
        
        return {
            totalProducts,
            totalQuantity,
            totalValue: utilsModule.formatCurrency(totalValue),
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
        const products = window.productModule?.getAllProducts() || [];
        const stats = getInventoryStats();
        
        const report = {
            date: new Date().toISOString(),
            stats,
            products: products.map(p => ({
                name: p.name,
                category: p.category,
                quantity: p.quantity,
                unit: p.unit,
                buyPrice: p.buyPrice,
                sellPrice: p.sellPrice,
                value: p.buyPrice * p.quantity,
                status: p.quantity <= p.minStock ? 'منخفض' : 'جيد'
            }))
        };
        
        return report;
    }
    
    // ================== طباعة تقرير المخزون ==================
    function printInventoryReport() {
        const report = generateInventoryReport();
        
        // تعبئة بيانات الطباعة
        const tbody = document.getElementById('print-inventory-items');
        const dateEl = document.getElementById('inventory-report-date');
        const totalEl = document.getElementById('print-total-value');
        
        if (tbody) {
            tbody.innerHTML = report.products.map((p, i) => `
                <tr>
                    <td>${i + 1}</td>
                    <td>${p.name}</td>
                    <td>${p.category}</td>
                    <td>${p.quantity} ${p.unit}</td>
                    <td>${utilsModule.formatCurrency(p.buyPrice)}</td>
                    <td>${utilsModule.formatCurrency(p.sellPrice)}</td>
                    <td>${utilsModule.formatCurrency(p.value)}</td>
                </tr>
            `).join('');
        }
        
        if (dateEl) {
            dateEl.textContent = utilsModule.formatDate(report.date);
        }
        
        if (totalEl) {
            totalEl.textContent = report.stats.totalValue;
        }
        
        // طباعة
        window.print();
    }
    
    // ================== التحقق الدوري من المخزون ==================
    function checkAllProducts() {
        const products = window.productModule?.getAllProducts() || [];
        
        products.forEach(product => {
            checkProductLimits(product);
        });
        
        utilsModule.showNotification('تم', 'تم التحقق من جميع المنتجات');
    }
    
    // ================== تهيئة الوحدة ==================
    function init() {
        console.log('✅ inventoryModule initialized - الرقم 19');
        console.log(`   عدد حركات المخزون: ${inventoryLogs.length}`);
        console.log(`   عدد التنبيهات النشطة: ${stockAlerts.filter(a => a.status === 'active').length}`);
        
        // عرض التنبيهات
        renderAlerts();
        
        // التحقق الدوري كل 5 دقائق
        setInterval(checkAllProducts, 5 * 60 * 1000);
    }
    
    // ================== واجهة الوحدة ==================
    return {
        // البيانات
        inventoryLogs,
        stockAlerts,
        
        // عمليات المخزون
        addStock,
        removeStock,
        adjustStock,
        
        // التنبيهات
        createAlert,
        resolveAlert,
        renderAlerts,
        checkAllProducts,
        checkProductLimits,
        
        // الجرد
        startInventoryCount,
        updateInventoryCount,
        completeInventoryCount,
        
        // التقارير
        getInventoryLogs,
        renderInventoryLogs,
        getInventoryStats,
        generateInventoryReport,
        printInventoryReport,
        
        // تهيئة
        init
    };
})();

// ================== تصدير للاستخدام العام ==================
window.inventoryModule = inventoryModule;

// ================== دوال مختصرة للاستخدام في HTML ==================
window.resolveAlert = (id) => inventoryModule.resolveAlert(id);
window.printInventoryReport = () => inventoryModule.printInventoryReport();

// ================== تهيئة تلقائية ==================
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        if (inventoryModule && inventoryModule.init) {
            inventoryModule.init();
        }
    });
    
    document.addEventListener('html-loaded', function() {
        if (inventoryModule && inventoryModule.init) {
            inventoryModule.init();
        }
    });
}
