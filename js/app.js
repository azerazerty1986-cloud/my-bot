// ================== app.js - الملف الرئيسي للتطبيق ==================
// الرقم 29 في ترتيب الملفات - يربط جميع الوحدات ويدير التطبيق

const App = {
    // ================== خصائص التطبيق ==================
    version: '2.0.0',
    name: 'سوبر - النظام المتكامل',
    modules: {},
    initialized: false,
    
    // ================== تهيئة التطبيق ==================
    init: function() {
        console.log(`🚀 بدأ تشغيل ${this.name} الإصدار ${this.version}`);
        
        this.checkLoginStatus();
        this.registerGlobalFunctions();
        this.waitForHTML();
        
        this.initialized = true;
    },
    
    // ================== التحقق من حالة تسجيل الدخول ==================
    checkLoginStatus: function() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        
        if (isLoggedIn) {
            setTimeout(() => {
                const loginScreen = document.getElementById('login-screen');
                if (loginScreen) {
                    loginScreen.style.display = 'none';
                }
            }, 100);
        }
    },
    
    // ================== انتظار تحميل HTML ==================
    waitForHTML: function() {
        // التحقق من وجود عناصر HTML
        if (document.getElementById('sales-section')) {
            this.registerModules();
        } else {
            // الاستماع لحدث تحميل HTML
            document.addEventListener('html-loaded', () => {
                console.log('✅ HTML loaded, registering modules...');
                this.registerModules();
            });
            
            // محاولة بعد ثانية كاحتياطي
            setTimeout(() => {
                if (!this.initialized) {
                    console.log('⏳ Retrying module registration...');
                    this.registerModules();
                }
            }, 1000);
        }
    },
    
    // ================== تسجيل وتفعيل جميع الوحدات ==================
    registerModules: function() {
        console.log('📦 بدء تسجيل الوحدات...');
        
        // قائمة الوحدات بالترتيب الصحيح
        const moduleList = [
            { name: 'utils', var: 'utilsModule', required: true },
            { name: 'product', var: 'productModule', required: true },
            { name: 'inventory', var: 'inventoryModule', required: true },
            { name: 'customer', var: 'customerModule', required: true },
            { name: 'supplier', var: 'supplierModule', required: true },
            { name: 'sales', var: 'salesModule', required: true },
            { name: 'purchases', var: 'purchasesModule', required: true },
            { name: 'invoices', var: 'invoicesModule', required: true },
            { name: 'reports', var: 'reportsModule', required: true },
            { name: 'debt', var: 'debtModule', required: false },
            { name: 'backup', var: 'backupModule', required: false },
            { name: 'ai', var: 'aiModule', required: false }
        ];
        
        let successCount = 0;
        let failCount = 0;
        
        moduleList.forEach(module => {
            const moduleVar = window[module.var];
            
            if (moduleVar) {
                this.modules[module.name] = moduleVar;
                
                if (typeof moduleVar.init === 'function') {
                    try {
                        moduleVar.init();
                        console.log(`✅ ${module.name}Module initialized`);
                        successCount++;
                    } catch (e) {
                        console.error(`❌ خطأ في تهيئة ${module.name}Module:`, e);
                        failCount++;
                    }
                } else {
                    console.log(`ℹ️ ${module.name}Module loaded (no init function)`);
                    successCount++;
                }
            } else {
                if (module.required) {
                    console.error(`❌ ${module.name}Module not found - هذا الملف مطلوب`);
                    failCount++;
                } else {
                    console.log(`ℹ️ ${module.name}Module not found (اختياري)`);
                }
            }
        });
        
        console.log(`📊 إحصائيات التحميل: ${successCount} نجاح, ${failCount} فشل`);
        
        if (failCount === 0) {
            console.log('🎉 جميع الوحدات الأساسية محملة بنجاح!');
            this.afterModulesLoaded();
        } else {
            console.warn('⚠️ بعض الوحدات المطلوبة غير موجودة');
        }
    },
    
    // ================== بعد تحميل جميع الوحدات ==================
    afterModulesLoaded: function() {
        // تحديث جميع الأقسام
        this.refreshAllSections();
        
        // إعداد مستمعي الأحداث العامة
        this.setupGlobalEventListeners();
        
        // التحقق من الإعدادات المحفوظة
        this.loadSettings();
        
        console.log('✨ التطبيق جاهز للعمل!');
    },
    
    // ================== تحديث جميع الأقسام ==================
    refreshAllSections: function() {
        if (this.modules.product && this.modules.product.renderProducts) {
            this.modules.product.renderProducts();
        }
        
        if (this.modules.customer && this.modules.customer.renderCustomers) {
            this.modules.customer.renderCustomers();
        }
        
        if (this.modules.supplier && this.modules.supplier.renderSuppliers) {
            this.modules.supplier.renderSuppliers();
        }
        
        if (this.modules.sales && this.modules.sales.renderCart) {
            this.modules.sales.renderCart();
        }
        
        if (this.modules.purchases && this.modules.purchases.renderCart) {
            this.modules.purchases.renderCart();
        }
        
        if (this.modules.invoices && this.modules.invoices.refresh) {
            this.modules.invoices.refresh();
        }
        
        if (this.modules.reports && this.modules.reports.updateDashboard) {
            this.modules.reports.updateDashboard();
        }
        
        if (this.modules.debt && this.modules.debt.renderDebts) {
            this.modules.debt.renderDebts();
        }
    },
    
    // ================== إعداد مستمعي الأحداث العامة ==================
    setupGlobalEventListeners: function() {
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
        
        // إغلاق نتائج البحث
        document.addEventListener('click', (e) => {
            document.querySelectorAll('.search-results').forEach(box => {
                if (!box.contains(e.target) && !e.target.closest('.search-container')) {
                    box.classList.remove('show');
                }
            });
        });
        
        // حفظ البيانات قبل إغلاق الصفحة
        window.addEventListener('beforeunload', () => {
            this.saveSettings();
        });
    },
    
    // ================== تحميل الإعدادات ==================
    loadSettings: function() {
        try {
            const settings = JSON.parse(localStorage.getItem('app_settings') || '{}');
            
            // تطبيق الإعدادات
            if (settings.theme) {
                document.body.classList.add(`theme-${settings.theme}`);
            }
            
            console.log('⚙️ تم تحميل الإعدادات');
        } catch (e) {
            console.error('خطأ في تحميل الإعدادات:', e);
        }
    },
    
    // ================== حفظ الإعدادات ==================
    saveSettings: function() {
        const settings = {
            lastVisit: new Date().toISOString(),
            version: this.version
        };
        
        localStorage.setItem('app_settings', JSON.stringify(settings));
    },
    
    // ================== الحصول على وحدة معينة ==================
    getModule: function(name) {
        return this.modules[name] || null;
    },
    
    // ================== التبديل بين الأقسام ==================
    showSection: function(sectionId) {
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active-section'));
        
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add('active-section');
            
            // تحديث بيانات القسم عند عرضه
            this.refreshSection(sectionId);
        }
    },
    
    // ================== تحديث قسم معين ==================
    refreshSection: function(sectionId) {
        switch(sectionId) {
            case 'inventory':
                if (this.modules.product) this.modules.product.renderInventoryTable?.();
                break;
            case 'reports':
                if (this.modules.reports) this.modules.reports.updateDashboard?.();
                break;
            case 'invoices':
                if (this.modules.invoices) this.modules.invoices.refresh?.();
                break;
            case 'sales':
                if (this.modules.sales) {
                    this.modules.sales.loadCustomers?.();
                    this.modules.sales.renderInvoices?.();
                }
                break;
            case 'purchases':
                if (this.modules.purchases) {
                    this.modules.purchases.loadSuppliers?.();
                    this.modules.purchases.renderInvoices?.();
                }
                break;
        }
    },
    
    // ================== التبديل بين الأقسام الفرعية ==================
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
            if (t.getAttribute('onclick') && t.getAttribute('onclick').includes(subId)) {
                if (parent.id === 'sales') t.classList.add('active-red');
                else if (parent.id === 'purchases') t.classList.add('active-green');
                else if (parent.id === 'add' || parent.id === 'invoices') t.classList.add('active-nardo');
            }
        });
    },
    
    // ================== تسجيل الدوال العامة ==================
    registerGlobalFunctions: function() {
        // دوال التنقل
        window.switchSection = (sectionId) => this.showSection(sectionId);
        window.showSubSection = (subId) => this.showSubSection(subId);
        
        // دوال تسجيل الدخول
        window.checkPassword = () => this.checkPassword();
        window.togglePasswordVisibility = () => this.togglePasswordVisibility();
        window.showResetPassword = () => this.showResetPassword();
        window.backToLogin = () => this.backToLogin();
        window.useDefaultPassword = () => this.useDefaultPassword();
        
        // دوال القائمة
        window.toggleSidebar = () => this.toggleSidebar();
        window.openUserMenu = () => this.openUserMenu();
        window.logout = () => this.logout();
        
        // دوال أخرى
        window.openBarcodeScanner = () => this.openBarcodeScanner();
        window.startVoiceSearch = () => this.startVoiceSearch();
        window.exportBackup = () => this.exportBackup();
        window.uploadExcel = () => this.uploadExcel();
    },
    
    // ================== دوال تسجيل الدخول ==================
    checkPassword: function() {
        const password = document.getElementById('password-input')?.value;
        const error = document.getElementById('error-message');
        
        if (password === '123456') {
            if (error) error.style.display = 'none';
            document.getElementById('login-screen').style.display = 'none';
            localStorage.setItem('isLoggedIn', 'true');
            
            this.showNotification('success', 'مرحباً بك', 'تم تسجيل الدخول بنجاح');
        } else {
            if (error) error.style.display = 'flex';
        }
    },
    
    togglePasswordVisibility: function() {
        const input = document.getElementById('password-input');
        const icon = document.querySelector('.toggle-password');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.textContent = 'visibility';
        } else {
            input.type = 'password';
            icon.textContent = 'visibility_off';
        }
    },
    
    showResetPassword: function() {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('reset-password-screen').style.display = 'flex';
    },
    
    backToLogin: function() {
        document.getElementById('reset-password-screen').style.display = 'none';
        document.getElementById('login-screen').style.display = 'flex';
    },
    
    useDefaultPassword: function() {
        document.getElementById('password-input').value = '123456';
        this.backToLogin();
        this.showNotification('info', 'تم', 'تم تعيين كلمة السر إلى 123456');
    },
    
    // ================== دوال القائمة ==================
    toggleSidebar: function() {
        document.getElementById('sidebar')?.classList.toggle('show');
    },
    
    openUserMenu: function() {
        Swal.fire({
            title: 'حساب المستخدم',
            html: `
                <div style="text-align:right">
                    <p><strong>المستخدم:</strong> مدير النظام</p>
                    <p><strong>الصلاحية:</strong> كاملة</p>
                    <p><strong>الإصدار:</strong> ${this.version}</p>
                    <p><strong>آخر دخول:</strong> ${new Date().toLocaleDateString('ar-EG')}</p>
                </div>
            `,
            confirmButtonText: 'تسجيل الخروج',
            showCancelButton: true,
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed) {
                this.logout();
            }
        });
    },
    
    logout: function() {
        localStorage.removeItem('isLoggedIn');
        location.reload();
    },
    
    // ================== دوال مساعدة ==================
    showNotification: function(type, title, message) {
        if (this.modules.utils) {
            this.modules.utils.showNotification(title, message, type);
        } else {
            Swal.fire({
                icon: type,
                title: title,
                text: message,
                timer: 2000,
                showConfirmButton: false
            });
        }
    },
    
    openBarcodeScanner: function() {
        if (this.modules.utils) {
            this.modules.utils.openBarcodeScanner();
        } else {
            Swal.fire('معلومة', 'ماسح الباركود غير متوفر', 'info');
        }
    },
    
    startVoiceSearch: function() {
        Swal.fire('البحث الصوتي', 'قريباً إن شاء الله', 'info');
    },
    
    exportBackup: function() {
        if (this.modules.backup) {
            this.modules.backup.exportBackup();
        } else {
            Swal.fire('معلومة', 'وحدة النسخ الاحتياطي غير متوفرة', 'info');
        }
    },
    
    uploadExcel: function() {
        Swal.fire('رفع ملف Excel', 'قريباً إن شاء الله', 'info');
    },
    
    // ================== الحصول على إحصائيات سريعة ==================
    getQuickStats: function() {
        const products = this.modules.product?.getAllProducts?.() || [];
        const customers = this.modules.customer?.getAllCustomers?.() || [];
        const suppliers = this.modules.supplier?.getAllSuppliers?.() || [];
        const salesInvoices = this.modules.sales?.getInvoices?.() || [];
        const purchaseInvoices = this.modules.purchases?.getInvoices?.() || [];
        
        return {
            products: products.length,
            customers: customers.length,
            suppliers: suppliers.length,
            sales: {
                count: salesInvoices.length,
                total: salesInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0)
            },
            purchases: {
                count: purchaseInvoices.length,
                total: purchaseInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0)
            }
        };
    },
    
    // ================== إعادة تعيين التطبيق ==================
    reset: function() {
        if (this.modules.backup) {
            this.modules.backup.clearAllData();
        } else {
            localStorage.clear();
            location.reload();
        }
    }
};

