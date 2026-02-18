const GEMINI_API_KEY = "AIzaSyAaKTwESBKSV8QzmEFKrAvzAOVafbWo0VQ";
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
let currentAnalysis = null;
let isMapLoaded = false;

document.addEventListener("DOMContentLoaded", async () => {
  console.log("[DEBUG] 1. Popup opened");

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    console.log("[DEBUG] 2. Got tab:", tab.url);

    // INJECT content script first
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });

    // Small delay to let it initialize
    setTimeout(() => {
      chrome.tabs.sendMessage(
        tab.id,
        { action: "getPageContent" },
        (response) => {
          if (chrome.runtime.lastError || !response) {
            showEmptyState();
            return;
          }

          if (response && response.content) {
            analyzeContent(response.content);
          } else {
            showEmptyState();
          }
        }
      );
    }, 100);
  } catch (error) {
    console.error("[DEBUG] Exception:", error);
    showEmptyState();
  }

  // Button event listeners (keep these)
  document.getElementById("verifyClaim").addEventListener("click", verifyClaim);
  document
    .getElementById("checkDetails")
    .addEventListener("click", showDetails);
  document
    .getElementById("submitCivicos")
    .addEventListener("click", submitToCivicos);
  document.getElementById("historyBtn").addEventListener("click", showHistory);
  document
    .getElementById("closeHistory")
    .addEventListener("click", closeHistory);
  document
    .getElementById("closeDetails")
    .addEventListener("click", closeDetails);
  document
    .getElementById("historyBackdrop")
    .addEventListener("click", closeHistory);
  document
    .getElementById("detailsBackdrop")
    .addEventListener("click", closeDetails);
});

async function analyzeContent(content) {
  console.log("[v0] Analyzing content");

  showLoadingState();

  try {
    const analysisPrompt = `Analyze this civic content from India. Extract and classify:
1. Location (city, area, ward if mentioned)
2. Issue type (pothole, drainage, street light, garbage, water, electricity, etc.)
3. Severity (Low/Medium/High/Critical)
4. Is this a legitimate civic concern? (Yes/No)
5. Suggested authority (Municipality, Water board, Electricity board, etc.)

Content: "${content.text.substring(0, 1000)}"

Respond ONLY in this JSON format:
{
  "location": "string",
  "issueType": "string",
  "severity": "string",
  "isLegitimate": boolean,
  "confidence": number (0-100),
  "authority": "string",
  "summary": "brief summary"
}`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: analysisPrompt }],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.candidates && data.candidates[0]) {
      const responseText = data.candidates[0].content.parts[0].text;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        currentAnalysis = JSON.parse(jsonMatch[0]);
        displayAnalysis(currentAnalysis, content);
        saveToHistory(currentAnalysis, content);
        return;
      }
    }

    showEmptyState();
  } catch (error) {
    console.error("[v0] Analysis error:", error);
    showEmptyState();
  }
}

function displayAnalysis(analysis, content) {
  console.log("[v0] Displaying analysis", analysis);

  document.getElementById("loadingState").classList.add("hidden");
  document.getElementById("emptyState").classList.add("hidden");
  document.getElementById("analysisState").classList.remove("hidden");

  // Update stats
  document.getElementById("locationText").textContent =
    analysis.location || "Not detected";
  document.getElementById("issueTypeText").textContent =
    analysis.issueType || "Unknown";
  document.getElementById("severityText").textContent =
    analysis.severity || "-";

  // Update confidence
  const confidence = analysis.confidence || 0;
  document.getElementById("confidenceText").textContent = confidence + "%";
  document.getElementById("confidenceFill").style.width = confidence + "%";

  // Apply severity styling
  const severityEl = document.getElementById("severityText");
  severityEl.className =
    "severity-badge " + getSeverityClass(analysis.severity);

  // Update content preview
  const preview = content.text.substring(0, 180);
  document.getElementById("contentPreview").textContent =
    preview + (preview.length >= 180 ? "..." : "");

  // Load map
  if (analysis.location) {
    loadMiniMap(analysis.location);
  }
}

