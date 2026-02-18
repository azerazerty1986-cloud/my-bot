
// ================== نظام الذكاء الاصطناعي المتكامل ==================
const aiModule = (function() {
    let learningData = JSON.parse(localStorage.getItem('ai_learning_data')) || [];
    let predictions = JSON.parse(localStorage.getItem('ai_predictions')) || [];
    
    const CONFIG = {
        LEARNING_RATE: 0.1,
        PREDICTION_THRESHOLD: 0.7,
        MAX_HISTORY: 1000
    };

    // ================== نظام التعلم ==================
    function learn(action, data, result) {
        const learningEntry = {
            id: Date.now(),
            action: action,
            data: data,
            result: result,
            timestamp: new Date().toISOString(),
            success: result.success || false
        };
        
        learningData.push(learningEntry);
        if (learningData.length > CONFIG.MAX_HISTORY) {
            learningData = learningData.slice(-CONFIG.MAX_HISTORY);
        }
        
        localStorage.setItem('ai_learning_data', JSON.stringify(learningData));
        analyzePatterns();
        
        return learningEntry;
    }

    // ================== تحليل الأنماط ==================
    function analyzePatterns() {
        const patterns = {
            frequentActions: {},
            successRates: {},
            timePatterns: {}
        };
        
        learningData.forEach(entry => {
            if (!patterns.frequentActions[entry.action]) {
                patterns.frequentActions[entry.action] = 0;
            }
            patterns.frequentActions[entry.action]++;
            
            if (!patterns.successRates[entry.action]) {
                patterns.successRates[entry.action] = { success: 0, total: 0 };
            }
            patterns.successRates[entry.action].total++;
            if (entry.success) {
                patterns.successRates[entry.action].success++;
            }
            
            const hour = new Date(entry.timestamp).getHours();
            const timeSlot = Math.floor(hour / 4);
            if (!patterns.timePatterns[timeSlot]) {
                patterns.timePatterns[timeSlot] = 0;
            }
            patterns.timePatterns[timeSlot]++;
        });
        
        localStorage.setItem('ai_patterns', JSON.stringify(patterns));
        return patterns;
    }

    // ================== نظام التنبؤ ==================
    function predict(action, context = {}) {
        const patterns = JSON.parse(localStorage.getItem('ai_patterns')) || {};
        
        let prediction = {
            action: action,
            confidence: 0,
            suggestions: [],
            timestamp: new Date().toISOString()
        };
        
        let confidenceScore = 0;
        let factors = 0;
        
        if (patterns.successRates && patterns.successRates[action]) {
            const rate = patterns.successRates[action];
            confidenceScore += rate.success / rate.total;
            factors++;
        }
        
        prediction.confidence = factors > 0 ? confidenceScore / factors : 0.5;
        prediction.suggestions = generateSuggestions(action, context);
        
        predictions.push(prediction);
        if (predictions.length > 100) predictions = predictions.slice(-100);
        localStorage.setItem('ai_predictions', JSON.stringify(predictions));
        
        return prediction;
    }

    // ================== توليد اقتراحات ==================
    function generateSuggestions(action, context) {
        const suggestions = [];
        const hour = new Date().getHours();
        
        if (action === 'sale') {
            if (hour >= 18 && hour <= 22) {
                suggestions.push('وقت الذروة للمبيعات - جهز مخزونك');
            }
        } else if (action === 'purchase') {
            if (hour >= 8 && hour <= 10) {
                suggestions.push('وقت مناسب لطلب المشتريات');
            }
        }
        
        return suggestions;
    }

    // ================== تحليل سلوك المستخدم ==================
    function analyzeUserBehavior() {
        const behavior = {
            mostUsedActions: [],
            bestTimeToWork: '',
            recommendations: []
        };
        
        const patterns = JSON.parse(localStorage.getItem('ai_patterns')) || {};
        
        if (patterns.frequentActions) {
            behavior.mostUsedActions = Object.entries(patterns.frequentActions)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);
        }
        
        if (patterns.timePatterns) {
            const bestTimeSlot = Object.entries(patterns.timePatterns)
                .sort((a, b) => b[1] - a[1])[0];
            if (bestTimeSlot) {
                const slot = parseInt(bestTimeSlot[0]);
                behavior.bestTimeToWork = `${slot * 4}:00 - ${(slot + 1) * 4}:00`;
            }
        }
        
        return behavior;
    }

    // ================== توصيات ذكية ==================
    function getSmartRecommendations() {
        const recommendations = [];
        const stock = JSON.parse(localStorage.getItem('ryan_stock')) || [];
        const invoices = JSON.parse(localStorage.getItem('ryan_invoices')) || [];
        
        const lowStock = stock.filter(p => p.qty < 5);
        if (lowStock.length > 0) {
            recommendations.push({
                type: 'warning',
                message: `لديك ${lowStock.length} منتجات تحت حد النقص`,
                action: 'توجه إلى المخزن'
            });
        }
        
        const topProducts = {};
        invoices.forEach(inv => {
            inv.items.forEach(item => {
                if (!topProducts[item.name]) topProducts[item.name] = 0;
                topProducts[item.name] += item.qty;
            });
        });
        
        const bestSeller = Object.entries(topProducts).sort((a, b) => b[1] - a[1])[0];
        if (bestSeller) {
            recommendations.push({
                type: 'info',
                message: `الأكثر مبيعاً: ${bestSeller[0]}`,
                action: 'تأكد من توفره'
            });
        }
        
        return recommendations;
    }

    return {
        learn,
        predict,
        analyzeUserBehavior,
        getSmartRecommendations
    };
})();

window.aiModule = aiModule;
