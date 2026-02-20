// ================== ai.js - ميزات الذكاء الاصطناعي والتحليلات المتقدمة ==================
// الرقم 28 في ترتيب الملفات - يعتمد على utils.js وجميع الوحدات الأخرى

const aiModule = (function() {
    // ================== دوال مساعدة داخلية ==================
    
    // ================== تحليل المبيعات وتوقع الاتجاهات ==================
    function analyzeSalesTrends(period = 30) {
        const salesInvoices = window.salesModule?.getInvoices() || [];
        const now = new Date();
        const startDate = new Date(now.getTime() - period * 24 * 60 * 60 * 1000);
        
        // تصفية الفواتير حسب الفترة
        const recentInvoices = salesInvoices.filter(inv => new Date(inv.date) >= startDate);
        
        if (recentInvoices.length < 5) {
            return {
                success: false,
                message: 'بيانات غير كافية للتحليل (تحتاج 5 فواتير على الأقل)',
                recommendations: ['قم بتسجيل المزيد من المبيعات للحصول على تحليل دقيق']
            };
        }
        
        // تحليل المبيعات اليومية
        const dailySales = {};
        recentInvoices.forEach(inv => {
            const date = new Date(inv.date).toDateString();
            dailySales[date] = (dailySales[date] || 0) + inv.grandTotal;
        });
        
        const dailyValues = Object.values(dailySales);
        const avgDaily = dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length;
        
        // حساب الاتجاه (زيادة أو نقصان)
        const firstHalf = dailyValues.slice(0, Math.floor(dailyValues.length / 2));
        const secondHalf = dailyValues.slice(Math.floor(dailyValues.length / 2));
        
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        
        const trend = secondAvg > firstAvg ? 'تصاعدي' : secondAvg < firstAvg ? 'تنازلي' : 'مستقر';
        const trendPercentage = ((secondAvg - firstAvg) / firstAvg * 100).toFixed(1);
        
        // توقع المبيعات للأيام القادمة
        const predictions = [];
        let lastValue = dailyValues[dailyValues.length - 1] || avgDaily;
        
        for (let i = 1; i <= 7; i++) {
            // نموذج بسيط للتوقع (متوسط متحرك مع بعض العشوائية)
            const variance = (Math.random() * 0.2 - 0.1) * lastValue; // -10% إلى +10%
            let predicted = lastValue + variance;
            
            // إضافة تأثير الاتجاه
            if (trend === 'تصاعدي') predicted *= 1.02;
            else if (trend === 'تنازلي') predicted *= 0.98;
            
            predictions.push({
                day: i,
                date: new Date(now.getTime() + i * 24 * 60 * 60 * 1000).toLocaleDateString('ar-EG'),
                predicted: Math.max(0, Math.round(predicted))
            });
            
            lastValue = predicted;
        }
        
        return {
            success: true,
            period: period,
            summary: {
                totalInvoices: recentInvoices.length,
                totalSales: recentInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0),
                averageDaily: Math.round(avgDaily),
                bestDay: Math.max(...dailyValues),
                worstDay: Math.min(...dailyValues)
            },
            trend: {
                direction: trend,
                percentage: trendPercentage,
                interpretation: trend === 'تصاعدي' ? 'المبيعات في تحسن' : 
                               trend === 'تنازلي' ? 'المبيعات في تراجع' : 'المبيعات مستقرة'
            },
            predictions: predictions,
            recommendations: generateSalesRecommendations(trend, avgDaily, predictions)
        };
    }
    
    // ================== توليد توصيات للمبيعات ==================
    function generateSalesRecommendations(trend, avgDaily, predictions) {
        const recommendations = [];
        
        if (trend === 'تنازلي') {
            recommendations.push('المبيعات في انخفاض - فكر في عروض ترويجية');
            recommendations.push('راجع أسعار المنافسين');
            recommendations.push('حسن خدمة العملاء');
        } else if (trend === 'تصاعدي') {
            recommendations.push('المبيعات في ارتفاع - حافظ على المخزون');
            recommendations.push('فكر في توسيع مجموعة المنتجات');
        }
        
        if (avgDaily < 1000) {
            recommendations.push('متوسط المبيعات منخفض - ركز على المنتجات الأكثر مبيعاً');
        } else if (avgDaily > 10000) {
            recommendations.push('أداء ممتاز - استمر في نفس النهج');
        }
        
        const nextWeekTotal = predictions.reduce((sum, p) => sum + p.predicted, 0);
        recommendations.push(`توقع المبيعات للأسبوع القادم: ${utilsModule.formatCurrency(nextWeekTotal)}`);
        
        return recommendations;
    }
    
    // ================== تحليل أداء المنتجات ==================
    function analyzeProducts() {
        const products = window.productModule?.getAllProducts() || [];
        const salesInvoices = window.salesModule?.getInvoices() || [];
        
        if (products.length === 0) {
            return {
                success: false,
                message: 'لا توجد منتجات للتحليل'
            };
        }
        
        // تحليل مبيعات المنتجات
        const productSales = {};
        const productProfit = {};
        
        salesInvoices.forEach(inv => {
            inv.items.forEach(item => {
                if (!productSales[item.productId]) {
                    productSales[item.productId] = {
                        productId: item.productId,
                        name: item.name,
                        quantity: 0,
                        total: 0,
                        count: 0
                    };
                }
                productSales[item.productId].quantity += item.qty;
                productSales[item.productId].total += item.total;
                productSales[item.productId].count += 1;
            });
        });
        
        // حساب الربح لكل منتج
        products.forEach(product => {
            const sales = productSales[product.id] || { quantity: 0, total: 0 };
            const cost = product.buyPrice * sales.quantity;
            const revenue = sales.total;
            productProfit[product.id] = {
                productId: product.id,
                name: product.name,
                cost: cost,
                revenue: revenue,
                profit: revenue - cost,
                margin: revenue > 0 ? ((revenue - cost) / revenue * 100).toFixed(1) : 0
            };
        });
        
        // تصنيف المنتجات
        const categories = {};
        products.forEach(product => {
            const cat = product.category || 'عام';
            if (!categories[cat]) {
                categories[cat] = {
                    name: cat,
                    count: 0,
                    totalSales: 0,
                    totalProfit: 0
                };
            }
            categories[cat].count++;
            categories[cat].totalSales += productSales[product.id]?.total || 0;
            categories[cat].totalProfit += productProfit[product.id]?.profit || 0;
        });
        
        // أفضل المنتجات وأسوأها
        const topBySales = Object.values(productSales)
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
        
        const topByProfit = Object.values(productProfit)
            .filter(p => p.profit > 0)
            .sort((a, b) => b.profit - a.profit)
            .slice(0, 5);
        
        const bottomBySales = Object.values(productSales)
            .sort((a, b) => a.total - b.total)
            .slice(0, 5);
        
        // منتجات لم تبع أبداً
        const unsoldProducts = products.filter(p => !productSales[p.id]);
        
        return {
            success: true,
            summary: {
                totalProducts: products.length,
                productsWithSales: Object.keys(productSales).length,
                unsoldCount: unsoldProducts.length,
                totalRevenue: Object.values(productSales).reduce((sum, p) => sum + p.total, 0),
                totalProfit: Object.values(productProfit).reduce((sum, p) => sum + p.profit, 0)
            },
            topBySales: topBySales,
            topByProfit: topByProfit,
            bottomBySales: bottomBySales,
            unsoldProducts: unsoldProducts,
            categories: Object.values(categories),
            recommendations: generateProductRecommendations(unsoldProducts, bottomBySales, topBySales)
        };
    }
    
    // ================== توليد توصيات للمنتجات ==================
    function generateProductRecommendations(unsold, bottom, top) {
        const recommendations = [];
        
        if (unsold.length > 0) {
            recommendations.push(`لديك ${unsold.length} منتجات لم تبع - فكر في تخفيضات أو عروض`);
        }
        
        if (bottom.length > 0) {
            recommendations.push('المنتجات الأقل مبيعاً تحتاج إلى مراجعة');
        }
        
        if (top.length > 0) {
            recommendations.push('ركز على المنتجات الأكثر مبيعاً وزد مخزونها');
        }
        
        return recommendations;
    }
    
    // ================== تحليل العملاء ==================
    function analyzeCustomers() {
        const customers = window.customerModule?.getAllCustomers() || [];
        const salesInvoices = window.salesModule?.getInvoices() || [];
        
        if (customers.length === 0) {
            return {
                success: false,
                message: 'لا توجد عملاء للتحليل'
            };
        }
        
        // تحليل مشتريات العملاء
        const customerAnalysis = customers.map(customer => {
            const customerInvoices = salesInvoices.filter(inv => inv.customerId === customer.id);
            const totalSpent = customerInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
            const frequency = customerInvoices.length;
            const lastPurchase = customerInvoices[0]?.date || null;
            
            let category = 'جديد';
            let score = 0;
            
            if (frequency > 10 && totalSpent > 100000) {
                category = 'VIP';
                score = 100;
            } else if (frequency > 5 && totalSpent > 50000) {
                category = 'ممتاز';
                score = 80;
            } else if (frequency > 2 && totalSpent > 10000) {
                category = 'جيد';
                score = 60;
            } else if (frequency > 0) {
                category = 'عادي';
                score = 40;
            }
            
            // حساب أيام منذ آخر شراء
            let daysSinceLast = null;
            if (lastPurchase) {
                daysSinceLast = Math.ceil((new Date() - new Date(lastPurchase)) / (1000 * 60 * 60 * 24));
                if (daysSinceLast > 60) score -= 20;
                else if (daysSinceLast > 30) score -= 10;
            }
            
            return {
                id: customer.id,
                name: customer.name,
                totalSpent,
                frequency,
                category,
                score,
                lastPurchase,
                daysSinceLast,
                avgPerPurchase: frequency > 0 ? totalSpent / frequency : 0
            };
        });
        
        // تصنيف العملاء
        const classification = {
            vip: customerAnalysis.filter(c => c.category === 'VIP').length,
            excellent: customerAnalysis.filter(c => c.category === 'ممتاز').length,
            good: customerAnalysis.filter(c => c.category === 'جيد').length,
            regular: customerAnalysis.filter(c => c.category === 'عادي').length,
            new: customerAnalysis.filter(c => c.category === 'جديد').length
        };
        
        // عملاء غير نشطين
        const inactiveCustomers = customerAnalysis.filter(c => c.daysSinceLast && c.daysSinceLast > 30);
        
        // أفضل العملاء
        const topBySpending = [...customerAnalysis]
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 5);
        
        const topByFrequency = [...customerAnalysis]
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 5);
        
        return {
            success: true,
            summary: {
                totalCustomers: customers.length,
                activeCustomers: customerAnalysis.filter(c => c.frequency > 0).length,
                inactiveCount: inactiveCustomers.length,
                totalRevenue: customerAnalysis.reduce((sum, c) => sum + c.totalSpent, 0),
                averagePerCustomer: customerAnalysis.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length
            },
            classification: classification,
            topBySpending: topBySpending,
            topByFrequency: topByFrequency,
            inactiveCustomers: inactiveCustomers.slice(0, 5),
            recommendations: generateCustomerRecommendations(inactiveCustomers, classification)
        };
    }
    
    // ================== توليد توصيات للعملاء ==================
    function generateCustomerRecommendations(inactive, classification) {
        const recommendations = [];
        
        if (inactive.length > 0) {
            recommendations.push(`لديك ${inactive.length} عملاء غير نشطين - أرسل لهم عروض خاصة`);
        }
        
        if (classification.vip > 0) {
            recommendations.push('عملاء VIP يحتاجون إلى معاملة خاصة ومزايا حصرية');
        }
        
        if (classification.new > 5) {
            recommendations.push('لديك عملاء جدد - شجعهم على الشراء مرة أخرى');
        }
        
        return recommendations;
    }
    
    // ================== تحليل المخزون ==================
    function analyzeInventory() {
        const products = window.productModule?.getAllProducts() || [];
        const inventoryLogs = window.inventoryModule?.inventoryLogs || [];
        
        if (products.length === 0) {
            return {
                success: false,
                message: 'لا توجد منتجات للتحليل'
            };
        }
        
        // تحليل حركة المخزون
        const now = new Date();
        const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const recentLogs = inventoryLogs.filter(log => new Date(log.date) >= lastMonth);
        
        const inbound = recentLogs.filter(l => l.type === 'add').reduce((sum, l) => sum + l.quantity, 0);
        const outbound = recentLogs.filter(l => l.type === 'remove').reduce((sum, l) => sum + Math.abs(l.quantity), 0);
        
        // معدل دوران المخزون
        const avgInventory = products.reduce((sum, p) => sum + p.quantity, 0) / products.length;
        const turnoverRate = outbound / (avgInventory || 1);
        
        // المنتجات حسب الحالة
        const lowStock = products.filter(p => p.quantity <= p.minStock);
        const outOfStock = products.filter(p => p.quantity === 0);
        const overStock = products.filter(p => p.maxStock && p.quantity > p.maxStock);
        
        // قيمة المخزون
        const totalValue = products.reduce((sum, p) => sum + (p.buyPrice * p.quantity), 0);
        const totalSellValue = products.reduce((sum, p) => sum + (p.sellPrice * p.quantity), 0);
        
        return {
            success: true,
            summary: {
                totalProducts: products.length,
                totalQuantity: products.reduce((sum, p) => sum + p.quantity, 0),
                totalValue: totalValue,
                totalSellValue: totalSellValue,
                potentialProfit: totalSellValue - totalValue
            },
            movement: {
                inbound: inbound,
                outbound: outbound,
                turnoverRate: turnoverRate.toFixed(2),
                netChange: inbound - outbound
            },
            status: {
                lowStock: lowStock.length,
                outOfStock: outOfStock.length,
                overStock: overStock.length,
                healthy: products.length - (lowStock.length + outOfStock.length + overStock.length)
            },
            lowStockProducts: lowStock.slice(0, 5),
            recommendations: generateInventoryRecommendations(lowStock, outOfStock, overStock, turnoverRate)
        };
    }
    
    // ================== توليد توصيات للمخزون ==================
    function generateInventoryRecommendations(lowStock, outOfStock, overStock, turnoverRate) {
        const recommendations = [];
        
        if (lowStock.length > 0) {
            recommendations.push(`${lowStock.length} منتجات تحتاج إلى إعادة طلب`);
        }
        
        if (outOfStock.length > 0) {
            recommendations.push(`${outOfStock.length} منتجات نفدت من المخزون`);
        }
        
        if (overStock.length > 0) {
            recommendations.push(`${overStock.length} منتجات تتجاوز الحد الأقصى - فكر في تخفيضات`);
        }
        
        if (turnoverRate < 1) {
            recommendations.push('معدل دوران المخزون منخفض - بطء في الحركة');
        } else if (turnoverRate > 5) {
            recommendations.push('معدل دوران المخزون مرتفع - تأكد من توفر المخزون دائماً');
        }
        
        return recommendations;
    }
    
    // ================== تحليل الأداء المالي ==================
    function analyzeFinancial() {
        const salesInvoices = window.salesModule?.getInvoices() || [];
        const purchaseInvoices = window.purchasesModule?.getInvoices() || [];
        const debts = window.debtModule?.debts || [];
        
        // إجمالي المبيعات
        const totalSales = salesInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
        const totalPurchases = purchaseInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
        
        // تحليل الديون
        const activeDebts = debts.filter(d => d.status !== 'paid');
        const totalDebt = activeDebts.reduce((sum, d) => sum + d.remaining, 0);
        const customerDebt = activeDebts.filter(d => d.partyType === 'customer').reduce((sum, d) => sum + d.remaining, 0);
        const supplierDebt = activeDebts.filter(d => d.partyType === 'supplier').reduce((sum, d) => sum + d.remaining, 0);
        
        // الربح التقديري
        const grossProfit = totalSales - totalPurchases;
        const profitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;
        
        return {
            success: true,
            summary: {
                totalSales: totalSales,
                totalPurchases: totalPurchases,
                grossProfit: grossProfit,
                profitMargin: profitMargin.toFixed(1),
                netCashflow: totalSales - totalPurchases - customerDebt + supplierDebt
            },
            debts: {
                total: totalDebt,
                customer: customerDebt,
                supplier: supplierDebt,
                customerCount: activeDebts.filter(d => d.partyType === 'customer').length,
                supplierCount: activeDebts.filter(d => d.partyType === 'supplier').length
            },
            recommendations: generateFinancialRecommendations(profitMargin, customerDebt, supplierDebt)
        };
    }
    
    // ================== توليد توصيات مالية ==================
    function generateFinancialRecommendations(profitMargin, customerDebt, supplierDebt) {
        const recommendations = [];
        
        if (profitMargin < 10) {
            recommendations.push('هامش الربح منخفض - راجع الأسعار أو خفض التكاليف');
        } else if (profitMargin > 30) {
            recommendations.push('هامش ربح ممتاز - استمر في نفس النهج');
        }
        
        if (customerDebt > 100000) {
            recommendations.push('ديون العملاء مرتفعة - فكر في تحصيل الديون');
        }
        
        if (supplierDebt > 100000) {
            recommendations.push('ديون الموردين مرتفعة - راجع جدولة السداد');
        }
        
        return recommendations;
    }
    
    // ================== توقع الكمية المثلى للطلب ==================
    function predictOptimalOrderQuantity(productId) {
        const product = window.productModule?.getProduct(productId);
        if (!product) return null;
        
        const salesInvoices = window.salesModule?.getInvoices() || [];
        const productSales = salesInvoices
            .flatMap(inv => inv.items)
            .filter(item => item.productId == productId);
        
        if (productSales.length === 0) {
            return {
                productName: product.name,
                currentStock: product.quantity,
                suggestedOrder: product.minStock,
                confidence: 'منخفض',
                reasoning: 'لا توجد مبيعات سابقة، اقتراح بالحد الأدنى'
            };
        }
        
        // حساب متوسط المبيعات اليومية
        const dates = productSales.map(s => new Date(s.date));
        const oldestDate = new Date(Math.min(...dates));
        const daysDiff = Math.max(1, Math.ceil((new Date() - oldestDate) / (1000 * 60 * 60 * 24)));
        
        const avgDaily = productSales.reduce((sum, s) => sum + s.qty, 0) / daysDiff;
        
        // تحليل موسمية
        const monthlySales = {};
        productSales.forEach(s => {
            const month = new Date(s.date).getMonth();
            monthlySales[month] = (monthlySales[month] || 0) + s.qty;
        });
        
        const currentMonth = new Date().getMonth();
        const seasonalFactor = monthlySales[currentMonth] ? 
            monthlySales[currentMonth] / (Object.values(monthlySales).reduce((a, b) => a + b, 0) / 12) : 1;
        
        // وقت التوريد المقدر (أيام)
        const leadTime = 7;
        
        // مخزون الأمان (20% من الطلب خلال فترة التوريد)
        const safetyStock = Math.ceil(avgDaily * leadTime * 0.2);
        
        // كمية الطلب المثلى (تكفي لـ 30 يوماً + مخزون أمان - المخزون الحالي)
        const coverage = 30;
        const optimalOrder = Math.max(0, Math.ceil(avgDaily * coverage * seasonalFactor + safetyStock - product.quantity));
        
        let confidence = 'مرتفع';
        if (productSales.length < 10) confidence = 'متوسط';
        if (productSales.length < 5) confidence = 'منخفض';
        
        return {
            productName: product.name,
            currentStock: product.quantity,
            avgDailySales: Math.round(avgDaily * 10) / 10,
            seasonalFactor: seasonalFactor.toFixed(2),
            safetyStock: safetyStock,
            suggestedOrder: optimalOrder,
            confidence: confidence,
            reasoning: confidence === 'مرتفع' ? 'بناءً على تحليل المبيعات السابقة' :
                       'بيانات محدودة، يفضل طلب كمية أقل'
        };
    }
    
    // ================== الحصول على تحليل شامل ==================
    function getFullAnalysis() {
        return {
            timestamp: new Date().toISOString(),
            sales: analyzeSalesTrends(),
            products: analyzeProducts(),
            customers: analyzeCustomers(),
            inventory: analyzeInventory(),
            financial: analyzeFinancial(),
            recommendations: generateAllRecommendations()
        };
    }
    
    // ================== توليد جميع التوصيات ==================
    function generateAllRecommendations() {
        const recommendations = [];
        
        // من تحليل المبيعات
        const salesAnalysis = analyzeSalesTrends();
        if (salesAnalysis.success) {
            recommendations.push(...salesAnalysis.recommendations);
        }
        
        // من تحليل المنتجات
        const productAnalysis = analyzeProducts();
        if (productAnalysis.success) {
            recommendations.push(...productAnalysis.recommendations);
        }
        
        // من تحليل العملاء
        const customerAnalysis = analyzeCustomers();
        if (customerAnalysis.success) {
            recommendations.push(...customerAnalysis.recommendations);
        }
        
        // من تحليل المخزون
        const inventoryAnalysis = analyzeInventory();
        if (inventoryAnalysis.success) {
            recommendations.push(...inventoryAnalysis.recommendations);
        }
        
        // من تحليل مالي
        const financialAnalysis = analyzeFinancial();
        if (financialAnalysis.success) {
            recommendations.push(...financialAnalysis.recommendations);
        }
        
        return {
            count: recommendations.length,
            list: recommendations,
            priority: recommendations.slice(0, 3) // أهم 3 توصيات
        };
    }
    
    // ================== تصدير تقرير تحليل ==================
    function exportAnalysisReport() {
        const analysis = getFullAnalysis();
        
        const report = {
            title: 'تقرير تحليل الأداء الشامل',
            date: utilsModule.formatDate(new Date()),
            summary: {
                sales: analysis.sales.summary,
                products: analysis.products.summary,
                customers: analysis.customers.summary,
                inventory: analysis.inventory.summary,
                financial: analysis.financial.summary
            },
            recommendations: analysis.recommendations.list
        };
        
        const reportJSON = JSON.stringify(report, null, 2);
        const blob = new Blob([reportJSON], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `analysis_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        
        utilsModule.showNotification('نجاح', 'تم تصدير تقرير التحليل');
    }
    
    // ================== عرض التحليل في واجهة المستخدم ==================
    function showAnalysis() {
        const analysis = getFullAnalysis();
        
        let html = `
            <div style="text-align:right; max-height:500px; overflow-y:auto; padding:10px;">
                <h4>📊 ملخص التحليل</h4>
                <hr>
        `;
        
        if (analysis.sales.success) {
            html += `
                <h5>💰 المبيعات</h5>
                <p>إجمالي المبيعات: ${utilsModule.formatCurrency(analysis.sales.summary.totalSales)}</p>
                <p>متوسط يومي: ${utilsModule.formatCurrency(analysis.sales.summary.averageDaily)}</p>
                <p>الاتجاه: ${analysis.sales.trend.interpretation}</p>
            `;
        }
        
        if (analysis.products.success) {
            html += `
                <h5>📦 المنتجات</h5>
                <p>إجمالي المنتجات: ${analysis.products.summary.totalProducts}</p>
                <p>منتجات لم تبع: ${analysis.products.summary.unsoldCount}</p>
                <p>إجمالي الربح: ${utilsModule.formatCurrency(analysis.products.summary.totalProfit)}</p>
            `;
        }
        
        html += '<h5>📋 أهم التوصيات</h5><ul>';
        analysis.recommendations.list.slice(0, 5).forEach(rec => {
            html += `<li>${rec}</li>`;
        });
        html += '</ul></div>';
        
        Swal.fire({
            title: 'تحليل الأداء',
            html: html,
            width: '700px',
            showCancelButton: true,
            confirmButtonText: 'تصدير التقرير',
            cancelButtonText: 'إغلاق'
        }).then((result) => {
            if (result.isConfirmed) {
                exportAnalysisReport();
            }
        });
    }
    
    // ================== تهيئة الوحدة ==================
    function init() {
        console.log('✅ aiModule initialized - الرقم 28');
        console.log('   ميزات الذكاء الاصطناعي والتحليلات جاهزة');
    }
    
    // ================== واجهة الوحدة ==================
    return {
        // تحليلات
        analyzeSalesTrends,
        analyzeProducts,
        analyzeCustomers,
        analyzeInventory,
        analyzeFinancial,
        
        // توقعات
        predictOptimalOrderQuantity,
        
        // تقارير شاملة
        getFullAnalysis,
        generateAllRecommendations,
        
        // عرض وتصدير
        showAnalysis,
        exportAnalysisReport,
        
        // تهيئة
        init
    };
})();

// ================== تصدير للاستخدام العام ==================
window.aiModule = aiModule;

// ================== دوال مختصرة للاستخدام في HTML ==================
window.showAIAnalysis = () => aiModule.showAnalysis();
window.exportAnalysis = () => aiModule.exportAnalysisReport();

// ================== تهيئة تلقائية ==================
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        if (aiModule && aiModule.init) {
            aiModule.init();
        }
    });
    
    document.addEventListener('html-loaded', function() {
        if (aiModule && aiModule.init) {
            aiModule.init();
        }
    });
}
