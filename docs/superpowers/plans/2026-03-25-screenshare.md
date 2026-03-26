# Screenshare Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable real-time screen sharing between users on the web app (Astro/React) and macOS app (SwiftUI), integrated with the existing chat/conversation system.

**Architecture:** LiveKit Cloud as the WebRTC SFU (Selective Forwarding Unit) — handles all media transport, TURN/STUN, and room management. Our backend generates LiveKit access tokens via a single API endpoint. The web uses LiveKit's React SDK with the browser's `getDisplayMedia()` API. The macOS app uses LiveKit's Swift SDK with `ScreenCaptureKit`. Screen share sessions are tied to existing chat conversations, stored in a new `screenshare_sessions` table.

**Tech Stack:**
- **Backend:** LiveKit Server SDK (`livekit-server-sdk`) for token generation on Cloudflare Workers
- **Web:** `@livekit/components-react`, `livekit-client` for React components
- **macOS:** `LiveKitClient` Swift package + `ScreenCaptureKit` (macOS 13+)
- **Signaling:** Handled entirely by LiveKit Cloud (no custom WebSocket needed)

---

## Scope & Subsystems

This plan covers three independent subsystems that can be developed in parallel after Task 1 (schema):

1. **Backend** (Tasks 1-3): Schema, token endpoint, session management API
2. **Web** (Tasks 4-7): React components for starting/viewing screenshare
3. **macOS** (Tasks 8-11): SwiftUI views + ScreenCaptureKit integration

## File Structure

### Backend (new files)
- `website-astro/src/lib/livekit.ts` — LiveKit token generation helper
- `website-astro/src/lib/db/screenshare-queries.ts` — DB queries for sessions
- `website-astro/src/pages/api/screenshare/token.ts` — Token endpoint (POST)
- `website-astro/src/pages/api/screenshare/sessions.ts` — Session CRUD (GET/POST)
- `website-astro/src/pages/api/screenshare/sessions/[id].ts` — End session (PATCH/DELETE)

### Web (new files)
- `website-astro/src/components/ui/organisms/ScreenShareRoom.tsx` — Main room component (video grid + controls)
- `website-astro/src/components/ui/molecules/ScreenShareControls.tsx` — Start/stop/viewer controls
- `website-astro/src/components/ui/molecules/ScreenShareTile.tsx` — Individual participant video tile
- `website-astro/src/components/ui/atoms/ScreenShareButton.tsx` — Button to initiate from chat
- `website-astro/src/pages/screenshare/[roomId].astro` — Dedicated screenshare page

### macOS (new files)
- `ios-app/Plantgotchi/ScreenShare/ScreenShareManager.swift` — LiveKit room + ScreenCaptureKit bridge
- `ios-app/Plantgotchi/ScreenShare/ScreenShareView.swift` — Main SwiftUI view for screenshare
- `ios-app/Plantgotchi/ScreenShare/ScreenShareParticipantView.swift` — Participant video tile

### Modified files
- `website-astro/src/lib/db/schema.sql` — Add `screenshare_sessions` table
- `website-astro/package.json` — Add LiveKit dependencies
- `website-astro/src/components/ui/organisms/ChatApp.tsx` — Add screenshare button to chat header
- `ios-app/Package.swift` — Add LiveKit Swift SDK dependency

---

## Chunk 1: Backend Infrastructure

### Task 1: Database Schema for Screen Share Sessions

**Files:**
- Modify: `website-astro/src/lib/db/schema.sql`
- Create: `website-astro/src/lib/db/screenshare-queries.ts`
- Test: `website-astro/src/lib/db/__tests__/screenshare-queries.test.ts`

- [ ] **Step 1: Write the failing test for screenshare queries**

```typescript
// website-astro/src/lib/db/__tests__/screenshare-queries.test.ts
import { describe, it, expect, vi } from 'vitest';
import {
  createScreenShareSession,
  getActiveSession,
  endScreenShareSession,
  getSessionsByConversation,
} from '../screenshare-queries';

describe('screenshare-queries', () => {
  it('createScreenShareSession returns session with id', async () => {
    const session = await createScreenShareSession({
      conversationId: 'conv-1',
      hostUserId: 'user-1',
      roomName: 'screenshare-conv-1-abc123',
    });
    expect(session).toHaveProperty('id');
    expect(session.status).toBe('active');
    expect(session.room_name).toBe('screenshare-conv-1-abc123');
  });

  it('getActiveSession returns null when none active', async () => {
    const session = await getActiveSession('conv-nonexistent');
    expect(session).toBeNull();
  });

  it('endScreenShareSession sets ended_at', async () => {
    const created = await createScreenShareSession({
      conversationId: 'conv-2',
      hostUserId: 'user-1',
      roomName: 'screenshare-conv-2-xyz',
    });
    const ended = await endScreenShareSession(created.id);
    expect(ended.status).toBe('ended');
    expect(ended.ended_at).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd website-astro && npx vitest run src/lib/db/__tests__/screenshare-queries.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Add screenshare_sessions table to schema.sql**

Append to `website-astro/src/lib/db/schema.sql`:

```sql
-- Screen share sessions tied to conversations
CREATE TABLE IF NOT EXISTS screenshare_sessions (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  host_user_id TEXT NOT NULL,
  room_name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'ended')),
  participant_count INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  ended_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_screenshare_conv ON screenshare_sessions(conversation_id, status);
CREATE INDEX IF NOT EXISTS idx_screenshare_host ON screenshare_sessions(host_user_id);
```

- [ ] **Step 4: Implement screenshare-queries.ts**

```typescript
// website-astro/src/lib/db/screenshare-queries.ts
import { getDb } from './client';

export interface ScreenShareSession {
  id: string;
  conversation_id: string;
  host_user_id: string;
  room_name: string;
  status: 'active' | 'ended';
  participant_count: number;
  created_at: string;
  ended_at: string | null;
}

