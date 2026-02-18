// ================== الملف الرئيسي للتطبيق - تهيئة وتشغيل ==================

// انتظار تحميل الصفحة بالكامل
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 تطبيق سوبر - بدء التشغيل...');
    
    // ================== تهيئة جميع الوحدات ==================
    initializeModules();
    
    // ================== التحقق من حالة تسجيل الدخول ==================
    checkLoginStatus();
    
    // ================== تحديث البيانات الأولية ==================
    refreshAllData();
    
    // ================== إعداد المستمعين ==================
    setupEventListeners();
    
    console.log('✅ تم تهيئة التطبيق بنجاح');
});

// ================== تهيئة الوحدات ==================
function initializeModules() {
    // تهيئة البحث الصوتي للمبيعات
    if (typeof salesModule !== 'undefined' && salesModule.initVoiceSearch) {
        salesModule.initVoiceSearch();
        console.log('🎤 البحث الصوتي للمبيعات جاهز');
    }
    
    // تهيئة البحث الصوتي للمشتريات
    if (typeof purchasesModule !== 'undefined' && purchasesModule.initVoiceSearch) {
        purchasesModule.initVoiceSearch();
        console.log('🎤 البحث الصوتي للمشتريات جاهز');
    }
    
    // تهيئة نظام الديون
    if (typeof debtModule !== 'undefined' && debtModule.init) {
        debtModule.init();
        console.log('💰 نظام الديون جاهز');
    }
    
    // تهيئة الذكاء الاصطناعي
    if (typeof aiModule !== 'undefined') {
        console.log('🤖 الذكاء الاصطناعي جاهز');
    }
}

// ================== التحقق من حالة تسجيل الدخول ==================
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const loginScreen = document.getElementById('login-screen');
    const resetScreen = document.getElementById('reset-password-screen');
    
    if (!loginScreen) return;
    
    if (isLoggedIn === 'true') {
        // تم تسجيل الدخول مسبقاً
        loginScreen.style.display = 'none';
        if (resetScreen) resetScreen.style.display = 'none';
        console.log('👤 مستخدم مسجل الدخول');
    } else {
        // لم يتم تسجيل الدخول
        loginScreen.style.display = 'flex';
        if (resetScreen) resetScreen.style.display = 'none';
        console.log('👤 يرجى تسجيل الدخول');
    }
}

// ================== تحديث جميع البيانات ==================
function refreshAllData() {
    // تحديث المبيعات
    if (typeof salesModule !== 'undefined') {
        if (salesModule.renderCart) salesModule.renderCart();
        if (salesModule.renderSaleInvoices) salesModule.renderSaleInvoices();
        console.log('📊 تم تحديث بيانات المبيعات');
    }
    
    // تحديث المشتريات
    if (typeof purchasesModule !== 'undefined') {
        if (purchasesModule.renderPurchaseCart) purchasesModule.renderPurchaseCart();
        if (purchasesModule.renderPurchaseInvoices) purchasesModule.renderPurchaseInvoices();
        console.log('📦 تم تحديث بيانات المشتريات');
    }
    
    // تحديث المخزون
    if (typeof inventoryModule !== 'undefined' && inventoryModule.renderStock) {
        inventoryModule.renderStock();
        console.log('🏪 تم تحديث المخزون');
    }
    
    // تحديث العملاء
    if (typeof customerModule !== 'undefined' && customerModule.renderCustomers) {
        customerModule.renderCustomers();
        console.log('👥 تم تحديث العملاء');
    }
    
    // تحديث الموردين
    if (typeof supplierModule !== 'undefined' && supplierModule.renderSuppliers) {
        supplierModule.renderSuppliers();
        console.log('🏢 تم تحديث الموردين');
    }
    
    // تحديث التقارير
    if (typeof reportsModule !== 'undefined' && reportsModule.renderReports) {
        reportsModule.renderReports();
        console.log('📈 تم تحديث التقارير');
    }
    
    // تحديث الديون
    if (typeof debtModule !== 'undefined') {
        if (debtModule.renderCustomerDebts) debtModule.renderCustomerDebts();
        if (debtModule.renderSupplierDebts) debtModule.renderSupplierDebts();
        if (debtModule.renderDebtSummary) debtModule.renderDebtSummary();
        console.log('💰 تم تحديث الديون');
    }
}

