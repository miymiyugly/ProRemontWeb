# Про-Ремонт — сайт

Тёмный сайт с жёлтыми акцентами для услуг ремонта под ключ.

## Структура

```
ProRemontWeb/
├── server.js              # Express-сервер (порт 3000)
├── logo.jpg               # Логотип (отдаётся с корня)
├── package.json
└── public/
    ├── index.html         # Разметка сайта
    ├── css/style.css      # Стили (тёмная тема, жёлтые акценты, адаптив)
    └── js/main.js         # Меню, модалка, маска телефона, отправка формы
```

## Запуск

```powershell
npm install
node server.js
```

Сайт: http://localhost:3000

## Куда добавить фото работ

1. Положите фотографии в папку `public/img/works/` (создайте её).
2. В `public/index.html` найдите блок `<!-- ===== GALLERY ===== -->` и пропишите путь в `data-src`:
   ```html
   <figure class="gallery__item" data-src="/img/works/1.jpg"></figure>
   ```
3. JS автоматически подставит фото как фон, плейсхолдер исчезнет.

## Контактная форма

POST `/api/contact` принимает `{ name, phone, message, variant }`.
Сейчас просто логирует в консоль — подключите к нужной интеграции (email / Telegram-бот / CRM) в `server.js`.

## Адаптив

Брейкпоинты: 1024px / 768px / 560px. Проверено на десктопе, планшете, мобильных.
