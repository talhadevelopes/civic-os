"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Navbar } from "@/app/_components/navbar";
import { Footer } from "@/app/_components/footer";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Users,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Send,
  Sparkles,
} from "lucide-react";

interface Citizen {
  id: string;
  name: string;
  email: string;
  constituency: string;
}

interface MLA {
  id: string;
  name: string;
  party: string;
  constituency: string;
  email: string;
  phone: string | null;
  rating: number | null;
}

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    email: string;
    constituency: string;
    type: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Upvote {
  citizen: {
    id: string;
    name: string;
    constituency: string;
  };
  upvotedAt: string;
}

interface Downvote {
  citizen: {
    id: string;
    name: string;
    constituency: string;
  };
  downvotedAt: string;
}

interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  mediaUrl: string | null;
  location: string;
  latitude: number | null;
  longitude: number | null;
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  upvoteCount: number;
  downvoteCount: number;
  hasUpvoted: boolean;
  hasDownvoted: boolean;
  citizenId: string;
  mlaId: string | null;
  organizationId: string | null;
  createdAt: string;
  updatedAt: string;
  citizen: Citizen;
  mla: MLA | null;
  organization: any | null;
  comments: Comment[];
  commentCount: number;
  upvotes: Upvote[];
  downvotes: Downvote[];
}

