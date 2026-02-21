// ================== app.js - الملف الرئيسي للتطبيق ==================
// الرقم 31 في ترتيب الملفات - يربط جميع الوحدات ويدير التطبيق

const App = {
    // ================== خصائص التطبيق ==================
    version: '2.0.0',
    name: 'سوبر - النظام المتكامل 2026',
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
                if (loginScreen) loginScreen.style.display = 'none';
            }, 100);
        }
    },
    
    // ================== انتظار تحميل HTML ==================
    waitForHTML: function() {
        if (document.getElementById('sales-section')) {
            this.registerModules();
        } else {
            document.addEventListener('html-loaded', () => {
                console.log('✅ HTML loaded, registering modules...');
                this.registerModules();
            });
            
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
            { name: 'debt', var: 'debtModule', required: true },
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
                    console.error(`❌ ${module.name}Module غير موجود - هذا الملف مطلوب`);
                    failCount++;
                } else {
                    console.log(`ℹ️ ${module.name}Module غير موجود (اختياري)`);
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
        this.refreshAllSections();
        this.setupGlobalEventListeners();
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
        
        if (this.modules.debt && this.modules.debt.renderAllDebts) {
            this.modules.debt.renderAllDebts();
            this.modules.debt.updateStats?.();
        }
    },
    
    // ================== إعداد مستمعي الأحداث العامة ==================
    setupGlobalEventListeners: function() {
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            const menuIcon = document.querySelector('.app-header i:first-child');
            if (sidebar?.classList.contains('show') && 
                !sidebar.contains(e.target) && 
                e.target !== menuIcon) {
                sidebar.classList.remove('show');
            }
        });
        
        document.addEventListener('click', (e) => {
            document.querySelectorAll('.search-results').forEach(box => {
                if (!box.contains(e.target) && !e.target.closest('.search-container')) {
                    box.classList.remove('show');
                }
            });
        });
        
        window.addEventListener('beforeunload', () => {
            this.saveSettings();
        });
    },
    
    // ================== تحميل الإعدادات ==================
    loadSettings: function() {
        try {
            const settings = JSON.parse(localStorage.getItem('app_settings') || '{}');
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
            this.refreshSection(sectionId);
        }
    },
    
    // ================== تحديث قسم معين ==================
    refreshSection: function(sectionId) {
        switch(sectionId) {
            case 'inventory':
                if (this.modules.product) this.modules.product.renderProducts?.();
                if (this.modules.inventory) this.modules.inventory.renderInventory?.();
                break;
            case 'reports':
                if (this.modules.reports) this.modules.reports.updateDashboard?.();
                break;
            case 'invoices':
                if (this.modules.invoices) this.modules.invoices.refresh?.();
                break;
            case 'debt':
                if (this.modules.debt) {
                    this.modules.debt.renderAllDebts?.();
                    this.modules.debt.renderCustomerDebts?.();
                    this.modules.debt.renderSupplierDebts?.();
                    this.modules.debt.renderPayments?.();
                    this.modules.debt.updateStats?.();
                }
                break;
            case 'ai':
                if (this.modules.ai && typeof loadAIOverview === 'function') {
                    setTimeout(loadAIOverview, 100);
                }
                break;
            case 'sales':
                if (this.modules.sales) {
                    if (this.modules.sales.loadCustomers) this.modules.sales.loadCustomers();
                    if (this.modules.sales.renderInvoices) this.modules.sales.renderInvoices();
                    if (this.modules.sales.renderCart) this.modules.sales.renderCart();
                }
                break;
            case 'purchases':
                if (this.modules.purchases) {
                    if (this.modules.purchases.loadSuppliers) this.modules.purchases.loadSuppliers();
                    if (this.modules.purchases.renderInvoices) this.modules.purchases.renderInvoices();
                    if (this.modules.purchases.renderCart) this.modules.purchases.renderCart();
                }
                break;
        }
    },
    
    // ================== تسجيل الدوال العامة ==================
    registerGlobalFunctions: function() {
        window.switchSection = (sectionId) => this.showSection(sectionId);
        window.showSubSection = (subId) => {
            const parent = document.querySelector('.active-section');
            if (!parent) return;
            parent.querySelectorAll('.sub-section').forEach(s => s.style.display = 'none');
            const target = document.getElementById(subId);
            if (target) target.style.display = 'block';
            
            const tabs = parent.querySelectorAll('.tab-item');
            tabs.forEach(t => t.classList.remove('active-red', 'active-green', 'active-nardo'));
            
            tabs.forEach(t => {
                if (t.getAttribute('onclick')?.includes(subId)) {
                    if (parent.id === 'sales') t.classList.add('active-red');
                    else if (parent.id === 'purchases') t.classList.add('active-green');
                    else if (parent.id === 'add' || parent.id === 'invoices' || parent.id === 'debt' || parent.id === 'ai') {
                        t.classList.add('active-nardo');
                    }
                }
            });
        };
        
        window.toggleSidebar = () => document.getElementById('sidebar')?.classList.toggle('show');
        window.openUserMenu = () => this.openUserMenu();
        window.logout = () => this.logout();
        
        window.checkPassword = () => {
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
        };
        
        window.togglePasswordVisibility = () => {
            const input = document.getElementById('password-input');
            const icon = document.querySelector('.toggle-password');
            if (input.type === 'password') {
                input.type = 'text';
                icon.textContent = 'visibility';
            } else {
                input.type = 'password';
                icon.textContent = 'visibility_off';
            }
        };
        
        window.showResetPassword = () => {
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('reset-password-screen').style.display = 'flex';
        };
        
        window.backToLogin = () => {
            document.getElementById('reset-password-screen').style.display = 'none';
            document.getElementById('login-screen').style.display = 'flex';
        };
        
        window.useDefaultPassword = () => {
            document.getElementById('password-input').value = '123456';
            backToLogin();
            this.showNotification('info', 'تم', 'تم تعيين كلمة السر إلى 123456');
        };
        
        window.openBarcodeScanner = (inputId) => {
            const modal = document.getElementById('barcodeScannerModal');
            if (modal) {
                const bsModal = new bootstrap.Modal(modal);
                bsModal.show();
            } else {
                this.showNotification('info', 'ماسح الباركود غير متوفر');
            }
        };
        
        window.startVoiceSearch = (callback) => {
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                const recognition = new SpeechRecognition();
                recognition.lang = 'ar-SA';
                
                recognition.onstart = () => {
                    Swal.fire({ title: '🎤 استمع...', text: 'تحدث الآن', timer: 5000, showConfirmButton: false });
                };
                
                recognition.onresult = (event) => {
                    const text = event.results[0][0].transcript;
                    if (callback) callback(text);
                };
                
                recognition.onerror = () => Swal.fire('خطأ', 'فشل التعرف على الصوت', 'error');
                recognition.start();
            } else {
                Swal.fire('خطأ', 'المتصفح لا يدعم البحث الصوتي', 'error');
            }
        };
        
        window.exportBackup = () => {
            if (this.modules.backup) {
                this.modules.backup.exportBackup();
            } else {
                this.showNotification('info', 'النسخ الاحتياطي غير متوفر');
            }
        };
        
        window.importBackup = () => document.getElementById('backup-file-input')?.click();
        
        document.getElementById('backup-file-input')?.addEventListener('change', (e) => {
            if (e.target.files.length > 0 && this.modules.backup) {
                this.modules.backup.importBackup(e.target.files[0]);
            }
        });
        
        window.uploadExcel = () => Swal.fire('رفع Excel', 'قريباً', 'info');
    },
    
    // ================== دوال إضافية ==================
    openUserMenu: function() {
        Swal.fire({
            title: 'حساب المستخدم',
            html: `
                <div style="text-align:right">
                    <p><strong>المستخدم:</strong> ريان ولدي</p>
                    <p><strong>الصلاحية:</strong> كاملة</p>
                    <p><strong>الإصدار:</strong> ${this.version}</p>
                    <p><strong>آخر دخول:</strong> ${new Date().toLocaleDateString('ar-EG')}</p>
                </div>
            `,
            confirmButtonText: 'تسجيل الخروج',
            showCancelButton: true,
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed) this.logout();
        });
    },
    
    logout: function() {
        localStorage.removeItem('isLoggedIn');
        location.reload();
    },
    
    showNotification: function(type, title, message) {
        if (this.modules.utils) {
            this.modules.utils.showNotification(title, message, type);
        } else {
            Swal.fire({ icon: type, title: title, text: message, timer: 2000, showConfirmButton: false });
        }
    },
    
    // ================== الحصول على إحصائيات سريعة ==================
    getQuickStats: function() {
        const products = this.modules.product?.products || [];
        const customers = this.modules.customer?.customers || [];
        const suppliers = this.modules.supplier?.suppliers || [];
        const salesInvoices = this.modules.sales?.invoices || [];
        const purchaseInvoices = this.modules.purchases?.invoices || [];
        
        return {
            products: products.length,
            customers: customers.length,
            suppliers: suppliers.length,
            sales: {
                count: salesInvoices.length,
                total: salesInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0)
            },
            purchases: {
                count: purchaseInvoices.length,
                total: purchaseInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0)
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

// ================== تصدير للاستخدام العام ==================
window.app = App;

console.log('✅ app.js loaded - الملف الرئيسي جاهز');
