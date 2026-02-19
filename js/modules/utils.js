// ================== الأدوات المساعدة المتقدمة - نسخة كاملة جداً ==================
const utils = (function() {
    // ================== المتغيرات الخاصة ==================
    let quaggaRunning = false;
    let selectedImageBase64 = '';

    // ================== توليد معرف فريد ==================
    function generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // ================== تنسيق العملة ==================
    function formatCurrency(amount) {
        return `${Number(amount).toFixed(2)} دج`;
    }

    // ================== تنسيق التاريخ ==================
    function formatDate(date = new Date()) {
        return date.toLocaleString('ar-DZ');
    }

    // ================== التحقق من البريد الإلكتروني ==================
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // ================== التحقق من رقم الهاتف ==================
    function isValidPhone(phone) {
        const re = /^(05|06|07)[0-9]{8}$/;
        return re.test(phone);
    }

    // ================== التحقق من الرقم ==================
    function isNumber(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    }

    // ================== التحقق من الحقل المطلوب ==================
    function isRequired(value) {
        return value !== null && value !== undefined && value.toString().trim() !== '';
    }

    // ================== وظائف التنقل الرئيسية ==================
    function switchSection(sectionId, element) {
        console.log('🔄 الانتقال إلى:', sectionId);
        
        // إخفاء جميع الأقسام
        document.querySelectorAll('.section').forEach(s => {
            s.classList.remove('active-section');
        });
        
        // إظهار القسم المطلوب
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active-section');
            console.log('✅ تم إظهار قسم:', sectionId);
        } else {
            console.log('❌ القسم غير موجود:', sectionId);
        }
        
        // تحديث الشريط السفلي
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        if (element) element.classList.add('active');
        
        // تحديث المحتوى حسب القسم
        if (sectionId === 'inventory' && typeof window.inventoryModule !== 'undefined') {
            if (window.inventoryModule.renderStock) window.inventoryModule.renderStock();
        }
        if (sectionId === 'reports' && typeof window.reportsModule !== 'undefined') {
            if (window.reportsModule.renderReports) window.reportsModule.renderReports();
        }
        if (sectionId === 'customers' && typeof window.customerModule !== 'undefined') {
            if (window.customerModule.renderCustomers) window.customerModule.renderCustomers();
        }
        if (sectionId === 'suppliers' && typeof window.supplierModule !== 'undefined') {
            if (window.supplierModule.renderSuppliers) window.supplierModule.renderSuppliers();
        }
    }

    // ================== إظهار القسم الفرعي ==================
    function showSubSection(subId) {
        console.log('📂 إظهار القسم الفرعي:', subId);
        
        const parent = document.querySelector('.active-section');
        if (!parent) {
            console.log('❌ لا يوجد قسم رئيسي نشط');
            return;
        }
        
        // إخفاء جميع الأقسام الفرعية
        parent.querySelectorAll('.sub-section').forEach(s => {
            s.style.display = 'none';
        });
        
        // إظهار القسم الفرعي المطلوب
        const target = document.getElementById(subId);
        if (target) {
            target.style.display = 'block';
            console.log('✅ تم إظهار القسم الفرعي:', subId);
        }
        
        // تحديث التبويبات
        const tabs = parent.querySelectorAll('.tab-item');
        tabs.forEach(t => t.classList.remove('active-red', 'active-green', 'active-nardo'));
        
        tabs.forEach(t => {
            if (t.getAttribute('onclick') && t.getAttribute('onclick').includes(subId)) {
                if (parent.id === 'sales') t.classList.add('active-red');
                else if (parent.id === 'purchases') t.classList.add('active-green');
                else if (parent.id === 'add') t.classList.add('active-nardo');
            }
        });
        
        // تحديث البيانات حسب القسم الفرعي
        if (subId === 'sale-invoices' && typeof window.salesModule !== 'undefined') {
            if (window.salesModule.renderSaleInvoices) window.salesModule.renderSaleInvoices();
        }
        if (subId === 'purchase-invoices' && typeof window.purchasesModule !== 'undefined') {
            if (window.purchasesModule.renderPurchaseInvoices) window.purchasesModule.renderPurchaseInvoices();
        }
        if (subId === 'customers' && typeof window.customerModule !== 'undefined') {
            if (window.customerModule.renderCustomers) window.customerModule.renderCustomers();
        }
        if (subId === 'suppliers' && typeof window.supplierModule !== 'undefined') {
            if (window.supplierModule.renderSuppliers) window.supplierModule.renderSuppliers();
        }
    }

    // ================== دوال الصور والباركود ==================
    function previewImage(event) {
        const file = event.target.files[0];
        const preview = document.getElementById('image-preview');
        const img = document.getElementById('preview-img');
        
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                img.src = e.target.result;
                preview.style.display = 'block';
                selectedImageBase64 = e.target.result;
            };
            reader.readAsDataURL(file);
        } else {
            preview.style.display = 'none';
            img.src = '#';
            selectedImageBase64 = '';
        }
    }

    function openBarcodeScanner() {
        const modal = new bootstrap.Modal(document.getElementById('barcodeScannerModal'));
        modal.show();
        
        if (quaggaRunning) {
            Quagga.stop();
            quaggaRunning = false;
        }
        
        setTimeout(() => {
            Quagga.init({
                inputStream: {
                    name: "Live",
                    type: "LiveStream",
                    target: document.querySelector('#barcode-video'),
                    constraints: { width: 640, height: 480, facingMode: "environment" },
                },
                decoder: { 
                    readers: ["ean_reader", "ean_8_reader", "code_128_reader", "code_39_reader", "upc_reader"] 
                }
            }, function(err) {
                if (err) {
                    console.log(err);
                    Swal.fire('خطأ', 'تعذر تشغيل الكاميرا: ' + err, 'error');
                    modal.hide();
                    return;
                }
                Quagga.start();
                quaggaRunning = true;
            });

            Quagga.onDetected((data) => {
                const code = data.codeResult.code;
                const barcodeInput = document.getElementById('new-barcode');
                if (barcodeInput) {
                    barcodeInput.value = code;
                }
                const resultEl = document.getElementById('barcode-result');
                if (resultEl) {
                    resultEl.innerText = 'تم المسح: ' + code;
                }
                Quagga.stop();
                quaggaRunning = false;
                modal.hide();
            });
        }, 500);
    }

    function showLargeImage(src) {
        const modalImage = document.getElementById('modal-image');
        if (modalImage) {
            modalImage.src = src;
            new bootstrap.Modal(document.getElementById('imageModal')).show();
        }
    }

    // ================== دوال الإشعارات ==================
    function showNotification(title, message, type = 'success') {
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

    function showSuccess(title, message) {
        showNotification(title, message, 'success');
    }

    function showError(title, message) {
        showNotification(title, message, 'error');
    }

    function showWarning(title, message) {
        showNotification(title, message, 'warning');
    }

    function showInfo(title, message) {
        showNotification(title, message, 'info');
    }

    function showConfirmation(title, text, confirmCallback, cancelCallback) {
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

    // ================== البحث الصوتي ==================
    function initVoiceSearch(inputId, callback) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.warn('المتصفح لا يدعم البحث الصوتي');
            return null;
        }
        
        const recognition = new SpeechRecognition();
        recognition.lang = 'ar-DZ';
        recognition.interimResults = false;
        recognition.continuous = false;
        recognition.maxAlternatives = 1;
        
        recognition.onstart = () => {
            console.log('البحث الصوتي بدأ');
            const micBtn = document.getElementById('mic-sale');
            if (micBtn) micBtn.classList.add('listening');
        };
        
        recognition.onend = () => {
            console.log('البحث الصوتي انتهى');
            const micBtn = document.getElementById('mic-sale');
            if (micBtn) micBtn.classList.remove('listening');
        };
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            const input = document.getElementById(inputId);
            if (input) {
                input.value = transcript;
                if (callback) callback(transcript);
            }
        };
        
        recognition.onerror = (event) => {
            console.log('خطأ في التعرف على الصوت:', event.error);
            showError('خطأ', 'فشل التعرف على الصوت');
        };
        
        return recognition;
    }

    // ================== حفظ البيانات في localStorage ==================
    function saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('خطأ في الحفظ:', e);
            showError('خطأ', 'فشل حفظ البيانات');
            return false;
        }
    }

    function loadFromLocalStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('خطأ في التحميل:', e);
            return defaultValue;
        }
    }

    function removeFromLocalStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('خطأ في الحذف:', e);
            return false;
        }
    }

    function clearLocalStorage() {
        try {
            localStorage.clear();
            return true;
        } catch (e) {
            console.error('خطأ في المسح:', e);
            return false;
        }
    }

    // ================== دوال مساعدة للنماذج ==================
    function clearForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return;
        
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.type === 'text' || input.type === 'number' || input.type === 'email' || input.type === 'tel') {
                input.value = '';
            } else if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = false;
            } else if (input.tagName === 'SELECT') {
                input.selectedIndex = 0;
            } else if (input.tagName === 'TEXTAREA') {
                input.value = '';
            }
        });
    }

    function getFormData(formId) {
        const form = document.getElementById(formId);
        if (!form) return {};
        
        const formData = {};
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            if (input.id) {
                if (input.type === 'checkbox') {
                    formData[input.id] = input.checked;
                } else if (input.type === 'radio') {
                    if (input.checked) {
                        formData[input.id] = input.value;
                    }
                } else {
                    formData[input.id] = input.value;
                }
            }
        });
        
        return formData;
    }

    // ================== دوال التاريخ ==================
    function getCurrentDate() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function getCurrentTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    function getCurrentDateTime() {
        return `${getCurrentDate()} ${getCurrentTime()}`;
    }

    function formatDateForDisplay(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('ar-DZ');
    }

    // ================== دوال مساعدة للعملة ==================
    function parseCurrency(currencyStr) {
        if (!currencyStr) return 0;
        return parseFloat(currencyStr.replace(/[^\d.-]/g, '')) || 0;
    }

    // ================== دوال مساعدة للأرقام ==================
    function roundToTwo(num) {
        return Math.round((num + Number.EPSILON) * 100) / 100;
    }

    function calculatePercentage(part, total) {
        if (total === 0) return 0;
        return (part / total) * 100;
    }

    // ================== دوال مساعدة للبحث ==================
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ================== تصدير الوحدة ==================
    return {
        // توليد المعرفات
        generateId,
        
        // تنسيقات
        formatCurrency,
        formatDate,
        formatDateForDisplay,
        getCurrentDate,
        getCurrentTime,
        getCurrentDateTime,
        
        // تحقق
        isValidEmail,
        isValidPhone,
        isNumber,
        isRequired,
        
        // تنقل
        switchSection,
        showSubSection,
        
        // صور وباركود
        previewImage,
        openBarcodeScanner,
        showLargeImage,
        
        // إشعارات
        showNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showConfirmation,
        
        // بحث صوتي
        initVoiceSearch,
        
        // تخزين محلي
        saveToLocalStorage,
        loadFromLocalStorage,
        removeFromLocalStorage,
        clearLocalStorage,
        
        // نماذج
        clearForm,
        getFormData,
        
        // عمليات حسابية
        parseCurrency,
        roundToTwo,
        calculatePercentage,
        
        // دوال مساعدة
        debounce,
        
        // الصورة المحددة
        getSelectedImage: () => selectedImageBase64,
        setSelectedImage: (val) => { selectedImageBase64 = val; }
    };
})();

// ================== تصدير للاستخدام العام ==================
window.utils = utils;

// ================== تهيئة تلقائية ==================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🛠️ الأدوات المساعدة جاهزة - الإصدار الكامل');
    
    // تفعيل القسم النشط الأول إذا لم يكن موجوداً
    const activeSection = document.querySelector('.section.active-section');
    if (!activeSection) {
        const firstSection = document.querySelector('.section');
        if (firstSection) {
            firstSection.classList.add('active-section');
        }
    }
    
    // إضافة خاصية debounce للبحث
    if (document.getElementById('sale-search')) {
        const searchInput = document.getElementById('sale-search');
        const originalHandler = searchInput.oninput;
        if (originalHandler) {
            searchInput.oninput = debounce(originalHandler, 300);
        }
    }
});
