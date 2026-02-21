// ================== backup.js - النسخ الاحتياطي واستعادة البيانات ==================
// الرقم 29 في ترتيب الملفات - يعتمد على utils.js وجميع الوحدات

const backupModule = (function() {
    // ================== دوال مساعدة ==================
    function showNotification(message, type = 'success') {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: type,
                title: type === 'success' ? 'نجاح' : 'خطأ',
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
    
    // ================== جمع جميع البيانات ==================
    function collectAllData() {
        const data = {
            version: '2.0.0',
            timestamp: new Date().toISOString(),
            appName: 'سوبر - النظام المتكامل',
            
            products: {
                data: window.productModule?.products || [],
                count: window.productModule?.products?.length || 0
            },
            
            customers: {
                data: window.customerModule?.customers || [],
                count: window.customerModule?.customers?.length || 0
            },
            
            suppliers: {
                data: window.supplierModule?.suppliers || [],
                count: window.supplierModule?.suppliers?.length || 0
            },
            
            salesInvoices: {
                data: window.salesModule?.invoices || [],
                count: window.salesModule?.invoices?.length || 0
            },
            
            purchaseInvoices: {
                data: window.purchasesModule?.invoices || [],
                count: window.purchasesModule?.invoices?.length || 0
            },
            
            debts: {
                data: window.debtModule?.debts || [],
                count: window.debtModule?.debts?.length || 0
            },
            
            payments: {
                data: window.debtModule?.payments || [],
                count: window.debtModule?.payments?.length || 0
            },
            
            inventoryLogs: {
                data: window.inventoryModule?.inventoryLogs || [],
                count: window.inventoryModule?.inventoryLogs?.length || 0
            },
            
            settings: JSON.parse(localStorage.getItem('settings') || '{}'),
            
            stats: {
                products: window.productModule?.products?.length || 0,
                customers: window.customerModule?.customers?.length || 0,
                suppliers: window.supplierModule?.suppliers?.length || 0,
                salesInvoices: window.salesModule?.invoices?.length || 0,
                purchaseInvoices: window.purchasesModule?.invoices?.length || 0,
                debts: window.debtModule?.debts?.length || 0
            }
        };
        
        return data;
    }
    
    // ================== تصدير نسخة احتياطية ==================
    function exportBackup() {
        try {
            const backupData = collectAllData();
            
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
            
            const backupJSON = JSON.stringify(backupData, null, 2);
            const blob = new Blob([backupJSON], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            
            showNotification('تم تصدير النسخة الاحتياطية بنجاح');
            logBackupOperation('export', 'success', backupData.summary.totalRecords);
            
            return true;
        } catch (error) {
            console.error('خطأ في التصدير:', error);
            showNotification('فشل في تصدير النسخة الاحتياطية', 'error');
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
                    
                    if (!backupData.version || !backupData.timestamp) {
                        throw new Error('الملف غير صالح');
                    }
                    
                    showConfirmation(
                        'تأكيد الاستيراد',
                        `سيتم استبدال جميع البيانات الحالية بنسخة من ${new Date(backupData.timestamp).toLocaleDateString('ar-EG')}. هل أنت متأكد؟`,
                        () => {
                            performImport(backupData, resolve, reject);
                        }
                    );
                    
                } catch (error) {
                    showNotification('الملف غير صالح', 'error');
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
            
            if (backupData.products?.data) {
                localStorage.setItem('products', JSON.stringify(backupData.products.data));
                importedCount += backupData.products.count;
            }
            
            if (backupData.customers?.data) {
                localStorage.setItem('customers', JSON.stringify(backupData.customers.data));
                importedCount += backupData.customers.count;
            }
            
            if (backupData.suppliers?.data) {
                localStorage.setItem('suppliers', JSON.stringify(backupData.suppliers.data));
                importedCount += backupData.suppliers.count;
            }
            
            if (backupData.salesInvoices?.data) {
                localStorage.setItem('sales_invoices', JSON.stringify(backupData.salesInvoices.data));
                importedCount += backupData.salesInvoices.count;
            }
            
            if (backupData.purchaseInvoices?.data) {
                localStorage.setItem('purchase_invoices', JSON.stringify(backupData.purchaseInvoices.data));
                importedCount += backupData.purchaseInvoices.count;
            }
            
            if (backupData.debts?.data) {
                localStorage.setItem('debts', JSON.stringify(backupData.debts.data));
                importedCount += backupData.debts.count;
            }
            
            if (backupData.payments?.data) {
                localStorage.setItem('payments', JSON.stringify(backupData.payments.data));
                importedCount += backupData.payments.count;
            }
            
            if (backupData.inventoryLogs?.data) {
                localStorage.setItem('inventory_logs', JSON.stringify(backupData.inventoryLogs.data));
                importedCount += backupData.inventoryLogs.count;
            }
            
            if (backupData.settings) {
                localStorage.setItem('settings', JSON.stringify(backupData.settings));
            }
            
            showNotification(`تم استيراد ${importedCount} سجل بنجاح`);
            logBackupOperation('import', 'success', importedCount);
            
            setTimeout(() => {
                location.reload();
            }, 2000);
            
            resolve({ success: true, count: importedCount });
            
        } catch (error) {
            showNotification('فشل في استيراد البيانات', 'error');
            logBackupOperation('import', 'error', 0, error.message);
            reject(error);
        }
    }
    
    // ================== تسجيل العمليات ==================
    function logBackupOperation(operation, status, count = 0, error = null) {
        const logs = JSON.parse(localStorage.getItem('backup_logs') || '[]');
        
        logs.push({
            id: Date.now() + Math.random(),
            operation: operation,
            status: status,
            count: count,
            error: error,
            timestamp: new Date().toISOString(),
            user: 'admin'
        });
        
        if (logs.length > 50) logs.shift();
        localStorage.setItem('backup_logs', JSON.stringify(logs));
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
    
    function performClearAll() {
        const keys = [
            'products', 'customers', 'suppliers',
            'sales_invoices', 'purchase_invoices',
            'debts', 'payments', 'inventory_logs',
            'inventory', 'categories', 'settings',
            'backup_logs'
        ];
        
        keys.forEach(key => localStorage.removeItem(key));
        
        showNotification('تم مسح جميع البيانات بنجاح');
        logBackupOperation('clear', 'success', 0);
        
        setTimeout(() => {
            location.reload();
        }, 2000);
    }
    
    // ================== الحصول على سجل العمليات ==================
    function getBackupLogs() {
        return JSON.parse(localStorage.getItem('backup_logs') || '[]');
    }
    
    // ================== تهيئة الوحدة ==================
    function init() {
        console.log('✅ backupModule initialized - الرقم 29');
    }
    
    return {
        exportBackup,
        importBackup,
        clearAllData,
        getBackupLogs,
        init
    };
})();

window.backupModule = backupModule;

// تهيئة تلقائية
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => backupModule.init());
    document.addEventListener('html-loaded', () => backupModule.init());
}
