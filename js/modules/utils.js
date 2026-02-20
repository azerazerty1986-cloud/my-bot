// ================== utils.js - الدوال المساعدة ==================
// الرقم 17 في ترتيب الملفات - الأساس لكل الملفات الأخرى

const utilsModule = (function() {
    // ================== تنسيق العملة ==================
    function formatCurrency(amount) {
        if (amount === undefined || amount === null) return '0.00';
        return Number(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }
    
    // ================== تنسيق التاريخ ==================
    function formatDate(date = new Date()) {
        const d = new Date(date);
        return d.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    function formatDateOnly(date = new Date()) {
        const d = new Date(date);
        return d.toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }
    
    // ================== إنشاء رقم فاتورة فريد ==================
    function generateInvoiceNumber(prefix = 'INV') {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${prefix}-${year}${month}${day}-${hours}${minutes}${seconds}`;
    }
    
    // ================== إظهار إشعار ==================
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
    
    // ================== إظهار تأكيد ==================
    function showConfirmation(title, text, confirmCallback, cancelCallback = null) {
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
                } else if (cancelCallback) {
                    cancelCallback();
                }
            });
        } else {
            if (confirm(`${title}\n${text}`)) {
                if (confirmCallback) confirmCallback();
            } else {
                if (cancelCallback) cancelCallback();
            }
        }
    }
    
    // ================== حفظ في localStorage ==================
    function saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('خطأ في الحفظ:', e);
            return false;
        }
    }
    
    // ================== تحميل من localStorage ==================
    function loadFromStorage(key, defaultValue = []) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('خطأ في التحميل:', e);
            return defaultValue;
        }
    }
    
    // ================== مسح الباركود ==================
    function openBarcodeScanner(inputElementId, callback) {
        const modal = document.getElementById('barcodeScannerModal');
        if (modal) {
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
            
            // محاكاة مسح باركود بعد ثانيتين (للتجربة)
            setTimeout(() => {
                const mockBarcode = '123456789';
                document.getElementById('barcode-result').textContent = `تم المسح: ${mockBarcode}`;
                
                if (inputElementId) {
                    document.getElementById(inputElementId).value = mockBarcode;
                }
                
                if (callback) callback(mockBarcode);
            }, 2000);
        } else {
            showNotification('معلومة', 'ماسح الباركود غير متوفر', 'info');
        }
    }
    
    // ================== معاينة الصورة ==================
    function previewImage(input, previewId) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const preview = document.getElementById(previewId);
                if (preview) {
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                }
            };
            
            reader.readAsDataURL(input.files[0]);
        }
    }
    
    // ================== تصدير إلى CSV ==================
    function exportToCSV(data, filename, headers) {
        if (!data || data.length === 0) {
            showNotification('تنبيه', 'لا توجد بيانات للتصدير', 'warning');
            return false;
        }
        
        // تحويل البيانات إلى CSV
        const csvRows = [];
        
        // إضافة headers
        if (headers) {
            csvRows.push(headers.join(','));
        }
        
        // إضافة البيانات
        for (const row of data) {
            const values = Object.values(row).map(val => {
                if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
                return val;
            });
            csvRows.push(values.join(','));
        }
        
        const csvString = csvRows.join('\n');
        const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}_${new Date().toISOString().slice(0,10)}.csv`;
        link.click();
        
        showNotification('نجاح', 'تم التصدير بنجاح');
        return true;
    }
    
    // ================== استيراد من CSV ==================
    function importFromCSV(file, callback) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const text = e.target.result;
            const rows = text.split('\n').map(row => row.trim()).filter(row => row);
            
            // أول صف هو headers
            const headers = rows[0].split(',').map(h => h.replace(/"/g, '').trim());
            const data = [];
            
            for (let i = 1; i < rows.length; i++) {
                const values = rows[i].split(',').map(v => v.replace(/"/g, '').trim());
                const item = {};
                
                for (let j = 0; j < headers.length; j++) {
                    item[headers[j]] = values[j] || '';
                }
                
                data.push(item);
            }
            
            if (callback) callback(data);
            showNotification('نجاح', `تم استيراد ${data.length} سجل`);
        };
        
        reader.readAsText(file);
    }
    
    // ================== تحقق من صحة البريد الإلكتروني ==================
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // ================== تحقق من صحة رقم الهاتف ==================
    function validatePhone(phone) {
        const re = /^(05|06|07)[0-9]{8}$/;
        return re.test(phone);
    }
    
    // ================== حساب الضريبة ==================
    function calculateTax(amount, taxRate = 19) {
        return (amount * taxRate) / 100;
    }
    
    // ================== حساب الخصم ==================
    function calculateDiscount(amount, discountRate) {
        return (amount * discountRate) / 100;
    }
    
    // ================== حساب الربح ==================
    function calculateProfit(buyPrice, sellPrice, quantity = 1) {
        return (sellPrice - buyPrice) * quantity;
    }
    
    // ================== إنشاء معرف فريد ==================
    function generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }
    
    // ================== تقريب الرقم ==================
    function roundNumber(num, decimals = 2) {
        return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
    }
    
    // ================== إحصائيات سريعة ==================
    function calculateStats(numbers) {
        if (!numbers || numbers.length === 0) {
            return { min: 0, max: 0, avg: 0, sum: 0 };
        }
        
        const sum = numbers.reduce((a, b) => a + b, 0);
        const avg = sum / numbers.length;
        const min = Math.min(...numbers);
        const max = Math.max(...numbers);
        
        return { min, max, avg, sum };
    }
    
    // ================== تهيئة الوحدة ==================
    function init() {
        console.log('✅ utilsModule initialized - الرقم 17');
        console.log('   الدوال المساعدة جاهزة للاستخدام');
    }
    
    // ================== واجهة الوحدة ==================
    return {
        // تنسيق
        formatCurrency,
        formatDate,
        formatDateOnly,
        
        // إنشاء
        generateInvoiceNumber,
        generateId,
        
        // إشعارات
        showNotification,
        showConfirmation,
        
        // تخزين
        saveToStorage,
        loadFromStorage,
        
        // أدوات
        openBarcodeScanner,
        previewImage,
        exportToCSV,
        importFromCSV,
        
        // تحقق
        validateEmail,
        validatePhone,
        
        // حسابات
        calculateTax,
        calculateDiscount,
        calculateProfit,
        roundNumber,
        calculateStats,
        
        // تهيئة
        init
    };
})();

// ================== تصدير للاستخدام العام ==================
window.utilsModule = utilsModule;

// ================== تهيئة تلقائية ==================
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        if (utilsModule && utilsModule.init) {
            utilsModule.init();
        }
    });
}

// ================== دوال مختصرة للاستخدام السريع ==================
window.formatCurrency = (amount) => utilsModule.formatCurrency(amount);
window.showNotification = (title, msg, type) => utilsModule.showNotification(title, msg, type);
window.showConfirmation = (title, text, confirm) => utilsModule.showConfirmation(title, text, confirm);