function getSeverityClass(severity) {
  const classMap = {
    Low: "severity-low",
    Medium: "severity-medium",
    High: "severity-high",
    Critical: "severity-critical",
  };
  return classMap[severity] || "severity-medium";
}

async function loadMiniMap(location) {
  console.log("[v0] Loading map for", location);

  const mapContainer = document.getElementById("miniMap");
  const mapPlaceholder = document.getElementById("mapPlaceholder");

  try {
    const geoResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        location + ", India"
      )}&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "CivicVerifier Extension",
        },
      }
    );

    if (!geoResponse.ok) {
      console.error("[v0] Geocoding failed:", geoResponse.status);
      return;
    }

    const geoData = await geoResponse.json();
    console.log("[v0] Geocoding result:", geoData);

    if (geoData.length > 0) {
      const lat = parseFloat(geoData[0].lat);
      const lon = parseFloat(geoData[0].lon);

      console.log("[v0] Coordinates:", lat, lon);

      // Calculate bounding box
      const delta = 0.02;
      const bbox = `${lon - delta},${lat - delta},${lon + delta},${
        lat + delta
      }`;

      console.log("[v0] BBox:", bbox);

      // Hide placeholder
      mapPlaceholder.style.display = "none";

      // Build embed URL
      const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
      console.log("[v0] Map URL:", embedUrl);

      // Show map container and add iframe
      mapContainer.style.display = "block";
      mapContainer.innerHTML = `
        <iframe 
          width="500" 
          height="160" 
          frameborder="0" 
          scrolling="no" 
          marginheight="0" 
          marginwidth="0" 
          src="${embedUrl}" 
          style="border-radius:8px; display:block;">
        </iframe>
      `;

      isMapLoaded = true;
      console.log("[v0] Map loaded successfully");
    } else {
      console.log("[v0] No geocoding results found for:", location);
      mapPlaceholder.querySelector(
        "p"
      ).textContent = `Location "${location}" not found`;
    }
  } catch (error) {
    console.error("[v0] Map loading error:", error);
    mapPlaceholder.querySelector("p").textContent = "Failed to load map";
  }
}

async function verifyClaim() {
  if (!currentAnalysis) return;

  console.log("[v0] Verifying claim");

  const verificationPrompt = `Based on this civic issue analysis:
Location: ${currentAnalysis.location}
Issue: ${currentAnalysis.issueType}
Severity: ${currentAnalysis.severity}

Provide a concise verification report:
1. Is this a common civic complaint?
2. What are typical solutions?
3. Which authority handles this?
4. Estimated resolution time?
5. Tips for reporting?

Keep it brief and actionable.`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: verificationPrompt }],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.candidates && data.candidates[0]) {
      const verificationText = data.candidates[0].content.parts[0].text;
      displayVerificationResults(verificationText);
    }
  } catch (error) {
    console.error("[v0] Verification error:", error);
  }
}

function displayVerificationResults(results) {
  const resultsDiv = document.getElementById("verificationResults");
  const resultsContent = document.getElementById("resultsContent");

  const formattedResults = results
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      const trimmed = line.trim();
      if (/^\d+\./.test(trimmed)) {
        return `<p><strong>${trimmed.substring(
          0,
          3
        )}</strong> ${trimmed.substring(3)}</p>`;
      }
      return `<p>${trimmed}</p>`;
    })
    .join("");

  resultsContent.innerHTML = formattedResults;
  resultsDiv.classList.remove("hidden");

  setTimeout(() => {
    resultsDiv.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, 100);
}

