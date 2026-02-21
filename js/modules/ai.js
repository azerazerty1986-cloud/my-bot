// ================== ai.js - الذكاء الاصطناعي والتحليلات المتقدمة ==================
// الرقم 28 في ترتيب الملفات - تحليلات ذكية وتوصيات

const aiModule = (function() {
    // ================== دوال مساعدة ==================
    function formatCurrency(amount) {
        return utilsModule?.formatCurrency(amount) || Number(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + ' دج';
    }
    
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    
    function showNotification(message, type = 'success') {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: type,
                title: type === 'success' ? 'توصية' : 'تنبيه',
                text: message,
                timer: 3000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
        }
    }
    
    // ================== تحليل المبيعات والتنبؤ ==================
    function analyzeSalesTrends(period = 30) {
        const salesInvoices = window.salesModule?.invoices || [];
        const now = new Date();
        const startDate = new Date(now.getTime() - period * 24 * 60 * 60 * 1000);
        
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
            dailySales[date] = (dailySales[date] || 0) + (inv.grandTotal || 0);
        });
        
        const dailyValues = Object.values(dailySales);
        const avgDaily = dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length;
        
        // حساب الاتجاه (زيادة أو نقصان)
        const firstHalf = dailyValues.slice(0, Math.floor(dailyValues.length / 2));
        const secondHalf = dailyValues.slice(Math.floor(dailyValues.length / 2));
        
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        
        const trend = secondAvg > firstAvg ? 'تصاعدي' : secondAvg < firstAvg ? 'تنازلي' : 'مستقر';
        const trendPercentage = firstAvg ? ((secondAvg - firstAvg) / firstAvg * 100).toFixed(1) : 0;
        
        // توقع المبيعات للأيام القادمة
        const predictions = [];
        let lastValue = dailyValues[dailyValues.length - 1] || avgDaily;
        
        for (let i = 1; i <= 7; i++) {
            const variance = (Math.random() * 0.2 - 0.1) * lastValue;
            let predicted = lastValue + variance;
            
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
                totalSales: recentInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0),
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
    
    function generateSalesRecommendations(trend, avgDaily, predictions) {
        const recommendations = [];
        
        if (trend === 'تنازلي') {
            recommendations.push('📉 المبيعات في انخفاض - فكر في عروض ترويجية');
            recommendations.push('🏷️ راجع أسعار المنافسين');
            recommendations.push('👥 حسن خدمة العملاء');
        } else if (trend === 'تصاعدي') {
            recommendations.push('📈 المبيعات في ارتفاع - حافظ على المخزون');
            recommendations.push('🆕 فكر في توسيع مجموعة المنتجات');
        }
        
        if (avgDaily < 1000) {
            recommendations.push('⚠️ متوسط المبيعات منخفض - ركز على المنتجات الأكثر مبيعاً');
        } else if (avgDaily > 10000) {
            recommendations.push('🌟 أداء ممتاز - استمر في نفس النهج');
        }
        
        const nextWeekTotal = predictions.reduce((sum, p) => sum + p.predicted, 0);
        recommendations.push(`📊 توقع المبيعات للأسبوع القادم: ${formatCurrency(nextWeekTotal)}`);
        
        return recommendations;
    }
    
    // ================== تحليل أداء المنتجات ==================
    function analyzeProducts() {
        const products = window.productModule?.products || [];
        const salesInvoices = window.salesModule?.invoices || [];
        
        if (products.length === 0) {
            return {
                success: false,
                message: 'لا توجد منتجات للتحليل'
            };
        }
        
        const productSales = {};
        const productProfit = {};
        
        salesInvoices.forEach(inv => {
            (inv.items || []).forEach(item => {
                if (!productSales[item.productId]) {
                    productSales[item.productId] = {
                        productId: item.productId,
                        name: item.name,
                        quantity: 0,
                        total: 0,
                        count: 0
                    };
                }
                productSales[item.productId].quantity += item.qty || 0;
                productSales[item.productId].total += item.total || 0;
                productSales[item.productId].count += 1;
            });
        });
        
        products.forEach(product => {
            const sales = productSales[product.id] || { quantity: 0, total: 0 };
            const cost = (product.buyPrice || 0) * sales.quantity;
            const revenue = sales.total;
            productProfit[product.id] = {
                productId: product.id,
                name: product.name,
                cost: cost,
                revenue: revenue,
                profit: revenue - cost,
                margin: revenue ? ((revenue - cost) / revenue * 100).toFixed(1) : 0
            };
        });
        
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
    
    function generateProductRecommendations(unsold, bottom, top) {
        const recommendations = [];
        
        if (unsold.length > 0) {
            recommendations.push(`📦 لديك ${unsold.length} منتجات لم تبع - فكر في تخفيضات أو عروض`);
        }
        
        if (bottom.length > 0) {
            recommendations.push('⚠️ المنتجات الأقل مبيعاً تحتاج إلى مراجعة');
            bottom.slice(0, 3).forEach(p => {
                recommendations.push(`   - ${p.name}: ${p.total} دج فقط`);
            });
        }
        
        if (top.length > 0) {
            recommendations.push('🌟 ركز على المنتجات الأكثر مبيعاً وزد مخزونها');
            top.slice(0, 3).forEach(p => {
                recommendations.push(`   - ${p.name}: ${p.quantity} وحدة مباعة`);
            });
        }
        
        return recommendations;
    }
    
    // ================== تحليل العملاء ==================
    function analyzeCustomers() {
        const customers = window.customerModule?.customers || [];
        const salesInvoices = window.salesModule?.invoices || [];
        
        if (customers.length === 0) {
            return {
                success: false,
                message: 'لا توجد عملاء للتحليل'
            };
        }
        
        const customerAnalysis = customers.map(customer => {
            const customerInvoices = salesInvoices.filter(inv => inv.customerId === customer.id);
            const totalSpent = customerInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
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
            
            let daysSinceLast = null;
            if (lastPurchase) {
                daysSinceLast = Math.ceil((new Date() - new Date(lastPurchase)) / (1000 * 60 * 60 * 24));
                if (daysSinceLast > 60) score -= 20;
                else if (daysSinceLast > 30) score -= 10;
            }
            
            return {
                id: customer.id,
                name: customer.fullname || customer.name,
                totalSpent,
                frequency,
                category,
                score,
                lastPurchase,
                daysSinceLast,
                avgPerPurchase: frequency ? totalSpent / frequency : 0
            };
        });
        
        const classification = {
            vip: customerAnalysis.filter(c => c.category === 'VIP').length,
            excellent: customerAnalysis.filter(c => c.category === 'ممتاز').length,
            good: customerAnalysis.filter(c => c.category === 'جيد').length,
            regular: customerAnalysis.filter(c => c.category === 'عادي').length,
            new: customerAnalysis.filter(c => c.category === 'جديد').length
        };
        
        const inactiveCustomers = customerAnalysis.filter(c => c.daysSinceLast && c.daysSinceLast > 30);
        
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
                averagePerCustomer: customers.length ? customerAnalysis.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length : 0
            },
            classification: classification,
            topBySpending: topBySpending,
            topByFrequency: topByFrequency,
            inactiveCustomers: inactiveCustomers.slice(0, 5),
            recommendations: generateCustomerRecommendations(inactiveCustomers, classification)
        };
    }
    
    function generateCustomerRecommendations(inactive, classification) {
        const recommendations = [];
        
        if (inactive.length > 0) {
            recommendations.push(`👥 لديك ${inactive.length} عملاء غير نشطين - أرسل لهم عروض خاصة`);
            inactive.slice(0, 3).forEach(c => {
                recommendations.push(`   - ${c.name}: لم يشتر منذ ${c.daysSinceLast} يوم`);
            });
        }
        
        if (classification.vip > 0) {
            recommendations.push('👑 عملاء VIP يحتاجون إلى معاملة خاصة ومزايا حصرية');
        }
        
        if (classification.new > 5) {
            recommendations.push('🆕 لديك عملاء جدد - شجعهم على الشراء مرة أخرى');
        }
        
        return recommendations;
    }
    
    // ================== تحليل المخزون ==================
    function analyzeInventory() {
        const products = window.productModule?.products || [];
        const inventoryLogs = window.inventoryModule?.inventoryLogs || [];
        
        if (products.length === 0) {
            return {
                success: false,
                message: 'لا توجد منتجات للتحليل'
            };
        }
        
        const now = new Date();
        const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const recentLogs = inventoryLogs.filter(log => new Date(log.date) >= lastMonth);
        
        const inbound = recentLogs.filter(l => l.type === 'add').reduce((sum, l) => sum + (l.quantity || 0), 0);
        const outbound = recentLogs.filter(l => l.type === 'remove').reduce((sum, l) => sum + Math.abs(l.quantity || 0), 0);
        
        const avgInventory = products.reduce((sum, p) => sum + (p.quantity || 0), 0) / products.length;
        const turnoverRate = outbound / (avgInventory || 1);
        
        const lowStock = products.filter(p => (p.quantity || 0) <= (p.minStock || 5));
        const outOfStock = products.filter(p => (p.quantity || 0) === 0);
        const overStock = products.filter(p => (p.maxStock || 999999) && (p.quantity || 0) > (p.maxStock || 999999));
        
        const totalValue = products.reduce((sum, p) => sum + ((p.buyPrice || 0) * (p.quantity || 0)), 0);
        const totalSellValue = products.reduce((sum, p) => sum + ((p.sellPrice || 0) * (p.quantity || 0)), 0);
        
        return {
            success: true,
            summary: {
                totalProducts: products.length,
                totalQuantity: products.reduce((sum, p) => sum + (p.quantity || 0), 0),
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
    
    function generateInventoryRecommendations(lowStock, outOfStock, overStock, turnoverRate) {
        const recommendations = [];
        
        if (lowStock.length > 0) {
            recommendations.push(`⚠️ ${lowStock.length} منتجات تحتاج إلى إعادة طلب:`);
            lowStock.slice(0, 3).forEach(p => {
                recommendations.push(`   - ${p.name}: ${p.quantity} / ${p.minStock}`);
            });
        }
        
        if (outOfStock.length > 0) {
            recommendations.push(`❌ ${outOfStock.length} منتجات نفدت من المخزون`);
        }
        
        if (overStock.length > 0) {
            recommendations.push(`📦 ${overStock.length} منتجات تتجاوز الحد الأقصى - فكر في تخفيضات`);
        }
        
        if (turnoverRate < 1) {
            recommendations.push('🐢 معدل دوران المخزون منخفض - بطء في الحركة');
        } else if (turnoverRate > 5) {
            recommendations.push('⚡ معدل دوران المخزون مرتفع - تأكد من توفر المخزون دائماً');
        }
        
        return recommendations;
    }
    
    // ================== تحليل الأداء المالي ==================
    function analyzeFinancial() {
        const salesInvoices = window.salesModule?.invoices || [];
        const purchaseInvoices = window.purchasesModule?.invoices || [];
        const debts = window.debtModule?.debts || [];
        
        const totalSales = salesInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
        const totalPurchases = purchaseInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
        
        const activeDebts = debts.filter(d => d.status !== 'paid');
        const totalDebt = activeDebts.reduce((sum, d) => sum + (d.remaining || 0), 0);
        const customerDebt = activeDebts.filter(d => d.partyType === 'customer').reduce((sum, d) => sum + (d.remaining || 0), 0);
        const supplierDebt = activeDebts.filter(d => d.partyType === 'supplier').reduce((sum, d) => sum + (d.remaining || 0), 0);
        
        const grossProfit = totalSales - totalPurchases;
        const profitMargin = totalSales ? (grossProfit / totalSales) * 100 : 0;
        
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
    
    function generateFinancialRecommendations(profitMargin, customerDebt, supplierDebt) {
        const recommendations = [];
        
        if (profitMargin < 10) {
            recommendations.push('💰 هامش الربح منخفض - راجع الأسعار أو خفض التكاليف');
        } else if (profitMargin > 30) {
            recommendations.push('💹 هامش ربح ممتاز - استمر في نفس النهج');
        }
        
        if (customerDebt > 100000) {
            recommendations.push('⚠️ ديون العملاء مرتفعة - فكر في تحصيل الديون');
        }
        
        if (supplierDebt > 100000) {
            recommendations.push('⚠️ ديون الموردين مرتفعة - راجع جدولة السداد');
        }
        
        return recommendations;
    }
    
    // ================== توقع الكمية المثلى للطلب ==================
    function predictOptimalOrderQuantity(productId) {
        const product = window.productModule?.products?.find(p => p.id == productId);
        if (!product) return null;
        
        const salesInvoices = window.salesModule?.invoices || [];
        const productSales = salesInvoices
            .flatMap(inv => inv.items || [])
            .filter(item => item.productId == productId);
        
        if (productSales.length === 0) {
            return {
                productName: product.name,
                currentStock: product.quantity,
                suggestedOrder: product.minStock || 5,
                confidence: 'منخفض',
                reasoning: 'لا توجد مبيعات سابقة، اقتراح بالحد الأدنى'
            };
        }
        
        const dates = productSales.map(s => new Date(s.date));
        const oldestDate = new Date(Math.min(...dates));
        const daysDiff = Math.max(1, Math.ceil((new Date() - oldestDate) / (1000 * 60 * 60 * 24)));
        
        const avgDaily = productSales.reduce((sum, s) => sum + (s.qty || 0), 0) / daysDiff;
        
        const monthlySales = {};
        productSales.forEach(s => {
            const month = new Date(s.date).getMonth();
            monthlySales[month] = (monthlySales[month] || 0) + (s.qty || 0);
        });
        
        const currentMonth = new Date().getMonth();
        const seasonalFactor = monthlySales[currentMonth] ? 
            monthlySales[currentMonth] / (Object.values(monthlySales).reduce((a, b) => a + b, 0) / 12) : 1;
        
        const leadTime = 7;
        const safetyStock = Math.ceil(avgDaily * leadTime * 0.2);
        const coverage = 30;
        const optimalOrder = Math.max(0, Math.ceil(avgDaily * coverage * seasonalFactor + safetyStock - (product.quantity || 0)));
        
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
    
    // ================== تحليل موسمي ==================
    function analyzeSeasonality() {
        const salesInvoices = window.salesModule?.invoices || [];
        
        if (salesInvoices.length < 30) {
            return {
                success: false,
                message: 'بيانات غير كافية للتحليل الموسمي'
            };
        }
        
        const monthlyData = {};
        const dayOfWeekData = {};
        
        salesInvoices.forEach(inv => {
            const date = new Date(inv.date);
            const month = date.getMonth() + 1;
            const dayOfWeek = date.getDay();
            
            monthlyData[month] = (monthlyData[month] || 0) + (inv.grandTotal || 0);
            dayOfWeekData[dayOfWeek] = (dayOfWeekData[dayOfWeek] || 0) + (inv.grandTotal || 0);
        });
        
        const months = [
            'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ];
        
        const bestMonth = Object.entries(monthlyData).sort((a, b) => b[1] - a[1])[0];
        const worstMonth = Object.entries(monthlyData).sort((a, b) => a[1] - b[1])[0];
        
        const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const bestDay = Object.entries(dayOfWeekData).sort((a, b) => b[1] - a[1])[0];
        
        return {
            success: true,
            monthly: monthlyData,
            daily: dayOfWeekData,
            bestMonth: bestMonth ? {
                name: months[parseInt(bestMonth[0]) - 1],
                value: bestMonth[1]
            } : null,
            worstMonth: worstMonth ? {
                name: months[parseInt(worstMonth[0]) - 1],
                value: worstMonth[1]
            } : null,
            bestDay: bestDay ? {
                name: days[parseInt(bestDay[0])],
                value: bestDay[1]
            } : null,
            recommendations: [
                `🌟 أفضل شهر للمبيعات: ${bestMonth ? months[parseInt(bestMonth[0]) - 1] : 'غير معروف'}`,
                `📉 أقل شهر للمبيعات: ${worstMonth ? months[parseInt(worstMonth[0]) - 1] : 'غير معروف'}`,
                `📅 أفضل يوم للمبيعات: ${bestDay ? days[parseInt(bestDay[0])] : 'غير معروف'}`
            ]
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
            seasonality: analyzeSeasonality(),
            recommendations: generateAllRecommendations()
        };
    }
    
    // ================== توليد جميع التوصيات ==================
    function generateAllRecommendations() {
        const recommendations = [];
        
        const salesAnalysis = analyzeSalesTrends();
        if (salesAnalysis.success) {
            recommendations.push(...salesAnalysis.recommendations);
        }
        
        const productAnalysis = analyzeProducts();
        if (productAnalysis.success) {
            recommendations.push(...productAnalysis.recommendations);
        }
        
        const customerAnalysis = analyzeCustomers();
        if (customerAnalysis.success) {
            recommendations.push(...customerAnalysis.recommendations);
        }
        
        const inventoryAnalysis = analyzeInventory();
        if (inventoryAnalysis.success) {
            recommendations.push(...inventoryAnalysis.recommendations);
        }
        
        const financialAnalysis = analyzeFinancial();
        if (financialAnalysis.success) {
            recommendations.push(...financialAnalysis.recommendations);
        }
        
        const seasonality = analyzeSeasonality();
        if (seasonality.success) {
            recommendations.push(...seasonality.recommendations);
        }
        
        return {
            count: recommendations.length,
            list: recommendations,
            priority: recommendations.slice(0, 5)
        };
    }
    
    // ================== عرض التحليل ==================
    function showAnalysis() {
        const analysis = getFullAnalysis();
        
        let html = `
            <div style="text-align:right; max-height:500px; overflow-y:auto; padding:10px;">
                <h4 style="color: var(--primary);">📊 تحليل الأداء الشامل</h4>
                <hr>
        `;
        
        if (analysis.sales.success) {
            html += `
                <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                    <h5 style="color: var(--primary);">💰 المبيعات</h5>
                    <p>إجمالي المبيعات: ${formatCurrency(analysis.sales.summary.totalSales)}</p>
                    <p>متوسط يومي: ${formatCurrency(analysis.sales.summary.averageDaily)}</p>
                    <p>الاتجاه: ${analysis.sales.trend.interpretation}</p>
                </div>
            `;
        }
        
        if (analysis.products.success) {
            html += `
                <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                    <h5 style="color: var(--success);">📦 المنتجات</h5>
                    <p>إجمالي المنتجات: ${analysis.products.summary.totalProducts}</p>
                    <p>منتجات لم تبع: ${analysis.products.summary.unsoldCount}</p>
                    <p>إجمالي الربح: ${formatCurrency(analysis.products.summary.totalProfit)}</p>
                </div>
            `;
        }
        
        if (analysis.customers.success) {
            html += `
                <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                    <h5 style="color: var(--warning);">👥 العملاء</h5>
                    <p>إجمالي العملاء: ${analysis.customers.summary.totalCustomers}</p>
                    <p>عملاء نشطين: ${analysis.customers.summary.activeCustomers}</p>
                    <p>عملاء غير نشطين: ${analysis.customers.summary.inactiveCount}</p>
                </div>
            `;
        }
        
        html += '<h5 style="color: var(--danger);">📋 أهم التوصيات</h5><ul style="list-style: none; padding-right: 0;">';
        analysis.recommendations.list.slice(0, 7).forEach(rec => {
            html += `<li style="margin-bottom: 10px; padding: 8px; background: #f0f0f0; border-radius: 5px;">${rec}</li>`;
        });
        html += '</ul></div>';
        
        Swal.fire({
            title: 'تحليل الذكاء الاصطناعي',
            html: html,
            width: '700px',
            showCancelButton: true,
            confirmButtonText: 'تحديث التحليل',
            cancelButtonText: 'إغلاق'
        }).then((result) => {
            if (result.isConfirmed) {
                showAnalysis();
            }
        });
    }
    
    // ================== تصدير تقرير التحليل ==================
    function exportAnalysisReport() {
        const analysis = getFullAnalysis();
        
        const report = {
            title: 'تقرير تحليل الأداء الشامل',
            date: new Date().toLocaleString('ar-EG'),
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
        const blob = new Blob(['\uFEFF' + reportJSON], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai_analysis_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        
        showNotification('تم تصدير تقرير التحليل');
    }
    
    // ================== تهيئة الوحدة ==================
    function init() {
        console.log('✅ aiModule initialized - الرقم 28');
        console.log('   ميزات الذكاء الاصطناعي جاهزة');
    }
    
    // ================== واجهة الوحدة ==================
    return {
        analyzeSalesTrends,
        analyzeProducts,
        analyzeCustomers,
        analyzeInventory,
        analyzeFinancial,
        analyzeSeasonality,
        predictOptimalOrderQuantity,
        getFullAnalysis,
        generateAllRecommendations,
        showAnalysis,
        exportAnalysisReport,
        init
    };
})();

window.aiModule = aiModule;

// ================== دوال مختصرة للاستخدام في HTML ==================
window.showAIAnalysis = () => aiModule.showAnalysis();
window.exportAIAnalysis = () => aiModule.exportAnalysisReport();

// ================== تهيئة تلقائية ==================
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => aiModule.init());
    document.addEventListener('html-loaded', () => aiModule.init());
}
