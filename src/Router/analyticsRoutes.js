import { Router } from 'express';
import { 
    getOverview, 
    getSentimentDistribution, 
    getHourlyTrends, 
    getEscalations,
    getRealtimeMetrics
} from '../Analytics/analytics.js';

const analyticsRouter = Router();

// Middleware para validar API key (opcional)
const validateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    // Si tienes una API key configurada, descomenta y configura:
    // if (apiKey !== process.env.ANALYTICS_API_KEY) {
    //     return res.status(401).json({ error: 'API key inválida' });
    // }
    next();
};

// Ruta para métricas generales
analyticsRouter.get('/overview', validateApiKey, (req, res) => {
    try {
        const data = getOverview();
        res.json({
            success: true,
            data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error en /analytics/overview:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener métricas generales'
        });
    }
});

// Ruta para distribución de sentimientos
analyticsRouter.get('/sentiment-distribution', validateApiKey, (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const data = getSentimentDistribution(days);
        res.json({
            success: true,
            data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error en /analytics/sentiment-distribution:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener distribución de sentimientos'
        });
    }
});

// Ruta para tendencias por hora
analyticsRouter.get('/hourly-trends', validateApiKey, (req, res) => {
    try {
        const data = getHourlyTrends();
        res.json({
            success: true,
            data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error en /analytics/hourly-trends:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener tendencias por hora'
        });
    }
});

// Ruta para escalaciones
analyticsRouter.get('/escalations', validateApiKey, (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const data = getEscalations(limit);
        res.json({
            success: true,
            data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error en /analytics/escalations:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener escalaciones'
        });
    }
});

// Ruta para datos combinados (más eficiente para el dashboard)
analyticsRouter.get('/dashboard', validateApiKey, (req, res) => {
    try {
        const overview = getOverview();
        const sentimentDist = getSentimentDistribution(7);
        const hourlyTrends = getHourlyTrends();
        const escalations = getEscalations(5);

        res.json({
            success: true,
            data: {
                overview,
                sentimentDistribution: sentimentDist,
                hourlyTrends,
                escalations
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error en /analytics/dashboard:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener datos del dashboard'
        });
    }
});

// Ruta para estadísticas en tiempo real
analyticsRouter.get('/realtime', validateApiKey, (req, res) => {
    try {
        const data = getRealtimeMetrics();
        
        res.json({
            success: true,
            data,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error en /analytics/realtime:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener métricas en tiempo real'
        });
    }
});

export default analyticsRouter;