function showDetails() {
  if (!currentAnalysis) return;

  const detailsContent = document.getElementById("detailsContent");

  detailsContent.innerHTML = `
    <div class="detail-item">
      <strong>Location</strong>
      <p>${currentAnalysis.location}</p>
    </div>
    <div class="detail-item">
      <strong>Issue Type</strong>
      <p>${currentAnalysis.issueType}</p>
    </div>
    <div class="detail-item">
      <strong>Severity Level</strong>
      <p>${currentAnalysis.severity}</p>
    </div>
    <div class="detail-item">
      <strong>Confidence Score</strong>
      <p>${currentAnalysis.confidence}%</p>
    </div>
    <div class="detail-item">
      <strong>Responsible Authority</strong>
      <p>${currentAnalysis.authority}</p>
    </div>
    <div class="detail-item">
      <strong>Is Legitimate</strong>
      <p>${
        currentAnalysis.isLegitimate
          ? "Yes - Valid civic concern"
          : "No - May need verification"
      }</p>
    </div>
    <div class="detail-item">
      <strong>Summary</strong>
      <p>${currentAnalysis.summary}</p>
    </div>
  `;

  document.getElementById("detailsModal").classList.remove("hidden");
}

function submitToCivicos(item) {
  if (!item) return;

  console.log("[v0] Submitting to CIVICOS", item);

  const payload = {
    location: item.location,
    issueType: item.issueType,
    severity: item.severity,
    authority: item.authority,
    confidence: item.confidence,
    timestamp: item.timestamp || new Date().toISOString(),
  };

  console.log("[v0] Payload for CIVICOS:", payload);
  alert(
    "✓ Issue submitted to CIVICOS platform!\n\nYour report helps improve civic governance."
  );
}

function saveToHistory(analysis, content) {
  chrome.storage.local.get(
    ["verificationHistory", "historyStats"],
    (result) => {
      const history = result.verificationHistory || [];
      const stats = result.historyStats || {
        totalVerifications: 0,
        issueTypes: {},
        severityDistribution: {},
        locationFrequency: {},
        lastUpdated: null,
      };

      // Create history entry with metadata
      const historyEntry = {
        ...analysis,
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString(),
        contentPreview: content.text.substring(0, 100),
        url: content.url,
        id: generateHistoryId(),
        tags: extractTags(analysis),
      };

      // Add to history
      history.unshift(historyEntry);

      // Update statistics
      stats.totalVerifications++;
      stats.issueTypes[analysis.issueType] =
        (stats.issueTypes[analysis.issueType] || 0) + 1;
      stats.severityDistribution[analysis.severity] =
        (stats.severityDistribution[analysis.severity] || 0) + 1;
      stats.locationFrequency[analysis.location] =
        (stats.locationFrequency[analysis.location] || 0) + 1;
      stats.lastUpdated = new Date().toISOString();

      // Maintain size limit
      if (history.length > 50) {
        history.pop();
      }

      chrome.storage.local.set({
        verificationHistory: history,
        historyStats: stats,
      });

      console.log("[v0] History saved. Total: " + history.length);
    }
  );
}

// Utility function to generate unique history IDs
function generateHistoryId() {
  return "hist_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
}

// Tag extraction for better categorization
function extractTags(analysis) {
  const tags = [];

  if (analysis.severity === "Critical") tags.push("urgent");
  if (analysis.isLegitimate) tags.push("verified");
  if (analysis.confidence > 80) tags.push("high-confidence");

  const issueType = analysis.issueType?.toLowerCase() || "";
  if (issueType.includes("water") || issueType.includes("pothole")) {
    tags.push("infrastructure");
  } else if (issueType.includes("electricity") || issueType.includes("light")) {
    tags.push("utilities");
  }

  return tags;
}

