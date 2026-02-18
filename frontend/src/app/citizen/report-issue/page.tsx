"use client"

import { useState, useEffect } from "react"
import { Upload, CheckCircle, Loader2, AlertCircle, Sparkles } from "lucide-react"
import { GoogleGenAI } from "@google/genai"

export default function ReportIssue() {
  const [email, setEmail] = useState<string>("")
  const [user, setUser] = useState<any>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    location: "",
    severity: "LOW" as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  })
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState("")
  const [uploadedImageUrl, setUploadedImageUrl] = useState("")
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [locationError, setLocationError] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<string>("")

  useEffect(() => {
    const storedEmail = localStorage.getItem("email")
    const storedId = localStorage.getItem("id")
    if (storedEmail) {
      setEmail(storedEmail)
      setUser({
        id: storedId,
        email: storedEmail,
        currentMLA: { name: "Sample MLA", id: "mla123" },
        constituency: "Sample Constituency"
      })
    }
    setIsLoadingUser(false)
  }, [])

  const categories = ["Road Damage", "Pothole", "Street Light", "Water Supply", "Drainage", "Garbage", "Traffic", "Other"]
  const severityLevels = [
    { value: "LOW", label: "Low", color: "text-[#10b981]" },
    { value: "MEDIUM", label: "Medium", color: "text-[#eab308]" },
    { value: "HIGH", label: "High", color: "text-[#f97316]" },
    { value: "CRITICAL", label: "Critical", color: "text-[#ef4444]" },
  ]

  const getCurrentLocation = () => {
    setIsLoadingLocation(true)
    setLocationError("")
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser")
      setIsLoadingLocation(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setCoordinates({ latitude, longitude })
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
          const data = await response.json()
          const address = data.display_name || `${latitude}, ${longitude}`
          setFormData(prev => ({ ...prev, location: address }))
          
        } catch (error) {
          setFormData(prev => ({ ...prev, location: `${latitude}, ${longitude}` }))
        }
        setIsLoadingLocation(false)
      },
      (error) => {
        setLocationError("Unable to get location. Please enter manually.")
        setIsLoadingLocation(false)
      }
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const analyzeImageWithGemini = async (base64Image: string) => {
    setIsAnalyzing(true)
    setAiSuggestion("")
    try {
      const ai = new GoogleGenAI({ apiKey: "AIzaSyCd6Lb7YPuoIW61NQKJWwvuQRq1ux3_-K8" })
      
      const prompt = `Analyze this civic issue image and provide the following information in JSON format only (no additional text):
{
  "title": "Brief, clear title (max 10 words)",
  "category": "One of: Road Damage, Pothole, Street Light, Water Supply, Drainage, Garbage, Traffic, Other",
  "description": "Detailed description of the issue (2-3 sentences)",
  "severity": "One of: LOW, MEDIUM, HIGH, CRITICAL",
  "reasoning": "Brief explanation of severity assessment"
}

Be specific about what you see in the image. For severity: LOW = minor cosmetic issues, MEDIUM = noticeable problems affecting daily use, HIGH = significant damage requiring urgent attention, CRITICAL = immediate safety hazard.`

      // Convert base64 to the format Gemini expects
      const base64Data = base64Image.split(',')[1]
      
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Data
                }
              },
              { text: prompt }
            ]
          }
        ]
      })

      const resultText = response.text
      
      // Extract JSON from response
      const jsonMatch = resultText!.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0])
        
        // Auto-fill form fields
        setFormData(prev => ({
          ...prev,
          title: analysis.title || prev.title,
          category: analysis.category || prev.category,
          description: analysis.description || prev.description,
          severity: analysis.severity || prev.severity,
        }))
        
        setAiSuggestion(`✨ AI Analysis: ${analysis.reasoning || "Image analyzed successfully"}`)
      } else {
        throw new Error("Could not parse AI response")
      }
      
    } catch (error) {
      console.error("Gemini AI analysis error:", error)
      setAiSuggestion("⚠️ AI analysis failed. Please fill in the details manually.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const uploadToCloudinary = async (file: File) => {
    setIsUploading(true)
    setUploadError("")
    try {
      const formDataObj = new FormData()
      formDataObj.append('file', file)
      formDataObj.append('upload_preset', 'ml_default')
      formDataObj.append('api_key', '293268566572153')
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dvmnmpdyy/image/upload`,
        {
          method: 'POST',
          body: formDataObj
        }
      )
      if (!response.ok) {
        throw new Error('Upload failed')
      }
      const data = await response.json()
      setUploadedImageUrl(data.secure_url)
      return data.secure_url
    } catch (error) {
      setUploadError('Failed to upload image. Please try again.')
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhoto(file)
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string
        setPhotoPreview(base64)
        
        // Start AI analysis and cloud upload in parallel
        const analysisPromise = analyzeImageWithGemini(base64)
        const uploadPromise = uploadToCloudinary(file)
        
        await Promise.all([analysisPromise, uploadPromise])
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
  setIsSubmitting(true)
  setUploadError("")
  try {
    const citizenId = localStorage.getItem("id")
    if (!citizenId) {
      setUploadError("User not authenticated. Please login again.")
      setIsSubmitting(false)
      return
    }

    // Fix: Get mlaId correctly from the user object
    // The API returns mlaId at the root level of the citizen object
    const mlaId = user?.mlaId

    // Log for debugging
    console.log("User data:", user)
    console.log("MLA ID:", mlaId)

    // Only include mlaId if it exists and is not null
    const issueData = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      location: formData.location,
      severity: formData.severity,
      citizenId: citizenId,
      ...(mlaId && { mlaId: mlaId }),
      ...(uploadedImageUrl && { mediaUrl: uploadedImageUrl }),
      ...(coordinates?.latitude && { latitude: coordinates.latitude }),
      ...(coordinates?.longitude && { longitude: coordinates.longitude }),
    }

    // Log the data being sent for debugging
    console.log("Submitting issue data:", issueData)

    const response = await fetch("https://civiciobackend.vercel.app/api/v1/citizen/issue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(issueData),
    })

    const data = await response.json()
    
    
    if (!response.ok) {
      throw new Error(data.message || "Failed to submit issue")
    }

    setSubmitted(true)
    setTimeout(() => {
      window.location.href = "/citizen/dashboard"
    }, 3000)
  } catch (error: any) {
    console.error("Submit error:", error)
    setUploadError(error.message || "An unexpected error occurred. Please try again.")
    setIsSubmitting(false)
  }
}

  if (isLoadingUser || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background:'#0a0a0a'}}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin" style={{color:'#3b82f6',margin:'0 auto 1rem'}} />
          <p style={{color:'#a1a1aa'}}>Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4 mt-12" style={{background:'#0a0a0a',color:'#fff'}}>
      <div className="max-w-2xl mx-auto">
        <div>
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <h1 className="text-4xl font-bold" style={{color:'#fff'}}>Report an Issue</h1>
              <Sparkles className="w-6 h-6" style={{color:'#a855f7'}} />
            </div>
            <p style={{color:'#a1a1aa'}}>Help improve your city by reporting civic issues</p>
            <p className="text-xs mt-1" style={{color:'#a855f7'}}>✨ Powered by Google Gemini AI</p>
            {user?.currentMLA && (
              <p className="text-sm mt-2" style={{color:'#3b82f6'}}>
                
              </p>
            )}
          </div>

          {submitted ? (
            <div className="border-2 rounded-lg p-8 text-center" style={{background:'#18181b',borderColor:'#10b981'}}>
              <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{color:'#10b981'}} />
              <h2 className="text-2xl font-bold mb-2" style={{color:'#10b981'}}>Issue Reported Successfully</h2>
              <p className="mb-4" style={{color:'#a1a1aa'}}>
                Your report has been submitted to {user?.currentMLA?.name || "your MLA"}. 
              </p>
              <div className="rounded p-4 mb-4" style={{background:'#27272a',border:'1px solid #3b82f6'}}>
                <p className="text-sm font-medium mb-2" style={{color:'#3b82f6'}}>
                  ✉️ Confirmation Email Sent
                </p>
                <p className="text-xs" style={{color:'#71717a'}}>
                  We've sent a confirmation email to <strong style={{color:'#d4d4d8'}}>{email}</strong> with all the issue details.
                </p>
              </div>
              {uploadedImageUrl && (
                <div className="rounded p-3 mb-4" style={{background:'#23232b'}}>
                  <p className="text-sm mb-1 font-medium" style={{color:'#a1a1aa'}}>Image URL:</p>
                  <p className="text-xs" style={{color:'#3b82f6',wordBreak:'break-all'}}>{uploadedImageUrl}</p>
                </div>
              )}
              <p className="text-sm" style={{color:'#71717a'}}>
                Redirecting to dashboard in 3 seconds...
              </p>
            </div>
          ) : (
            <div className="rounded-lg shadow-lg p-8 space-y-6" style={{background:'#18181b',border:'1px solid #27272a'}}>
              {/* Photo Upload - Moved to top for AI analysis */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{color:'#d4d4d8'}}>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" style={{color:'#a855f7'}} />
                    Upload Photo (AI-Powered Analysis)
                    <span className="text-xs" style={{color:'#71717a'}}>(Optional)</span>
                  </div>
                </label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer"
                  style={{borderColor:isAnalyzing?'#a855f7':'#27272a',background:'#23232b',transition:'all 0.3s'}}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    id="photo-input"
                    disabled={isUploading || isAnalyzing}
                  />
                  <label htmlFor="photo-input" className="cursor-pointer block">
                    {isAnalyzing ? (
                      <div className="space-y-2">
                        <Sparkles className="w-8 h-8 mx-auto animate-pulse" style={{color:'#a855f7'}} />
                        <p className="text-sm font-medium" style={{color:'#a855f7'}}>Gemini AI is analyzing your image...</p>
                        <p className="text-xs" style={{color:'#71717a'}}>This may take a few seconds</p>
                      </div>
                    ) : isUploading ? (
                      <div className="space-y-2">
                        <Loader2 className="w-8 h-8 mx-auto animate-spin" style={{color:'#3b82f6'}} />
                        <p className="text-sm font-medium" style={{color:'#3b82f6'}}>Uploading to cloud...</p>
                      </div>
                    ) : photoPreview ? (
                      <div className="space-y-2">
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="w-32 h-32 object-cover mx-auto rounded"
                        />
                        {uploadedImageUrl && (
                          <div className="flex items-center justify-center gap-2" style={{color:'#10b981'}}>
                            <CheckCircle className="w-4 h-4" />
                            <p className="text-sm font-medium">Uploaded successfully</p>
                          </div>
                        )}
                        <p className="text-sm" style={{color:'#71717a'}}>Click to change photo</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 mx-auto" style={{color:'#52525b'}} />
                        <p className="text-sm font-medium" style={{color:'#d4d4d8'}}>Click to upload or drag and drop</p>
                        <p className="text-xs" style={{color:'#71717a'}}>PNG, JPG up to 10MB</p>
                        <div className="flex items-center justify-center gap-1 mt-2">
                          <Sparkles className="w-3 h-3" style={{color:'#a855f7'}} />
                          <p className="text-xs" style={{color:'#a855f7'}}>Gemini AI will auto-fill the form</p>
                        </div>
                      </div>
                    )}
                  </label>
                </div>
                {aiSuggestion && (
                  <div className="mt-2 flex items-start gap-2 text-sm p-3 rounded-lg" style={{background:'#2e1065',borderLeft:'3px solid #a855f7'}}>
                    <Sparkles className="w-4 h-4 shrink-0 mt-0.5" style={{color:'#a855f7'}} />
                    <p style={{color:'#e9d5ff'}}>{aiSuggestion}</p>
                  </div>
                )}
                {uploadError && (
                  <div className="mt-2 flex items-center gap-2 text-sm" style={{color:'#ef4444'}}>
                    <AlertCircle className="w-4 h-4" />
                    <p>{uploadError}</p>
                  </div>
                )}
              </div>

              {/* AI Status Banner */}
              {(isAnalyzing || isUploading) && (
                <div className="rounded-lg p-4 border" style={{background:'#1e1b4b',borderColor:'#a855f7'}}>
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" style={{color:'#c084fc'}} />
                    <div>
                      <p className="text-sm font-medium" style={{color:'#e9d5ff'}}>
                        {isAnalyzing ? "🤖 Gemini AI is analyzing your image..." : "☁️ Uploading image..."}
                      </p>
                      <p className="text-xs" style={{color:'#c4b5fd'}}>
                        {isAnalyzing ? "Form fields will be auto-filled shortly" : "Please wait"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Issue Title */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{color:'#d4d4d8'}}>Issue Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Brief title of the issue"
                  required
                  className="w-full px-4 py-2 rounded-lg bg-[#23232b] border border-[#27272a] text-white focus:ring-2 focus:ring-[#a855f7] focus:border-transparent text-base"
                  style={{transition:'all .15s'}}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{color:'#d4d4d8'}}>Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-[#23232b] border border-[#27272a] text-white focus:ring-2 focus:ring-[#a855f7] focus:border-transparent text-base"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{color:'#d4d4d8'}}>Location *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Enter address or use auto-detect"
                    required
                    className="flex-1 px-4 py-2 rounded-lg bg-[#23232b] border border-[#27272a] text-white focus:ring-2 focus:ring-[#a855f7] focus:border-transparent text-base"
                  />
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isLoadingLocation}
                    className="px-4 py-2 bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                  >
                    {isLoadingLocation ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Detecting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Auto-detect
                      </>
                    )}
                  </button>
                </div>
                {locationError && (
                  <p className="text-xs mt-1" style={{color:'#fde68a'}}>{locationError}</p>
                )}
                {coordinates && (
                  <p className="text-xs mt-1" style={{color:'#10b981'}}>
                    📍 Coordinates captured: {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
                  </p>
                )}
              </div>

              {/* Severity */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{color:'#d4d4d8'}}>Severity *</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {severityLevels.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, severity: level.value as any }))}
                      className={
                        `px-4 py-2 rounded-lg border-2 font-medium transition ` +
                        (formData.severity === level.value
                          ? `${level.color} border-current bg-[#23232b] bg-opacity-15`
                          : 'border-[#27272a] text-[#a1a1aa] hover:text-white hover:border-[#52525b]')
                      }
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{color:'#d4d4d8'}}>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Detailed description of the issue"
                  rows={4}
                  required
                  className="w-full px-4 py-2 rounded-lg bg-[#23232b] border border-[#27272a] text-white focus:ring-2 focus:ring-[#a855f7] focus:border-transparent resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || isUploading || isAnalyzing || !formData.title || !formData.category || !formData.location || !formData.description}
                  className="flex-1 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                  style={{background:'#3b82f6',color:'#fff',boxShadow:'0 2px 8px 0 rgba(59,130,246,.09)',opacity:isSubmitting||isUploading||isAnalyzing||!formData.title||!formData.category||!formData.location||!formData.description?0.6:1,pointerEvents:isSubmitting||isUploading||isAnalyzing||!formData.title||!formData.category||!formData.location||!formData.description? 'none':'auto'}}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Uploading photo...
                    </>
                  ) : isAnalyzing ? (
                    <>
                      <Sparkles className="w-5 h-5 animate-pulse" />
                      AI Analyzing...
                    </>
                  ) : (
                    "Submit Report"
                  )}
                </button>
                <button
                  onClick={() => window.history.back()}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-lg font-semibold transition"
                  style={{border:'2px solid #27272a',color:'#d4d4d8',background:'#23232b'}}
                >
                  Cancel
                </button>
              </div>

              {(!formData.title || !formData.category || !formData.location || !formData.description) && !isSubmitting && (
                <div className="flex items-start gap-2 text-sm p-3 rounded-lg border mt-2"
                  style={{background:'#312e81',borderColor:'#818cf8',color:'#fbbf24'}}>
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Please complete all required fields:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-xs">
                      {!formData.title && <li>Issue Title</li>}
                      {!formData.category && <li>Category</li>}
                      {!formData.location && <li>Location</li>}
                      {!formData.description && <li>Description</li>}
                    </ul>
                    <div className="flex items-center gap-1 mt-2">
                      <Sparkles className="w-3 h-3" style={{color:'#c7d2fe'}} />
                      <p className="text-xs" style={{color:'#c7d2fe'}}>💡 Tip: Upload a photo and Gemini AI will fill these for you!</p>
                    </div>
                  </div>
                </div>
              )}

              {uploadError && !isUploading && (
                <div className="mt-2 flex items-center gap-2 text-sm p-3 rounded-lg"
                  style={{background:'#450a0a',color:'#ef4444'}}>
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>{uploadError}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}