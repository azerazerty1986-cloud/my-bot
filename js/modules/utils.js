// ================== الأدوات المساعدة ==================
const utils = (function() {
    // المتغيرات العامة المشتركة
    let quaggaRunning = false;
    let selectedImageBase64 = '';

    // وظائف التنقل
    function switchSection(sectionId, element) {
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active-section'));
        document.getElementById(sectionId).classList.add('active-section');
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        if (element) element.classList.add('active');
        if (sectionId === 'sales') showSubSection('sale-operation');
        if (sectionId === 'purchases') showSubSection('purchase-operation');
        if (sectionId === 'add') showSubSection('add-product');
        if (sectionId === 'inventory') inventoryModule.renderStock();
        if (sectionId === 'reports') { 
            reportsModule.renderReports(); 
            reportsModule.showReportTab('report-summary'); 
        }
        if (customerModule) customerModule.hideCustomerInvoices();
    }

    function showSubSection(subId) {
        const parent = document.querySelector('.active-section');
        parent.querySelectorAll('.sub-section').forEach(s => s.style.display = 'none');
        document.getElementById(subId).style.display = 'block';
        const tabs = parent.querySelectorAll('.tab-item');
        tabs.forEach(t => t.classList.remove('active-red', 'active-green', 'active-nardo'));
        tabs.forEach(t => {
            if (t.getAttribute('onclick') && t.getAttribute('onclick').includes(subId)) {
                if (parent.id === 'sales') t.classList.add('active-red');
                else if (parent.id === 'purchases') t.classList.add('active-green');
                else if (parent.id === 'add') t.classList.add('active-nardo');
            }
        });
        if (subId === 'sale-invoices' && salesModule) salesModule.renderSaleInvoices();
        if (subId === 'purchase-invoices' && purchasesModule) purchasesModule.renderPurchaseInvoices();
        if (subId === 'customers' && customerModule) customerModule.renderCustomers();
        if (subId === 'suppliers' && supplierModule) supplierModule.renderSuppliers();
        if (customerModule) customerModule.hideCustomerInvoices();
    }

    // وظائف الصور والباركود
    function previewImage(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                selectedImageBase64 = e.target.result;
                document.getElementById('preview-img').src = selectedImageBase64;
                document.getElementById('image-preview').style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            selectedImageBase64 = '';
            document.getElementById('image-preview').style.display = 'none';
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

    // إرجاع الوظائف العامة
    return {
        switchSection,
        showSubSection,
        previewImage,
        openBarcodeScanner,
        showLargeImage,
        getSelectedImage: () => selectedImageBase64,
        setSelectedImage: (val) => { selectedImageBase64 = val; }
    };
})();
