"use client"

import { useState, useEffect } from "react"
import { Upload, CheckCircle, Loader2, AlertCircle } from "lucide-react"
import { useUserDetails } from "@/lib/cache/index"

export default function ReportIssue() {
  const [email, setEmail] = useState<string>("")
  const { data: user, isLoading: isLoadingUser } = useUserDetails(email)

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

  // Load user email from localStorage
  useEffect(() => {
    const storedEmail = localStorage.getItem("email")
    if (storedEmail) {
      setEmail(storedEmail)
    }
  }, [])

  const categories = [
    "Road Damage",
    "Pothole",
    "Street Light",
    "Water Supply",
    "Drainage",
    "Garbage",
    "Traffic",
    "Other",
  ]

  const severityLevels = [
    { value: "LOW", label: "Low", color: "text-green-600" },
    { value: "MEDIUM", label: "Medium", color: "text-yellow-600" },
    { value: "HIGH", label: "High", color: "text-orange-600" },
    { value: "CRITICAL", label: "Critical", color: "text-red-600" },
  ]

  // Get current location
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
        
        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          )
          const data = await response.json()
          const address = data.display_name || `${latitude}, ${longitude}`
          setFormData(prev => ({ ...prev, location: address }))
        } catch (error) {
          console.error("Geocoding error:", error)
          setFormData(prev => ({ ...prev, location: `${latitude}, ${longitude}` }))
        }
        
        setIsLoadingLocation(false)
      },
      (error) => {
        console.error("Location error:", error)
        setLocationError("Unable to get location. Please enter manually.")
        setIsLoadingLocation(false)
      }
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const uploadToCloudinary = async (file: File) => {
    setIsUploading(true)
    setUploadError("")
    
    try {
      // Create form data for Cloudinary
      const formDataObj = new FormData()
      formDataObj.append('file', file)
      formDataObj.append('upload_preset', 'ml_default')
      formDataObj.append('api_key', '293268566572153')
      
      // Upload to Cloudinary
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
      console.log('Uploaded image URL:', data.secure_url)
      return data.secure_url
      
    } catch (error) {
      console.error('Upload error:', error)
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
      
      // Show preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to Cloudinary
      await uploadToCloudinary(file)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setUploadError("")

    try {
      // Get citizen ID from localStorage
      const citizenId = localStorage.getItem("id")
      
      if (!citizenId) {
        setUploadError("User not authenticated. Please login again.")
        setIsSubmitting(false)
        return
      }

      // Get MLA ID from cached user data
      const mlaId = user?.currentMLA?.id || user?.mlaId

      // Prepare issue data matching backend route structure
      const issueData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        location: formData.location,
        severity: formData.severity,
        citizenId: citizenId,
        ...(mlaId && { mlaId: mlaId }), // ✅ Include MLA ID from cached data
        ...(uploadedImageUrl && { mediaUrl: uploadedImageUrl }),
        ...(coordinates?.latitude && { latitude: coordinates.latitude }),
        ...(coordinates?.longitude && { longitude: coordinates.longitude }),
      }

      console.log("Submitting issue data:", issueData)

      // Submit to backend
      const response = await fetch("https://civiciobackend.vercel.app/api/v1/citizen/issue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(issueData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit issue")
      }

      console.log("Issue created successfully:", data)
      setSubmitted(true)

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        window.location.href = "/citizen/dashboard"
      }, 2000)

    } catch (error: any) {
      console.error("Error submitting issue:", error)
      setUploadError(error.message || "An unexpected error occurred. Please try again.")
      setIsSubmitting(false)
    }
  }

  // Show loading state while fetching user data
  if (isLoadingUser || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div>
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2 text-gray-900">Report an Issue</h1>
            <p className="text-gray-600">Help improve your city by reporting civic issues</p>
            {user?.currentMLA && (
              <p className="text-sm text-blue-600 mt-2">
                📍 
              </p>
            )}
          </div>

          {submitted ? (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-900 mb-2">
                Issue Reported Successfully
              </h2>
              <p className="text-green-700 mb-4">
                Your report has been submitted to {user?.currentMLA?.name || "your MLA"}. Authorities will review and take action soon.
              </p>
              {uploadedImageUrl && (
                <div className="bg-white rounded p-3 mb-4">
                  <p className="text-sm text-gray-600 mb-1 font-medium">Image URL:</p>
                  <p className="text-xs text-blue-600 break-all">{uploadedImageUrl}</p>
                </div>
              )}
              <p className="text-sm text-green-600">Redirecting to dashboard...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
              {/* Issue Title */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Issue Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Brief title of the issue"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Location *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Enter address or use auto-detect"
                    required
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isLoadingLocation}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
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
                  <p className="text-xs text-amber-600 mt-1">{locationError}</p>
                )}
                {coordinates && (
                  <p className="text-xs text-green-600 mt-1">
                    📍 Coordinates captured: {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
                  </p>
                )}
              </div>

              {/* Severity */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Severity *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {severityLevels.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, severity: level.value as any }))}
                      className={`px-4 py-2 rounded-lg border-2 transition font-medium ${
                        formData.severity === level.value
                          ? `border-current bg-opacity-10 ${level.color}`
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Detailed description of the issue"
                  rows={4}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Upload Photo <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    id="photo-input"
                    disabled={isUploading}
                  />
                  <label htmlFor="photo-input" className="cursor-pointer block">
                    {isUploading ? (
                      <div className="space-y-2">
                        <Loader2 className="w-8 h-8 mx-auto text-blue-600 animate-spin" />
                        <p className="text-sm font-medium text-blue-600">Uploading to cloud...</p>
                      </div>
                    ) : photoPreview ? (
                      <div className="space-y-2">
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="w-32 h-32 object-cover mx-auto rounded"
                        />
                        {uploadedImageUrl && (
                          <div className="flex items-center justify-center gap-2 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <p className="text-sm font-medium">Uploaded successfully</p>
                          </div>
                        )}
                        <p className="text-sm text-gray-500">Click to change photo</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 mx-auto text-gray-400" />
                        <p className="text-sm font-medium text-gray-700">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                      </div>
                    )}
                  </label>
                </div>
                
                {uploadError && (
                  <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <p>{uploadError}</p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || isUploading || !formData.title || !formData.category || !formData.location || !formData.description}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                  ) : (
                    "Submit Report"
                  )}
                </button>
                <button
                  onClick={() => window.history.back()}
                  disabled={isSubmitting}
                  className="flex-1 border-2 border-gray-300 py-3 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>

              {/* Validation feedback */}
              {(!formData.title || !formData.category || !formData.location || !formData.description) && !isSubmitting && (
                <div className="flex items-start gap-2 text-amber-600 text-sm bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Please complete all required fields:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-xs">
                      {!formData.title && <li>Issue Title</li>}
                      {!formData.category && <li>Category</li>}
                      {!formData.location && <li>Location</li>}
                      {!formData.description && <li>Description</li>}
                    </ul>
                  </div>
                </div>
              )}

              {uploadError && !isUploading && (
                <div className="mt-2 flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
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