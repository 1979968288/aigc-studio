import { createApp } from 'vue';
import VueKonva from 'vue-konva';
import 'ant-design-vue/es/style/reset.css';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

import '@/styles/variables.css';
import '@/styles/tailwind.css';
import '@/styles/common.css';

import App from './App.vue';
import router from './router';
import { pinia } from './stores';
import { useAppStore } from './stores/app';
import { ensureDBSeeded } from '@/shared/mock/db';

dayjs.locale('zh-cn');

// 演示数据库（localStorage）播种
ensureDBSeeded();

const app = createApp(App);

app.use(pinia);
app.use(router);
app.use(VueKonva, { prefix: 'Konva' });

// 主题同步：store 与 DOM 对齐（index.html 已提前写入避免闪屏）
const appStore = useAppStore();
appStore.initTheme();

app.mount('#app');