function generateId(): string {
  return crypto.randomUUID();
}

export async function createScreenShareSession(params: {
  conversationId: string;
  hostUserId: string;
  roomName: string;
}): Promise<ScreenShareSession> {
  const db = getDb();
  const id = generateId();
  const now = new Date().toISOString();

  await db.execute({
    sql: `INSERT INTO screenshare_sessions (id, conversation_id, host_user_id, room_name, status, participant_count, created_at)
          VALUES (?, ?, ?, ?, 'active', 1, ?)`,
    args: [id, params.conversationId, params.hostUserId, params.roomName, now],
  });

  return {
    id,
    conversation_id: params.conversationId,
    host_user_id: params.hostUserId,
    room_name: params.roomName,
    status: 'active',
    participant_count: 1,
    created_at: now,
    ended_at: null,
  };
}

export async function getActiveSession(conversationId: string): Promise<ScreenShareSession | null> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT * FROM screenshare_sessions WHERE conversation_id = ? AND status = 'active' LIMIT 1`,
    args: [conversationId],
  });
  return (result.rows[0] as unknown as ScreenShareSession) ?? null;
}

export async function endScreenShareSession(sessionId: string): Promise<ScreenShareSession> {
  const db = getDb();
  const now = new Date().toISOString();

  await db.execute({
    sql: `UPDATE screenshare_sessions SET status = 'ended', ended_at = ? WHERE id = ?`,
    args: [now, sessionId],
  });

  const result = await db.execute({
    sql: `SELECT * FROM screenshare_sessions WHERE id = ?`,
    args: [sessionId],
  });
  return result.rows[0] as unknown as ScreenShareSession;
}

export async function getSessionsByConversation(conversationId: string): Promise<ScreenShareSession[]> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT * FROM screenshare_sessions WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 20`,
    args: [conversationId],
  });
  return result.rows as unknown as ScreenShareSession[];
}