export default function IssueDetailPage() {
  const router = useRouter();
  const params = useParams();
  const issueId = params.issue_id as string;

  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [citizenId, setCitizenId] = useState<string>("");
  const [commentSummaries, setCommentSummaries] = useState<{ [key: string]: string }>({});
  const [loadingSummaries, setLoadingSummaries] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const storedCitizenId = localStorage.getItem("id");
    if (storedCitizenId) {
      setCitizenId(storedCitizenId);
    }
  }, []);

  useEffect(() => {
    if (issueId) {
      fetchIssueDetail();
    }
    // eslint-disable-next-line
  }, [issueId]);

  const fetchIssueDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://civiciobackend.vercel.app/api/v1/citizen/issue/${issueId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch issue details");
      }
      const data = await response.json();
      if (data.success) {
        setIssue(data.issue);
        if (data.issue.comments && data.issue.comments.length > 0) {
          data.issue.comments.forEach((comment: Comment) => {
            generateCommentSummary(comment.id, comment.content);
          });
        }
      } else {
        throw new Error("API returned unsuccessful response");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const generateCommentSummary = async (commentId: string, content: string) => {
    if (commentSummaries[commentId] || loadingSummaries[commentId]) {
      return;
    }
    setLoadingSummaries(prev => ({ ...prev, [commentId]: true }));
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Summarize this civic issue comment in 1-2 concise sentences. Focus on the key point or concern raised:\n\n"${content}"`
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 100,
            }
          }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }
      const data = await response.json();
      const summary = data.candidates?.[0]?.content?.parts?.[0]?.text || "Summary unavailable";
      setCommentSummaries(prev => ({ ...prev, [commentId]: summary }));
    } catch (err) {
      console.error("Summary generation error:", err);
      setCommentSummaries(prev => ({ ...prev, [commentId]: "AI summary unavailable" }));
    } finally {
      setLoadingSummaries(prev => ({ ...prev, [commentId]: false }));
    }
  };

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!citizenId) {
      alert("Please login to vote");
      return;
    }
    setIsVoting(true);
    try {
      const response = await fetch(
        `https://civiciobackend.vercel.app/api/v1/citizen/issue/${issueId}/${voteType}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            citizenId: citizenId,
          }),
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to ${voteType}`);
      }
      const data = await response.json();
      if (data.success) {
        await fetchIssueDetail();
      } else {
        throw new Error(data.message || `Failed to ${voteType}`);
      }
    } catch (err) {
      console.error("Vote error:", err);
      alert(
        err instanceof Error ? err.message : `Failed to ${voteType}. Please try again.`
      );
    } finally {
      setIsVoting(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!citizenId) {
      alert("Please login to comment");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `https://civiciobackend.vercel.app/api/v1/citizen/issue/${issueId}/comment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: newComment.trim(),
            authorType: "CITIZEN",
            authorId: citizenId,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Server error: ${response.status}`);
      }
      if (data.success) {
        setNewComment("");
        await fetchIssueDetail();
      } else {
        throw new Error(data.message || "Failed to post comment");
      }
    } catch (err) {
      console.error("Comment error:", err);
      alert(
        err instanceof Error
          ? err.message
          : "Failed to post comment. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return { bg: "#ef444414", text: "#ef4444", border: "#ef4444" };
      case "HIGH":
        return { bg: "#f9731614", text: "#f97316", border: "#f97316" };
      case "MEDIUM":
        return { bg: "#eab30814", text: "#eab308", border: "#eab308" };
      case "LOW":
        return { bg: "#10b98114", text: "#10b981", border: "#10b981" };
      default:
        return { bg: "#71717a14", text: "#71717a", border: "#71717a" };
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "RESOLVED":
        return { bg: "#10b98114", text: "#10b981", border: "#10b981" };
      case "IN_PROGRESS":
        return { bg: "#3b82f614", text: "#3b82f6", border: "#3b82f6" };
      case "PENDING":
        return { bg: "#71717a14", text: "#71717a", border: "#71717a" };
      default:
        return { bg: "#71717a14", text: "#71717a", border: "#71717a" };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "RESOLVED":
        return <CheckCircle className="w-4 h-4" />;
      case "IN_PROGRESS":
        return <Clock className="w-4 h-4" />;
      case "PENDING":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);
    if (diffInMins < 1) return "Just now";
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const openInGoogleMaps = () => {
    if (issue?.latitude && issue?.longitude) {
      window.open(
        `https://www.google.com/maps?q=${issue.latitude},${issue.longitude}`,
        "_blank"
      );
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          backgroundColor: "#0a0a0a",
          color: "#ffffff"
        }}
      >
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-12 w-12 mx-auto"
              style={{
                border: "2px solid transparent",
                borderTopColor: "#3b82f6",
                borderBottomColor: "#3b82f6"
              }}
            />
            <p className="mt-4 text-sm font-medium" style={{ color: "#a1a1aa" }}>
              Loading issue details...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          backgroundColor: "#0a0a0a",
          color: "#ffffff"
        }}
      >
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div
            className="rounded-[10px] p-8 max-w-md text-center"
            style={{
              backgroundColor: "#18181b",
              border: "1px solid #ef4444"
            }}
          >
            <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: "#ef4444" }} />
            <h2 className="text-xl font-bold mb-2" style={{ color: "#ffffff" }}>
              {error || "Issue not found"}
            </h2>
            <button
              onClick={() => router.back()}
              className="mt-6 px-6 rounded-[10px] font-medium transition-colors"
              style={{
                height: "44px",
                backgroundColor: "#ef4444",
                color: "#ffffff"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#dc2626";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#ef4444";
              }}
            >
              Go Back
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const severityStyle = getSeverityStyle(issue.severity);
  const statusStyle = getStatusStyle(issue.status);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        backgroundColor: "#0a0a0a",
        color: "#ffffff"
      }}
    >
      <Navbar />
      <main className="flex-1 pt-24 pb-12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => router.back()}
            className="flex items-center gap-2 mb-8 transition-colors font-medium"
            style={{ height: "44px", color: "#a1a1aa" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#a1a1aa";
            }}
          >
            <ArrowLeft size={20} />
            <span>Back to Issues</span>
          </motion.button>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Title and Voting Section */}
              <div
                className="rounded-[10px] p-6"
                style={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => handleVote('upvote')}
                      disabled={isVoting}
                      className="p-2 rounded-md transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: issue.hasUpvoted ? '#10b98114' : '#27272a',
                        color: issue.hasUpvoted ? '#10b981' : '#a1a1aa',
                        border: issue.hasUpvoted ? '1px solid #10b981' : 'none'
                      }}
                      title="Upvote"
                    >
                      <ArrowUp className="w-5 h-5" />
                    </button>
                    <span className="text-lg font-bold" style={{color:'#d4d4d8'}}>
                      {(issue.upvoteCount || 0) - (issue.downvoteCount || 0)}
                    </span>
                    <button
                      onClick={() => handleVote('downvote')}
                      disabled={isVoting}
                      className="p-2 rounded-md transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: issue.hasDownvoted ? '#ef444414' : '#27272a',
                        color: issue.hasDownvoted ? '#ef4444' : '#a1a1aa',
                        border: issue.hasDownvoted ? '1px solid #ef4444' : 'none'
                      }}
                      title="Downvote"
                    >
                      <ArrowDown className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h1 className="text-2xl font-bold" style={{color:'#fff'}}>{issue.title}</h1>
                      <span 
                        className="px-3 py-1 rounded-full text-xs font-semibold ml-3"
                        style={{
                          background: severityStyle.bg,
                          color: severityStyle.text,
                          border: `1px solid ${severityStyle.border}`
                        }}
                      >
                        {issue.severity}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span 
                        className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                        style={{
                          background: statusStyle.bg,
                          color: statusStyle.text,
                          border: `1px solid ${statusStyle.border}`
                        }}
                      >
                        {getStatusIcon(issue.status)}
                        {issue.status.replace("_", " ")}
                      </span>
                      <span className="text-xs" style={{color:'#71717a'}}>
                        Posted {formatRelativeTime(issue.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Image */}
              {issue.mediaUrl && (
                <div
                  className="rounded-[10px] overflow-hidden"
                  style={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a"
                  }}
                >
                  <img
                    src={issue.mediaUrl}
                    alt={issue.title}
                    className="w-full h-[400px] object-cover"
                  />
                </div>
              )}

              {/* Description */}
              <div
                className="rounded-[10px] p-6"
                style={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}
              >
                <h2 className="text-xl font-bold mb-4">Description</h2>
                <p className="leading-relaxed text-sm" style={{ color: "#d4d4d8" }}>
                  {issue.description}
                </p>
              </div>

              {/* Location */}
              <div
                className="rounded-[10px] p-6"
                style={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}
              >
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <MapPin size={20} />
                  Location
                </h2>
                <p className="mb-4 text-sm font-medium" style={{ color: "#d4d4d8" }}>
                  {issue.location}
                </p>
                {issue.latitude && issue.longitude && (
                  <button
                    onClick={openInGoogleMaps}
                    className="flex items-center gap-2 px-4 rounded-[10px] text-sm font-semibold transition-colors"
                    style={{
                      height: "44px",
                      border: "1px solid #3b82f6",
                      color: "#3b82f6"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#3b82f614";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <ExternalLink size={16} />
                    Open in Google Maps
                  </button>
                )}
              </div>

              {/* Comments Section */}
              <div
                className="rounded-[10px] p-6"
                style={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}
              >
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <MessageSquare size={20} />
                  Comments ({issue.commentCount})
                </h2>
                <form onSubmit={handleCommentSubmit} className="mb-6">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full p-4 rounded-[10px] resize-none focus:outline-none transition-colors text-sm"
                    style={{ backgroundColor: "#0a0a0a", border: "1px solid #27272a", color: "#ffffff" }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#3b82f6";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#27272a";
                    }}
                    rows={3}
                  />
                  <div className="flex justify-end mt-3">
                    <button
                      type="submit"
                      disabled={!newComment.trim() || isSubmitting}
                      className="flex items-center gap-2 px-5 rounded-[10px] font-semibold text-sm transition-colors disabled:cursor-not-allowed"
                      style={{
                        height: "44px",
                        backgroundColor: !newComment.trim() || isSubmitting ? "#27272a" : "#3b82f6",
                        color: !newComment.trim() || isSubmitting ? "#71717a" : "#ffffff"
                      }}
                      onMouseEnter={(e) => {
                        if (newComment.trim() && !isSubmitting) {
                          e.currentTarget.style.backgroundColor = "#2563eb";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (newComment.trim() && !isSubmitting) {
                          e.currentTarget.style.backgroundColor = "#3b82f6";
                        }
                      }}
                    >
                      {isSubmitting ? (
                        <>
                          <div
                            className="animate-spin rounded-full h-4 w-4"
                            style={{ border: "2px solid transparent", borderTopColor: "#ffffff", borderBottomColor: "#ffffff" }}
                          />
                          Posting...
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Post Comment
                        </>
                      )}
                    </button>
                  </div>
                </form>
                <div className="space-y-4">
                  {issue.comments.length === 0 ? (
                    <p className="text-center py-8 text-sm" style={{ color: "#71717a" }}>
                      No comments yet. Be the first to comment!
                    </p>
                  ) : (
                    issue.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="pl-4 py-3"
                        style={{ borderLeft: "2px solid #3b82f6" }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-sm">
                              {comment.author.name}
                            </p>
                            <p className="text-xs font-medium mt-0.5" style={{ color: "#71717a" }}>
                              {comment.author.constituency} · {formatRelativeTime(comment.createdAt)}
                            </p>
                          </div>
                          <span
                            className="text-xs px-2 py-1 rounded-[6px] font-medium"
                            style={{ backgroundColor: "#27272a", color: "#a1a1aa" }}
                          >
                            {comment.author.type}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed mb-3" style={{ color: "#d4d4d8" }}>
                          {comment.content}
                        </p>
                        <div
                          className="mt-3 p-3 rounded-[8px] border"
                          style={{ backgroundColor: "#0a0a0a", borderColor: "#27272a" }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={14} style={{ color: "#3b82f6" }} />
                            <span className="text-xs font-semibold" style={{ color: "#3b82f6" }}>
                              AI Summary
                            </span>
                          </div>
                          {loadingSummaries[comment.id] ? (
                            <div className="flex items-center gap-2">
                              <div
                                className="animate-spin rounded-full h-3 w-3"
                                style={{ border: "2px solid transparent", borderTopColor: "#3b82f6", borderBottomColor: "#3b82f6" }}
                              />
                              <span className="text-xs" style={{ color: "#71717a" }}>
                                Generating summary...
                              </span>
                            </div>
                          ) : (
                            <p className="text-xs leading-relaxed" style={{ color: "#a1a1aa" }}>
                              {commentSummaries[comment.id] || "Summary unavailable"}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Upvotes Section */}
              {issue.upvotes.length > 0 && (
                <div
                  className="rounded-[10px] p-6"
                  style={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}
                >
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <ArrowUp size={20} style={{color: '#10b981'}} />
                    Upvotes ({issue.upvoteCount})
                  </h2>
                  <div className="space-y-2">
                    {issue.upvotes.map((upvote, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-[10px]"
                        style={{ backgroundColor: "#0a0a0a", border: "1px solid #27272a" }}
                      >
                        <div>
                          <p className="font-semibold text-sm">
                            {upvote.citizen.name}
                          </p>
                          <p className="text-xs font-medium mt-0.5" style={{ color: "#71717a" }}>
                            {upvote.citizen.constituency}
                          </p>
                        </div>
                        <p className="text-xs font-medium" style={{ color: "#71717a" }}>
                          {formatRelativeTime(upvote.upvotedAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Downvotes Section */}
              {issue.downvotes && issue.downvotes.length > 0 && (
                <div
                  className="rounded-[10px] p-6"
                  style={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}
                >
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <ArrowDown size={20} style={{color: '#ef4444'}} />
                    Downvotes ({issue.downvoteCount})
                  </h2>
                  <div className="space-y-2">
                    {issue.downvotes.map((downvote, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-[10px]"
                        style={{ backgroundColor: "#0a0a0a", border: "1px solid #27272a" }}
                      >
                        <div>
                          <p className="font-semibold text-sm">
                            {downvote.citizen.name}
                          </p>
                          <p className="text-xs font-medium mt-0.5" style={{ color: "#71717a" }}>
                            {downvote.citizen.constituency}
                          </p>
                        </div>
                        <p className="text-xs font-medium" style={{ color: "#71717a" }}>
                          {formatRelativeTime(downvote.downvotedAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Right Column - Reporter & MLA Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              {/* Reporter Info */}
              <div
                className="rounded-[10px] p-6"
                style={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}
              >
                <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
                  <User size={20} />
                  Reported By
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">{issue.citizen.name}</p>
                    <p className="text-xs" style={{ color: "#71717a" }}>{issue.citizen.constituency}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs" style={{ color: "#a1a1aa" }}>
                    <Mail size={16} />
                    <span>{issue.citizen.email}</span>
                  </div>
                </div>
              </div>
              {/* MLA Info */}
              {issue.mla && (
                <div
                  className="rounded-[10px] p-6"
                  style={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}
                >
                  <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
                    <Users size={20} />
                    Assigned MLA
                  </h2>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-sm">{issue.mla.name}</p>
                      <p className="text-xs"><span style={{ color: "#a1a1aa" }}>{issue.mla.party}</span> • {issue.mla.constituency}</p>
                    </div>
                    {issue.mla.email && (
                      <div className="flex items-center gap-2 text-xs" style={{ color: "#a1a1aa" }}>
                        <Mail size={16} />
                        <span>{issue.mla.email}</span>
                      </div>
                    )}
                    {issue.mla.phone && (
                      <div className="flex items-center gap-2 text-xs" style={{ color: "#a1a1aa" }}>
                        <Phone size={16} />
                        <span>{issue.mla.phone}</span>
                      </div>
                    )}
                    {issue.mla.rating !== null && (
                      <div className="flex items-center gap-2 text-xs" style={{ color: "#a1a1aa" }}>
                        <span>Rating:</span> <span>{issue.mla.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