// ================== إعداد مستمعي الأحداث ==================
function setupEventListeners() {
    // إغلاق القوائم المنبثقة عند النقر خارجها
    document.addEventListener('click', function(event) {
        // يمكن إضافة منطق إغلاق القوائم هنا
    });
    
    // مراقبة التغييرات في localStorage
    window.addEventListener('storage', function(event) {
        console.log('📝 تم تغيير البيانات في التخزين المحلي:', event.key);
        // يمكن تحديث واجهة المستخدم عند تغيير البيانات من نافذة أخرى
    });
    
    console.log('👂 تم إعداد مستمعي الأحداث');
}

// ================== دوال تسجيل الدخول ==================

// إظهار نافذة استعادة كلمة السر
function showResetPassword() {
    const loginScreen = document.getElementById('login-screen');
    const resetScreen = document.getElementById('reset-password-screen');
    
    if (loginScreen) loginScreen.style.display = 'none';
    if (resetScreen) resetScreen.style.display = 'flex';
}

// العودة إلى شاشة تسجيل الدخول
function backToLogin() {
    const loginScreen = document.getElementById('login-screen');
    const resetScreen = document.getElementById('reset-password-screen');
    
    if (resetScreen) resetScreen.style.display = 'none';
    if (loginScreen) loginScreen.style.display = 'flex';
}

// استخدام كلمة السر الافتراضية
function useDefaultPassword() {
    const passwordInput = document.getElementById('password-input');
    if (passwordInput) passwordInput.value = '123456';
    
    backToLogin();
    
    Swal.fire({
        icon: 'info',
        title: 'كلمة السر الافتراضية',
        text: 'تم تعيين كلمة السر إلى 123456',
        timer: 2000,
        showConfirmButton: false
    });
}

// إظهار/إخفاء كلمة السر
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password-input');
    const toggleIcon = document.querySelector('.toggle-password');
    
    if (!passwordInput || !toggleIcon) return;
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.textContent = 'visibility';
    } else {
        passwordInput.type = 'password';
        toggleIcon.textContent = 'visibility_off';
    }
}

// التحقق من كلمة السر
function checkPassword() {
    const passwordInput = document.getElementById('password-input');
    const errorMessage = document.getElementById('error-message');
    
    if (!passwordInput || !errorMessage) return;
    
    const password = passwordInput.value;
    
    // كلمة السر الافتراضية (يمكن تغييرها)
    if (password === '123456') {
        // تسجيل دخول ناجح
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
        
        // تحديث البيانات
        refreshAllData();
        
    } else {
        // كلمة سر خاطئة
        errorMessage.style.display = 'flex';
        passwordInput.value = '';
        passwordInput.focus();
    }
}

// ================== دوال القائمة الجانبية ==================

// تبديل القائمة الجانبية
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar && overlay) {
        const isVisible = sidebar.style.display !== 'none';
        
        sidebar.style.display = isVisible ? 'none' : 'block';
        overlay.style.display = isVisible ? 'none' : 'block';
    }
}

// فتح قائمة المستخدم
function openUserMenu() {
    Swal.fire({
        title: 'قائمة المستخدم',
        html: `
            <div style="text-align:right">
                <p><i class="material-icons-round">person</i> الملف الشخصي</p>
                <p><i class="material-icons-round">settings</i> الإعدادات</p>
                <p><i class="material-icons-round">exit_to_app</i> تسجيل الخروج</p>
            </div>
        `,
        showConfirmButton: false,
        showCloseButton: true
    });
}

// تسجيل الخروج
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

// ================== دوال الطباعة ==================

// طباعة تفاصيل الفاتورة
function printInvoiceDetails() {
    window.print();
}

// ================== تصدير الدوال للاستخدام العام ==================
// الدوال متاحة عالمياً بالفعل
