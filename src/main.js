import { createApp } from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import { createPinia } from 'pinia'
import vuetify from './plugins/vuetify'
import { initializeWebSocket } from './plugins/websocket'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)

// Initialize WebSocket connection
initializeWebSocket()

app.mount('#app')
