// ================== نظام النسخ الاحتياطي المتكامل - نسخة محسنة ==================
const backupModule = (function() {
    
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
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'نعم',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed && confirmCallback) {
                confirmCallback();
            }
        });
    }

    // ================== جمع جميع البيانات ==================
    function _collectAllData() {
        return {
            // بيانات المخزون
            stock: JSON.parse(localStorage.getItem('ryan_stock')) || [],
            
            // بيانات المبيعات
            invoices: JSON.parse(localStorage.getItem('ryan_invoices')) || [],
            cart: JSON.parse(localStorage.getItem('ryan_cart')) || [],
            
            // بيانات المشتريات
            purchases: JSON.parse(localStorage.getItem('ryan_purchases')) || [],
            purchaseCart: JSON.parse(localStorage.getItem('ryan_purchase_cart')) || [],
            
            // بيانات العملاء والموردين
            customers: JSON.parse(localStorage.getItem('ryan_customers')) || [],
            suppliers: JSON.parse(localStorage.getItem('ryan_suppliers')) || [],
            
            // بيانات الحركات
            movements: JSON.parse(localStorage.getItem('ryan_movements')) || [],
            
            // بيانات الديون
            payments: JSON.parse(localStorage.getItem('payment_history')) || [],
            
            // بيانات التعلم الآلي
            aiLearning: JSON.parse(localStorage.getItem('ai_learning_data')) || [],
            aiPredictions: JSON.parse(localStorage.getItem('ai_predictions')) || [],
            aiPatterns: JSON.parse(localStorage.getItem('ai_patterns')) || [],
            
            // معلومات النسخة
            exportDate: new Date().toISOString(),
            version: '1.0.0',
            appName: 'تطبيق سوبر'
        };
    }

    // ================== تصدير نسخة احتياطية كاملة ==================
    function exportFullBackup() {
        const backupData = _collectAllData();
        
        // تحويل البيانات إلى نص JSON منسق
        const dataStr = JSON.stringify(backupData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // إنشاء رابط التحميل
        const a = document.createElement('a');
        a.href = url;
        
        // تسمية الملف بالتاريخ
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}`;
        const timeStr = `${now.getHours().toString().padStart(2,'0')}-${now.getMinutes().toString().padStart(2,'0')}`;
        a.download = `سوبر_نسخة_احتياطية_${dateStr}_${timeStr}.json`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // إظهار إشعار النجاح
        _showNotification('نجاح', 'تم تصدير النسخة الاحتياطية بنجاح', 'success');
        
        // تسجيل عملية التصدير
        console.log('تم تصدير نسخة احتياطية في:', new Date().toLocaleString('ar-DZ'));
    }

    // ================== تصدير نسخة احتياطية (للتوافق مع الكود القديم) ==================
    function exportBackup() {
        exportFullBackup();
    }

    // ================== استيراد نسخة احتياطية ==================
    function importBackup(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // التحقق من حجم الملف (حد أقصى 10 ميجابايت)
        if (file.size > 10 * 1024 * 1024) {
            _showNotification('خطأ', 'حجم الملف كبير جداً (الحد الأقصى 10 ميجابايت)', 'error');
            document.getElementById('backup-file-input').value = '';
            return;
        }
        
        // تأكيد الاستيراد
        _showConfirmation('تأكيد استيراد النسخة', 'هل أنت متأكد من استيراد هذه النسخة؟ سيتم استبدال جميع البيانات الحالية.', () => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const backupData = JSON.parse(e.target.result);
                    
                    // التحقق من صحة البيانات
                    if (!backupData || typeof backupData !== 'object') {
                        throw new Error('ملف غير صالح');
                    }
                    
                    // استيراد البيانات مع التحقق من وجودها
                    if (backupData.stock) localStorage.setItem('ryan_stock', JSON.stringify(backupData.stock));
                    if (backupData.invoices) localStorage.setItem('ryan_invoices', JSON.stringify(backupData.invoices));
                    if (backupData.purchases) localStorage.setItem('ryan_purchases', JSON.stringify(backupData.purchases));
                    if (backupData.customers) localStorage.setItem('ryan_customers', JSON.stringify(backupData.customers));
                    if (backupData.suppliers) localStorage.setItem('ryan_suppliers', JSON.stringify(backupData.suppliers));
                    if (backupData.movements) localStorage.setItem('ryan_movements', JSON.stringify(backupData.movements));
                    if (backupData.payments) localStorage.setItem('payment_history', JSON.stringify(backupData.payments));
                    
                    // بيانات إضافية
                    if (backupData.cart) localStorage.setItem('ryan_cart', JSON.stringify(backupData.cart));
                    if (backupData.purchaseCart) localStorage.setItem('ryan_purchase_cart', JSON.stringify(backupData.purchaseCart));
                    if (backupData.aiLearning) localStorage.setItem('ai_learning_data', JSON.stringify(backupData.aiLearning));
                    if (backupData.aiPredictions) localStorage.setItem('ai_predictions', JSON.stringify(backupData.aiPredictions));
                    if (backupData.aiPatterns) localStorage.setItem('ai_patterns', JSON.stringify(backupData.aiPatterns));
                    
                    // إظهار رسالة نجاح
                    Swal.fire({
                        icon: 'success',
                        title: 'تم الاستيراد بنجاح',
                        text: 'سيتم إعادة تحميل الصفحة لتطبيق التغييرات',
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => {
                        // إعادة تحميل الصفحة
                        location.reload();
                    });
                    
                } catch (error) {
                    console.error('خطأ في استيراد الملف:', error);
                    _showNotification('خطأ', 'الملف غير صالح أو تالف', 'error');
                }
                
                // إعادة تعيين حقل الملف
                document.getElementById('backup-file-input').value = '';
            };
            
            reader.readAsText(file);
        });
    }

    // ================== تصدير بيانات محددة ==================
    function exportSpecific(dataTypes) {
        const allData = _collectAllData();
        const selectedData = {};
        
        dataTypes.forEach(type => {
            if (allData[type]) {
                selectedData[type] = allData[type];
            }
        });
        
        selectedData.exportDate = new Date().toISOString();
        selectedData.version = '1.0.0';
        
        const dataStr = JSON.stringify(selectedData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `سوبر_بيانات_محددة_${new Date().toLocaleDateString('ar-DZ').replace(/\//g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        _showNotification('نجاح', 'تم تصدير البيانات المحددة', 'success');
    }

    // ================== تصدير بيانات العملاء فقط ==================
    function exportCustomers() {
        exportSpecific(['customers', 'payments']);
    }

    // ================== تصدير بيانات المنتجات فقط ==================
    function exportProducts() {
        exportSpecific(['stock', 'movements']);
    }

    // ================== تصدير بيانات المبيعات فقط ==================
    function exportSales() {
        exportSpecific(['invoices', 'cart']);
    }

    // ================== تصدير بيانات المشتريات فقط ==================
    function exportPurchases() {
        exportSpecific(['purchases', 'purchaseCart']);
    }

    // ================== مسح جميع البيانات ==================
    function clearAllData() {
        _showConfirmation('تأكيد مسح البيانات', 'هل أنت متأكد من مسح جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه.', () => {
            localStorage.clear();
            _showNotification('تم', 'تم مسح جميع البيانات', 'success');
            setTimeout(() => location.reload(), 1500);
        });
    }

    // ================== الحصول على حجم التخزين المستخدم ==================
    function getStorageSize() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length * 2; // تقريباً
            }
        }
        return (total / 1024).toFixed(2); // كيلوبايت
    }

    // ================== عرض معلومات النسخ الاحتياطي ==================
    function showBackupInfo() {
        const size = getStorageSize();
        const items = localStorage.length;
        
        Swal.fire({
            title: 'معلومات النسخ الاحتياطي',
            html: `
                <div style="text-align:right">
                    <p>عدد العناصر المخزنة: <strong>${items}</strong></p>
                    <p>حجم التخزين المستخدم: <strong>${size} كيلوبايت</strong></p>
                    <p>آخر تصدير: <strong>${localStorage.getItem('last_backup') || 'لم يتم بعد'}</strong></p>
                </div>
            `,
            icon: 'info',
            confirmButtonText: 'حسناً'
        });
    }

    // ================== تصدير الوحدة ==================
    return {
        exportBackup,
        exportFullBackup,
        importBackup,
        exportCustomers,
        exportProducts,
        exportSales,
        exportPurchases,
        clearAllData,
        showBackupInfo
    };
})();

// ================== تصدير للاستخدام العام ==================
window.backupModule = backupModule;

// تهيئة تلقائية
document.addEventListener('DOMContentLoaded', function() {
    // تسجيل آخر ظهور
    console.log('📦 نظام النسخ الاحتياطي جاهز');
    
    // حفظ تاريخ آخر ظهور
    localStorage.setItem('last_backup_check', new Date().toISOString());
});
