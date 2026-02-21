// ================== app.js - الملف الرئيسي للتطبيق ==================
// الرقم 31 في ترتيب الملفات - يربط جميع الوحدات

const App = {
    version: '2.0.0',
    name: 'سوبر - النظام المتكامل',
    modules: {},
    
    // ================== تهيئة التطبيق ==================
    init: function() {
        console.log(`🚀 بدأ تشغيل ${this.name} الإصدار ${this.version}`);
        this.checkLoginStatus();
        this.waitForHTML();
    },
    
    checkLoginStatus: function() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        if (isLoggedIn) {
            setTimeout(() => {
                document.getElementById('login-screen')?.style.display = 'none';
            }, 100);
        }
    },
    
    waitForHTML: function() {
        if (document.getElementById('sales-section')) {
            this.registerModules();
        } else {
            document.addEventListener('html-loaded', () => this.registerModules());
            setTimeout(() => {
                if (document.getElementById('sales-section')) {
                    this.registerModules();
                }
            }, 1000);
        }
    },
    
    registerModules: function() {
        console.log('✅ HTML جاهز، تسجيل الوحدات...');
        
        const modules = [
            'utils', 'product', 'inventory', 'customer', 'supplier',
            'sales', 'purchases', 'invoices', 'reports', 'debt',
            'backup', 'ai'
        ];
        
        modules.forEach(name => {
            const module = window[`${name}Module`];
            if (module) {
                this.modules[name] = module;
                if (typeof module.init === 'function') {
                    try {
                        module.init();
                        console.log(`✅ ${name}Module initialized`);
                    } catch (e) {
                        console.error(`❌ خطأ في تهيئة ${name}Module:`, e);
                    }
                }
            } else {
                console.warn(`⚠️ ${name}Module غير موجود`);
            }
        });
        
        this.refreshAllSections();
        console.log('🎉 التطبيق جاهز للعمل!');
    },
    
    refreshAllSections: function() {
        if (this.modules.product) this.modules.product.renderProducts?.();
        if (this.modules.customer) this.modules.customer.renderCustomers?.();
        if (this.modules.supplier) this.modules.supplier.renderSuppliers?.();
        if (this.modules.sales) this.modules.sales.renderCart?.();
        if (this.modules.purchases) this.modules.purchases.renderCart?.();
        if (this.modules.invoices) this.modules.invoices.refresh?.();
        if (this.modules.reports) this.modules.reports.updateDashboard?.();
        if (this.modules.debt) {
            this.modules.debt.renderAllDebts?.();
            this.modules.debt.updateStats?.();
        }
    },
    
    getModule: function(name) {
        return this.modules[name] || null;
    }
};

App.init();
window.app = App;
