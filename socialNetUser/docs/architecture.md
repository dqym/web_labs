# Social Network User Portal — Architecture Overview

## Goals
- Provide a learner-friendly social network UI with registration, news feed, post creation, messaging, and friend/photo management.
- Keep data in sync with the existing Social Network admin module via a shared JSON file.
- Deliver instant updates for messages and news without a full page refresh.
- Build the UI entirely with Angular components, services, and directives.

## High-Level Structure
```
/socialNetUser
├─ package.json (backend scripts & deps)
├─ index.js (Express server entry)
├─ src/
│  ├─ server.js (Express + Socket.IO setup)
│  ├─ routes/ (REST resources for users, posts, friends, photos, messages)
│  ├─ services/datastore.js (JSON storage w/ fs watch + persistence)
│  └─ sockets/feedSocket.js (room management & events)
├─ data/admin-data.json (shared storage with admin module)
├─ tests/server/*.test.js (Jest + Supertest)
└─ client/ (Angular 17 standalone app)
   ├─ package.json / angular.json / tsconfig*.json
   ├─ src/main.ts (bootstrapApplication)
   └─ src/app/
      ├─ services/api.service.ts (HTTP wrapper)
      ├─ services/realtime.service.ts (Socket.IO client)
      ├─ components/
      │  ├─ registration
      │  ├─ news-feed
      │  ├─ post-form
      │  ├─ friends-panel
      │  ├─ messages
      │  └─ admin-link (stub navigation)
      └─ directives/
         ├─ new-item-highlight.directive.ts
         └─ auto-scroll.directive.ts
```

## Data Flow
1. **Admin Module Sync**: `datastore.js` loads `data/admin-data.json`, watches for changes (from admin module) and hot-reloads in-memory state. All write operations persist back to the JSON file.
2. **REST API**: Angular calls Express endpoints (`/api/users`, `/api/posts`, `/api/friends`, `/api/messages`). Validation ensures consistent schema. File-backed transactions use a queue to avoid corruption.
3. **Real-Time Updates**: Socket.IO namespaces emit `post:new` and `message:new` events to user-specific rooms. Angular `RealTimeService` subscribes and updates Observables powering the feed/messages without page reload.
4. **Angular Routing**:
   - `/register`: registration form + avatar upload (URL-based) implemented with Reactive Forms and validation directives.
   - `/feed`: combined feed + messaging view, automatically refreshed via sockets.
   - `/post`: dedicated page for composing news posts.
   - `/admin`: stub card with CTA to launch the external admin module.

## Key Requirements Mapping
| Requirement | Implementation |
|-------------|----------------|
| JSON data from admin module | `data/admin-data.json` + file watcher & persistence |
| Node.js + Express server | `index.js` bootstraps Express, routers under `src/routes` |
| Registration / Feed / Post pages | Angular routes/components listed above |
| Admin shortcut for admins | `AdminLinkComponent` displays CTA based on `user.isAdmin` |
| Instant updates (chat + news) | Socket.IO broadcasting + Angular `RealTimeService` |
| Jest server tests | `tests/server/*.test.js` covering registration, posts, feed, sockets |
| Angular components/services/directives | Standalone Angular components + custom directives for effects |

## Assumptions
- Avatar "photo" management uses image URLs or base64 strings supplied by the user rather than binary uploads (fits coursework scope).
- Authentication is simplified to per-session selection of the active user; no password hashing is performed.
- The admin module writes to the same JSON file; our watcher reloads whenever timestamps differ.

This document is a living reference for both implementation and grading.
