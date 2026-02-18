// تأكد من وجود هذه الدالة في utils.js
window.switchSection = function(sectionId, element) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active-section'));
    document.getElementById(sectionId).classList.add('active-section');
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    if (element) element.classList.add('active');
};
// ================== الأدوات المساعدة المتقدمة - نسخة كاملة ==================
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
        if (sectionId === 'inventory' && typeof inventoryModule !== 'undefined') {
            inventoryModule.renderStock();
        }
        if (sectionId === 'reports' && typeof reportsModule !== 'undefined') {
            reportsModule.renderReports();
        }
        if (sectionId === 'customers' && typeof customerModule !== 'undefined') {
            customerModule.renderCustomers();
        }
        if (sectionId === 'suppliers' && typeof supplierModule !== 'undefined') {
            supplierModule.renderSuppliers();
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
        if (subId === 'sale-invoices' && typeof salesModule !== 'undefined') {
            salesModule.renderSaleInvoices();
        }
        if (subId === 'purchase-invoices' && typeof purchasesModule !== 'undefined') {
            purchasesModule.renderPurchaseInvoices();
        }
        if (subId === 'customers' && typeof customerModule !== 'undefined') {
            customerModule.renderCustomers();
        }
        if (subId === 'suppliers' && typeof supplierModule !== 'undefined') {
            supplierModule.renderSuppliers();
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
                document.getElementById('new-barcode').value = code;
                document.getElementById('barcode-result').innerText = 'تم المسح: ' + code;
                Quagga.stop();
                quaggaRunning = false;
                modal.hide();
            });
        }, 500);
    }

    function showLargeImage(src) {
        document.getElementById('modal-image').src = src;
        new bootstrap.Modal(document.getElementById('imageModal')).show();
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
            if (result.isConfirmed && confirmCallback) {
                confirmCallback();
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
            showNotification('خطأ', 'فشل التعرف على الصوت', 'error');
        };
        
        return recognition;
    }

    // ================== تصدير الوحدة ==================
    return {
        generateId,
        formatCurrency,
        formatDate,
        isValidEmail,
        isValidPhone,
        switchSection,
        showSubSection,
        previewImage,
        openBarcodeScanner,
        showLargeImage,
        showNotification,
        showConfirmation,
        initVoiceSearch,
        getSelectedImage: () => selectedImageBase64,
        setSelectedImage: (val) => { selectedImageBase64 = val; }
    };
})();

// ================== تصدير للاستخدام العام ==================
window.utils = utils;

// ================== تهيئة تلقائية ==================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🛠️ الأدوات المساعدة جاهزة');
    
    // تفعيل القسم النشط الأول
    const activeSection = document.querySelector('.section.active-section');
    if (!activeSection) {
        const firstSection = document.querySelector('.section');
        if (firstSection) {
            firstSection.classList.add('active-section');
        }
    }
});
