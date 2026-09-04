require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY
);

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
    res.send("Daymaker backend is running!");
});

// API test
app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "API is working!"
    });
});

// Save student message
app.post("/api/messages", async (req, res) => {
    const { studentEmail, counsellorId, message, sender } = req.body;

    if (!studentEmail || !counsellorId || !message) {
        return res.status(400).json({
            success: false,
            message: "Missing required message data"
        });
    }

    const messageSender = sender === "admin" ? "admin" : "student";

    const { data, error } = await supabase
        .from("messages")
        .insert([
            {
                student_email: studentEmail,
                counsellor_id: counsellorId,
                message: message,
                sender: messageSender
            }
        ])
        .select();

    if (error) {
        console.error("Supabase error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }

    console.log("Message saved to Supabase:", data[0]);

    res.json({
        success: true,
        message: "Message saved successfully!",
        data: data[0]
    });
});

// Get messages
app.get("/api/messages", async (req, res) => {
    const { counsellorId, studentEmail } = req.query;

    let query = supabase
        .from("messages")
        .select("*")
        .order("timestamp", { ascending: true });

    if (counsellorId) {
        query = query.eq("counsellor_id", counsellorId);
    }

    if (studentEmail) {
        query = query.eq("student_email", studentEmail);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Supabase error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve messages"
        });
    }

    res.json(data);
});

if (require.main === module) {
    const PORT = 3000;

    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}

// Export app for Vercel
module.exports = app;
