import { useState, useEffect } from 'react';
import SiteNav from './SiteNav';
import CommentItem, { type CommentReaction } from '../molecules/CommentItem';
import IssueSidebar from '../molecules/IssueSidebar';

interface IssueData {
  id: string;
  title: string;
  description: string;
  status: string;
  parent_issue_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  assignees: { user_id: string; user_name: string; user_email: string; user_image: string | null }[];
  subIssues: { id: string; title: string; status: string }[];
  comments: CommentData[];
  projects: { id: string; name: string }[];
}

interface CommentData {
  id: string;
  user_id: string;
  body: string;
  pinned: number;
  created_at: string;
  updated_at: string;
  author_name: string;
  author_email: string;
  author_image: string | null;
  reactions: { user_id: string; emoji: string }[];
}

export interface IssueDetailProps {
  issueId: string;
  userId?: string;
  userName?: string;
  locale?: string;
  navLabels?: Record<string, string>;
  labels?: Record<string, string>;
}

const STATUS_COLORS: Record<string, string> = {
  todo: 'bg-text-mid/20 text-text-mid',
  in_progress: 'bg-water/20 text-water',
  done: 'bg-primary/20 text-primary-dark',
  blocked: 'bg-danger/20 text-danger',
  archived: 'bg-text-mid/10 text-text-mid',
};

