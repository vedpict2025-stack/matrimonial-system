require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// --- DIAGNOSTIC LISTENERS (To catch the silent crashes) ---
process.on('uncaughtException', (err) => {
    console.error('🚨 UNCAUGHT EXCEPTION CRASH:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 UNHANDLED PROMISE REJECTION:', reason);
});
process.on('exit', (code) => {
    console.log(`🛑 Node process exited with code: ${code}`);
});
// ----------------------------------------------------------

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log("✅ Supabase client initialized!");

// --- 1. CREATE PROFILE (Now includes PIN and Photo Data) ---
app.post('/api/profiles', async (req, res) => {
    try {
        console.log("📥 Receiving new profile submission...");
        const { data, error } = await supabase.from('profiles').insert([req.body]).select();
        if (error) throw error;
        console.log("✅ Profile saved successfully!");
        res.status(201).json({ profile: data[0] });
    } catch (err) {
        console.error("🔥 ROUTE ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});

// --- 2. PAGINATED BROWSE PROFILES (Infinite Scroll) ---
app.get('/api/profiles', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const start = (page - 1) * limit;
        const end = start + limit - 1;

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .range(start, end);

        if (error) throw error;
        res.status(200).json(data);
    } catch (err) {
        console.error("🔥 FETCH ERROR:", err);
        res.status(500).json({ error: "Could not fetch profiles." });
    }
});

// --- 3. SECURE LOGIN ROUTE (Validates ID and PIN) ---
app.post('/api/login', async (req, res) => {
    try {
        const { id, pin } = req.body;
        
        // Committee Master Login 
        if (id.startsWith('COM-')) {
            if (pin === '9999') return res.status(200).json({ success: true, role: 'admin' });
            else return res.status(401).json({ error: "Invalid Committee PIN." });
        }

        // Regular User Login
        const dbId = parseInt(id.replace(/\D/g, ''), 10);
        const { data, error } = await supabase.from('profiles').select('id, pin').eq('id', dbId).single();
        
        if (error || !data) return res.status(401).json({ error: "Profile ID not found." });
        if (data.pin !== pin) return res.status(401).json({ error: "Incorrect 4-Digit PIN." });
        
        res.status(200).json({ success: true, role: 'user' });
    } catch (err) {
        res.status(500).json({ error: "Server error during login." });
    }
});

// --- 4. FETCH SINGLE PROFILE (For Dashboard) ---
app.get('/api/profiles/:id', async (req, res) => {
    try {
        const dbId = parseInt(req.params.id.replace(/\D/g, ''), 10);
        const { data, error } = await supabase.from('profiles').select('*').eq('id', dbId).single();
        if (error) throw error;
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: "Profile not found." });
    }
});

// --- ROBUST SERVER STARTUP ---
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`⏳ Waiting for submissions... Do not close this window.`);
});

// Catch silent server errors (like a blocked port)
server.on('error', (error) => {
    console.error('💥 SERVER STARTUP ERROR:', error.message);
});

// Force the Node event loop to stay awake
setInterval(() => {
    // This silent heartbeat runs in the background and guarantees 
    // the Node process cannot exit with "code: 0" on its own.
}, 60000);