export async function getActiveSessionById(sessionId: string): Promise<ScreenShareSession | null> {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT * FROM screenshare_sessions WHERE id = ? AND status = 'active' LIMIT 1`,
    args: [sessionId],
  });
  return (result.rows[0] as unknown as ScreenShareSession) ?? null;
}

export async function updateParticipantCount(sessionId: string, count: number): Promise<void> {
  const db = getDb();
  await db.execute({
    sql: `UPDATE screenshare_sessions SET participant_count = ? WHERE id = ?`,
    args: [count, sessionId],
  });
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd website-astro && npx vitest run src/lib/db/__tests__/screenshare-queries.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add website-astro/src/lib/db/schema.sql website-astro/src/lib/db/screenshare-queries.ts website-astro/src/lib/db/__tests__/screenshare-queries.test.ts
git commit -m "feat(screenshare): add screenshare_sessions schema and query functions"
```

---

### Task 2: LiveKit Token Generation Helper (Workers-Compatible)

**Files:**
- Create: `website-astro/src/lib/livekit.ts`
- Modify: `website-astro/package.json` (add `jose` — Workers-compatible JWT library)
- Test: `website-astro/src/lib/__tests__/livekit.test.ts`

**Note:** The `livekit-server-sdk` npm package depends on `@livekit/protocol` (protobuf) which uses Node.js-specific APIs incompatible with Cloudflare Workers. Instead, we generate LiveKit access tokens directly using `jose` (a Workers-compatible JWT library). LiveKit tokens are standard JWTs with specific claims — no SDK needed.

- [ ] **Step 1: Install jose (Workers-compatible JWT)**

```bash
cd website-astro && npm install jose
```

- [ ] **Step 2: Write the failing test**

```typescript
// website-astro/src/lib/__tests__/livekit.test.ts
import { describe, it, expect } from 'vitest';
import { generateScreenShareToken } from '../livekit';

describe('livekit token generation', () => {
  it('generates a JWT string for a participant', async () => {
    const token = await generateScreenShareToken({
      roomName: 'test-room',
      participantIdentity: 'user-123',
      participantName: 'Test User',
      isHost: true,
    });
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
    // JWT has 3 dot-separated parts
    expect(token.split('.').length).toBe(3);
  });

  it('host token has canPublish=true', async () => {
    const token = await generateScreenShareToken({
      roomName: 'test-room',
      participantIdentity: 'host-1',
      participantName: 'Host',
      isHost: true,
    });
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    expect(payload.video?.canPublish).toBe(true);
  });

  it('viewer token has canPublish=false', async () => {
    const token = await generateScreenShareToken({
      roomName: 'test-room',
      participantIdentity: 'viewer-1',
      participantName: 'Viewer',
      isHost: false,
    });
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    expect(payload.video?.canPublish).toBe(false);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd website-astro && npx vitest run src/lib/__tests__/livekit.test.ts`
Expected: FAIL — module not found

- [ ] **Step 4: Implement livekit.ts using jose (no livekit-server-sdk)**

```typescript
// website-astro/src/lib/livekit.ts
import { SignJWT } from 'jose';

// LiveKit Cloud credentials — set in Cloudflare dashboard secrets
const LIVEKIT_API_KEY = import.meta.env.LIVEKIT_API_KEY || 'devkey';
const LIVEKIT_API_SECRET = import.meta.env.LIVEKIT_API_SECRET || 'devsecretthatisatleast32chars!!';
export const LIVEKIT_WS_URL = import.meta.env.PUBLIC_LIVEKIT_WS_URL || 'wss://plantgotchi-dev.livekit.cloud';

/**
 * Generate a LiveKit access token (JWT) compatible with LiveKit Cloud.
 * Uses jose instead of livekit-server-sdk to ensure Cloudflare Workers compatibility.
 *
 * LiveKit JWT spec: https://docs.livekit.io/home/get-started/authentication/
 */
export async function generateScreenShareToken(params: {
  roomName: string;
  participantIdentity: string;
  participantName: string;
  isHost: boolean;
}): Promise<string> {
  const secret = new TextEncoder().encode(LIVEKIT_API_SECRET);
  const now = Math.floor(Date.now() / 1000);

  const token = await new SignJWT({
    sub: params.participantIdentity,
    name: params.participantName,
    video: {
      room: params.roomName,
      roomJoin: true,
      canPublish: params.isHost,
      canSubscribe: true,
      canPublishData: true,
    },
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuer(LIVEKIT_API_KEY)
    .setIssuedAt(now)
    .setExpirationTime(now + 7200) // 2 hours
    .setNotBefore(now)
    .setJti(crypto.randomUUID())
    .sign(secret);

  return token;
}

export function generateRoomName(conversationId: string): string {
  const suffix = crypto.randomUUID().slice(0, 8);
  return `screenshare-${conversationId}-${suffix}`;
}
```

- [ ] **Step 5: Verify the build works on Workers**

```bash
cd website-astro && npx astro build
```
Expected: Build succeeds (jose is Workers-compatible, unlike livekit-server-sdk)

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd website-astro && npx vitest run src/lib/__tests__/livekit.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 7: Commit**

```bash
git add website-astro/src/lib/livekit.ts website-astro/src/lib/__tests__/livekit.test.ts website-astro/package.json website-astro/package-lock.json
git commit -m "feat(screenshare): add LiveKit token generation using jose (Workers-compatible)"
```

---

### Task 3: Screenshare API Endpoints

**Files:**
- Create: `website-astro/src/pages/api/screenshare/token.ts`
- Create: `website-astro/src/pages/api/screenshare/sessions.ts`
- Create: `website-astro/src/pages/api/screenshare/sessions/[id].ts`

- [ ] **Step 1: Implement token endpoint**

```typescript
// website-astro/src/pages/api/screenshare/token.ts
import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { generateScreenShareToken, LIVEKIT_WS_URL } from '../../../lib/livekit';
import { getActiveSession } from '../../../lib/db/screenshare-queries';

export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = await request.json();
  const { roomName, conversationId } = body;

  if (!roomName || !conversationId) {
    return new Response(JSON.stringify({ error: 'roomName and conversationId required' }), { status: 400 });
  }

  // Check if an active session exists for this room
  const activeSession = await getActiveSession(conversationId);
  const isHost = activeSession?.host_user_id === session.user.id;

  const token = await generateScreenShareToken({
    roomName,
    participantIdentity: session.user.id,
    participantName: session.user.name || session.user.email || 'Anonymous',
    isHost,
  });

  return new Response(JSON.stringify({ token, wsUrl: LIVEKIT_WS_URL }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

- [ ] **Step 2: Implement sessions endpoint (create + list)**

```typescript
// website-astro/src/pages/api/screenshare/sessions.ts
import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { createScreenShareSession, getActiveSession, getSessionsByConversation } from '../../../lib/db/screenshare-queries';
import { generateRoomName } from '../../../lib/livekit';

// GET: Check for active session in a conversation
export const GET: APIRoute = async ({ request, url }) => {
  const session = await getSession(request);
  if (!session?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const conversationId = url.searchParams.get('conversationId');
  if (!conversationId) {
    return new Response(JSON.stringify({ error: 'conversationId required' }), { status: 400 });
  }

  const active = await getActiveSession(conversationId);
  return new Response(JSON.stringify({ session: active }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// POST: Start a new screenshare session
export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = await request.json();
  const { conversationId } = body;

  if (!conversationId) {
    return new Response(JSON.stringify({ error: 'conversationId required' }), { status: 400 });
  }

  // Check if there's already an active session
  const existing = await getActiveSession(conversationId);
  if (existing) {
    return new Response(JSON.stringify({ error: 'Session already active', session: existing }), { status: 409 });
  }

  const roomName = generateRoomName(conversationId);
  const screenshareSession = await createScreenShareSession({
    conversationId,
    hostUserId: session.user.id,
    roomName,
  });

  return new Response(JSON.stringify({ session: screenshareSession }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

- [ ] **Step 3: Implement session end endpoint**

```typescript
// website-astro/src/pages/api/screenshare/sessions/[id].ts
import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth';
import { endScreenShareSession } from '../../../../lib/db/screenshare-queries';

// PATCH: End a screenshare session (host only)
export const PATCH: APIRoute = async ({ request, params }) => {
  const session = await getSession(request);
  if (!session?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Session ID required' }), { status: 400 });
  }

  // Verify the requesting user is the session host
  const { getActiveSessionById } = await import('../../../../lib/db/screenshare-queries');
  const existing = await getActiveSessionById(id);
  if (!existing) {
    return new Response(JSON.stringify({ error: 'Session not found' }), { status: 404 });
  }
  if (existing.host_user_id !== session.user.id) {
    return new Response(JSON.stringify({ error: 'Only the host can end a session' }), { status: 403 });
  }

  const ended = await endScreenShareSession(id);
  return new Response(JSON.stringify({ session: ended }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
```

- [ ] **Step 4: Commit**

```bash
git add website-astro/src/pages/api/screenshare/
git commit -m "feat(screenshare): add token, session create/end API endpoints"
```

---

## Chunk 2: Web Client (React + LiveKit)

### Task 4: Install LiveKit React SDK & Create ScreenShareButton

**Files:**
- Modify: `website-astro/package.json` (add `livekit-client`, `@livekit/components-react`)
- Create: `website-astro/src/components/ui/atoms/ScreenShareButton.tsx`

- [ ] **Step 1: Install LiveKit client dependencies**

```bash
cd website-astro && npm install livekit-client @livekit/components-react @livekit/components-styles
```

- [ ] **Step 2: Create ScreenShareButton atom**

```tsx
// website-astro/src/components/ui/atoms/ScreenShareButton.tsx
import { useState } from 'react';

interface ScreenShareButtonProps {
  conversationId: string;
  locale?: string;
  onSessionStarted: (session: { id: string; room_name: string }) => void;
}

const translations = {
  en: { share: 'Share Screen', starting: 'Starting...', active: 'Screen Share Active' },
  'pt-br': { share: 'Compartilhar Tela', starting: 'Iniciando...', active: 'Compartilhamento Ativo' },
};

export default function ScreenShareButton({ conversationId, locale = 'pt-br', onSessionStarted }: ScreenShareButtonProps) {
  const t = translations[locale as keyof typeof translations] || translations['pt-br'];
  const [loading, setLoading] = useState(false);

  async function startSession() {
    setLoading(true);
    try {
      const res = await fetch('/api/screenshare/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      });

      if (res.status === 409) {
        // Session already exists — join it
        const data = await res.json();
        onSessionStarted(data.session);
        return;
      }

      if (!res.ok) throw new Error('Failed to start session');

      const data = await res.json();
      onSessionStarted(data.session);
    } catch (err) {
      console.error('Failed to start screenshare:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={startSession}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
      title={t.share}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
      {loading ? t.starting : t.share}
    </button>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add website-astro/package.json website-astro/package-lock.json website-astro/src/components/ui/atoms/ScreenShareButton.tsx
git commit -m "feat(screenshare): add LiveKit deps and ScreenShareButton atom"
```

---

### Task 5: ScreenShareTile Component

**Files:**
- Create: `website-astro/src/components/ui/molecules/ScreenShareTile.tsx`

- [ ] **Step 1: Create the participant video tile**

```tsx
// website-astro/src/components/ui/molecules/ScreenShareTile.tsx
import { VideoTrack, useParticipantTracks } from '@livekit/components-react';
import { Track, type Participant } from 'livekit-client';

interface ScreenShareTileProps {
  participant: Participant;
  isMain?: boolean;
}

export default function ScreenShareTile({ participant, isMain = false }: ScreenShareTileProps) {
  const tracks = useParticipantTracks(
    [Track.Source.ScreenShare, Track.Source.Camera],
    participant
  );

  const screenTrack = tracks.find(t => t.source === Track.Source.ScreenShare);
  const cameraTrack = tracks.find(t => t.source === Track.Source.Camera);
  const displayTrack = screenTrack || cameraTrack;

  if (!displayTrack) {
    return (
      <div className={`flex items-center justify-center bg-gray-800 rounded-lg ${isMain ? 'w-full h-full' : 'w-48 h-36'}`}>
        <div className="text-center">
          <div className="text-2xl mb-1">👤</div>
          <span className="text-gray-400 text-sm">{participant.name || participant.identity}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden bg-black ${isMain ? 'w-full h-full' : 'w-48 h-36'}`}>
      <VideoTrack
        trackRef={displayTrack}
        className="w-full h-full object-contain"
      />
      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
        {participant.name || participant.identity}
        {screenTrack && ' 🖥️'}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add website-astro/src/components/ui/molecules/ScreenShareTile.tsx
git commit -m "feat(screenshare): add ScreenShareTile video component"
```

---

### Task 6: ScreenShareControls Component

**Files:**
- Create: `website-astro/src/components/ui/molecules/ScreenShareControls.tsx`

- [ ] **Step 1: Create the controls bar**

```tsx
// website-astro/src/components/ui/molecules/ScreenShareControls.tsx
import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { useState } from 'react';

interface ScreenShareControlsProps {
  sessionId: string;
  isHost: boolean;
  locale?: string;
  onLeave: () => void;
}

const translations = {
  en: {
    shareScreen: 'Share Screen',
    stopSharing: 'Stop Sharing',
    leave: 'Leave',
    endSession: 'End Session',
  },
  'pt-br': {
    shareScreen: 'Compartilhar Tela',
    stopSharing: 'Parar Compartilhamento',
    leave: 'Sair',
    endSession: 'Encerrar Sessao',
  },
};

export default function ScreenShareControls({ sessionId, isHost, locale = 'pt-br', onLeave }: ScreenShareControlsProps) {
  const t = translations[locale as keyof typeof translations] || translations['pt-br'];
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const [isSharing, setIsSharing] = useState(false);

  async function toggleScreenShare() {
    try {
      if (isSharing) {
        await localParticipant.setScreenShareEnabled(false);
        setIsSharing(false);
      } else {
        await localParticipant.setScreenShareEnabled(true);
        setIsSharing(true);
      }
    } catch (err) {
      console.error('Screen share toggle failed:', err);
    }
  }

  async function handleLeave() {
    if (isHost) {
      await fetch(`/api/screenshare/sessions/${sessionId}`, { method: 'PATCH' });
    }
    room.disconnect();
    onLeave();
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg">
      {isHost && (
        <button
          onClick={toggleScreenShare}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isSharing
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          {isSharing ? t.stopSharing : t.shareScreen}
        </button>
      )}

      <button
        onClick={handleLeave}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
      >
        {isHost ? t.endSession : t.leave}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add website-astro/src/components/ui/molecules/ScreenShareControls.tsx
git commit -m "feat(screenshare): add ScreenShareControls with share toggle and leave"
```

---

### Task 7: ScreenShareRoom Organism + Astro Page + ChatApp Integration

**Files:**
- Create: `website-astro/src/components/ui/organisms/ScreenShareRoom.tsx`
- Create: `website-astro/src/pages/screenshare/[roomId].astro`
- Modify: `website-astro/src/components/ui/organisms/ChatApp.tsx`

- [ ] **Step 1: Create ScreenShareRoom organism**

```tsx
// website-astro/src/components/ui/organisms/ScreenShareRoom.tsx
import { LiveKitRoom, RoomAudioRenderer, useRemoteParticipants, useLocalParticipant } from '@livekit/components-react';
import '@livekit/components-styles';
import { useState, useEffect } from 'react';
import ScreenShareTile from '../molecules/ScreenShareTile';
import ScreenShareControls from '../molecules/ScreenShareControls';

interface ScreenShareRoomProps {
  sessionId: string;
  roomName: string;
  conversationId: string;
  isHost: boolean;
  locale?: string;
  onClose: () => void;
}

const translations = {
  en: { connecting: 'Connecting...', waiting: 'Waiting for host to share screen...', viewers: 'viewers' },
  'pt-br': { connecting: 'Conectando...', waiting: 'Aguardando o host compartilhar a tela...', viewers: 'espectadores' },
};

function RoomContent({ sessionId, isHost, locale, onClose }: Omit<ScreenShareRoomProps, 'roomName' | 'conversationId'>) {
  const t = translations[locale as keyof typeof translations] || translations['pt-br'];
  const remoteParticipants = useRemoteParticipants();
  const { localParticipant } = useLocalParticipant();
  const allParticipants = [localParticipant, ...remoteParticipants];

  // Find the participant who is sharing their screen
  const presenter = allParticipants.find(p =>
    Array.from(p.trackPublications.values()).some(
      pub => pub.source === 'screen_share' && pub.isSubscribed
    )
  );

  return (
    <div className="flex flex-col h-full bg-gray-950 rounded-xl overflow-hidden">
      {/* Main video area */}
      <div className="flex-1 relative p-4">
        {presenter ? (
          <ScreenShareTile participant={presenter} isMain />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            {t.waiting}
          </div>
        )}
      </div>

      {/* Participant strip (non-presenters) */}
      {remoteParticipants.length > 0 && (
        <div className="flex gap-2 px-4 py-2 overflow-x-auto">
          {remoteParticipants
            .filter(p => p !== presenter)
            .map(p => (
              <ScreenShareTile key={p.identity} participant={p} />
            ))}
          <span className="text-gray-500 text-xs self-center ml-2">
            {remoteParticipants.length} {t.viewers}
          </span>
        </div>
      )}

      {/* Controls */}
      <div className="p-3 border-t border-gray-800">
        <ScreenShareControls
          sessionId={sessionId}
          isHost={isHost}
          locale={locale}
          onLeave={onClose}
        />
      </div>

      <RoomAudioRenderer />
    </div>
  );
}

export default function ScreenShareRoom({ sessionId, roomName, conversationId, isHost, locale = 'pt-br', onClose }: ScreenShareRoomProps) {
  const t = translations[locale as keyof typeof translations] || translations['pt-br'];
  const [token, setToken] = useState<string | null>(null);
  const [wsUrl, setWsUrl] = useState<string>('');

  useEffect(() => {
    async function fetchToken() {
      const res = await fetch('/api/screenshare/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName, conversationId }),
      });
      const data = await res.json();
      setToken(data.token);
      setWsUrl(data.wsUrl);
    }
    fetchToken();
  }, [roomName, conversationId]);

  if (!token) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-950 rounded-xl">
        <span className="text-gray-400">{t.connecting}</span>
      </div>
    );
  }

  return (
    <LiveKitRoom token={token} serverUrl={wsUrl} connect>
      <RoomContent
        sessionId={sessionId}
        isHost={isHost}
        locale={locale}
        onClose={onClose}
      />
    </LiveKitRoom>
  );
}
```

- [ ] **Step 2: Create Astro page for standalone screenshare view**

```astro
---
// website-astro/src/pages/screenshare/[roomId].astro
import BaseLayout from "../../layouts/BaseLayout.astro";
import ScreenShareRoom from "../../components/ui/organisms/ScreenShareRoom";
import { getLocaleFromPath } from "../../i18n";

const locale = getLocaleFromPath(Astro.url.pathname);
const { roomId } = Astro.params;
const title = locale === "pt-br" ? "Compartilhamento de Tela" : "Screen Share";

// The roomId URL param is the session ID.
// ScreenShareRoom fetches the session details (room_name, conversation_id)
// and token via the /api/screenshare/* endpoints client-side.
---
<BaseLayout title={title}>
  <div class="max-w-6xl mx-auto p-4 h-[calc(100vh-80px)]">
    <ScreenShareRoom
      client:load
      sessionId={roomId!}
      locale={locale}
    />
  </div>
</BaseLayout>
```

**Note:** The `ScreenShareRoom` component should accept an optional `sessionId`-only mode where it fetches session details (roomName, conversationId, isHost) from `/api/screenshare/sessions/{id}` on mount. This is used for the standalone page where we only have the session ID from the URL. The main props-based mode is used when launched from ChatApp where all details are already available.

- [ ] **Step 3: Add ScreenShareButton to ChatApp header**

In `website-astro/src/components/ui/organisms/ChatApp.tsx`, find the chat header area (where the conversation name is displayed) and add the ScreenShareButton alongside it. The exact location depends on the current ChatApp layout — find the header `<div>` and insert:

```tsx
import ScreenShareButton from '../atoms/ScreenShareButton';
import ScreenShareRoom from './ScreenShareRoom';

// Inside the component, add state:
const [activeScreenShare, setActiveScreenShare] = useState<{ id: string; room_name: string } | null>(null);

// In the header, after the conversation title:
<ScreenShareButton
  conversationId={currentConversationId}
  locale={locale}
  onSessionStarted={(session) => setActiveScreenShare(session)}
/>

// Below the chat area (or as a modal overlay):
{activeScreenShare && (
  <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8">
    <div className="w-full max-w-5xl h-[80vh]">
      <ScreenShareRoom
        sessionId={activeScreenShare.id}
        roomName={activeScreenShare.room_name}
        conversationId={currentConversationId}
        isHost={true}
        locale={locale}
        onClose={() => setActiveScreenShare(null)}
      />
    </div>
  </div>
)}
```

- [ ] **Step 4: Commit**

```bash
git add website-astro/src/components/ui/organisms/ScreenShareRoom.tsx website-astro/src/pages/screenshare/ website-astro/src/components/ui/organisms/ChatApp.tsx
git commit -m "feat(screenshare): add ScreenShareRoom, Astro page, ChatApp integration"
```

---

## Chunk 3: macOS Client (SwiftUI + LiveKit)

### Task 8: Add LiveKit Swift SDK Dependency

**Files:**
- Modify: `ios-app/Package.swift`

- [ ] **Step 1: Add LiveKit Swift SDK to Package.swift**

Add to the `dependencies` array:

```swift
.package(url: "https://github.com/livekit/client-sdk-swift.git", from: "2.0.0"),
```

Add to the `Plantgotchi` target's dependencies:

```swift
.product(name: "LiveKit", package: "client-sdk-swift"),
```

- [ ] **Step 2: Verify it resolves**

```bash
cd ios-app && swift package resolve
```
Expected: Dependencies resolved successfully

- [ ] **Step 3: Commit**

```bash
git add ios-app/Package.swift
git commit -m "feat(screenshare): add LiveKit Swift SDK dependency"
```

---

### Task 9: ScreenShareManager (LiveKit + ScreenCaptureKit Bridge)

**Files:**
- Create: `ios-app/Plantgotchi/ScreenShare/ScreenShareManager.swift`

- [ ] **Step 1: Create the manager**

```swift
// ios-app/Plantgotchi/ScreenShare/ScreenShareManager.swift
import SwiftUI
import LiveKit
import ScreenCaptureKit
import Combine

@MainActor
class ScreenShareManager: ObservableObject {
    @Published var room: Room?
    @Published var isConnected = false
    @Published var isSharing = false
    @Published var error: String?
    @Published var remoteParticipants: [RemoteParticipant] = []

    private var roomDelegate: RoomDelegateHandler?
    private let baseURL: String

    init(baseURL: String = "") {
        // Read from Config.plist or use default
        if let url = Bundle.main.object(forInfoDictionaryKey: "API_BASE_URL") as? String, !url.isEmpty {
            self.baseURL = url
        } else {
            self.baseURL = baseURL.isEmpty ? "http://localhost:4321" : baseURL
        }
    }

    // MARK: - Session Management

    func startSession(conversationId: String) async throws -> (sessionId: String, roomName: String) {
        var request = URLRequest(url: URL(string: "\(baseURL)/api/screenshare/sessions")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(["conversationId": conversationId])

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode < 300 else {
            throw ScreenShareError.sessionCreationFailed
        }

        let json = try JSONDecoder().decode(SessionResponse.self, from: data)
        return (json.session.id, json.session.room_name)
    }

    func fetchToken(roomName: String, conversationId: String) async throws -> (token: String, wsUrl: String) {
        var request = URLRequest(url: URL(string: "\(baseURL)/api/screenshare/token")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode([
            "roomName": roomName,
            "conversationId": conversationId,
        ])

        let (data, _) = try await URLSession.shared.data(for: request)
        let json = try JSONDecoder().decode(TokenResponse.self, from: data)
        return (json.token, json.wsUrl)
    }

    // MARK: - Room Connection

    func connect(token: String, wsUrl: String) async throws {
        let room = Room()
        self.room = room

        let delegate = RoomDelegateHandler(manager: self)
        self.roomDelegate = delegate
        room.add(delegate: delegate)

        try await room.connect(url: wsUrl, token: token)
        isConnected = true
        updateParticipants()
    }

    func disconnect() async {
        isSharing = false
        await room?.disconnect()
        room = nil
        isConnected = false
        remoteParticipants = []
    }

    // MARK: - Screen Sharing (macOS only)

    #if os(macOS)
    func startScreenShare() async throws {
        guard let room = room else { return }
        let localParticipant = room.localParticipant

        // ScreenCaptureKit requires user permission
        try await SCShareableContent.excludingDesktopWindows(false, onScreenWindowsOnly: true)

        try await localParticipant.setScreenShareEnabled(true)
        isSharing = true
    }

    func stopScreenShare() async throws {
        guard let localParticipant = room?.localParticipant else { return }
        try await localParticipant.setScreenShareEnabled(false)
        isSharing = false
    }
    #endif

    // MARK: - Helpers

    func updateParticipants() {
        guard let room = room else { return }
        remoteParticipants = Array(room.remoteParticipants.values)
    }

    func endSession(sessionId: String) async {
        var request = URLRequest(url: URL(string: "\(baseURL)/api/screenshare/sessions/\(sessionId)")!)
        request.httpMethod = "PATCH"
        try? await URLSession.shared.data(for: request)
        await disconnect()
    }
}

// MARK: - Room Delegate

class RoomDelegateHandler: RoomDelegate, @unchecked Sendable {
    weak var manager: ScreenShareManager?

    init(manager: ScreenShareManager) {
        self.manager = manager
    }

    nonisolated func room(_ room: Room, participantDidJoin participant: RemoteParticipant) {
        Task { @MainActor in
            manager?.updateParticipants()
        }
    }

    nonisolated func room(_ room: Room, participantDidLeave participant: RemoteParticipant) {
        Task { @MainActor in
            manager?.updateParticipants()
        }
    }

    nonisolated func room(_ room: Room, participant: RemoteParticipant, didSubscribeTrack publication: RemoteTrackPublication) {
        Task { @MainActor in
            manager?.updateParticipants()
        }
    }
}

// MARK: - Models

struct SessionResponse: Codable {
    let session: ScreenShareSessionData
}

struct ScreenShareSessionData: Codable {
    let id: String
    let room_name: String
    let conversation_id: String
    let host_user_id: String
    let status: String
}

struct TokenResponse: Codable {
    let token: String
    let wsUrl: String
}

enum ScreenShareError: LocalizedError {
    case sessionCreationFailed
    case tokenFetchFailed
    case permissionDenied

    var errorDescription: String? {
        switch self {
        case .sessionCreationFailed: return "Failed to create screen share session"
        case .tokenFetchFailed: return "Failed to get connection token"
        case .permissionDenied: return "Screen recording permission denied"
        }
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add ios-app/Plantgotchi/ScreenShare/ScreenShareManager.swift
git commit -m "feat(screenshare): add ScreenShareManager with LiveKit + ScreenCaptureKit"
```

---

### Task 10: ScreenShareParticipantView

**Files:**
- Create: `ios-app/Plantgotchi/ScreenShare/ScreenShareParticipantView.swift`

- [ ] **Step 1: Create the participant video tile**

```swift
// ios-app/Plantgotchi/ScreenShare/ScreenShareParticipantView.swift
import SwiftUI
import LiveKit

struct ScreenShareParticipantView: View {
    let participant: Participant
    let isMain: Bool

    init(participant: Participant, isMain: Bool = false) {
        self.participant = participant
        self.isMain = isMain
    }

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            // Find screen share track first, fall back to camera
            if let screenTrack = participant.firstScreenShareVideoTrack {
                SwiftUIVideoView(screenTrack)
                    .aspectRatio(16/9, contentMode: .fit)
            } else if let cameraTrack = participant.firstCameraVideoTrack {
                SwiftUIVideoView(cameraTrack)
                    .aspectRatio(16/9, contentMode: .fit)
            } else {
                // No video — show avatar
                VStack {
                    Image(systemName: "person.circle.fill")
                        .font(.system(size: isMain ? 60 : 30))
                        .foregroundColor(.gray)
                    Text(participant.name ?? participant.identity?.stringValue ?? "")
                        .font(.caption)
                        .foregroundColor(.gray)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(Color.black.opacity(0.8))
            }

            // Name badge
            HStack(spacing: 4) {
                Text(participant.name ?? participant.identity?.stringValue ?? "")
                    .font(.caption2)
                    .foregroundColor(.white)
                if participant.firstScreenShareVideoTrack != nil {
                    Image(systemName: "rectangle.inset.filled.and.person.filled")
                        .font(.caption2)
                        .foregroundColor(.green)
                }
            }
            .padding(.horizontal, 6)
            .padding(.vertical, 3)
            .background(Color.black.opacity(0.6))
            .cornerRadius(4)
            .padding(6)
        }
        .background(Color.black)
        .cornerRadius(8)
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add ios-app/Plantgotchi/ScreenShare/ScreenShareParticipantView.swift
git commit -m "feat(screenshare): add ScreenShareParticipantView for macOS"
```

---

### Task 11: ScreenShareView (Main SwiftUI View)

**Files:**
- Create: `ios-app/Plantgotchi/ScreenShare/ScreenShareView.swift`

- [ ] **Step 1: Create the main screen share view**

```swift
// ios-app/Plantgotchi/ScreenShare/ScreenShareView.swift
import SwiftUI
import LiveKit

struct ScreenShareView: View {
    @StateObject private var manager = ScreenShareManager()
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var localeManager: LocaleManager

    let conversationId: String
    let isHost: Bool

    @State private var sessionId: String?
    @State private var connectionState: ConnectionState = .idle

    enum ConnectionState {
        case idle, connecting, connected, error(String)
    }

    var t: [String: String] {
        localeManager.currentLocale == "pt-br" ? [
            "connecting": "Conectando...",
            "shareScreen": "Compartilhar Tela",
            "stopSharing": "Parar Compartilhamento",
            "endSession": "Encerrar Sessao",
            "leave": "Sair",
            "waiting": "Aguardando o host compartilhar a tela...",
            "viewers": "espectadores",
            "error": "Erro",
        ] : [
            "connecting": "Connecting...",
            "shareScreen": "Share Screen",
            "stopSharing": "Stop Sharing",
            "endSession": "End Session",
            "leave": "Leave",
            "waiting": "Waiting for host to share screen...",
            "viewers": "viewers",
            "error": "Error",
        ]
    }

    var body: some View {
        VStack(spacing: 0) {
            switch connectionState {
            case .idle, .connecting:
                Spacer()
                ProgressView(t["connecting"]!)
                    .foregroundColor(.gray)
                Spacer()

            case .connected:
                // Main video area
                mainVideoArea
                    .frame(maxWidth: .infinity, maxHeight: .infinity)

                // Participant thumbnails
                if !manager.remoteParticipants.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(manager.remoteParticipants, id: \.identity) { participant in
                                ScreenShareParticipantView(participant: participant, isMain: false)
                                    .frame(width: 160, height: 100)
                            }
                            Text("\(manager.remoteParticipants.count) \(t["viewers"]!)")
                                .font(.caption2)
                                .foregroundColor(.gray)
                        }
                        .padding(.horizontal)
                    }
                    .frame(height: 110)
                    .background(Color.black.opacity(0.3))
                }

                // Controls
                controlBar

            case .error(let message):
                Spacer()
                VStack(spacing: 12) {
                    Image(systemName: "exclamationmark.triangle")
                        .font(.largeTitle)
                        .foregroundColor(.red)
                    Text("\(t["error"]!): \(message)")
                        .foregroundColor(.red)
                    Button("Retry") { Task { await connectToRoom() } }
                        .buttonStyle(.borderedProminent)
                }
                Spacer()
            }
        }
        .background(Color.black)
        .task { await connectToRoom() }
    }

    @ViewBuilder
    var mainVideoArea: some View {
        // Find who is presenting
        let allParticipants: [Participant] = {
            var list: [Participant] = []
            if let local = manager.room?.localParticipant {
                list.append(local)
            }
            list.append(contentsOf: manager.remoteParticipants)
            return list
        }()

        let presenter = allParticipants.first { p in
            p.firstScreenShareVideoTrack != nil
        }

        if let presenter = presenter {
            ScreenShareParticipantView(participant: presenter, isMain: true)
        } else {
            Text(t["waiting"]!)
                .foregroundColor(.gray)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }

    var controlBar: some View {
        HStack(spacing: 16) {
            #if os(macOS)
            if isHost {
                Button(action: {
                    Task {
                        if manager.isSharing {
                            try? await manager.stopScreenShare()
                        } else {
                            try? await manager.startScreenShare()
                        }
                    }
                }) {
                    Label(
                        manager.isSharing ? t["stopSharing"]! : t["shareScreen"]!,
                        systemImage: manager.isSharing ? "rectangle.slash" : "rectangle.inset.filled.and.person.filled"
                    )
                }
                .buttonStyle(.borderedProminent)
                .tint(manager.isSharing ? .red : .green)
            }
            #endif

            Spacer()

            Button(action: {
                Task {
                    if isHost, let sid = sessionId {
                        await manager.endSession(sessionId: sid)
                    } else {
                        await manager.disconnect()
                    }
                    dismiss()
                }
            }) {
                Label(
                    isHost ? t["endSession"]! : t["leave"]!,
                    systemImage: "xmark.circle.fill"
                )
            }
            .buttonStyle(.borderedProminent)
            .tint(.red)
        }
        .padding()
        .background(Color.black.opacity(0.8))
    }

    // MARK: - Connection

    func connectToRoom() async {
        connectionState = .connecting
        do {
            let (sid, roomName) = try await manager.startSession(conversationId: conversationId)
            sessionId = sid
            let (token, wsUrl) = try await manager.fetchToken(roomName: roomName, conversationId: conversationId)
            try await manager.connect(token: token, wsUrl: wsUrl)
            connectionState = .connected
        } catch {
            connectionState = .error(error.localizedDescription)
        }
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add ios-app/Plantgotchi/ScreenShare/ScreenShareView.swift
git commit -m "feat(screenshare): add main ScreenShareView for macOS"
```

---

## Chunk 4: Integration & Environment Setup

### Task 12: Environment Variables & LiveKit Cloud Setup

**Files:**
- Modify: `website-astro/wrangler.toml` (add env var placeholders)

- [ ] **Step 1: Document required LiveKit Cloud setup**

The team needs to:
1. Create a free LiveKit Cloud account at https://cloud.livekit.io
2. Create a project (e.g., "plantgotchi")
3. Copy the API Key, API Secret, and WebSocket URL from Project Settings → Keys

- [ ] **Step 2: Add env var placeholders to wrangler.toml**

Append to `website-astro/wrangler.toml`:

```toml
# LiveKit Cloud credentials (set actual values in Cloudflare dashboard → Settings → Variables)
# LIVEKIT_API_KEY = "your-api-key"
# LIVEKIT_API_SECRET = "your-api-secret"
# PUBLIC_LIVEKIT_WS_URL = "wss://your-project.livekit.cloud"
```

- [ ] **Step 3: Add macOS entitlement note**

For the macOS app, `ScreenCaptureKit` requires the `com.apple.security.screen-capture` entitlement. Add a note in the `ios-app/Plantgotchi/ScreenShare/` directory:

The app's entitlements file (or Info.plist) must include:
```xml
<key>NSScreenCaptureUsageDescription</key>
<string>Plantgotchi needs screen recording permission to share your screen with other users.</string>
```

- [ ] **Step 4: Commit**

```bash
git add website-astro/wrangler.toml
git commit -m "chore(screenshare): add LiveKit env var placeholders and entitlement notes"
```

---

### Task 13: Build Verification & Smoke Test

- [ ] **Step 1: Verify web build**

```bash
cd website-astro && npx astro build
```
Expected: Build succeeds with no errors

- [ ] **Step 2: Verify Swift package resolution**

```bash
cd ios-app && swift package resolve
```
Expected: All dependencies resolve including LiveKit

- [ ] **Step 3: Run web tests**

```bash
cd website-astro && npx vitest run
```
Expected: All tests pass including new screenshare query tests

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A && git commit -m "fix(screenshare): build verification fixes"
```

---

## Summary

| Task | Subsystem | What it builds | Can parallelize with |
|------|-----------|---------------|---------------------|
| 1 | Backend | Schema + query functions | — (must go first) |
| 2 | Backend | LiveKit token helper | Task 1 |
| 3 | Backend | API endpoints | Tasks 1, 2 |
| 4 | Web | ScreenShareButton atom | Task 3 |
| 5 | Web | ScreenShareTile video | Task 4 |
| 6 | Web | ScreenShareControls | Task 4 |
| 7 | Web | ScreenShareRoom + ChatApp integration | Tasks 5, 6 |
| 8 | macOS | LiveKit Swift dependency | — (independent) |
| 9 | macOS | ScreenShareManager | Task 8 |
| 10 | macOS | ParticipantView | Task 8 |
| 11 | macOS | Main ScreenShareView | Tasks 9, 10 |
| 12 | Config | Env vars + entitlements | — (independent) |
| 13 | Verify | Build + test | All above |

**Parallelism:** After Task 1 completes, Tasks 2-3 (backend), Tasks 4-7 (web), and Tasks 8-11 (macOS) can all run in parallel as independent subsystems.
