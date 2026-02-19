// ================== الملف الرئيسي للتطبيق ==================
const app = {
    // تهيئة التطبيق
    init: function() {
        console.log('✅ تم تهيئة التطبيق');
        this.checkLoginStatus();
        this.loadAllModules();
        this.setupEventListeners();
    },
    
    // التحقق من حالة تسجيل الدخول
    checkLoginStatus: function() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        if (isLoggedIn) {
            setTimeout(() => {
                document.getElementById('login-screen').style.display = 'none';
            }, 100);
        }
    },
    
    // تحميل جميع الوحدات
    loadAllModules: function() {
        if (window.customerModule) {
            customerModule.init?.();
            console.log('✅ customerModule loaded');
        }
        if (window.supplierModule) {
            supplierModule.init?.();
            console.log('✅ supplierModule loaded');
        }
        if (window.inventoryModule) {
            inventoryModule.init?.();
            console.log('✅ inventoryModule loaded');
        }
        if (window.salesModule) {
            salesModule.init?.();
            console.log('✅ salesModule loaded');
        }
        if (window.purchasesModule) {
            purchasesModule.init?.();
            console.log('✅ purchasesModule loaded');
        }
        if (window.reportsModule) {
            reportsModule.init?.();
            console.log('✅ reportsModule loaded');
        }
        if (window.backupModule) {
            backupModule.init?.();
            console.log('✅ backupModule loaded');
        }
    },
    
    // إعداد مستمعي الأحداث
    setupEventListeners: function() {
        // إغلاق القائمة الجانبية عند النقر خارجها
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            const menuIcon = document.querySelector('.app-header i:first-child');
            
            if (sidebar?.classList.contains('show') && 
                !sidebar.contains(e.target) && 
                e.target !== menuIcon) {
                sidebar.classList.remove('show');
            }
        });
    },
    
    // التبديل بين الأقسام
    switchSection: function(sectionId, element) {
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active-section'));
        const targetSection = document.getElementById(sectionId);
        if (targetSection) targetSection.classList.add('active-section');
        
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        if (element) element.classList.add('active');
        
        // تحديث البيانات حسب القسم
        if (sectionId === 'inventory' && window.inventoryModule) {
            inventoryModule.renderStock?.();
        } else if (sectionId === 'reports' && window.reportsModule) {
            reportsModule.loadReports?.();
        } else if (sectionId === 'sales' && window.salesModule) {
            salesModule.loadCustomersList?.();
        } else if (sectionId === 'purchases' && window.purchasesModule) {
            purchasesModule.loadSuppliersList?.();
        }
    },
    
    // التبديل بين الأقسام الفرعية
    showSubSection: function(subId) {
        const parent = document.querySelector('.active-section');
        if (!parent) return;
        
        parent.querySelectorAll('.sub-section').forEach(s => s.style.display = 'none');
        const target = document.getElementById(subId);
        if (target) target.style.display = 'block';
        
        // تحديث التبويبات
        const tabs = parent.querySelectorAll('.tab-item');
        tabs.forEach(t => t.classList.remove('active-red', 'active-green', 'active-nardo'));
        
        tabs.forEach(t => {
            if (t.getAttribute('onclick')?.includes(subId)) {
                if (parent.id === 'sales') t.classList.add('active-red');
                else if (parent.id === 'purchases') t.classList.add('active-green');
                else if (parent.id === 'add') t.classList.add('active-nardo');
            }
        });
        
        // تحميل البيانات حسب القسم الفرعي
        if (subId === 'customers' && window.customerModule) {
            customerModule.renderCustomers?.();
        } else if (subId === 'suppliers' && window.supplierModule) {
            supplierModule.renderSuppliers?.();
        } else if (subId === 'sale-invoices' && window.salesModule) {
            salesModule.loadInvoices?.();
        } else if (subId === 'purchase-invoices' && window.purchasesModule) {
            purchasesModule.loadInvoices?.();
        }
    },
    
    // فتح القائمة الجانبية
    toggleSidebar: function() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('show');
        }
    },
    
    // فتح قائمة المستخدم
    openUserMenu: function() {
        Swal.fire({
            title: 'حساب المستخدم',
            html: `
                <div style="text-align:right">
                    <p><strong>المستخدم:</strong> مدير النظام</p>
                    <p><strong>الصلاحية:</strong> كاملة</p>
                    <p><strong>آخر دخول:</strong> ${new Date().toLocaleDateString('ar-EG')}</p>
                </div>
            `,
            confirmButtonText: 'تسجيل الخروج',
            showCancelButton: true,
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('isLoggedIn');
                location.reload();
            }
        });
    },
    
    // تصدير نسخة احتياطية
    exportBackup: function() {
        if (window.backupModule) {
            backupModule.exportBackup?.();
        } else {
            Swal.fire('معلومة', 'وحدة النسخ الاحتياطي غير متوفرة', 'info');
        }
    }
};

// ================== دوال عامة للاستخدام في HTML ==================

// دوال التنقل
window.switchSection = (sectionId, element) => app.switchSection(sectionId, element);
window.showSubSection = (subId) => app.showSubSection(subId);
window.toggleSidebar = () => app.toggleSidebar();
window.openUserMenu = () => app.openUserMenu();
window.exportBackup = () => app.exportBackup();

// دوال تسجيل الدخول
window.checkPassword = function() {
    const password = document.getElementById('password-input').value;
    const error = document.getElementById('error-message');
    
    if (password === '123456') {
        error.style.display = 'none';
        document.getElementById('login-screen').style.display = 'none';
        localStorage.setItem('isLoggedIn', 'true');
        
        Swal.fire({
            icon: 'success',
            title: 'مرحباً بك',
            text: 'تم تسجيل الدخول بنجاح',
            timer: 1500,
            showConfirmButton: false
        });
    } else {
        error.style.display = 'flex';
        document.getElementById('password-input').value = '';
    }
};

window.togglePasswordVisibility = function() {
    const input = document.getElementById('password-input');
    const icon = document.querySelector('.toggle-password');
    input.type = input.type === 'password' ? 'text' : 'password';
    icon.textContent = input.type === 'password' ? 'visibility_off' : 'visibility';
};

window.showResetPassword = function() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('reset-password-screen').style.display = 'flex';
};

window.backToLogin = function() {
    document.getElementById('reset-password-screen').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
};

window.useDefaultPassword = function() {
    document.getElementById('password-input').value = '123456';
    backToLogin();
    Swal.fire({
        icon: 'info',
        title: 'كلمة السر الافتراضية',
        text: 'تم تعيين كلمة السر إلى 123456',
        timer: 2000,
        showConfirmButton: false
    });
};

// دوال افتراضية للطوارئ (تستبدل بواسطة الوحدات الحقيقية)
window.openBarcodeScanner = () => Swal.fire('ماسح الباركود', 'جاري التفعيل', 'info');
window.startVoiceSearch = () => Swal.fire('البحث الصوتي', 'قريباً إن شاء الله', 'info');
window.smartSearch = () => {};
window.smartSearchPurchase = () => {};
window.addToCart = () => {};
window.clearCart = () => {};
window.finishSaleAndPrint = () => {};
window.searchInvoices = () => {};
window.addCustomer = () => window.customerModule?.addCustomer?.();
window.addSupplier = () => window.supplierModule?.addSupplier?.();
window.addToPurchaseCart = () => {};
window.clearPurchaseCart = () => {};
window.finishPurchaseAndPrint = () => {};
window.uploadExcel = () => {};
window.showReportTab = () => {};

// تهيئة التطبيق بعد تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => app.init());
