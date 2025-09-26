// Gemini API Integration
// This provides easy-to-use functions for calling Gemini AI

class GeminiAPI {
    constructor() {
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
    }

    async generateContent(prompt, options = {}) {
        const apiKey = window.AppConfig?.get('GEMINI_API_KEY');
        if (!apiKey) {
            throw new Error('Gemini API key not configured. Please set up your API key first.');
        }

        const model = options.model || 'gemini-1.5-flash';
        const url = `${this.baseUrl}/${model}:generateContent?key=${apiKey}`;

        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: options.temperature || 0.7,
                topK: options.topK || 40,
                topP: options.topP || 0.95,
                maxOutputTokens: options.maxTokens || 1024,
            },
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates.length > 0) {
                return data.candidates[0].content.parts[0].text;
            } else {
                throw new Error('No content generated from Gemini API');
            }
        } catch (error) {
            console.error('Gemini API Error:', error);
            throw error;
        }
    }

    // Convenience method for chat-style interactions
    async chat(message, context = '', options = {}) {
        const prompt = context ? `Context: ${context}\n\nUser: ${message}` : message;
        return await this.generateContent(prompt, options);
    }

    // Analyze construction data (specific to your use case)
    async analyzeConstructionData(data, question) {
        const prompt = `
You are a construction project analyst. Analyze the following data and answer the question.

Data: ${JSON.stringify(data, null, 2)}

Question: ${question}

Please provide a clear, actionable analysis focusing on:
- Key insights from the data
- Potential issues or risks
- Recommendations for improvement
- Specific metrics and trends

Response:`;

        return await this.generateContent(prompt, { temperature: 0.3, maxTokens: 2048 });
    }

    // Generate anomaly detection insights
    async generateAnomalyInsights(anomalies) {
        const prompt = `
Analyze these construction project anomalies and provide actionable insights:

Anomalies: ${JSON.stringify(anomalies, null, 2)}

Provide:
1. Summary of critical issues
2. Root cause analysis
3. Priority ranking
4. Recommended actions
5. Risk assessment

Keep the response practical and actionable for project managers.`;

        return await this.generateContent(prompt, { temperature: 0.4, maxTokens: 1500 });
    }
}

// Create global instance
window.GeminiAPI = new GeminiAPI();

// Example usage functions
window.testGeminiAPI = async function() {
    try {
        const response = await window.GeminiAPI.chat("Hello! Can you help me analyze construction project data?");
        console.log("✅ Gemini API Test Successful:", response);
        return response;
    } catch (error) {
        console.error("❌ Gemini API Test Failed:", error);
        throw error;
    }
};

// Helper function to add AI features to existing apps
function addAIButton(containerId, buttonText = "🤖 Ask AI") {
    const container = document.getElementById(containerId);
    if (!container) return;

    const aiButton = document.createElement('button');
    aiButton.innerHTML = buttonText;
    aiButton.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 25px;
        cursor: pointer;
        font-size: 14px;
        margin: 10px;
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        transition: all 0.3s ease;
    `;

    aiButton.onmouseover = () => {
        aiButton.style.transform = 'translateY(-2px)';
        aiButton.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
    };

    aiButton.onmouseout = () => {
        aiButton.style.transform = 'translateY(0)';
        aiButton.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
    };

    aiButton.onclick = () => {
        const question = prompt("What would you like to ask the AI about this data?");
        if (question) {
            handleAIQuery(question);
        }
    };

    container.appendChild(aiButton);
}

async function handleAIQuery(question) {
    try {
        const response = await window.GeminiAPI.chat(question);
        
        // Create a nice modal to show the response
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                border-radius: 15px;
                padding: 30px;
                max-width: 800px;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            ">
                <h3 style="margin-top: 0; color: #333;">🤖 AI Analysis</h3>
                <div style="
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 10px;
                    margin: 20px 0;
                    border-left: 4px solid #667eea;
                    white-space: pre-wrap;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    line-height: 1.6;
                ">${response}</div>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: #667eea;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    float: right;
                ">Close</button>
            </div>
        `;

        document.body.appendChild(modal);
    } catch (error) {
        alert(`AI Error: ${error.message}`);
    }
}
