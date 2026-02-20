// ================== backup.js - النسخ الاحتياطي واستعادة البيانات ==================
// الرقم 27 في ترتيب الملفات - يعتمد على utils.js وجميع الوحدات الأخرى

const backupModule = (function() {
    // ================== دوال مساعدة داخلية ==================
    
    // ================== جمع جميع البيانات ==================
    function collectAllData() {
        const data = {
            version: '2.0.0',
            timestamp: new Date().toISOString(),
            appName: 'سوبر - النظام المتكامل',
            
            // المنتجات
            products: {
                data: window.productModule?.getAllProducts() || [],
                count: window.productModule?.getAllProducts()?.length || 0
            },
            
            // العملاء
            customers: {
                data: window.customerModule?.getAllCustomers() || [],
                count: window.customerModule?.getAllCustomers()?.length || 0
            },
            
            // الموردين
            suppliers: {
                data: window.supplierModule?.getAllSuppliers() || [],
                count: window.supplierModule?.getAllSuppliers()?.length || 0
            },
            
            // فواتير المبيعات
            salesInvoices: {
                data: window.salesModule?.getInvoices() || [],
                count: window.salesModule?.getInvoices()?.length || 0
            },
            
            // فواتير المشتريات
            purchaseInvoices: {
                data: window.purchasesModule?.getInvoices() || [],
                count: window.purchasesModule?.getInvoices()?.length || 0
            },
            
            // الديون
            debts: {
                data: window.debtModule?.debts || [],
                count: window.debtModule?.debts?.length || 0
            },
            
            // الدفعات
            payments: {
                data: window.debtModule?.payments || [],
                count: window.debtModule?.payments?.length || 0
            },
            
            // سجلات المخزون
            inventoryLogs: {
                data: window.inventoryModule?.inventoryLogs || [],
                count: window.inventoryModule?.inventoryLogs?.length || 0
            },
            
            // الإعدادات
            settings: JSON.parse(localStorage.getItem('settings') || '{}'),
            
            // إحصائيات عامة
            stats: {
                products: window.productModule?.getAllProducts()?.length || 0,
                customers: window.customerModule?.getAllCustomers()?.length || 0,
                suppliers: window.supplierModule?.getAllSuppliers()?.length || 0,
                salesInvoices: window.salesModule?.getInvoices()?.length || 0,
                purchaseInvoices: window.purchasesModule?.getInvoices()?.length || 0,
                debts: window.debtModule?.debts?.length || 0
            }
        };
        
        return data;
    }
    
    // ================== تصدير نسخة احتياطية ==================
    function exportBackup() {
        try {
            // جمع البيانات
            const backupData = collectAllData();
            
            // إضافة ملخص
            backupData.summary = {
                totalRecords: 
                    backupData.stats.products +
                    backupData.stats.customers +
                    backupData.stats.suppliers +
                    backupData.stats.salesInvoices +
                    backupData.stats.purchaseInvoices +
                    backupData.stats.debts,
                date: new Date().toLocaleString('ar-EG'),
                version: backupData.version
            };
            
            // تحويل إلى JSON مع تنسيق جميل
            const backupJSON = JSON.stringify(backupData, null, 2);
            
            // إنشاء ملف للتحميل
            const blob = new Blob([backupJSON], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            
            utilsModule.showNotification('نجاح', 'تم تصدير النسخة الاحتياطية بنجاح');
            
            // تسجيل عملية التصدير
            logBackupOperation('export', 'success', backupData.summary.totalRecords);
            
            return true;
        } catch (error) {
            console.error('خطأ في تصدير النسخة:', error);
            utilsModule.showNotification('خطأ', 'فشل في تصدير النسخة الاحتياطية', 'error');
            
            logBackupOperation('export', 'error', 0, error.message);
            
            return false;
        }
    }
    
    // ================== استيراد نسخة احتياطية ==================
    function importBackup(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const backupData = JSON.parse(e.target.result);
                    
                    // التحقق من صحة الملف
                    if (!backupData.version || !backupData.timestamp) {
                        throw new Error('الملف غير صالح - لا يحتوي على بيانات صحيحة');
                    }
                    
                    // التحقق من الإصدار
                    if (backupData.version !== '2.0.0') {
                        utilsModule.showConfirmation(
                            'تحذير: إصدار مختلف',
                            `النسخة الاحتياطية من إصدار ${backupData.version} والتطبيق الحالي إصدار 2.0.0. قد تحدث مشاكل في التوافق. هل تريد المتابعة؟`,
                            () => {
                                performImport(backupData, resolve, reject);
                            },
                            () => {
                                reject(new Error('تم إلغاء الاستيراد'));
                            }
                        );
                    } else {
                        performImport(backupData, resolve, reject);
                    }
                    
                } catch (error) {
                    console.error('خطأ في قراءة الملف:', error);
                    utilsModule.showNotification('خطأ', 'الملف غير صالح', 'error');
                    
                    logBackupOperation('import', 'error', 0, error.message);
                    
                    reject(error);
                }
            };
            
            reader.readAsText(file);
        });
    }
    
    // ================== تنفيذ الاستيراد ==================
    function performImport(backupData, resolve, reject) {
        try {
            let importedCount = 0;
            
            // استيراد المنتجات
            if (backupData.products && backupData.products.data) {
                localStorage.setItem('products', JSON.stringify(backupData.products.data));
                importedCount += backupData.products.count;
            }
            
            // استيراد العملاء
            if (backupData.customers && backupData.customers.data) {
                localStorage.setItem('customers', JSON.stringify(backupData.customers.data));
                importedCount += backupData.customers.count;
            }
            
            // استيراد الموردين
            if (backupData.suppliers && backupData.suppliers.data) {
                localStorage.setItem('suppliers', JSON.stringify(backupData.suppliers.data));
                importedCount += backupData.suppliers.count;
            }
            
            // استيراد فواتير المبيعات
            if (backupData.salesInvoices && backupData.salesInvoices.data) {
                localStorage.setItem('sales_invoices', JSON.stringify(backupData.salesInvoices.data));
                importedCount += backupData.salesInvoices.count;
            }
            
            // استيراد فواتير المشتريات
            if (backupData.purchaseInvoices && backupData.purchaseInvoices.data) {
                localStorage.setItem('purchase_invoices', JSON.stringify(backupData.purchaseInvoices.data));
                importedCount += backupData.purchaseInvoices.count;
            }
            
            // استيراد الديون
            if (backupData.debts && backupData.debts.data) {
                localStorage.setItem('debts', JSON.stringify(backupData.debts.data));
                importedCount += backupData.debts.count;
            }
            
            // استيراد الدفعات
            if (backupData.payments && backupData.payments.data) {
                localStorage.setItem('payments', JSON.stringify(backupData.payments.data));
                importedCount += backupData.payments.count;
            }
            
            // استيراد سجلات المخزون
            if (backupData.inventoryLogs && backupData.inventoryLogs.data) {
                localStorage.setItem('inventory_logs', JSON.stringify(backupData.inventoryLogs.data));
                importedCount += backupData.inventoryLogs.count;
            }
            
            // استيراد الإعدادات
            if (backupData.settings) {
                localStorage.setItem('settings', JSON.stringify(backupData.settings));
            }
            
            utilsModule.showNotification(
                'نجاح',
                `تم استيراد ${importedCount} سجل بنجاح. سيتم إعادة تحميل الصفحة`,
                'success'
            );
            
            logBackupOperation('import', 'success', importedCount);
            
            // إعادة تحميل الصفحة بعد ثانيتين
            setTimeout(() => {
                location.reload();
            }, 2000);
            
            resolve({
                success: true,
                count: importedCount,
                message: `تم استيراد ${importedCount} سجل`
            });
            
        } catch (error) {
            console.error('خطأ في استيراد البيانات:', error);
            utilsModule.showNotification('خطأ', 'فشل في استيراد البيانات', 'error');
            
            logBackupOperation('import', 'error', 0, error.message);
            
            reject(error);
        }
    }
    
    // ================== تسجيل عمليات النسخ الاحتياطي ==================
    function logBackupOperation(operation, status, count = 0, error = null) {
        const logs = JSON.parse(localStorage.getItem('backup_logs') || '[]');
        
        logs.push({
            id: utilsModule.generateId(),
            operation: operation, // 'export' or 'import'
            status: status, // 'success' or 'error'
            count: count,
            error: error,
            timestamp: new Date().toISOString(),
            user: 'admin'
        });
        
        // الاحتفاظ بآخر 50 عملية فقط
        if (logs.length > 50) {
            logs.shift();
        }
        
        localStorage.setItem('backup_logs', JSON.stringify(logs));
    }
    
    // ================== مسح جميع البيانات ==================
    function clearAllData() {
        utilsModule.showConfirmation(
            '⚠️ تحذير شديد',
            'هل أنت متأكد من مسح جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء!',
            () => {
                // تأكيد ثان
                Swal.fire({
                    title: 'تأكيد نهائي',
                    text: 'اكتب "مسح" لتأكيد العملية',
                    input: 'text',
                    inputPlaceholder: 'اكتب "مسح" هنا',
                    showCancelButton: true,
                    confirmButtonText: 'مسح الكل',
                    cancelButtonText: 'إلغاء',
                    confirmButtonColor: '#d33',
                    preConfirm: (input) => {
                        if (input !== 'مسح') {
                            Swal.showValidationMessage('يجب كتابة "مسح" للتأكيد');
                            return false;
                        }
                    }
                }).then((result) => {
                    if (result.isConfirmed) {
                        performClearAll();
                    }
                });
            }
        );
    }
    
    // ================== تنفيذ المسح الكلي ==================
    function performClearAll() {
        // قائمة المفاتيح المراد مسحها
        const keys = [
            'products',
            'customers',
            'suppliers',
            'sales_invoices',
            'purchase_invoices',
            'debts',
            'payments',
            'inventory_logs',
            'inventory',
            'categories',
            'settings',
            'backup_logs'
        ];
        
        // مسح كل مفتاح
        keys.forEach(key => localStorage.removeItem(key));
        
        utilsModule.showNotification('نجاح', 'تم مسح جميع البيانات بنجاح');
        
        logBackupOperation('clear', 'success', 0);
        
        // إعادة تحميل الصفحة
        setTimeout(() => {
            location.reload();
        }, 2000);
    }
    
    // ================== تصدير بيانات محددة ==================
    function exportSpecificData(types) {
        const data = {};
        
        if (types.includes('products') && window.productModule) {
            data.products = window.productModule.getAllProducts();
        }
        
        if (types.includes('customers') && window.customerModule) {
            data.customers = window.customerModule.getAllCustomers();
        }
        
        if (types.includes('suppliers') && window.supplierModule) {
            data.suppliers = window.supplierModule.getAllSuppliers();
        }
        
        if (types.includes('sales') && window.salesModule) {
            data.salesInvoices = window.salesModule.getInvoices();
        }
        
        if (types.includes('purchases') && window.purchasesModule) {
            data.purchaseInvoices = window.purchasesModule.getInvoices();
        }
        
        if (types.includes('debts') && window.debtModule) {
            data.debts = window.debtModule.debts;
            data.payments = window.debtModule.payments;
        }
        
        const backupJSON = JSON.stringify(data, null, 2);
        const blob = new Blob([backupJSON], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `export_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        
        utilsModule.showNotification('نجاح', 'تم تصدير البيانات المحددة');
    }
    
    // ================== الحصول على إحصائيات النسخ الاحتياطي ==================
    function getBackupStats() {
        const logs = JSON.parse(localStorage.getItem('backup_logs') || '[]');
        
        const lastExport = logs.filter(l => l.operation === 'export' && l.status === 'success').pop();
        const lastImport = logs.filter(l => l.operation === 'import' && l.status === 'success').pop();
        
        return {
            totalExports: logs.filter(l => l.operation === 'export' && l.status === 'success').length,
            totalImports: logs.filter(l => l.operation === 'import' && l.status === 'success').length,
            lastExport: lastExport ? new Date(lastExport.timestamp).toLocaleString('ar-EG') : 'لا يوجد',
            lastImport: lastImport ? new Date(lastImport.timestamp).toLocaleString('ar-EG') : 'لا يوجد',
            recentLogs: logs.slice(-10).reverse()
        };
    }
    
    // ================== عرض سجل النسخ الاحتياطي ==================
    function showBackupLogs() {
        const logs = JSON.parse(localStorage.getItem('backup_logs') || '[]');
        
        if (logs.length === 0) {
            utilsModule.showNotification('معلومة', 'لا توجد سجلات سابقة', 'info');
            return;
        }
        
        let logsHtml = '';
        logs.slice(-20).reverse().forEach(log => {
            const statusClass = log.status === 'success' ? 'badge-success' : 'badge-danger';
            const statusText = log.status === 'success' ? 'نجاح' : 'فشل';
            const operationText = log.operation === 'export' ? 'تصدير' : 
                                  log.operation === 'import' ? 'استيراد' : 'مسح';
            
            logsHtml += `
                <tr>
                    <td>${utilsModule.formatDate(log.timestamp)}</td>
                    <td>${operationText}</td>
                    <td><span class="${statusClass}">${statusText}</span></td>
                    <td>${log.count || '-'}</td>
                    <td>${log.error || '-'}</td>
                </tr>
            `;
        });
        
        Swal.fire({
            title: 'سجل عمليات النسخ الاحتياطي',
            html: `
                <div style="max-height:400px; overflow-y:auto;">
                    <table class="table-custom">
                        <thead>
                            <tr>
                                <th>التاريخ</th>
                                <th>العملية</th>
                                <th>الحالة</th>
                                <th>عدد السجلات</th>
                                <th>الخطأ</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${logsHtml}
                        </tbody>
                    </table>
                </div>
            `,
            width: '800px',
            confirmButtonText: 'إغلاق'
        });
    }
    
    // ================== جدولة نسخ احتياطي تلقائي ==================
    function scheduleAutoBackup(intervalHours = 24) {
        const settings = JSON.parse(localStorage.getItem('settings') || '{}');
        settings.autoBackup = {
            enabled: true,
            interval: intervalHours,
            lastBackup: new Date().toISOString(),
            nextBackup: new Date(Date.now() + intervalHours * 60 * 60 * 1000).toISOString()
        };
        
        localStorage.setItem('settings', JSON.stringify(settings));
        
        utilsModule.showNotification('نجاح', `تم جدولة نسخ احتياطي كل ${intervalHours} ساعة`);
    }
    
    // ================== إيقاف النسخ الاحتياطي التلقائي ==================
    function disableAutoBackup() {
        const settings = JSON.parse(localStorage.getItem('settings') || '{}');
        settings.autoBackup = {
            enabled: false
        };
        
        localStorage.setItem('settings', JSON.stringify(settings));
        
        utilsModule.showNotification('معلومة', 'تم إيقاف النسخ الاحتياطي التلقائي', 'info');
    }
    
    // ================== مقارنة نسختين ==================
    function compareBackups(backup1, backup2) {
        const diff = {
            products: Math.abs(backup1.products.count - backup2.products.count),
            customers: Math.abs(backup1.customers.count - backup2.customers.count),
            suppliers: Math.abs(backup1.suppliers.count - backup2.suppliers.count),
            sales: Math.abs(backup1.salesInvoices.count - backup2.salesInvoices.count),
            purchases: Math.abs(backup1.purchaseInvoices.count - backup2.purchaseInvoices.count),
            debts: Math.abs(backup1.debts.count - backup2.debts.count)
        };
        
        const totalDiff = Object.values(diff).reduce((a, b) => a + b, 0);
        
        return {
            differences: diff,
            totalDiff,
            firstDate: new Date(backup1.timestamp).toLocaleString('ar-EG'),
            secondDate: new Date(backup2.timestamp).toLocaleString('ar-EG'),
            hasChanges: totalDiff > 0
        };
    }
    
    // ================== ضغط البيانات قبل التصدير ==================
    function compressData(data) {
        // إزالة الحقول غير الضرورية
        const compressed = JSON.parse(JSON.stringify(data));
        
        // حذف الحقول الكبيرة مثل الملاحظات
        if (compressed.products?.data) {
            compressed.products.data = compressed.products.data.map(p => ({
                id: p.id,
                name: p.name,
                buyPrice: p.buyPrice,
                sellPrice: p.sellPrice,
                quantity: p.quantity,
                unit: p.unit,
                minStock: p.minStock,
                category: p.category
            }));
        }
        
        return compressed;
    }
    
    // ================== استعادة نسخة احتياطية مع خيارات ==================
    function restoreWithOptions(file, options = {}) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const backupData = JSON.parse(e.target.result);
                    
                    // استعادة حسب الخيارات
                    if (options.restoreProducts && backupData.products) {
                        localStorage.setItem('products', JSON.stringify(backupData.products.data));
                    }
                    
                    if (options.restoreCustomers && backupData.customers) {
                        localStorage.setItem('customers', JSON.stringify(backupData.customers.data));
                    }
                    
                    if (options.restoreSuppliers && backupData.suppliers) {
                        localStorage.setItem('suppliers', JSON.stringify(backupData.suppliers.data));
                    }
                    
                    if (options.restoreSales && backupData.salesInvoices) {
                        localStorage.setItem('sales_invoices', JSON.stringify(backupData.salesInvoices.data));
                    }
                    
                    if (options.restorePurchases && backupData.purchaseInvoices) {
                        localStorage.setItem('purchase_invoices', JSON.stringify(backupData.purchaseInvoices.data));
                    }
                    
                    if (options.restoreDebts && backupData.debts) {
                        localStorage.setItem('debts', JSON.stringify(backupData.debts.data));
                        if (backupData.payments) {
                            localStorage.setItem('payments', JSON.stringify(backupData.payments.data));
                        }
                    }
                    
                    utilsModule.showNotification('نجاح', 'تم استعادة البيانات المحددة');
                    
                    resolve({ success: true });
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.readAsText(file);
        });
    }
    
    // ================== تهيئة الوحدة ==================
    function init() {
        console.log('✅ backupModule initialized - الرقم 27');
        
        // التحقق من وجود مجلد للنسخ الاحتياطي
        const settings = JSON.parse(localStorage.getItem('settings') || '{}');
        
        if (settings.autoBackup?.enabled) {
            const lastBackup = new Date(settings.autoBackup.lastBackup);
            const nextBackup = new Date(settings.autoBackup.nextBackup);
            const now = new Date();
            
            if (now >= nextBackup) {
                // تنفيذ نسخ احتياطي تلقائي
                console.log('🔄 تنفيذ نسخ احتياطي تلقائي...');
                exportBackup();
                
                // تحديث الموعد القادم
                settings.autoBackup.lastBackup = now.toISOString();
                settings.autoBackup.nextBackup = new Date(now.getTime() + settings.autoBackup.interval * 60 * 60 * 1000).toISOString();
                localStorage.setItem('settings', JSON.stringify(settings));
            }
        }
    }
    
    // ================== واجهة الوحدة ==================
    return {
        // عمليات أساسية
        exportBackup,
        importBackup,
        clearAllData,
        
        // عمليات متقدمة
        exportSpecificData,
        restoreWithOptions,
        
        // إحصائيات وسجلات
        getBackupStats,
        showBackupLogs,
        
        // جدولة
        scheduleAutoBackup,
        disableAutoBackup,
        
        // أدوات
        compareBackups,
        compressData,
        
        // تهيئة
        init
    };
})();

// ================== تصدير للاستخدام العام ==================
window.backupModule = backupModule;

// ================== دوال مختصرة للاستخدام في HTML ==================
window.exportBackup = () => backupModule.exportBackup();
window.importBackup = (input) => {
    if (input.files && input.files[0]) {
        backupModule.importBackup(input.files[0]);
    }
};
window.showBackupLogs = () => backupModule.showBackupLogs();
window.clearAllData = () => backupModule.clearAllData();

// ================== ربط مع عنصر input file ==================
document.addEventListener('click', function(e) {
    if (e.target.id === 'backup-file-input') {
        // تم النقر على زر استيراد
    }
});

// ================== تهيئة تلقائية ==================
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        if (backupModule && backupModule.init) {
            backupModule.init();
        }
    });
    
    document.addEventListener('html-loaded', function() {
        if (backupModule && backupModule.init) {
            backupModule.init();
        }
    });
}
