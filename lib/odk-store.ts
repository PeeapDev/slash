"use client"

import { v4 as uuidv4 } from "uuid"

// ─── ODK Data Types ───

export interface OdkProject {
  id: string
  name: string
  description: string
  archived: boolean
  createdAt: string
  updatedAt: string
}

export type OdkReviewState = "received" | "hasIssues" | "approved" | "rejected"

export interface OdkSubmission {
  id: string
  formId: string
  projectId: string
  data: Record<string, any>
  submitter: string
  reviewState: OdkReviewState
  deviceId?: string
  createdAt: string
  updatedAt: string
}

export interface OdkComment {
  id: string
  submissionId: string
  body: string
  author: string
  createdAt: string
}

export interface OdkAppUser {
  id: string
  projectId: string
  displayName: string
  token: string
  status: "active" | "revoked"
  createdAt: string
}

export type OdkSiteRole = "admin" | "none"

export interface OdkWebUser {
  id: string
  email: string
  displayName: string
  siteRole: OdkSiteRole
  createdAt: string
  updatedAt: string
}

// ─── IndexedDB-backed Store ───

const DB_NAME = "SLASH_ODK_DB"
const DB_VERSION = 1

const STORES = {
  projects: "odk_projects",
  submissions: "odk_submissions",
  comments: "odk_comments",
  appUsers: "odk_app_users",
  webUsers: "odk_web_users",
} as const

type StoreName = (typeof STORES)[keyof typeof STORES]

class OdkStore {
  private db: IDBDatabase | null = null
  private initPromise: Promise<void> | null = null

  async init(): Promise<void> {
    if (this.db) return
    if (this.initPromise) return this.initPromise

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === "undefined" || typeof indexedDB === "undefined") {
        resolve()
        return
      }

      const req = indexedDB.open(DB_NAME, DB_VERSION)

      req.onerror = () => reject(req.error)

      req.onsuccess = () => {
        this.db = req.result
        resolve()
      }

      req.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Projects
        if (!db.objectStoreNames.contains(STORES.projects)) {
          db.createObjectStore(STORES.projects, { keyPath: "id" })
        }

        // Submissions
        if (!db.objectStoreNames.contains(STORES.submissions)) {
          const sub = db.createObjectStore(STORES.submissions, { keyPath: "id" })
          sub.createIndex("formId", "formId")
          sub.createIndex("projectId", "projectId")
          sub.createIndex("reviewState", "reviewState")
          sub.createIndex("createdAt", "createdAt")
        }

        // Comments
        if (!db.objectStoreNames.contains(STORES.comments)) {
          const cm = db.createObjectStore(STORES.comments, { keyPath: "id" })
          cm.createIndex("submissionId", "submissionId")
        }

        // App Users
        if (!db.objectStoreNames.contains(STORES.appUsers)) {
          const au = db.createObjectStore(STORES.appUsers, { keyPath: "id" })
          au.createIndex("projectId", "projectId")
        }

