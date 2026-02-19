// ================== الدوال المساعدة العامة ==================
const utils = (function() {
    
    // ===== تنسيق العملة =====
    function formatCurrency(amount) {
        return Number(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    }
    
    // ===== تنسيق التاريخ =====
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
    
    // ===== إنشاء رقم فاتورة فريد =====
    function generateInvoiceNumber(prefix = 'INV') {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}-${year}${month}${day}-${random}`;
    }
    
    // ===== إظهار إشعار =====
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
    
    // ===== إظهار تأكيد =====
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
    
    // ===== حفظ في localStorage =====
    function saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('خطأ في الحفظ:', e);
            return false;
        }
    }
    
    // ===== تحميل من localStorage =====
    function loadFromStorage(key, defaultValue = []) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('خطأ في التحميل:', e);
            return defaultValue;
        }
    }
    
    // ===== معاينة الصورة =====
    function previewImage(event) {
        const reader = new FileReader();
        reader.onload = function() {
            const preview = document.getElementById('image-preview');
            const img = document.getElementById('preview-img');
            if (preview && img) {
                img.src = reader.result;
                preview.style.display = 'block';
            }
        };
        reader.readAsDataURL(event.target.files[0]);
    }
    
    // ===== فتح ماسح الباركود (مبدئي) =====
    function openBarcodeScanner() {
        showNotification('معلومة', 'ماسح الباركود قيد التفعيل', 'info');
    }
    
    // ===== تصدير الدوال =====
    return {
        formatCurrency,
        formatDate,
        generateInvoiceNumber,
        showNotification,
        showConfirmation,
        saveToStorage,
        loadFromStorage,
        previewImage,
        openBarcodeScanner
    };
})();

// تصدير للاستخدام العام
window.utils = utils;
