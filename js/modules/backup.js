// ================== backup.js - النسخ الاحتياطي واستعادة البيانات المتقدم ==================
// الرقم 29 في ترتيب الملفات - يعتمد على utils.js وجميع الوحدات

const backupModule = (function() {
    // ================== دوال مساعدة ==================
    function formatDate(date) {
        return new Date(date).toLocaleString('ar-EG', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    function showNotification(message, type = 'success') {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: type,
                title: type === 'success' ? 'نجاح' : (type === 'error' ? 'خطأ' : 'تنبيه'),
                text: message,
                timer: 2000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
        } else {
            alert(message);
        }
    }
    
    function showConfirmation(title, text, confirmCallback, cancelCallback = null) {
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
            } else if (cancelCallback) {
                cancelCallback();
            }
        });
    }
    
    // ================== جمع جميع البيانات من الوحدات المختلفة ==================
    function collectAllData() {
        const data = {
            version: '2.0.0',
            timestamp: new Date().toISOString(),
            appName: 'سوبر - النظام المتكامل',
            
            // المنتجات
            products: {
                data: window.productModule?.products || [],
                count: window.productModule?.products?.length || 0
            },
            
            // العملاء
            customers: {
                data: window.customerModule?.customers || [],
                count: window.customerModule?.customers?.length || 0
            },
            
            // الموردين
            suppliers: {
                data: window.supplierModule?.suppliers || [],
                count: window.supplierModule?.suppliers?.length || 0
            },
            
            // فواتير المبيعات
            salesInvoices: {
                data: window.salesModule?.invoices || [],
                count: window.salesModule?.invoices?.length || 0
            },
            
            // فواتير المشتريات
            purchaseInvoices: {
                data: window.purchasesModule?.invoices || [],
                count: window.purchasesModule?.invoices?.length || 0
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
            
            // التصنيفات
            categories: {
                data: window.productModule?.categories || [],
                count: window.productModule?.categories?.length || 0
            },
            
            // الماركات
            brands: {
                data: window.productModule?.brands || [],
                count: window.productModule?.brands?.length || 0
            },
            
            // الإعدادات
            settings: JSON.parse(localStorage.getItem('settings') || '{}'),
            
            // إحصائيات عامة
            stats: {
                products: window.productModule?.products?.length || 0,
                customers: window.customerModule?.customers?.length || 0,
                suppliers: window.supplierModule?.suppliers?.length || 0,
                salesInvoices: window.salesModule?.invoices?.length || 0,
                purchaseInvoices: window.purchasesModule?.invoices?.length || 0,
                debts: window.debtModule?.debts?.length || 0,
                payments: window.debtModule?.payments?.length || 0
            }
        };
        
        return data;
    }
    
    // ================== تصدير نسخة احتياطية كاملة ==================
    function exportBackup() {
        try {
            const backupData = collectAllData();
            
            // إضافة ملخص
            backupData.summary = {
                totalRecords: 
                    backupData.stats.products +
                    backupData.stats.customers +
                    backupData.stats.suppliers +
                    backupData.stats.salesInvoices +
                    backupData.stats.purchaseInvoices +
                    backupData.stats.debts +
                    backupData.stats.payments,
                date: formatDate(new Date()),
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
            
            showNotification(`✅ تم تصدير النسخة الاحتياطية (${backupData.summary.totalRecords} سجل)`);
            logBackupOperation('export', 'success', backupData.summary.totalRecords);
            
            return true;
        } catch (error) {
            console.error('خطأ في التصدير:', error);
            showNotification('❌ فشل في تصدير النسخة الاحتياطية', 'error');
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
                    
                    // عرض معلومات الملف قبل الاستيراد
                    const fileInfo = `
                        <div style="text-align:right; padding:10px;">
                            <p><strong>الإصدار:</strong> ${backupData.version}</p>
                            <p><strong>التاريخ:</strong> ${formatDate(backupData.timestamp)}</p>
                            <p><strong>المنتجات:</strong> ${backupData.stats?.products || 0}</p>
                            <p><strong>العملاء:</strong> ${backupData.stats?.customers || 0}</p>
                            <p><strong>الموردين:</strong> ${backupData.stats?.suppliers || 0}</p>
                            <p><strong>فواتير المبيعات:</strong> ${backupData.stats?.salesInvoices || 0}</p>
                            <p><strong>فواتير المشتريات:</strong> ${backupData.stats?.purchaseInvoices || 0}</p>
                            <p><strong>الديون:</strong> ${backupData.stats?.debts || 0}</p>
                            <p><strong>إجمالي السجلات:</strong> ${backupData.summary?.totalRecords || 0}</p>
                        </div>
                    `;
                    
                    Swal.fire({
                        title: 'تأكيد الاستيراد',
                        html: fileInfo,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#d33',
                        cancelButtonColor: '#3085d6',
                        confirmButtonText: 'نعم، استيراد',
                        cancelButtonText: 'إلغاء'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            performImport(backupData, resolve, reject);
                        } else {
                            reject(new Error('تم إلغاء الاستيراد'));
                        }
                    });
                    
                } catch (error) {
                    console.error('خطأ في قراءة الملف:', error);
                    showNotification('الملف غير صالح', 'error');
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
            if (backupData.products?.data) {
                localStorage.setItem('products', JSON.stringify(backupData.products.data));
                importedCount += backupData.products.count;
            }
            
            // استيراد العملاء
            if (backupData.customers?.data) {
                localStorage.setItem('customers', JSON.stringify(backupData.customers.data));
                importedCount += backupData.customers.count;
            }
            
            // استيراد الموردين
            if (backupData.suppliers?.data) {
                localStorage.setItem('suppliers', JSON.stringify(backupData.suppliers.data));
                importedCount += backupData.suppliers.count;
            }
            
            // استيراد فواتير المبيعات
            if (backupData.salesInvoices?.data) {
                localStorage.setItem('sales_invoices', JSON.stringify(backupData.salesInvoices.data));
                importedCount += backupData.salesInvoices.count;
            }
            
            // استيراد فواتير المشتريات
            if (backupData.purchaseInvoices?.data) {
                localStorage.setItem('purchase_invoices', JSON.stringify(backupData.purchaseInvoices.data));
                importedCount += backupData.purchaseInvoices.count;
            }
            
            // استيراد الديون
            if (backupData.debts?.data) {
                localStorage.setItem('debts', JSON.stringify(backupData.debts.data));
                importedCount += backupData.debts.count;
            }
            
            // استيراد الدفعات
            if (backupData.payments?.data) {
                localStorage.setItem('payments', JSON.stringify(backupData.payments.data));
                importedCount += backupData.payments.count;
            }
            
            // استيراد سجلات المخزون
            if (backupData.inventoryLogs?.data) {
                localStorage.setItem('inventory_logs', JSON.stringify(backupData.inventoryLogs.data));
                importedCount += backupData.inventoryLogs.count;
            }
            
            // استيراد التصنيفات
            if (backupData.categories?.data) {
                localStorage.setItem('categories', JSON.stringify(backupData.categories.data));
            }
            
            // استيراد الماركات
            if (backupData.brands?.data) {
                localStorage.setItem('brands', JSON.stringify(backupData.brands.data));
            }
            
            // استيراد الإعدادات
            if (backupData.settings) {
                localStorage.setItem('settings', JSON.stringify(backupData.settings));
            }
            
            showNotification(`✅ تم استيراد ${importedCount} سجل بنجاح`);
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
            showNotification('❌ فشل في استيراد البيانات', 'error');
            logBackupOperation('import', 'error', 0, error.message);
            reject(error);
        }
    }
    
    // ================== تسجيل عمليات النسخ الاحتياطي ==================
    function logBackupOperation(operation, status, count = 0, error = null) {
        const logs = JSON.parse(localStorage.getItem('backup_logs') || '[]');
        
        logs.push({
            id: Date.now() + Math.random().toString(36).substr(2, 5),
            operation: operation, // 'export', 'import', 'clear'
            status: status, // 'success', 'error'
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
    
    // ================== الحصول على سجل العمليات ==================
    function getBackupLogs() {
        return JSON.parse(localStorage.getItem('backup_logs') || '[]');
    }
    
    // ================== عرض سجل العمليات ==================
    function showBackupLogs() {
        const logs = getBackupLogs();
        
        if (logs.length === 0) {
            showNotification('لا توجد سجلات سابقة', 'info');
            return;
        }
        
        let logsHtml = '';
        logs.slice().reverse().forEach(log => {
            const statusClass = log.status === 'success' ? 'badge-success' : 'badge-danger';
            const statusText = log.status === 'success' ? 'نجاح' : 'فشل';
            const operationText = log.operation === 'export' ? 'تصدير' : 
                                  log.operation === 'import' ? 'استيراد' : 'مسح';
            
            logsHtml += `
                <tr>
                    <td>${formatDate(log.timestamp)}</td>
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
                    <table class="table-custom" style="width:100%; font-size:12px;">
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
    
    // ================== مسح جميع البيانات ==================
    function clearAllData() {
        showConfirmation(
            '⚠️ تحذير شديد',
            'هل أنت متأكد من مسح جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء!',
            () => {
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
            'brands',
            'settings',
            'backup_logs'
        ];
        
        // مسح كل مفتاح
        keys.forEach(key => localStorage.removeItem(key));
        
        showNotification('✅ تم مسح جميع البيانات بنجاح');
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
            data.products = window.productModule.products;
        }
        
        if (types.includes('customers') && window.customerModule) {
            data.customers = window.customerModule.customers;
        }
        
        if (types.includes('suppliers') && window.supplierModule) {
            data.suppliers = window.supplierModule.suppliers;
        }
        
        if (types.includes('sales') && window.salesModule) {
            data.salesInvoices = window.salesModule.invoices;
        }
        
        if (types.includes('purchases') && window.purchasesModule) {
            data.purchaseInvoices = window.purchasesModule.invoices;
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
        
        showNotification('✅ تم تصدير البيانات المحددة');
    }
    
    // ================== إحصائيات النسخ الاحتياطي ==================
    function getBackupStats() {
        const logs = getBackupLogs();
        
        const lastExport = logs.filter(l => l.operation === 'export' && l.status === 'success').pop();
        const lastImport = logs.filter(l => l.operation === 'import' && l.status === 'success').pop();
        
        return {
            totalExports: logs.filter(l => l.operation === 'export' && l.status === 'success').length,
            totalImports: logs.filter(l => l.operation === 'import' && l.status === 'success').length,
            lastExport: lastExport ? formatDate(lastExport.timestamp) : 'لا يوجد',
            lastImport: lastImport ? formatDate(lastImport.timestamp) : 'لا يوجد',
            recentLogs: logs.slice(-10).reverse()
        };
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
        
        showNotification(`✅ تم جدولة نسخ احتياطي كل ${intervalHours} ساعة`);
    }
    
    // ================== إيقاف النسخ الاحتياطي التلقائي ==================
    function disableAutoBackup() {
        const settings = JSON.parse(localStorage.getItem('settings') || '{}');
        settings.autoBackup = {
            enabled: false
        };
        
        localStorage.setItem('settings', JSON.stringify(settings));
        
        showNotification('⏹️ تم إيقاف النسخ الاحتياطي التلقائي', 'info');
    }
    
    // ================== مقارنة نسختين ==================
    function compareBackups(backup1, backup2) {
        const diff = {
            products: Math.abs((backup1.products?.count || 0) - (backup2.products?.count || 0)),
            customers: Math.abs((backup1.customers?.count || 0) - (backup2.customers?.count || 0)),
            suppliers: Math.abs((backup1.suppliers?.count || 0) - (backup2.suppliers?.count || 0)),
            sales: Math.abs((backup1.salesInvoices?.count || 0) - (backup2.salesInvoices?.count || 0)),
            purchases: Math.abs((backup1.purchaseInvoices?.count || 0) - (backup2.purchaseInvoices?.count || 0)),
            debts: Math.abs((backup1.debts?.count || 0) - (backup2.debts?.count || 0))
        };
        
        const totalDiff = Object.values(diff).reduce((a, b) => a + b, 0);
        
        return {
            differences: diff,
            totalDiff,
            firstDate: formatDate(backup1.timestamp),
            secondDate: formatDate(backup2.timestamp),
            hasChanges: totalDiff > 0
        };
    }
    
    // ================== تهيئة الوحدة ==================
    function init() {
        console.log('✅ backupModule initialized - الرقم 29');
        
        // التحقق من وجود نسخ احتياطي تلقائي
        const settings = JSON.parse(localStorage.getItem('settings') || '{}');
        
        if (settings.autoBackup?.enabled) {
            const lastBackup = new Date(settings.autoBackup.lastBackup);
            const nextBackup = new Date(settings.autoBackup.nextBackup);
            const now = new Date();
            
            if (now >= nextBackup) {
                console.log('🔄 تنفيذ نسخ احتياطي تلقائي...');
                exportBackup();
                
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
        
        // سجلات وإحصائيات
        getBackupLogs,
        showBackupLogs,
        getBackupStats,
        
        // جدولة
        scheduleAutoBackup,
        disableAutoBackup,
        
        // أدوات
        compareBackups,
        
        // تهيئة
        init
    };
})();

window.backupModule = backupModule;

// ================== دوال مختصرة للاستخدام في HTML ==================
window.exportBackup = () => backupModule.exportBackup();
window.showBackupLogs = () => backupModule.showBackupLogs();
window.clearAllData = () => backupModule.clearAllData();

// ================== ربط مع عنصر input file ==================
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('backup-file-input');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0 && window.backupModule) {
                backupModule.importBackup(e.target.files[0]);
            }
            this.value = ''; // إعادة تعيين الحقل
        });
    }
});

// ================== تهيئة تلقائية ==================
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => backupModule.init());
    document.addEventListener('html-loaded', () => backupModule.init());
}
