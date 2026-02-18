// Service worker for background tasks
const GEMINI_API_KEY = "AIzaSyAaKTwESBKSV8QzmEFKrAvzAOVafbWo0VQ"
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

const chrome = window.chrome

const requestQueue = []
const isProcessing = false

chrome.runtime.onInstalled.addListener(() => {
  console.log("[v0] CIVICOS Verifier extension installed")

  // Initialize storage
  chrome.storage.local.get("verificationHistory", (result) => {
    if (!result.verificationHistory) {
      chrome.storage.local.set({ verificationHistory: [] })
    }
  })

  // Initialize settings
  chrome.storage.local.get("extensionSettings", (result) => {
    if (!result.extensionSettings) {
      chrome.storage.local.set({
        extensionSettings: {
          autoAnalyze: true,
          maxHistoryItems: 50,
          apiTimeout: 30000,
        },
      })
    }
  })
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyzeClaim") {
    analyzeClaimInBackground(request.data)
      .then((result) => {
        sendResponse({ success: true, data: result })
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message })
      })
    return true // Keep channel open for async response
  }

  if (request.action === "submitToAPI") {
    submitDataToAPI(request.data)
      .then((result) => {
        sendResponse({ success: true, data: result })
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message })
      })
    return true
  }
})

async function analyzeClaimInBackground(data) {
  console.log("[v0] Background: Analyzing claim", data)

  const prompt = `Analyze this civic claim from India:
Location: ${data.location || "Not provided"}
Issue Type: ${data.issueType || "Not specified"}
Content: "${data.content ? data.content.substring(0, 500) : ""}
"

Provide structured analysis:
1. Claim Legitimacy Score (0-100)
2. Related Authority
3. Estimated Impact
4. Similar Recent Cases (if known)
5. Recommended Next Steps

Format as JSON.`

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const result = await response.json()
    if (result.candidates && result.candidates[0]) {
      const responseText = result.candidates[0].content.parts[0].text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    }

    throw new Error("Invalid API response format")
  } catch (error) {
    console.error("[v0] Background analysis error:", error)
    throw error
  }
}

async function submitDataToAPI(data) {
  console.log("[v0] Background: Submitting data", data)

  // Store submission locally first
  const submission = {
    ...data,
    timestamp: new Date().toISOString(),
    status: "pending",
    id: generateUUID(),
  }

  chrome.storage.local.get("submissions", (result) => {
    const submissions = result.submissions || []
    submissions.push(submission)
    chrome.storage.local.set({ submissions })
  })

  // TODO: Send to CIVICOS backend API
  // This would be replaced with actual API endpoint
  return {
    submissionId: submission.id,
    status: "queued",
    message: "Your report has been queued for processing",
  }
}

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

chrome.contextMenus.create({
  id: "verifyCivicClaim",
  title: "Verify with CIVICOS",
  contexts: ["selection", "link", "page"],
  icons: {
    16: "icons/icon-16.jpg",
  },
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "verifyCivicClaim") {
    const selectedText = info.selectionText || info.linkUrl || ""
    console.log("[v0] Context menu verification triggered:", selectedText)

    // Send message to popup
    chrome.tabs
      .sendMessage(tab.id, {
        action: "verifyCivicContent",
        content: selectedText,
      })
      .catch((err) => {
        console.log("[v0] Could not send message to content script:", err)
      })
  }
})
