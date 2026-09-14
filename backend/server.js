import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();

app.use(express.json());

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

app.post("/chat", async (req, res) => {

    try {

        const message = req.body.message;

        if (!message) {
            return res.status(400).json({
                error: "Message is required."
            });
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: message
        });

        res.json({
            reply: response.text
        });

    } catch (error) {

        console.error("Gemini error:", error);

        res.status(500).json({
            error: "Caesar could not respond."
        });
    }
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Caesar backend running on port ${PORT}`);
});