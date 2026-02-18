// Listen for messages from popup
window.chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPageContent") {
    const content = extractPageContent()
    sendResponse({ content: content })
  }
})

function extractPageContent() {
  console.log("[v0] Extracting page content")

  // Get article text
  const articleSelectors = [
    "article",
    '[role="article"]',
    ".article-body",
    ".post-content",
    ".entry-content",
    "main",
    ".content",
  ]

  let text = ""
  for (const selector of articleSelectors) {
    const element = document.querySelector(selector)
    if (element) {
      text = element.innerText
      break
    }
  }

  // Fallback to body text
  if (!text) {
    text = document.body.innerText
  }

  // Extract page title
  const title = document.title || document.querySelector("h1")?.textContent || ""

  // Extract images
  const images = Array.from(document.querySelectorAll("img"))
    .slice(0, 3)
    .map((img) => ({
      src: img.src,
      alt: img.alt,
    }))

  // Get all text (limit to 2000 chars for API)
  const fullText = (title + " " + text).substring(0, 2000)

  return {
    title: title,
    text: fullText,
    images: images,
    url: window.location.href,
  }
}
