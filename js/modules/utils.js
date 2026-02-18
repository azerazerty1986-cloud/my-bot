// ================== الأدوات المساعدة المتقدمة ==================
const utils = (function() {
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

    // ================== وظائف التنقل ==================
    function switchSection(sectionId, element) {
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active-section'));
        document.getElementById(sectionId).classList.add('active-section');
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        if (element) element.classList.add('active');
        
        if (sectionId === 'sales') showSubSection('sale-operation');
        if (sectionId === 'purchases') showSubSection('purchase-operation');
        if (sectionId === 'add') showSubSection('add-product');
        if (sectionId === 'inventory' && typeof inventoryModule !== 'undefined') {
            inventoryModule.renderStock();
        }
        if (sectionId === 'reports' && typeof reportsModule !== 'undefined') { 
            reportsModule.renderReports(); 
            reportsModule.showReportTab('report-summary'); 
        }
        
        if (typeof customerModule !== 'undefined') {
            customerModule.hideCustomerInvoices();
        }
        if (typeof supplierModule !== 'undefined') {
            supplierModule.hideSupplierInvoices();
        }
    }

    function showSubSection(subId) {
        const parent = document.querySelector('.active-section');
        if (!parent) return;
        
        parent.querySelectorAll('.sub-section').forEach(s => s.style.display = 'none');
        
        const targetSection = document.getElementById(subId);
        if (targetSection) {
            targetSection.style.display = 'block';
        }
        
        const tabs = parent.querySelectorAll('.tab-item');
        tabs.forEach(t => t.classList.remove('active-red', 'active-green', 'active-nardo'));
        
        tabs.forEach(t => {
            if (t.getAttribute('onclick') && t.getAttribute('onclick').includes(subId)) {
                if (parent.id === 'sales') t.classList.add('active-red');
                else if (parent.id === 'purchases') t.classList.add('active-green');
                else if (parent.id === 'add') t.classList.add('active-nardo');
            }
        });
        
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
        
        if (typeof customerModule !== 'undefined') {
            customerModule.hideCustomerInvoices();
        }
        if (typeof supplierModule !== 'undefined') {
            supplierModule.hideSupplierInvoices();
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
                decoder: { readers: ["ean_reader", "ean_8_reader", "code_128_reader", "code_39_reader", "upc_reader"] }
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
        getSelectedImage: () => selectedImageBase64,
        setSelectedImage: (val) => { selectedImageBase64 = val; }
    };
})();

window.utils = utils;
