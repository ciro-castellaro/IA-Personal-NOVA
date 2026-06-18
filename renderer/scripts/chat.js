// ── Estado ────────────────────────────────────────────────────────────────────
let isWaiting = false   // Evitar múltiples envíos simultáneos
let currentBubble = null  // Burbuja activa durante el streaming

// ── Referencias al DOM ────────────────────────────────────────────────────────
const messagesEl      = document.getElementById('messages')
const userInput       = document.getElementById('user-input')
const btnSend         = document.getElementById('btn-send')
const typingIndicator = document.getElementById('typing-indicator')
const btnClear        = document.getElementById('btn-clear')
const btnClearHistory = document.getElementById('btn-clear-history')

// Sidebar nav
const navBtns = document.querySelectorAll('.nav-btn[data-view]')
const views   = document.querySelectorAll('.view')

// Titlebar
document.getElementById('btn-minimize').onclick = () => window.nova.minimize()
document.getElementById('btn-maximize').onclick = () => window.nova.maximize()
document.getElementById('btn-close').onclick    = () => window.nova.close()

// ── Utilidades ────────────────────────────────────────────────────────────────

/** Formatea la hora actual como HH:MM */
function timeNow() {
  return new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

/** Hace scroll al último mensaje */
function scrollToBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight
}

/**
 * Renderiza Markdown mínimo en el texto de respuesta de NOVA.
 * Soporta: negrita, código inline, bloques de código.
 */
function renderMarkdown(text) {
  return text
    // Bloques de código ```lang\ncode```
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
      `<pre><code>${escapeHtml(code.trim())}</code></pre>`)
    // Código inline `code`
    .replace(/`([^`]+)`/g, (_, code) => `<code>${escapeHtml(code)}</code>`)
    // Negrita **texto**
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Saltos de línea → <br>
    .replace(/\n/g, '<br>')
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Crea y agrega un mensaje al DOM. Devuelve el elemento de la burbuja. */
function appendMessage(role, content = '') {
  const wrapper = document.createElement('div')
  wrapper.className = `message ${role}`

  const bubble = document.createElement('div')
  bubble.className = 'message-bubble'

  if (content) {
    bubble.innerHTML = role === 'nova' ? renderMarkdown(content) : escapeHtml(content)
  }

  const time = document.createElement('span')
  time.className = 'message-time'
  time.textContent = timeNow()

  wrapper.appendChild(bubble)
  wrapper.appendChild(time)
  messagesEl.appendChild(wrapper)
  scrollToBottom()

  return bubble
}

// ── Envío de mensajes ─────────────────────────────────────────────────────────

async function sendMessage() {
  const text = userInput.value.trim()
  if (!text || isWaiting) return

  isWaiting = true
  btnSend.disabled = true
  userInput.value = ''
  autoResizeInput()

  // 1. Mostrar mensaje del usuario
  appendMessage('user', text)

  // 2. Mostrar indicador de escritura
  typingIndicator.style.display = 'flex'
  scrollToBottom()

  // 3. Crear burbuja vacía de NOVA para el streaming
  currentBubble = appendMessage('nova', '')
  typingIndicator.style.display = 'none'

  let accumulatedText = ''

  // 4. Limpiar listeners anteriores por si acaso
  window.nova.removeAllListeners('ai:token')
  window.nova.removeAllListeners('ai:response-end')

  // 5. Escuchar tokens en streaming
  window.nova.onToken((token) => {
    accumulatedText += token
    currentBubble.innerHTML = renderMarkdown(accumulatedText)
    scrollToBottom()
  })

  // 6. Cuando termina la respuesta
  window.nova.onResponseEnd(() => {
    isWaiting = false
    btnSend.disabled = false
    currentBubble = null
    userInput.focus()
  })

  // 7. Disparar la llamada
  await window.nova.sendMessage(text)
}

// ── Auto-resize del textarea ──────────────────────────────────────────────────
function autoResizeInput() {
  userInput.style.height = 'auto'
  userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px'
}

// ── Event listeners ───────────────────────────────────────────────────────────

btnSend.addEventListener('click', sendMessage)

userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
})

userInput.addEventListener('input', autoResizeInput)

// Sidebar: cambio de vista
navBtns.forEach((btn) => {
  btn.addEventListener('click', async () => {
    navBtns.forEach((b) => b.classList.remove('active'))
    btn.classList.add('active')

    const viewId = `view-${btn.dataset.view}`
    views.forEach((v) => v.classList.remove('active'))
    document.getElementById(viewId)?.classList.add('active')

    // Si se abre el historial, cargarlo desde la DB
    if (btn.dataset.view === 'history') {
      await loadHistory()
    }
  })
})

// Nueva conversación
btnClear.addEventListener('click', () => {
  if (confirm('¿Empezar una conversación nueva? El historial se limpiará de la pantalla pero quedará guardado en la base de datos.')) {
    messagesEl.innerHTML = ''
    appendMessage('nova', 'Listo, empezamos de nuevo. ¿En qué puedo ayudarte?')
  }
})

// Limpiar historial completo
btnClearHistory?.addEventListener('click', async () => {
  if (confirm('¿Eliminar todo el historial de la base de datos? Esta acción no se puede deshacer.')) {
    await window.nova.clearHistory()
    document.getElementById('history-list').innerHTML = ''
  }
})

// ── Carga del historial ───────────────────────────────────────────────────────
async function loadHistory() {
  const historyList = document.getElementById('history-list')
  historyList.innerHTML = '<div style="padding:20px;color:var(--text-2)">Cargando...</div>'

  const { messages } = await window.nova.getHistory()

  if (!messages || messages.length === 0) {
    historyList.innerHTML = '<div style="padding:20px;color:var(--text-2)">No hay conversaciones guardadas.</div>'
    return
  }

  historyList.innerHTML = ''
  messages.forEach((msg) => {
    const role = msg.role === 'user' ? 'user' : 'nova'
    const wrapper = document.createElement('div')
    wrapper.className = `message ${role}`

    const bubble = document.createElement('div')
    bubble.className = 'message-bubble'
    bubble.innerHTML = role === 'nova' ? renderMarkdown(msg.content) : escapeHtml(msg.content)

    const time = document.createElement('span')
    time.className = 'message-time'
    time.textContent = new Date(msg.created_at).toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    })

    wrapper.appendChild(bubble)
    wrapper.appendChild(time)
    historyList.appendChild(wrapper)
  })

  historyList.scrollTop = historyList.scrollHeight
}

// ── Init ──────────────────────────────────────────────────────────────────────
userInput.focus()