// ================== تشغيل التطبيق ==================
App.init();

// ================== تصدير التطبيق للاستخدام العام ==================
window.app = App;
window.App = App;

// ================== دوال إضافية للتوافق مع الأكواد القديمة ==================
window.switchSection = (id) => App.showSection(id);
window.showSubSection = (id) => App.showSubSection(id);
window.toggleSidebar = () => App.toggleSidebar();
window.openUserMenu = () => App.openUserMenu();
window.logout = () => App.logout();
window.checkPassword = () => App.checkPassword();
window.togglePasswordVisibility = () => App.togglePasswordVisibility();
window.showResetPassword = () => App.showResetPassword();
window.backToLogin = () => App.backToLogin();
window.useDefaultPassword = () => App.useDefaultPassword();
window.openBarcodeScanner = () => App.openBarcodeScanner();
window.startVoiceSearch = () => App.startVoiceSearch();
window.exportBackup = () => App.exportBackup();
window.uploadExcel = () => App.uploadExcel();

// ================== معالجة الأخطاء العامة ==================
window.addEventListener('error', function(e) {
    console.error('⚠️ خطأ عام:', e.error || e.message);
    
    // إظهار رسالة خطأ للمستخدم في حالة الأخطاء الحرجة
    if (e.message && e.message.includes('script')) {
        Swal.fire({
            icon: 'error',
            title: 'خطأ في تحميل الملفات',
            text: 'تأكد من وجود جميع ملفات JavaScript في المسارات الصحيحة',
            footer: 'راجع مجلد js/modules/'
        });
    }
});

// ================== حفظ الحالة قبل إغلاق الصفحة ==================
window.addEventListener('beforeunload', function() {
    App.saveSettings();
});

// ================== التحقق من التحميل الكامل ==================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM جاهز');
});

document.addEventListener('html-loaded', function() {
    console.log('✅ جميع أقسام HTML محملة');
});

// ================== إظهار شاشة الدخول إذا لم يكن مسجل الدخول ==================
if (!localStorage.getItem('isLoggedIn')) {
    setTimeout(() => {
        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) {
            loginScreen.style.display = 'flex';
        }
    }, 100);
}