export default function IssueDetail({ issueId, userId, userName, locale = 'pt-br', navLabels, labels = {} }: IssueDetailProps) {
  const [issue, setIssue] = useState<IssueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [editDesc, setEditDesc] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [newSubIssueTitle, setNewSubIssueTitle] = useState('');
  const [showNewSubIssue, setShowNewSubIssue] = useState(false);

  const prefix = locale === 'en' ? '/en' : '';

  const fetchIssue = async () => {
    try {
      const res = await fetch(`/api/issues/${issueId}`);
      if (res.ok) {
        const data = await res.json();
        setIssue(data);
        setEditTitle(data.title);
        setEditDesc(data.description);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssue();
  }, [issueId]);

  const handleSaveTitle = async () => {
    if (!editTitle.trim()) return;
    await fetch(`/api/issues/${issueId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle }),
    });
    setEditingTitle(false);
    fetchIssue();
  };

  const handleSaveDesc = async () => {
    await fetch(`/api/issues/${issueId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: editDesc }),
    });
    setEditingDesc(false);
    fetchIssue();
  };

  const handleStatusChange = async (status: string) => {
    await fetch(`/api/issues/${issueId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchIssue();
  };

  const handleAddComment = async () => {
    if (!commentBody.trim()) return;
    await fetch(`/api/issues/${issueId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: commentBody }),
    });
    setCommentBody('');
    fetchIssue();
  };

  const handleEditComment = async (commentId: string, body: string) => {
    await fetch(`/api/comments/${commentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
    fetchIssue();
  };

  const handleDeleteComment = async (commentId: string) => {
    await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
    fetchIssue();
  };

  const handlePinComment = async (commentId: string) => {
    await fetch(`/api/comments/${commentId}/pin`, { method: 'POST' });
    fetchIssue();
  };

  const handleReactComment = async (commentId: string, emoji: string) => {
    // Toggle: check if already reacted
    const comment = issue?.comments.find(c => c.id === commentId);
    const hasReacted = comment?.reactions.some(r => r.user_id === userId && r.emoji === emoji);
    if (hasReacted) {
      await fetch(`/api/comments/${commentId}/reactions/${encodeURIComponent(emoji)}`, { method: 'DELETE' });
    } else {
      await fetch(`/api/comments/${commentId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });
    }
    fetchIssue();
  };

  const handleRemoveAssignee = async (assigneeUserId: string) => {
    await fetch(`/api/issues/${issueId}/assignees/${assigneeUserId}`, { method: 'DELETE' });
    fetchIssue();
  };

  const handleAddSubIssue = async () => {
    if (!newSubIssueTitle.trim()) return;
    await fetch(`/api/issues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newSubIssueTitle, parentIssueId: issueId }),
    });
    setNewSubIssueTitle('');
    setShowNewSubIssue(false);
    fetchIssue();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg text-text">
        <SiteNav userName={userName} locale={locale as any} labels={navLabels as any} />
        <div className="flex items-center justify-center py-12">
          <p className="font-pixel text-primary-dark text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen bg-bg text-text">
        <SiteNav userName={userName} locale={locale as any} labels={navLabels as any} />
        <div className="flex items-center justify-center py-12">
          <p className="font-pixel text-danger text-sm">Issue not found</p>
        </div>
      </div>
    );
  }

  // Aggregate reactions per comment
  const aggregateReactions = (rawReactions: { user_id: string; emoji: string }[]): CommentReaction[] => {
    const map = new Map<string, { count: number; hasReacted: boolean }>();
    for (const r of rawReactions) {
      const existing = map.get(r.emoji) || { count: 0, hasReacted: false };
      existing.count++;
      if (r.user_id === userId) existing.hasReacted = true;
      map.set(r.emoji, existing);
    }
    return Array.from(map.entries()).map(([emoji, data]) => ({
      emoji,
      count: data.count,
      hasReacted: data.hasReacted,
    }));
  };

  return (
    <div className="min-h-screen bg-bg text-text">
      <SiteNav
        userName={userName}
        locale={locale as 'pt-br' | 'en'}
        labels={navLabels as any}
        currentPath={typeof window !== 'undefined' ? window.location.pathname : '/'}
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left panel */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            {editingTitle ? (
              <div className="flex items-center gap-2 mb-2">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="font-pixel text-lg text-primary-dark bg-transparent border-b-2 border-primary focus:outline-none flex-1"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                />
                <button onClick={handleSaveTitle} className="text-xs text-primary-dark hover:text-primary cursor-pointer">{labels.save || 'Save'}</button>
                <button onClick={() => setEditingTitle(false)} className="text-xs text-text-mid cursor-pointer">{labels.cancel || 'Cancel'}</button>
              </div>
            ) : (
              <h1
                className="font-pixel text-lg text-primary-dark mb-2 cursor-pointer hover:opacity-80"
                onClick={() => setEditingTitle(true)}
              >
                {issue.title}
              </h1>
            )}

            {/* Metadata */}
            <div className="flex items-center gap-3 mb-4 text-xs text-text-mid">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[issue.status] || ''}`}>
                {labels[`status${issue.status.charAt(0).toUpperCase()}${issue.status.slice(1).replace('_', '')}`] || issue.status}
              </span>
              <span>Opened {new Date(issue.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'pt-BR')}</span>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-text-mid uppercase mb-2">{labels.description || 'Description'}</h3>
              {editingDesc ? (
                <div className="space-y-2">
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-bg-warm rounded-lg resize-none focus:outline-none focus:border-primary"
                    rows={6}
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSaveDesc} className="px-3 py-1 text-xs bg-primary text-bg rounded hover:bg-primary-dark cursor-pointer">
                      {labels.save || 'Save'}
                    </button>
                    <button onClick={() => { setEditingDesc(false); setEditDesc(issue.description); }} className="text-xs text-text-mid cursor-pointer">
                      {labels.cancel || 'Cancel'}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="text-sm text-text bg-white rounded-lg p-3 border border-bg-warm cursor-pointer hover:border-primary-light min-h-[3rem]"
                  onClick={() => setEditingDesc(true)}
                >
                  {issue.description || <span className="text-text-mid italic">{labels.noDescription || 'No description'}</span>}
                </div>
              )}
            </div>

            {/* Sub-issues */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-text-mid uppercase">{labels.subIssues || 'Sub-issues'}</h3>
                <button
                  onClick={() => setShowNewSubIssue(true)}
                  className="text-[10px] text-primary-dark hover:text-primary cursor-pointer"
                >
                  + {labels.addSubIssue || 'Add sub-issue'}
                </button>
              </div>
              {showNewSubIssue && (
                <div className="flex gap-2 mb-2">
                  <input
                    value={newSubIssueTitle}
                    onChange={(e) => setNewSubIssueTitle(e.target.value)}
                    placeholder="Sub-issue title..."
                    className="flex-1 px-2 py-1 text-xs border border-bg-warm rounded focus:outline-none focus:border-primary"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubIssue()}
                  />
                  <button onClick={handleAddSubIssue} className="px-2 py-1 text-xs bg-primary text-bg rounded cursor-pointer">Create</button>
                  <button onClick={() => setShowNewSubIssue(false)} className="text-xs text-text-mid cursor-pointer">Cancel</button>
                </div>
              )}
              {issue.subIssues.length > 0 ? (
                <div className="space-y-1">
                  {issue.subIssues.map((sub) => (
                    <a
                      key={sub.id}
                      href={`${prefix}/issues/${sub.id}`}
                      className="flex items-center gap-2 px-3 py-2 bg-white rounded border border-bg-warm hover:border-primary-light transition-colors"
                    >
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${STATUS_COLORS[sub.status] || ''}`}>
                        {sub.status}
                      </span>
                      <span className="text-sm text-text">{sub.title}</span>
                    </a>
                  ))}
                </div>
              ) : !showNewSubIssue ? (
                <p className="text-xs text-text-mid">-</p>
              ) : null}
            </div>

            {/* Comments */}
            <div>
              <h3 className="text-xs font-semibold text-text-mid uppercase mb-3">{labels.commentsTitle || 'Comments'}</h3>
              <div className="space-y-3 mb-4">
                {issue.comments.length > 0 ? (
                  issue.comments.map((c) => (
                    <CommentItem
                      key={c.id}
                      id={c.id}
                      authorName={c.author_name || c.author_email || 'Unknown'}
                      body={c.body}
                      createdAt={c.created_at}
                      updatedAt={c.updated_at}
                      pinned={!!c.pinned}
                      reactions={aggregateReactions(c.reactions)}
                      isAuthor={c.user_id === userId}
                      labels={{
                        edit: labels.commentEdit,
                        delete: labels.commentDelete,
                        pin: labels.commentPin,
                        unpin: labels.commentUnpin,
                        pinned: labels.commentPinned,
                        edited: labels.commentEdited,
                      }}
                      onEdit={handleEditComment}
                      onDelete={handleDeleteComment}
                      onPin={handlePinComment}
                      onReact={handleReactComment}
                    />
                  ))
                ) : (
                  <p className="text-xs text-text-mid">{labels.noComments || 'No comments yet'}</p>
                )}
              </div>

              {/* Comment composer */}
              <div className="space-y-2">
                <textarea
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder={labels.commentWrite || 'Write a comment...'}
                  className="w-full px-3 py-2 text-sm border border-bg-warm rounded-lg resize-none focus:outline-none focus:border-primary"
                  rows={3}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!commentBody.trim()}
                  className="px-4 py-2 text-xs font-semibold bg-primary text-bg rounded-lg hover:bg-primary-dark transition cursor-pointer disabled:opacity-50"
                >
                  {labels.commentSubmit || 'Comment'}
                </button>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <IssueSidebar
            issue={issue}
            labels={labels}
            locale={locale}
            onStatusChange={handleStatusChange}
            onAssigneeRemove={handleRemoveAssignee}
          />
        </div>
      </main>
    </div>
  );
}
