function initAI() {
    const API_KEY = "AIzaSyCgIJZGVwK6aztrTDh2oCisxDAzjMK_CsY";
    const responseDiv = document.getElementById('response');

    try {
        window.googleAI = new window.GoogleGenerativeAI(API_KEY);
        console.log('AI initialized successfully');
        if (responseDiv) {
            responseDiv.textContent = 'AI ready - ask me anything!';
        }
    } catch (err) {
        console.error('Error initializing AI:', err);
        if (responseDiv) {
            responseDiv.textContent = "Could not initialize AI. Please refresh the page.";
        }
    }
}

// Define askAI function
async function askAI(question, responseElementId = 'response') {
    const responseDiv = document.getElementById(responseElementId);
    if (!responseDiv) {
        console.error("Response element not found");
        return;
    }

    if (!question.trim()) {
        responseDiv.textContent = 'Please enter a question';
        return;
    }

    try {
        if (!window.googleAI) {
            responseDiv.textContent = 'AI is not ready yet. Please wait...';
            return;
        }

        responseDiv.textContent = 'Generating response...';
        const model = window.googleAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(question);
        const response = await result.response;
        responseDiv.textContent = response.text() || 'No response received';
    } catch (error) {
        console.error("Error in AI response:", error);
        responseDiv.textContent = `Error: ${error.message}. Please try again.`;
    }
}

function checkCode() {
    
}

// Initialize when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAI);
} else {
    initAI();
}

// Make askAI available globally
window.askAI = askAI;