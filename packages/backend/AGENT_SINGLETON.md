# Agent Singleton Architecture

## 📋 Overview

O AI Agent agora é inicializado **uma única vez no startup do servidor**, não em cada comando. Isso elimina 1-2s de overhead por comando.

---

## 🏗️ Arquitetura Anterior vs Nova

### ❌ **ANTES (Lento)**
```
Deploy → FastAPI Startup
↓
User Command → API → create_canvas_agent() → Initialize LLM + Prompt + Tools (1-2s)
↓
User Command 2 → API → create_canvas_agent() → Initialize LLM + Prompt + Tools (1-2s)
↓
(Repetir para cada comando...)
```

### ✅ **AGORA (Rápido)**
```
Deploy → FastAPI Startup → initialize_agent() → Agent pronto ⚡
↓
User Command → API → Usa agent global (0s overhead)
↓
User Command 2 → API → Usa agent global (0s overhead)
↓
Background Task (a cada 10min) → check_agent_health()
```

---

## 🚀 Melhorias Implementadas

### 1. **Agent Singleton Global**
- **Arquivo**: `canvas_agent.py`
- **Variável**: `_global_agent` (global)
- **Inicialização**: `initialize_agent()` chamado no startup
- **Uso**: `execute_canvas_command()` usa `_global_agent` diretamente

### 2. **Health Check Automático**
- **Frequência**: A cada 10 minutos
- **Background Task**: `agent_health_monitor()` em loop asyncio
- **Ação**: Verifica se `_global_agent` está OK
- **Auto-recovery**: Recria agent se detectar problema

### 3. **Logging Dedicado**
- **Arquivo**: `agent_health.log` (backend root)
- **Logger**: `agent_health_logger`
- **Registra**:
  - ✅ Criações de agent
  - ⚠️ Health checks falhos
  - ❌ Erros de recreação
  - 📊 Estatísticas (total de criações)

---

## 📊 API Endpoints

### **GET `/agent/health`**
Retorna estatísticas de saúde do agent:

```json
{
  "status": "healthy",
  "is_initialized": true,
  "creation_count": 1,
  "last_health_check": "2025-10-18T10:48:03.785Z"
}
```

**Status possíveis:**
- `healthy` - Agent inicializado e funcionando
- `not_initialized` - Agent não foi criado (erro no startup)

---

## 📝 Agent Health Log

**Localização**: `backend/agent_health.log`

**Exemplo de log:**
```
2025-10-18 10:48:03,785 - INFO - 🚀 Creating agent (creation #1)
2025-10-18 10:48:03,850 - INFO - ✅ Agent created successfully (creation #1)
2025-10-18 10:58:03,123 - INFO - ✅ Health check PASSED (total creations: 1)
2025-10-18 11:08:03,456 - INFO - ✅ Health check PASSED (total creations: 1)
```

**Se houver problema:**
```
2025-10-18 11:18:03,789 - WARNING - ⚠️  Health check FAILED: Agent is None - recreating
2025-10-18 11:18:03,790 - INFO - 🚀 Creating agent (creation #2)
2025-10-18 11:18:03,855 - INFO - ✅ Agent created successfully (creation #2)
```

---

## 🔧 Monitoramento

### **Como verificar se agent está persistindo:**

1. **Via API:**
   ```bash
   curl http://localhost:8000/agent/health
   ```
   
   - `creation_count: 1` → Agent nunca foi recriado ✅
   - `creation_count: 5` → Agent foi recriado 4 vezes ⚠️

2. **Via Log:**
   ```bash
   tail -f agent_health.log
   ```
   
   - Ver `creation #1` no startup
   - Ver `Health check PASSED` a cada 10 minutos
   - Se houver recriações, aparecerá `creation #2`, `#3`, etc.

3. **Contar criações no log:**
   ```bash
   grep "Creating agent" agent_health.log | wc -l
   ```

---

## ⚡ Performance Gains

### **Antes:**
- Primeira chamada: 3-5s (criar agent + executar)
- Próximas chamadas: 3-5s (recriar agent + executar)

### **Agora:**
- Deploy: 1-2s (criar agent uma vez)
- Primeira chamada: 1-3s (só executar) ⚡ **50% mais rápido**
- Próximas chamadas: 1-3s (só executar) ⚡ **50% mais rápido**

### **Benefícios adicionais:**
- ✅ OpenAI Prompt Caching ativo (GPT-4o-mini cacheia system prompt)
- ✅ Zero latência de inicialização
- ✅ Tools já carregadas em memória
- ✅ Prompt já compilado

---

## 🐛 Troubleshooting

### **Agent não inicializa no startup:**
```bash
# Verificar logs do main.py
tail -f backend.log | grep "Agent"
```

Deve aparecer:
```
🤖 Initializing AI Agent...
✓ AI Agent: Initialized and ready
✓ Agent Health Monitor: Started (10min interval)
```

### **Agent sendo recriado frequentemente:**
Verificar `agent_health.log`:
```bash
grep "creation #" agent_health.log
```

Se houver muitas criações (>5), investigar:
- Memória do servidor (OOM?)
- Erros no LangChain
- Problemas com OpenAI API

---

## 🔒 Limitações Conhecidas

1. **Memory por Session**: Memory ainda é gerenciada por sessão (SessionManager)
2. **Restart necessário**: Se mudar tools/prompt, precisa restart do servidor
3. **Single-threaded**: FastAPI + uvicorn já lida com concorrência

---

## 📌 Version

**Implementado em**: v2025.10.18.8  
**Nome**: Agent Singleton + Health Monitoring


