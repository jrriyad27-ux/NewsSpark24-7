const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'news-portal-top-secret', resave: false, saveUninitialized: true }));

// --- ১. আপনার দেওয়া MongoDB কানেকশন ---
// <db_password> এর জায়গায় আপনার ডাটাবেস পাসওয়ার্ডটি বসান
const MONGO_URI = "mongodb+srv://UpDateNews24:F7jsCEa9ua84Nb6I@cluster0.lx23k6r.mongodb.net/NewsDB?retryWrites=true&w=majority&appName=Cluster0"; 

mongoose.connect(MONGO_URI)
    .then(() => console.log("Database Connected Successfully"))
    .catch(err => console.log("Database Error: ", err));

const News = mongoose.model('News', {
    title: String,
    image: String,
    details: String,
    date: { type: Date, default: Date.now }
});

// --- ২. আপনার দেওয়া Monetag অ্যাড সেটআপ ---
const MonetagLink = "https://omg10.com/4/10954412";

// --- ৩. ওয়েবসাইট লেআউট (Design) ---
const Layout = (title, content, image = "") => `
<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | সবার আলাদা নিউজ</title>
    
    <!-- সোশ্যাল মিডিয়া শেয়ারিং (ফেসবুক/হোয়াটসঅ্যাপ) এর জন্য মেটা ট্যাগ -->
    <meta property="og:title" content="${title}" />
    <meta property="og:image" content="${image || 'https://via.placeholder.com/600x400'}" />
    <meta property="og:description" content="দেশ-বিদেশের সর্বশেষ সংবাদ জানতে ক্লিক করুন..." />
    <meta property="og:type" content="article" />

    <script src="https://cdn.tailwindcss.com"></script>
    <style>@import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;700&display=swap'); body{font-family: 'Hind Siliguri', sans-serif;}</style>
    
    <!-- Monetag Ad Script -->
    <script src="${MonetagLink}" async data-cfasync="false"></script>
</head>
<body class="bg-gray-50 pb-12">
    <!-- প্রফেশনাল হেডার (যমুনা টিভির মতো লাল রঙ) -->
    <nav class="bg-[#CC0000] text-white p-4 shadow-xl sticky top-0 z-50">
        <div class="container mx-auto flex justify-between items-center">
            <a href="/" class="text-2xl font-bold italic tracking-tighter uppercase">UpdateNews24</a>
            <div class="text-sm font-bold border border-white px-2 py-1 rounded">লাইভ</div>
        </div>
    </nav>

    <!-- মেইন কন্টেন্ট -->
    <main class="container mx-auto p-4 md:mt-6">
        ${content}
    </main>

    <!-- ফুটার -->
    <footer class="bg-gray-900 text-gray-400 p-8 mt-10 text-center">
        <p>&copy; ${new Date().getFullYear()} UpdateNews24 | সকল সত্য সংবাদ এখানে</p>
    </footer>
</body>
</html>`;

// --- ৪. রুটস (Routes) ---

// হোম পেজ (ডেট অনুযায়ী নিউজ আসবে)
app.get('/', async (req, res) => {
    const allNews = await News.find().sort({ date: -1 });
    let newsHtml = allNews.map(n => `
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition mb-6">
            <img src="${n.image}" class="w-full h-56 object-cover">
            <div class="p-4">
                <p class="text-xs text-red-600 font-bold mb-1 uppercase tracking-widest">${n.date.toLocaleDateString('bn-BD')}</p>
                <h2 class="font-bold text-xl mb-3 text-gray-800 leading-snug">${n.title}</h2>
                <a href="/news/${n._id}" class="text-blue-700 font-bold hover:text-red-600">বিস্তারিত পড়ুন →</a>
            </div>
        </div>
    `).join('');

    res.send(Layout("Home", `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${newsHtml || '<p class="text-center col-span-full">এখনো কোনো খবর পোস্ট করা হয়নি।</p>'}
        </div>
    `));
});

// বিস্তারিত নিউজ পেজ (এই লিঙ্কটিই আপনি ফেসবুকে দিবেন)
app.get('/news/:id', async (req, res) => {
    try {
        const n = await News.findById(req.params.id);
        res.send(Layout(n.title, `
            <div class="max-w-3xl mx-auto bg-white p-4 md:p-8 rounded-lg shadow-sm">
                <h1 class="text-2xl md:text-4xl font-bold mb-4 text-gray-900">${n.title}</h1>
                <p class="text-gray-500 text-xs mb-6 border-b pb-2">প্রকাশিত: ${n.date.toLocaleString('bn-BD')}</p>
                <img src="${n.image}" class="w-full rounded mb-6">
                
                <!-- সংবাদের বিস্তারিত -->
                <div class="text-lg leading-relaxed text-gray-800 whitespace-pre-line">
                    ${n.details}
                </div>
                
                <div class="mt-10 pt-6 border-t text-center">
                    <a href="/" class="bg-red-600 text-white px-8 py-2 rounded-full font-bold">আরো খবর পড়ুন</a>
                </div>
            </div>
        `, n.image));
    } catch (e) { res.redirect('/'); }
});

// সিক্রেট এডমিন প্যানেল
app.get('/update-admin-789', (req, res) => {
    res.send(Layout("Admin Login", `
        <div class="max-w-md mx-auto mt-10 bg-white p-8 rounded shadow">
            <h2 class="text-xl font-bold mb-4 text-center">এডমিন লগইন</h2>
            <form action="/login" method="POST">
                <input type="password" name="pass" placeholder="পাসওয়ার্ড দিন" class="w-full p-3 border rounded mb-4 focus:ring-2 ring-red-600 outline-none" required>
                <button class="bg-red-700 text-white w-full py-3 rounded font-bold">প্রবেশ করুন</button>
            </form>
        </div>
    `));
});

app.post('/login', (req, res) => {
    if(req.body.pass === "news2024") { // পাসওয়ার্ড এখানে পরিবর্তন করতে পারেন
        req.session.isAdmin = true;
        res.redirect('/post-panel');
    } else { res.send("ভুল পাসওয়ার্ড!"); }
});

app.get('/post-panel', (req, res) => {
    if(!req.session.isAdmin) return res.redirect('/update-admin-789');
    res.send(Layout("Post News", `
        <div class="max-w-2xl mx-auto mt-10 bg-white p-6 rounded shadow">
            <h2 class="text-2xl font-bold mb-6">নতুন খবর পোস্ট করুন</h2>
            <form action="/post" method="POST" class="space-y-4">
                <input name="title" placeholder="শিরোনাম" class="w-full p-3 border rounded" required>
                <input name="image" placeholder="ইমেজ লিঙ্ক (URL)" class="w-full p-3 border rounded" required>
                <textarea name="details" placeholder="খবরের বিস্তারিত..." class="w-full p-3 border rounded h-64" required></textarea>
                <button class="bg-green-600 text-white px-10 py-3 rounded font-bold">পাবলিশ করুন</button>
            </form>
        </div>
    `));
});

app.post('/post', async (req, res) => {
    if(req.session.isAdmin) {
        await new News(req.body).save();
        res.redirect('/');
    }
});

module.exports = app;
