// ================== utils.js - الدوال المساعدة النهائية ==================
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
    
    // ================== إنشاء معرف فريد ==================
    function generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
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
    
    // ================== حذف من localStorage ==================
    function removeFromStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('خطأ في الحذف:', e);
            return false;
        }
    }
    
    // ================== مسح الكل ==================
    function clearStorage() {
        try {
            localStorage.clear();
            return true;
        } catch (e) {
            console.error('خطأ في المسح:', e);
            return false;
        }
    }
    
    // ================== التحقق من البريد الإلكتروني ==================
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // ================== التحقق من رقم الهاتف ==================
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
    
    // ================== تقريب الرقم ==================
    function roundNumber(num, decimals = 2) {
        return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
    }
    
    // ================== نسخ نص إلى الحافظة ==================
    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                showNotification('تم', 'تم النسخ إلى الحافظة', 'success');
            }).catch(() => {
                fallbackCopy(text);
            });
        } else {
            fallbackCopy(text);
        }
    }
    
    function fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showNotification('تم', 'تم النسخ إلى الحافظة', 'success');
        } catch (err) {
            showNotification('خطأ', 'فشل النسخ', 'error');
        }
        document.body.removeChild(textarea);
    }
    
    // ================== انتظار عنصر ==================
    function waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const checkExist = setInterval(() => {
                const element = document.querySelector(selector);
                if (element) {
                    clearInterval(checkExist);
                    resolve(element);
                } else if (Date.now() - startTime > timeout) {
                    clearInterval(checkExist);
                    reject(new Error(`العنصر ${selector} غير موجود بعد ${timeout}ms`));
                }
            }, 100);
        });
    }
    
    // ================== تحميل ملف ==================
    function downloadFile(content, filename, type = 'text/plain') {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    // ================== تصدير إلى CSV ==================
    function exportToCSV(data, filename, headers) {
        if (!data || data.length === 0) {
            showNotification('تنبيه', 'لا توجد بيانات للتصدير', 'warning');
            return false;
        }
        
        const csvRows = [];
        
        if (headers) {
            csvRows.push(headers.join(','));
        }
        
        for (const row of data) {
            const values = Object.values(row).map(val => {
                if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
                return val;
            });
            csvRows.push(values.join(','));
        }
        
        const csvString = csvRows.join('\n');
        downloadFile('\uFEFF' + csvString, `${filename}_${new Date().toISOString().slice(0,10)}.csv`, 'text/csv;charset=utf-8;');
        
        showNotification('نجاح', 'تم التصدير بنجاح');
        return true;
    }
    
    // ================== الحصول على معلمات URL ==================
    function getUrlParams() {
        const params = {};
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        
        for (const [key, value] of urlParams.entries()) {
            params[key] = value;
        }
        
        return params;
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
        removeFromStorage,
        clearStorage,
        
        // تحقق
        validateEmail,
        validatePhone,
        
        // حسابات
        calculateTax,
        calculateDiscount,
        roundNumber,
        
        // أدوات
        copyToClipboard,
        waitForElement,
        downloadFile,
        exportToCSV,
        getUrlParams,
        
        // تهيئة
        init
    };
})();

// ================== تصدير للاستخدام العام ==================
window.utilsModule = utilsModule;

// ================== دوال مختصرة للاستخدام السريع ==================
window.formatCurrency = (amount) => utilsModule.formatCurrency(amount);
window.formatDate = (date) => utilsModule.formatDate(date);
window.showNotification = (title, msg, type) => utilsModule.showNotification(title, msg, type);
window.showConfirmation = (title, text, confirm) => utilsModule.showConfirmation(title, text, confirm);
window.copyToClipboard = (text) => utilsModule.copyToClipboard(text);

// ================== تهيئة تلقائية ==================
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        if (utilsModule && utilsModule.init) {
            utilsModule.init();
        }
    });
    
    // إعادة المحاولة بعد تحميل HTML
    document.addEventListener('html-loaded', function() {
        if (utilsModule && utilsModule.init) {
            utilsModule.init();
        }
    });
}
