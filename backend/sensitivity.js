const sensitivityCategories = {
    high: [
        "kill myself",
        "suicide",
        "want to die",
        "end my life",
        "hurt myself",
        "self harm",
        "self-harm",
        "feel like dying"
    
    ],

    medium: [
        "hopeless",
        "worthless",
        "can't go on",
        "cannot go on",
        "no reason to live",
        "extremely depressed",
        "hate myself"
    ],

    low: [
        "stressed",
        "stress",
        "anxious",
        "anxiety",
        "overwhelmed",
        "lonely",
        "sad"
    ]
};

function detectSensitivity(message) {
    const text = message.toLowerCase().trim();

    const detected = [];

    for (const word of sensitivityCategories.high) {
        if (text.includes(word)) {
            detected.push({
                word: word,
                level: "high"
            });
        }
    }

    for (const word of sensitivityCategories.medium) {
        if (text.includes(word)) {
            detected.push({
                word: word,
                level: "medium"
            });
        }
    }

    for (const word of sensitivityCategories.low) {
        if (text.includes(word)) {
            detected.push({
                word: word,
                level: "low"
            });
        }
    }

    let riskLevel = "normal";

    if (detected.some(item => item.level === "high")) {
        riskLevel = "high";
    } else if (detected.some(item => item.level === "medium")) {
        riskLevel = "medium";
    } else if (detected.some(item => item.level === "low")) {
        riskLevel = "low";
    }

    return {
        riskLevel,
        detectedWords: detected.map(item => item.word)
    };
}

module.exports = {
    detectSensitivity
};


