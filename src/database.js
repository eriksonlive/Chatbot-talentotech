import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Sistema de base de datos para trazabilidad y analytics del chatbot
 */
export class ChatbotDatabase {
  constructor() {
    const dbPath = join(__dirname, '..', 'chatbot_analytics.db');
    this.db = new sqlite3.Database(dbPath);
    this.initializeTables();
  }

  /**
   * Inicializa las tablas de la base de datos
   */
  initializeTables() {
    // Tabla principal de conversaciones
    this.db.run(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        channel TEXT NOT NULL,
        message TEXT NOT NULL,
        response TEXT,
        intent TEXT,
        sentiment TEXT,
        confidence REAL,
        emotion TEXT,
        escalated BOOLEAN DEFAULT 0,
        response_time_ms INTEGER,
        session_id TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de métricas diarias agregadas
    this.db.run(`
      CREATE TABLE IF NOT EXISTS daily_metrics (
        date DATE PRIMARY KEY,
        total_messages INTEGER DEFAULT 0,
        unique_users INTEGER DEFAULT 0,
        positive_sentiment INTEGER DEFAULT 0,
        negative_sentiment INTEGER DEFAULT 0,
        neutral_sentiment INTEGER DEFAULT 0,
        escalations INTEGER DEFAULT 0,
        avg_confidence REAL DEFAULT 0,
        avg_response_time REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de usuarios únicos
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        total_messages INTEGER DEFAULT 0,
        preferred_channel TEXT,
        last_intent TEXT,
        last_sentiment TEXT,
        total_escalations INTEGER DEFAULT 0
      )
    `);

    // Tabla de intents más consultados
    this.db.run(`
      CREATE TABLE IF NOT EXISTS intent_stats (
        intent TEXT PRIMARY KEY,
        count INTEGER DEFAULT 0,
        last_used DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Índices para optimizar consultas
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_conversations_timestamp ON conversations(timestamp)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_conversations_sentiment ON conversations(sentiment)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_conversations_intent ON conversations(intent)`);

    console.log('📊 Base de datos de analytics inicializada correctamente');
  }

  /**
   * Registra una conversación completa
   */
  async logConversation(data) {
    const {
      userId,
      channel,
      message,
      response,
      intent = null,
      sentiment = null,
      confidence = null,
      emotion = null,
      escalated = false,
      responseTime = null,
      sessionId = null
    } = data;

    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      // Insertar conversación
      this.db.run(`
        INSERT INTO conversations (
          user_id, channel, message, response, intent, sentiment,
          confidence, emotion, escalated, response_time_ms, session_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId, channel, message, response, intent, sentiment,
        confidence, emotion, escalated, responseTime, sessionId
      ], function(err) {
        if (err) {
          console.error('Error logging conversation:', err);
          reject(err);
          return;
        }

        const conversationId = this.lastID;
        
        // Actualizar estadísticas en paralelo
        Promise.all([
          this.updateUserStats(userId, channel, intent, sentiment, escalated),
          this.updateIntentStats(intent),
          this.updateDailyMetrics(sentiment, confidence, responseTime, escalated)
        ]).then(() => {
          const endTime = Date.now();
          console.log(`📝 Conversación registrada en ${endTime - startTime}ms (ID: ${conversationId})`);
          resolve(conversationId);
        }).catch(reject);
      }.bind(this));
    });
  }

  /**
   * Actualiza estadísticas del usuario
   */
  updateUserStats(userId, channel, intent, sentiment, escalated) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        INSERT OR REPLACE INTO users (
          user_id, first_seen, last_seen, total_messages, 
          preferred_channel, last_intent, last_sentiment, total_escalations
        ) VALUES (
          ?,
          COALESCE((SELECT first_seen FROM users WHERE user_id = ?), CURRENT_TIMESTAMP),
          CURRENT_TIMESTAMP,
          COALESCE((SELECT total_messages FROM users WHERE user_id = ?), 0) + 1,
          ?,
          ?,
          ?,
          COALESCE((SELECT total_escalations FROM users WHERE user_id = ?), 0) + ?
        )
      `, [userId, userId, userId, channel, intent, sentiment, userId, escalated ? 1 : 0], 
      (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Actualiza estadísticas de intents
   */
  updateIntentStats(intent) {
    if (!intent) return Promise.resolve();

    return new Promise((resolve, reject) => {
      this.db.run(`
        INSERT OR REPLACE INTO intent_stats (intent, count, last_used)
        VALUES (?, COALESCE((SELECT count FROM intent_stats WHERE intent = ?), 0) + 1, CURRENT_TIMESTAMP)
      `, [intent, intent], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Actualiza métricas diarias
   */
  updateDailyMetrics(sentiment, confidence, responseTime, escalated) {
    const today = new Date().toISOString().split('T')[0];
    
    return new Promise((resolve, reject) => {
      // Primero obtener métricas actuales del día
      this.db.get(`SELECT * FROM daily_metrics WHERE date = ?`, [today], (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        const current = row || {
          total_messages: 0,
          positive_sentiment: 0,
          negative_sentiment: 0,
          neutral_sentiment: 0,
          escalations: 0,
          avg_confidence: 0,
          avg_response_time: 0
        };

        // Calcular nuevos valores
        const newTotalMessages = current.total_messages + 1;
        let newPositive = current.positive_sentiment;
        let newNegative = current.negative_sentiment;
        let newNeutral = current.neutral_sentiment;

        if (sentiment === 'POSITIVO') newPositive++;
        else if (sentiment === 'NEGATIVO') newNegative++;
        else newNeutral++;

        const newEscalations = current.escalations + (escalated ? 1 : 0);
        
        // Calcular promedios
        const newAvgConfidence = confidence ? 
          ((current.avg_confidence * current.total_messages) + confidence) / newTotalMessages :
          current.avg_confidence;

        const newAvgResponseTime = responseTime ?
          ((current.avg_response_time * current.total_messages) + responseTime) / newTotalMessages :
          current.avg_response_time;

        // Actualizar o insertar métricas diarias
        this.db.run(`
          INSERT OR REPLACE INTO daily_metrics (
            date, total_messages, positive_sentiment, negative_sentiment,
            neutral_sentiment, escalations, avg_confidence, avg_response_time, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
          today, newTotalMessages, newPositive, newNegative,
          newNeutral, newEscalations, newAvgConfidence, newAvgResponseTime
        ], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  }

  /**
   * Obtiene métricas generales para el dashboard
   */
  async getOverviewMetrics() {
    return new Promise((resolve, reject) => {
      const queries = [
        // Métricas del día actual
        `SELECT * FROM daily_metrics WHERE date = date('now')`,
        
        // Total de usuarios únicos
        `SELECT COUNT(*) as total_users FROM users`,
        
        // Mensajes de las últimas 24 horas
        `SELECT COUNT(*) as messages_24h FROM conversations 
         WHERE timestamp >= datetime('now', '-24 hours')`,
        
        // Escalaciones pendientes (últimas 24h)
        `SELECT COUNT(*) as pending_escalations FROM conversations 
         WHERE escalated = 1 AND timestamp >= datetime('now', '-24 hours')`,
         
        // Top 5 intents
        `SELECT intent, count FROM intent_stats ORDER BY count DESC LIMIT 5`
      ];

      Promise.all(queries.map(query => {
        return new Promise((res, rej) => {
          if (query.includes('ORDER BY')) {
            this.db.all(query, (err, rows) => {
              if (err) rej(err);
              else res(rows);
            });
          } else {
            this.db.get(query, (err, row) => {
              if (err) rej(err);
              else res(row || {});
            });
          }
        });
      })).then(results => {
        const [todayMetrics, userCount, messages24h, escalations, topIntents] = results;
        
        resolve({
          today: todayMetrics,
          totalUsers: userCount.total_users || 0,
          messages24h: messages24h.messages_24h || 0,
          pendingEscalations: escalations.pending_escalations || 0,
          topIntents: topIntents || [],
          timestamp: new Date().toISOString()
        });
      }).catch(reject);
    });
  }

  /**
   * Obtiene distribución de sentimientos para un período
   */
  async getSentimentDistribution(days = 7) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          date,
          positive_sentiment,
          negative_sentiment,
          neutral_sentiment,
          total_messages
        FROM daily_metrics 
        WHERE date >= date('now', '-${days} days')
        ORDER BY date DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * Obtiene tendencias de conversaciones por hora
   */
  async getHourlyTrends() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          strftime('%H', timestamp) as hour,
          COUNT(*) as message_count,
          AVG(CASE WHEN sentiment = 'POSITIVO' THEN 1 ELSE 0 END) as positive_rate
        FROM conversations 
        WHERE timestamp >= datetime('now', '-24 hours')
        GROUP BY strftime('%H', timestamp)
        ORDER BY hour
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * Obtiene casos que requieren escalación
   */
  async getEscalationCases(limit = 20) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          user_id,
          message,
          sentiment,
          emotion,
          timestamp,
          channel
        FROM conversations 
        WHERE escalated = 1 
        ORDER BY timestamp DESC 
        LIMIT ?
      `, [limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  /**
   * Cierra la conexión a la base de datos
   */
  close() {
    this.db.close((err) => {
      if (err) {
        console.error('Error cerrando BD:', err);
      } else {
        console.log('📊 Conexión a BD cerrada correctamente');
      }
    });
  }
}

// Instancia global de la base de datos
let dbInstance = null;

/**
 * Obtiene la instancia singleton de la base de datos
 */
export function getDatabase() {
  if (!dbInstance) {
    dbInstance = new ChatbotDatabase();
  }
  return dbInstance;
}

/**
 * Función helper para logging rápido de conversaciones
 */
export async function logConversationQuick(userId, channel, message, response, intent, sentimentAnalysis) {
  const db = getDatabase();
  
  return await db.logConversation({
    userId,
    channel,
    message,
    response,
    intent,
    sentiment: sentimentAnalysis?.sentiment,
    confidence: sentimentAnalysis?.confidence,
    emotion: sentimentAnalysis?.emotion,
    escalated: sentimentAnalysis?.escalate || false,
    responseTime: null, // Se puede calcular si es necesario
    sessionId: `${userId}_${new Date().toISOString().split('T')[0]}`
  });
}
