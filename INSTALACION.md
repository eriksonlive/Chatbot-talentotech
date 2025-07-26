# 🚀 INSTALACIÓN RÁPIDA - Chatbot INGELEAN

## ⚡ Pasos para Ejecutar el Proyecto

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar Variables de Entorno
```bash
# Copiar el archivo de ejemplo
copy env.example .env

# Editar .env con tus claves reales
```

### 3. Obtener las APIs Necesarias

#### Google Gemini API:
1. Ir a https://ai.google.dev/
2. Crear cuenta y obtener API Key
3. Agregar a `.env`: `GEMINI_API_KEY=tu_clave_aqui`

#### Telegram Bot:
1. Buscar @BotFather en Telegram
2. Crear nuevo bot con `/newbot`
3. Agregar a `.env`: `TELEGRAM_BOT_TOKEN=tu_token_aqui`

#### WhatsApp (UltraMsg) - Opcional:
1. Ir a https://ultramsg.com/
2. Crear cuenta y obtener Instance ID y Token
3. Agregar a `.env`

### 4. Ejecutar el Proyecto
```bash
# Modo desarrollo
npm run dev

# Modo producción
node index.js
```

### 5. Probar el Bot

#### Telegram:
- Buscar tu bot en Telegram
- Enviar mensaje: "¿Qué servicios ofrecen?"

#### API REST:
```bash
# En otra terminal
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "¿Qué hace INGELEAN?"}'
```

## 📋 Verificación

✅ El servidor debe mostrar: "Bot activo en http://localhost:3000"
✅ El dataset debe cargar: "Dataset de INGELEAN cargado correctamente"
✅ Respuestas deben ser sobre INGELEAN

## 🆘 Problemas Comunes

- **Error de API Key**: Verificar que las claves estén correctas en `.env`
- **Puerto ocupado**: Cambiar `PORT=3001` en `.env`
- **Error de dataset**: Verificar que `dataset_ingelean_chatbot.json` existe

## 🎯 Listo para la Hackaton!

El chatbot ya está configurado con:
- ✅ 10 intents de INGELEAN
- ✅ Respuestas inteligentes con IA
- ✅ Soporte Telegram y WhatsApp
- ✅ API REST funcional
