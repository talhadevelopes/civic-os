'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, MapPin, Calendar, User, Users, ArrowUp, ArrowDown } from 'lucide-react';

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

interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  mediaUrl: string | null;
  location: string;
  latitude: number | null;
  longitude: number | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  citizenId: string;
  mlaId: string | null;
  organizationId: string | null;
  createdAt: string;
  updatedAt: string;
  citizen: Citizen;
  mla: MLA | null;
  organization: any | null;
  upvoteCount?: number;
  downvoteCount?: number;
  hasUpvoted?: boolean;
  hasDownvoted?: boolean;
}

interface ApiResponse {
  success: boolean;
  count: number;
  totalCount: number;
  issues: Issue[];
}

export default function GlobalIssues() {
  const router = useRouter();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [citizenId, setCitizenId] = useState<string>('');
  const [votingStates, setVotingStates] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const storedCitizenId = localStorage.getItem('id');
    if (storedCitizenId) {
      setCitizenId(storedCitizenId);
    }
  }, []);

  useEffect(() => {
    fetchIssues();
    // eslint-disable-next-line
  }, []);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        'https://civiciobackend.vercel.app/api/v1/citizen/issues'
      );
      if (!response.ok) {
        throw new Error('Failed to fetch issues');
      }
      const data: ApiResponse = await response.json();
      if (data.success) {
        setIssues(data.issues);
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (issueId: string, voteType: 'upvote' | 'downvote', e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!citizenId) {
      alert('Please login to vote');
      return;
    }

    if (votingStates[issueId]) return;

    setVotingStates(prev => ({ ...prev, [issueId]: true }));

    try {
      const response = await fetch(
        `https://civiciobackend.vercel.app/api/v1/citizen/issue/${issueId}/${voteType}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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
        setIssues(prevIssues =>
          prevIssues.map(issue =>
            issue.id === issueId
              ? { 
                  ...issue, 
                  upvoteCount: data.upvoteCount !== undefined ? data.upvoteCount : issue.upvoteCount,
                  downvoteCount: data.downvoteCount !== undefined ? data.downvoteCount : issue.downvoteCount,
                  hasUpvoted: voteType === 'upvote' ? !issue.hasUpvoted : false,
                  hasDownvoted: voteType === 'downvote' ? !issue.hasDownvoted : false
                }
              : issue
          )
        );
      }
    } catch (err) {
      console.error(`${voteType} error:`, err);
      alert(err instanceof Error ? err.message : `Failed to ${voteType}`);
    } finally {
      setVotingStates(prev => ({ ...prev, [issueId]: false }));
    }
  };

  const handleIssueClick = (issueId: string) => {
    router.push(`/global-issues/${issueId}`);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-[#ef444414] text-[#ef4444] border border-[#ef4444]';
      case 'HIGH': return 'bg-[#f9731614] text-[#f97316] border border-[#f97316]';
      case 'MEDIUM': return 'bg-[#eab30814] text-[#eab308] border border-[#eab308]';
      case 'LOW': return 'bg-[#10b98114] text-[#10b981] border border-[#10b981]';
      default: return 'bg-[#71717a14] text-[#71717a] border border-[#71717a]';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RESOLVED': return 'bg-[#10b98114] text-[#10b981] border border-[#10b981]';
      case 'IN_PROGRESS': return 'bg-[#3b82f614] text-[#3b82f6] border border-[#3b82f6]';
      case 'PENDING': return 'bg-[#71717a14] text-[#71717a] border border-[#71717a]';
      default: return 'bg-[#71717a14] text-[#71717a] border border-[#71717a]';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: '#0a0a0a', color: '#fff'}}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3b82f6] mx-auto" />
          <p className="mt-4" style={{ color: '#a1a1aa' }}>Loading issues...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{background: '#0a0a0a', color: '#fff'}}>
        <div className="bg-[#18181b] border border-[#ef4444] rounded-lg p-6 max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{color:'#ef4444'}} />
          <h2 className="text-xl font-semibold text-center mb-2" style={{color:'#fff'}}>Error Loading Issues</h2>
          <p className="text-red-400 text-center">{error}</p>
          <button
            onClick={fetchIssues}
            className="mt-4 w-full py-2 px-4 rounded-lg"
            style={{background:'#ef4444', color:'#fff'}}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{background: '#0a0a0a', color:'#fff'}}>
      <div className="max-w-[1440px] mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{color:'#fff'}}>Civic Issues Dashboard</h1>
          <p style={{ color: '#a1a1aa' }}>
            Total Issues: <span className="font-semibold" style={{color:'#3b82f6'}}>{issues.length}</span>
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {issues.map((issue) => (
            <div
              key={issue.id}
              onClick={() => handleIssueClick(issue.id)}
              className="rounded-[12px] border border-[#27272a] hover:shadow-xl transition-all cursor-pointer overflow-hidden hover:scale-[1.025] duration-200"
              style={{background:'#18181b', color:'#fff'}}
            >
              {issue.mediaUrl && (
                <img
                  src={issue.mediaUrl}
                  alt={issue.title}
                  className="w-full h-48 object-cover"
                  style={{objectPosition:'center'}}
                />
              )}
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold flex-1" style={{color:'#fff'}}>{issue.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeverityColor(issue.severity)}`}>{issue.severity}</span>
                </div>
                <p className="text-sm mb-4 line-clamp-2" style={{color:'#a1a1aa'}}>{issue.description}</p>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm" style={{color:'#a1a1aa'}}>
                    <MapPin className="w-4 h-4 mr-2 flex-shrink-0"/>
                    <span className="truncate">{issue.location}</span>
                  </div>
                  <div className="flex items-center text-sm" style={{color:'#a1a1aa'}}>
                    <User className="w-4 h-4 mr-2 flex-shrink-0"/>
                    <span>{issue.citizen.name} ({issue.citizen.constituency})</span>
                  </div>
                  {issue.mla && (
                    <div className="flex items-center text-sm" style={{color:'#a1a1aa'}}>
                      <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{issue.mla.name} - {issue.mla.party}</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm" style={{color:'#a1a1aa'}}>
                    <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>{formatDate(issue.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-[#27272a]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium rounded-full px-3 py-1" style={{background:'#23232b', color:'#d4d4d8'}}>
                      {issue.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Enhanced Voting Section */}
                    <div 
                      className="flex items-center rounded-lg overflow-hidden"
                      style={{
                        background: '#0a0a0a',
                        border: '1px solid #27272a'
                      }}
                    >
                      {/* Upvote Button */}
                      <button
                        onClick={(e) => handleVote(issue.id, 'upvote', e)}
                        disabled={votingStates[issue.id]}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                        style={{
                          background: issue.hasUpvoted ? '#10b98114' : 'transparent',
                          color: issue.hasUpvoted ? '#10b981' : '#71717a',
                          borderRight: '1px solid #27272a'
                        }}
                        onMouseEnter={(e) => {
                          if (!issue.hasUpvoted && !votingStates[issue.id]) {
                            e.currentTarget.style.background = '#10b98108';
                            e.currentTarget.style.color = '#10b981';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!issue.hasUpvoted) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = '#71717a';
                          }
                        }}
                        title="Upvote this issue"
                      >
                        <ArrowUp 
                          className="w-4 h-4 transition-transform group-hover:scale-110 group-active:scale-95" 
                          strokeWidth={2.5}
                        />
                        <span className="text-xs font-bold min-w-[18px] text-center">
                          {issue.upvoteCount || 0}
                        </span>
                      </button>
                      
                      {/* Downvote Button */}
                      <button
                        onClick={(e) => handleVote(issue.id, 'downvote', e)}
                        disabled={votingStates[issue.id]}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                        style={{
                          background: issue.hasDownvoted ? '#ef444414' : 'transparent',
                          color: issue.hasDownvoted ? '#ef4444' : '#71717a'
                        }}
                        onMouseEnter={(e) => {
                          if (!issue.hasDownvoted && !votingStates[issue.id]) {
                            e.currentTarget.style.background = '#ef444408';
                            e.currentTarget.style.color = '#ef4444';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!issue.hasDownvoted) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = '#71717a';
                          }
                        }}
                        title="Downvote this issue"
                      >
                        <ArrowDown 
                          className="w-4 h-4 transition-transform group-hover:scale-110 group-active:scale-95" 
                          strokeWidth={2.5}
                        />
                        <span className="text-xs font-bold min-w-[18px] text-center">
                          {issue.downvoteCount || 0}
                        </span>
                      </button>
                    </div>
                    
                    {/* Status Badge */}
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(issue.status)}`} style={{textTransform:'capitalize'}}>
                      {issue.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {issues.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{color:'#3b82f6'}} />
            <h3 className="text-xl font-semibold mb-2" style={{color:'#fff'}}>No Issues Found</h3>
            <p className="text-[#a1a1aa]">There are currently no civic issues to display.</p>
          </div>
        )}
      </div>
    </div>
  );
}