        // Web Users
        if (!db.objectStoreNames.contains(STORES.webUsers)) {
          db.createObjectStore(STORES.webUsers, { keyPath: "id" })
        }
      }
    })

    return this.initPromise
  }

  // ─── Generic helpers ───

  private async _put<T>(storeName: StoreName, record: T): Promise<void> {
    await this.init()
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, "readwrite")
      tx.objectStore(storeName).put(record)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  private async _get<T>(storeName: StoreName, id: string): Promise<T | null> {
    await this.init()
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, "readonly")
      const req = tx.objectStore(storeName).get(id)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => reject(req.error)
    })
  }

  private async _getAll<T>(storeName: StoreName): Promise<T[]> {
    await this.init()
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, "readonly")
      const req = tx.objectStore(storeName).getAll()
      req.onsuccess = () => resolve(req.result ?? [])
      req.onerror = () => reject(req.error)
    })
  }

  private async _getAllByIndex<T>(storeName: StoreName, indexName: string, value: string): Promise<T[]> {
    await this.init()
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, "readonly")
      const idx = tx.objectStore(storeName).index(indexName)
      const req = idx.getAll(value)
      req.onsuccess = () => resolve(req.result ?? [])
      req.onerror = () => reject(req.error)
    })
  }

  private async _delete(storeName: StoreName, id: string): Promise<void> {
    await this.init()
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, "readwrite")
      tx.objectStore(storeName).delete(id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  // ─── Projects ───

  async getProjects(): Promise<OdkProject[]> {
    return this._getAll<OdkProject>(STORES.projects)
  }

  async getProject(id: string): Promise<OdkProject | null> {
    return this._get<OdkProject>(STORES.projects, id)
  }

  async createProject(name: string, description = ""): Promise<OdkProject> {
    const project: OdkProject = {
      id: uuidv4(),
      name,
      description,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await this._put(STORES.projects, project)
    return project
  }

  async updateProject(id: string, updates: Partial<Pick<OdkProject, "name" | "description" | "archived">>): Promise<OdkProject | null> {
    const p = await this.getProject(id)
    if (!p) return null
    const updated = { ...p, ...updates, updatedAt: new Date().toISOString() }
    await this._put(STORES.projects, updated)
    return updated
  }

  async deleteProject(id: string): Promise<void> {
    await this._delete(STORES.projects, id)
  }

  async getProjectStats(projectId: string): Promise<{ formCount: number; submissionCount: number; lastSubmission?: string }> {
    const { getForms } = await import("./form-store")
    const allForms = getForms()
    const forms = allForms.filter((f) => f.projectId === projectId)
    const submissions = await this._getAllByIndex<OdkSubmission>(STORES.submissions, "projectId", projectId)
    const sorted = submissions.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return {
      formCount: forms.length,
      submissionCount: submissions.length,
      lastSubmission: sorted[0]?.createdAt,
    }
  }

  // ─── Submissions ───

  async getSubmissions(formId?: string, projectId?: string): Promise<OdkSubmission[]> {
    if (formId) return this._getAllByIndex<OdkSubmission>(STORES.submissions, "formId", formId)
    if (projectId) return this._getAllByIndex<OdkSubmission>(STORES.submissions, "projectId", projectId)
    return this._getAll<OdkSubmission>(STORES.submissions)
  }

  async getSubmission(id: string): Promise<OdkSubmission | null> {
    return this._get<OdkSubmission>(STORES.submissions, id)
  }

  async createSubmission(formId: string, projectId: string, data: Record<string, any>, submitter: string): Promise<OdkSubmission> {
    const sub: OdkSubmission = {
      id: uuidv4(),
      formId,
      projectId,
      data,
      submitter,
      reviewState: "received",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await this._put(STORES.submissions, sub)
    return sub
  }

  async updateSubmission(id: string, updates: Partial<OdkSubmission>): Promise<OdkSubmission | null> {
    const s = await this.getSubmission(id)
    if (!s) return null
    const updated = { ...s, ...updates, updatedAt: new Date().toISOString() }
    await this._put(STORES.submissions, updated)
    return updated
  }

  async deleteSubmission(id: string): Promise<void> {
    await this._delete(STORES.submissions, id)
  }

  // ─── Comments ───

  async getComments(submissionId: string): Promise<OdkComment[]> {
    return this._getAllByIndex<OdkComment>(STORES.comments, "submissionId", submissionId)
  }

  async addComment(submissionId: string, body: string, author: string): Promise<OdkComment> {
    const c: OdkComment = {
      id: uuidv4(),
      submissionId,
      body,
      author,
      createdAt: new Date().toISOString(),
    }
    await this._put(STORES.comments, c)
    return c
  }

  // ─── App Users ───

  async getAppUsers(projectId: string): Promise<OdkAppUser[]> {
    return this._getAllByIndex<OdkAppUser>(STORES.appUsers, "projectId", projectId)
  }

  async createAppUser(projectId: string, displayName: string): Promise<OdkAppUser> {
    const au: OdkAppUser = {
      id: uuidv4(),
      projectId,
      displayName,
      token: uuidv4().replace(/-/g, ""),
      status: "active",
      createdAt: new Date().toISOString(),
    }
    await this._put(STORES.appUsers, au)
    return au
  }

  async revokeAppUser(id: string): Promise<void> {
    const u = await this._get<OdkAppUser>(STORES.appUsers, id)
    if (u) await this._put(STORES.appUsers, { ...u, status: "revoked" as const })
  }

  // ─── Web Users ───

  async getWebUsers(): Promise<OdkWebUser[]> {
    return this._getAll<OdkWebUser>(STORES.webUsers)
  }

  async getWebUser(id: string): Promise<OdkWebUser | null> {
    return this._get<OdkWebUser>(STORES.webUsers, id)
  }

  async createWebUser(email: string, displayName: string, siteRole: OdkSiteRole = "none"): Promise<OdkWebUser> {
    const wu: OdkWebUser = {
      id: uuidv4(),
      email,
      displayName,
      siteRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await this._put(STORES.webUsers, wu)
    return wu
  }

  async updateWebUser(id: string, updates: Partial<Pick<OdkWebUser, "email" | "displayName" | "siteRole">>): Promise<OdkWebUser | null> {
    const u = await this.getWebUser(id)
    if (!u) return null
    const updated = { ...u, ...updates, updatedAt: new Date().toISOString() }
    await this._put(STORES.webUsers, updated)
    return updated
  }

  async deleteWebUser(id: string): Promise<void> {
    await this._delete(STORES.webUsers, id)
  }

  // ─── Export ───

  async exportSubmissions(formId: string, format: "csv" | "json"): Promise<string> {
    const subs = await this.getSubmissions(formId)
    if (format === "json") return JSON.stringify(subs, null, 2)

    if (subs.length === 0) return ""
    const allKeys = new Set<string>()
    subs.forEach((s) => Object.keys(s.data).forEach((k) => allKeys.add(k)))
    const keys = ["id", "submitter", "reviewState", "createdAt", ...Array.from(allKeys)]
    const header = keys.join(",")
    const rows = subs.map((s) =>
      keys
        .map((k) => {
          if (k in s.data) return `"${String(s.data[k]).replace(/"/g, '""')}"`
          const v = (s as any)[k]
          return v !== undefined ? `"${String(v).replace(/"/g, '""')}"` : ""
        })
        .join(",")
    )
    return [header, ...rows].join("\n")
  }

  // ─── Seed Data (no fake submissions — only real data shows in dashboard) ───

  async seed(): Promise<void> {
    // No-op: we no longer seed fake data.
    // Projects are created by users via the UI.
    // Submissions come from real form fills.
  }
}

export const odkStore = new OdkStore()

// Auto-init and seed
if (typeof window !== "undefined") {
  odkStore.init().then(() => odkStore.seed())
}
