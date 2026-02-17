// ================== الأدوات المساعدة ==================
const utils = (function() {
    let quaggaRunning = false;
    let selectedImageBase64 = '';

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

    // ================== دوال القائمة الجانبية ==================
    function toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        if (sidebar && overlay) {
            if (sidebar.style.display === 'none' || sidebar.style.display === '') {
                sidebar.style.display = 'block';
                overlay.style.display = 'block';
            } else {
                sidebar.style.display = 'none';
                overlay.style.display = 'none';
            }
        }
    }

    function openUserMenu() {
        Swal.fire({
            title: 'قائمة المستخدم',
            html: `
                <div style="text-align:right">
                    <p><i class="material-icons-round">person</i> الملف الشخصي</p>
                    <p><i class="material-icons-round">settings</i> الإعدادات</p>
                </div>
            `,
            showConfirmButton: false,
            showCloseButton: true
        });
    }

    // ================== نظام تسجيل الدخول ==================
    const APP_PASSWORD = "123456";

    function checkPassword() {
        const passwordInput = document.getElementById('password-input');
        const errorMessage = document.getElementById('error-message');
        const password = passwordInput.value;
        
        if (password === APP_PASSWORD) {
            errorMessage.style.display = 'none';
            document.getElementById('login-screen').style.display = 'none';
            localStorage.setItem('isLoggedIn', 'true');
            
            Swal.fire({
                icon: 'success',
                title: 'مرحباً بك',
                text: 'تم تسجيل الدخول بنجاح',
                timer: 1500,
                showConfirmButton: false
            });
            
            setTimeout(() => {
                document.getElementById('welcome-screen').style.display = 'flex';
            }, 1500);
            
        } else {
            errorMessage.style.display = 'flex';
            passwordInput.value = '';
            passwordInput.focus();
        }
    }

    function togglePasswordVisibility() {
        const passwordInput = document.getElementById('password-input');
        const toggleIcon = document.querySelector('.toggle-password');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.textContent = 'visibility';
        } else {
            passwordInput.type = 'password';
            toggleIcon.textContent = 'visibility_off';
        }
    }

    function showPasswordHint() {
        Swal.fire({
            title: 'نسيت كلمة السر؟',
            html: `
                <div style="text-align:right">
                    <p>كلمة السر الافتراضية هي: <strong>123456</strong></p>
                </div>
            `,
            icon: 'info',
            confirmButtonText: 'حسناً'
        });
    }

    function checkLoginStatus() {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        
        if (isLoggedIn === 'true') {
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('welcome-screen').style.display = 'flex';
        } else {
            document.getElementById('login-screen').style.display = 'flex';
            document.getElementById('welcome-screen').style.display = 'none';
        }
    }

    function logout() {
        Swal.fire({
            title: 'تسجيل الخروج',
            text: 'هل أنت متأكد من تسجيل الخروج؟',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'نعم',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('isLoggedIn');
                location.reload();
            }
        });
    }

    function closeWelcomeScreen() {
        document.getElementById('welcome-screen').style.display = 'none';
    }

    function openPrintSettings() {
        closeWelcomeScreen();
        Swal.fire({
            title: 'إعدادات الطباعة',
            html: '<p>سيتم إضافة إعدادات الطباعة قريباً</p>',
            icon: 'info'
        });
    }

    function openSettings() {
        closeWelcomeScreen();
        Swal.fire({
            title: 'إعدادات النظام',
            html: '<p>سيتم إضافة الإعدادات قريباً</p>',
            icon: 'info'
        });
    }

    function openAboutApp() {
        closeWelcomeScreen();
        Swal.fire({
            title: 'عن التطبيق',
            html: `
                <div style="text-align:right">
                    <h3>تطبيق سوبر</h3>
                    <p>نظام متكامل لإدارة المبيعات والمشتريات والمخزون</p>
                    <p><strong>الإصدار:</strong> 1.0.0</p>
                </div>
            `,
            icon: 'info'
        });
    }

    function rateApp() {
        closeWelcomeScreen();
        Swal.fire({
            title: 'تقييم التطبيق',
            text: 'شكراً لاستخدامك التطبيق!',
            icon: 'success'
        });
    }

    function shareApp() {
        closeWelcomeScreen();
        if (navigator.share) {
            navigator.share({
                title: 'تطبيق سوبر',
                text: 'نظام متكامل لإدارة المبيعات والمشتريات والمخزون',
                url: window.location.href
            });
        } else {
            Swal.fire({
                title: 'مشاركة التطبيق',
                text: 'يمكنك نسخ الرابط ومشاركته مع أصدقائك',
                icon: 'info'
            });
        }
    }

    function openPrivacyPolicy() {
        closeWelcomeScreen();
        Swal.fire({
            title: 'سياسة الخصوصية',
            html: `
                <div style="text-align:right">
                    <p>جميع البيانات保存在 جهازك المحلي ولا يتم مشاركتها مع أي طرف ثالث.</p>
                </div>
            `,
            icon: 'info'
        });
    }

    function openHelp() {
        closeWelcomeScreen();
        Swal.fire({
            title: 'مساعدة',
            html: `
                <div style="text-align:right">
                    <p>للحصول على مساعدة، يرجى التواصل معنا</p>
                </div>
            `,
            icon: 'info'
        });
    }

    return {
        switchSection,
        showSubSection,
        previewImage,
        openBarcodeScanner,
        showLargeImage,
        toggleSidebar,
        openUserMenu,
        checkPassword,
        togglePasswordVisibility,
        showPasswordHint,
        checkLoginStatus,
        logout,
        closeWelcomeScreen,
        openPrintSettings,
        openSettings,
        openAboutApp,
        rateApp,
        shareApp,
        openPrivacyPolicy,
        openHelp,
        getSelectedImage: () => selectedImageBase64,
        setSelectedImage: (val) => { selectedImageBase64 = val; }
    };
})();

window.utils = utils;

// التحقق من حالة تسجيل الدخول عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    if (typeof utils !== 'undefined' && utils.checkLoginStatus) {
        utils.checkLoginStatus();
    }
});
