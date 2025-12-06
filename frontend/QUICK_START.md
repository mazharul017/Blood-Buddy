# 🚀 Blood Buddy - Quick Start Guide

## Bengali (বাংলা)

### শুরু করার জন্য:

1. **Terminal খুলুন** এবং frontend folder এ যান:
```bash
cd "C:\Users\sourov\OneDrive\Desktop\blood buddy\frontend"
```

2. **Development server চালু করুন**:
```bash
npm run dev
```

3. **Browser এ খুলুন**:
- URL: http://localhost:5174/
- বা যে port টা terminal এ দেখবেন

### Pages:
- 🏠 Home: http://localhost:5174/
- 📝 Register: http://localhost:5174/register
- 🩸 Donate: http://localhost:5174/donate
- 💬 Help: http://localhost:5174/help

### যদি কোন সমস্যা হয়:

**সমস্যা 1: npm run dev কাজ না করলে**
```bash
npm install
npm run dev
```

**সমস্যা 2: Port already in use**
- Terminal এ Ctrl+C চাপুন
- আবার `npm run dev` চালান

**সমস্যা 3: Images দেখা যাচ্ছে না**
- Check করুন `public/Images` folder আছে কিনা
- Browser refresh করুন (Ctrl+R)

### Project Structure সহজ করে:

```
frontend/
├── public/              ← Static files (images, video)
├── src/
│   ├── components/      ← Shared components (Header, Footer)
│   ├── pages/          ← Page components (Home, Register, etc.)
│   ├── App.jsx         ← Main app
│   └── style.css       ← Global styles
└── package.json        ← Dependencies
```

### Code Edit করতে চাইলে:

1. **Header change করতে**: `src/components/Header.jsx`
2. **Footer change করতে**: `src/components/Footer.jsx`
3. **Home page edit করতে**: `src/pages/Home.jsx`
4. **Colors change করতে**: `tailwind.config.js`

### Build করতে চাইলে (Production):
```bash
npm run build
```

এটি একটি `dist` folder তৈরি করবে যা deploy করা যাবে।

---

## English

### To Start:

1. **Open Terminal** and navigate to frontend folder:
```bash
cd "C:\Users\sourov\OneDrive\Desktop\blood buddy\frontend"
```

2. **Start the development server**:
```bash
npm run dev
```

3. **Open in Browser**:
- URL: http://localhost:5174/
- Or whatever port shown in terminal

### Available Pages:
- 🏠 Home: http://localhost:5174/
- 📝 Register: http://localhost:5174/register
- 🩸 Donate: http://localhost:5174/donate
- 💬 Help: http://localhost:5174/help

### Troubleshooting:

**Issue 1: npm run dev not working**
```bash
npm install
npm run dev
```

**Issue 2: Port already in use**
- Press Ctrl+C in terminal
- Run `npm run dev` again

**Issue 3: Images not showing**
- Check `public/Images` folder exists
- Refresh browser (Ctrl+R)

### Simple Project Structure:

```
frontend/
├── public/              ← Static files (images, video)
├── src/
│   ├── components/      ← Shared components (Header, Footer)
│   ├── pages/          ← Page components (Home, Register, etc.)
│   ├── App.jsx         ← Main app
│   └── style.css       ← Global styles
└── package.json        ← Dependencies
```

### To Edit Code:

1. **Change Header**: `src/components/Header.jsx`
2. **Change Footer**: `src/components/Footer.jsx`
3. **Edit Home page**: `src/pages/Home.jsx`
4. **Change Colors**: `tailwind.config.js`

### To Build (Production):
```bash
npm run build
```

This creates a `dist` folder ready for deployment.

---

## 📦 Installed Packages

- react: ^18.x
- react-dom: ^18.x
- react-router-dom: ^6.x
- @vitejs/plugin-react: Latest
- tailwindcss: ^4.x
- autoprefixer: ^10.x
- vite: ^7.x

## 🎨 Technologies

- ⚛️ React 18 (with JSX)
- 🎨 Tailwind CSS
- ⚡ Vite
- 🧭 React Router
- 🎯 Font Awesome Icons

## 📞 Need Help?

যদি কোন সমস্যা হয় তাহলে:
1. Terminal error message দেখুন
2. Browser console (F12) check করুন
3. `npm install` চালিয়ে দেখুন
4. Server restart করুন

---

**Happy Coding!** 🚀🩸

আপনার Blood Buddy app এখন modern React এ চলছে!

