// Configuration Manager for API Keys
// This handles environment variables in a browser-safe way

class Config {
    constructor() {
        // For development: load from localStorage or environment
        this.config = this.loadConfig();
    }

    loadConfig() {
        // Try to load from localStorage first (for browser-based development)
        const stored = localStorage.getItem('app_config');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.warn('Failed to parse stored config');
            }
        }

        // Default configuration
        return {
            GEMINI_API_KEY: '',
            GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
            NODE_ENV: 'development'
        };
    }

    get(key) {
        return this.config[key];
    }

    set(key, value) {
        this.config[key] = value;
        this.saveConfig();
    }

    saveConfig() {
        localStorage.setItem('app_config', JSON.stringify(this.config));
    }

    // Method to initialize API key (call this once when user provides their key)
    setGeminiApiKey(apiKey) {
        this.set('GEMINI_API_KEY', apiKey);
        console.log('✅ Gemini API key configured successfully');
    }

    // Check if API key is configured
    isConfigured() {
        return !!this.get('GEMINI_API_KEY');
    }

    // Get headers for Gemini API requests
    getGeminiHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.get('GEMINI_API_KEY')}`
        };
    }
}

// Create global config instance
window.AppConfig = new Config();

// Configuration setup UI component
function createConfigSetup() {
    if (window.AppConfig.isConfigured()) {
        return '';
    }

    return `
        <div id="config-setup" style="
            position: fixed; 
            top: 0; 
            left: 0; 
            width: 100%; 
            height: 100%; 
            background: rgba(0,0,0,0.8); 
            z-index: 9999; 
            display: flex; 
            align-items: center; 
            justify-content: center;
        ">
            <div style="
                background: white; 
                padding: 30px; 
                border-radius: 10px; 
                max-width: 500px; 
                text-align: center;
            ">
                <h2>🔑 API Configuration Required</h2>
                <p>Please enter your Gemini API key to enable AI features:</p>
                <input 
                    type="password" 
                    id="api-key-input" 
                    placeholder="Enter your Gemini API key"
                    style="
                        width: 100%; 
                        padding: 10px; 
                        margin: 15px 0; 
                        border: 1px solid #ddd; 
                        border-radius: 5px;
                    "
                >
                <br>
                <button onclick="setupApiKey()" style="
                    background: #4CAF50; 
                    color: white; 
                    padding: 10px 20px; 
                    border: none; 
                    border-radius: 5px; 
                    cursor: pointer;
                ">
                    Save Configuration
                </button>
                <p style="font-size: 12px; color: #666; margin-top: 15px;">
                    Your API key is stored locally and never shared.
                </p>
            </div>
        </div>
    `;
}

function setupApiKey() {
    const apiKey = document.getElementById('api-key-input').value.trim();
    if (apiKey) {
        window.AppConfig.setGeminiApiKey(apiKey);
        document.getElementById('config-setup').style.display = 'none';
        location.reload(); // Refresh to apply configuration
    } else {
        alert('Please enter a valid API key');
    }
}

// Auto-inject config setup if needed
document.addEventListener('DOMContentLoaded', function() {
    if (!window.AppConfig.isConfigured()) {
        document.body.insertAdjacentHTML('beforeend', createConfigSetup());
    }
});
