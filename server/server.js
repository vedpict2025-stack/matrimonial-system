require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// --- DIAGNOSTIC LISTENERS ---
process.on('uncaughtException', (err) => {
    console.error('🚨 UNCAUGHT EXCEPTION CRASH:', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 UNHANDLED PROMISE REJECTION:', reason);
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log("✅ Supabase client initialized!");

// --- MIDDLEWARE FOR AUTH ---
const getRole = async (userId) => {
    if (!userId) return null;
    if (userId.startsWith('COM-')) {
        const { data } = await supabase.from('committee').select('role').eq('id', userId).single();
        return data ? data.role : null;
    } else {
        const dbId = parseInt(userId.replace(/\D/g, ''), 10);
        if (isNaN(dbId)) return null;
        const { data } = await supabase.from('profiles').select('id').eq('id', dbId).single();
        return data ? 'user' : null;
    }
};

const authMiddleware = async (req, res, next) => {
    const userId = req.headers['x-user-id'];
    req.userRole = await getRole(userId);
    req.userId = userId;
    next();
};
app.use(authMiddleware);

// --- 1. CREATE PROFILE (Registration / Save Progress) ---
app.post('/api/profiles', async (req, res) => {
    try {
        const profileData = { ...req.body };
        if (!profileData.status) profileData.status = 'Draft';
        
        const { data, error } = await supabase.from('profiles').insert([profileData]).select();
        if (error) throw error;
        res.status(201).json({ profile: data[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 1b. UPDATE PROFILE (Save Progress / Edit) ---
app.put('/api/profiles/:id', async (req, res) => {
    try {
        const dbId = parseInt(req.params.id.replace(/\D/g, ''), 10);
        
        // Security check: Only the owner or committee can edit
        if (req.userRole !== 'super_admin' && req.userRole !== 'committee_admin' && req.userId !== req.params.id && req.userId !== `MAT-${String(dbId).padStart(4, '0')}`) {
            return res.status(403).json({ error: "Unauthorized to edit this profile" });
        }

        const { data, error } = await supabase.from('profiles').update(req.body).eq('id', dbId).select();
        if (error) throw error;
        res.status(200).json({ profile: data[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 2. PAGINATED BROWSE PROFILES ---
app.get('/api/profiles', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const start = (page - 1) * limit;
        const end = start + limit - 1;

        let query = supabase.from('profiles').select('*', { count: 'exact' });
        
        // Access control
        if (req.userRole === 'user' || !req.userRole) {
            query = query.eq('status', 'Approved');
        } else if (req.query.status) {
            query = query.eq('status', req.query.status);
        }

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(start, end);

        if (error) throw error;
        res.status(200).json({ profiles: data, total: count });
    } catch (err) {
        res.status(500).json({ error: "Could not fetch profiles." });
    }
});

// --- 3. SECURE LOGIN ROUTE ---
app.post('/api/login', async (req, res) => {
    try {
        const { id, pin } = req.body;
        
        if (id.startsWith('COM-')) {
            const { data, error } = await supabase.from('committee').select('id, pin, role').eq('id', id).single();
            if (error || !data) return res.status(401).json({ error: "Invalid Committee ID." });
            if (data.pin !== pin) return res.status(401).json({ error: "Incorrect PIN." });
            
            return res.status(200).json({ success: true, role: data.role });
        }

        const dbId = parseInt(id.replace(/\D/g, ''), 10);
        if (isNaN(dbId)) return res.status(401).json({ error: "Invalid Profile ID format." });

        const { data, error } = await supabase.from('profiles').select('id, pin, status').eq('id', dbId).single();
        
        if (error || !data) return res.status(401).json({ error: "Profile ID not found." });
        if (data.pin !== pin) return res.status(401).json({ error: "Incorrect 4-Digit PIN." });
        
        res.status(200).json({ success: true, role: 'user', status: data.status });
    } catch (err) {
        res.status(500).json({ error: "Server error during login." });
    }
});

// --- 4. FETCH SINGLE PROFILE ---
app.get('/api/profiles/:id', async (req, res) => {
    try {
        const dbId = parseInt(req.params.id.replace(/\D/g, ''), 10);
        const { data, error } = await supabase.from('profiles').select('*').eq('id', dbId).single();
        if (error) throw error;
        
        // Security check
        if ((!req.userRole || req.userRole === 'user') && data.status !== 'Approved') {
            // A user can fetch their own draft
            const visualId = `MAT-${String(data.id).padStart(4, '0')}`;
            if (req.userId !== visualId) {
                return res.status(403).json({ error: "Profile not approved yet." });
            }
        }
        
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: "Profile not found." });
    }
});

// --- 5. COMMITTEE MANAGEMENT (Super Admin Only) ---
app.post('/api/committee', async (req, res) => {
    if (req.userRole !== 'super_admin') return res.status(403).json({ error: "Forbidden" });
    try {
        const { data, error } = await supabase.from('committee').insert([req.body]).select();
        if (error) throw error;
        res.status(201).json({ member: data[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/committee', async (req, res) => {
    if (req.userRole !== 'super_admin') return res.status(403).json({ error: "Forbidden" });
    try {
        const { data, error } = await supabase.from('committee').select('*');
        if (error) throw error;
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- VERCEL SERVERLESS STARTUP ---
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const server = app.listen(PORT, () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
    });

    server.on('error', (error) => {
        console.error('💥 SERVER STARTUP ERROR:', error.message);
    });
}

// Export the Express app for Vercel
module.exports = app;