function showHistory() {
  chrome.storage.local.get(
    ["verificationHistory", "historyStats"],
    (result) => {
      const history = result.verificationHistory || [];
      const stats = result.historyStats || {};
      const historyList = document.getElementById("historyList");

      if (history.length === 0) {
        historyList.innerHTML =
          '<p class="no-data">No verification history yet. Start verifying civic content!</p>';
      } else {
        // Create history UI with stats summary
        let html = `
        <div class="history-stats-summary">
          <div class="stat-pill">Total: ${stats.totalVerifications || 0}</div>
          ${Object.entries(stats.issueTypes || {})
            .slice(0, 3)
            .map(
              ([type, count]) =>
                `<div class="stat-pill">${type}: ${count}</div>`
            )
            .join("")}
        </div>
        <div class="history-items">`;

        history.forEach((item, idx) => {
          const severity = getSeverityClass(item.severity);
          html += `
          <div class="history-item" data-id="${item.id}">
            <div class="history-item-header">
              <div class="history-item-title">${item.issueType}</div>
              <span class="severity-badge ${severity}">${item.severity}</span>
            </div>
            <div class="history-item-meta">
              <span class="location">📍 ${item.location}</span>
              <span class="date">${item.date}</span>
              <span class="confidence">${item.confidence}%</span>
            </div>
            <p class="history-item-preview">${item.contentPreview}</p>
            <div class="history-item-tags">
              ${
                item.tags
                  ? item.tags
                      .map((tag) => `<span class="tag">${tag}</span>`)
                      .join("")
                  : ""
              }
            </div>
          </div>
        `;
        });

        html += "</div>";
        historyList.innerHTML = html;

        // Add event listeners for history item interactions
        document.querySelectorAll(".history-item").forEach((item) => {
          item.addEventListener("click", () => {
            const id = item.getAttribute("data-id");
            loadHistoryDetails(id, history);
          });
        });
      }

      document.getElementById("historyModal").classList.remove("hidden");
    }
  );
}

// Function to load and display history item details
function loadHistoryDetails(id, history) {
  const item = history.find((h) => h.id === id);
  if (!item) return;

  const detailsContent = document.getElementById("detailsContent");

  detailsContent.innerHTML = `
    <div class="history-detail">
      <div class="detail-section">
        <h3>Issue Details</h3>
        <div class="detail-item">
          <strong>Type</strong>
          <p>${item.issueType}</p>
        </div>
        <div class="detail-item">
          <strong>Location</strong>
          <p>${item.location}</p>
        </div>
        <div class="detail-item">
          <strong>Severity</strong>
          <p>${item.severity}</p>
        </div>
      </div>
      
      <div class="detail-section">
        <h3>Analysis Metrics</h3>
        <div class="detail-item">
          <strong>Confidence Score</strong>
          <p>${item.confidence}%</p>
        </div>
        <div class="detail-item">
          <strong>Legitimate Concern</strong>
          <p>${item.isLegitimate ? "Yes" : "No"}</p>
        </div>
        <div class="detail-item">
          <strong>Authority</strong>
          <p>${item.authority}</p>
        </div>
      </div>
      
      <div class="detail-section">
        <h3>Metadata</h3>
        <div class="detail-item">
          <strong>Date</strong>
          <p>${new Date(item.timestamp).toLocaleString()}</p>
        </div>
        <div class="detail-item">
          <strong>Source URL</strong>
          <p class="url-text">${item.url || "N/A"}</p>
        </div>
        <div class="detail-item">
          <strong>Preview</strong>
          <p>${item.contentPreview}</p>
        </div>
      </div>
      
      ${
        item.summary
          ? `
        <div class="detail-section">
          <h3>Summary</h3>
          <p>${item.summary}</p>
        </div>
      `
          : ""
      }
      
      <button class="btn btn-primary" onclick="resubmitHistoryItem('${
        item.id
      }')">
        Resubmit This Report
      </button>
    </div>
  `;

  document.getElementById("detailsModal").classList.remove("hidden");
}

// Function to resubmit historical reports
function resubmitHistoryItem(id) {
  console.log("[v0] Resubmitting history item:", id);

  chrome.storage.local.get("verificationHistory", (result) => {
    const item = result.verificationHistory.find((h) => h.id === id);
    if (item) {
      submitToCivicos(item);
    }
  });
}

function showLoadingState() {
  document.getElementById("emptyState").classList.add("hidden");
  document.getElementById("analysisState").classList.add("hidden");
  document.getElementById("loadingState").classList.remove("hidden");
}

function showEmptyState() {
  document.getElementById("loadingState").classList.add("hidden");
  document.getElementById("analysisState").classList.add("hidden");
  document.getElementById("emptyState").classList.remove("hidden");
}

function closeHistory() {
  document.getElementById("historyModal").classList.add("hidden");
}

function closeDetails() {
  document.getElementById("detailsModal").classList.add("hidden");
}
