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

  // ─── Seed Data ───

  async seed(): Promise<void> {
    const projects = await this.getProjects()
    if (projects.length > 0) return // Already seeded

    const { getForms, saveForms } = await import("./form-store")

    // Create 2 sample projects
    const p1: OdkProject = {
      id: "proj-odk-001",
      name: "Community Health Assessment 2025",
      description: "Annual health survey across 12 districts focusing on water, sanitation, and nutrition indicators.",
      archived: false,
      createdAt: "2025-01-15T08:00:00Z",
      updatedAt: "2025-03-01T10:00:00Z",
    }
    const p2: OdkProject = {
      id: "proj-odk-002",
      name: "School Nutrition Pilot",
      description: "Pilot study measuring nutritional status of children aged 5-12 in selected schools.",
      archived: false,
      createdAt: "2025-02-01T09:00:00Z",
      updatedAt: "2025-02-20T14:30:00Z",
    }
    await this._put(STORES.projects, p1)
    await this._put(STORES.projects, p2)

    // Patch existing sample forms with projectId
    const forms = getForms()
    const patched = forms.map((f, i) => ({
      ...f,
      projectId: i === 0 ? p1.id : p1.id,
      odkStatus: "open" as const,
    }))
    saveForms(patched)

    // Create demo submissions for FORM-001
    const submitters = ["Alice Mugo", "Brian Wanjiku", "Cynthia Odhiambo", "David Kimani", "Esther Nyambura"]
    const reviewStates: OdkReviewState[] = ["received", "approved", "hasIssues", "approved", "received"]

    for (let i = 0; i < 5; i++) {
      const sub: OdkSubmission = {
        id: uuidv4(),
        formId: "FORM-001",
        projectId: p1.id,
        data: {
          "field-001": `Household ${i + 1}`,
          "field-002": Math.floor(Math.random() * 6) + 1,
          "field-002b": Math.floor(Math.random() * 4),
          "field-003": ["North", "South", "East", "West"][i % 4],
          "field-004": ["Tap water", "Well water", "Borehole"][i % 3],
          "field-005x": ["Grid electricity", "Solar power", "No electricity"][i % 3],
        },
        submitter: submitters[i],
        reviewState: reviewStates[i],
        createdAt: new Date(Date.now() - (5 - i) * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - (5 - i) * 86400000).toISOString(),
      }
      await this._put(STORES.submissions, sub)
    }

    // Create demo submissions for FORM-002
    for (let i = 0; i < 3; i++) {
      const sub: OdkSubmission = {
        id: uuidv4(),
        formId: "FORM-002",
        projectId: p1.id,
        data: {
          "field-s01": `UR-${String(i + 1).padStart(4, "0")}`,
          "field-s02": new Date(Date.now() - i * 86400000).toISOString().split("T")[0],
          "field-s03": "09:30",
          "field-s04": (Math.random() * 50 + 10).toFixed(1),
          "field-s05": ["Excellent", "Good", "Acceptable"][i % 3],
        },
        submitter: submitters[i],
        reviewState: "received",
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - i * 86400000).toISOString(),
      }
      await this._put(STORES.submissions, sub)
    }

    // Web users
    const admin: OdkWebUser = {
      id: uuidv4(),
      email: "admin@slash.org",
      displayName: "Admin User",
      siteRole: "admin",
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    }
    await this._put(STORES.webUsers, admin)

    // App users for p1
    await this.createAppUser(p1.id, "Field Tablet 1")
    await this.createAppUser(p1.id, "Field Tablet 2")

    console.log("✅ ODK seed data created")
  }
}

export const odkStore = new OdkStore()

// Auto-init and seed
if (typeof window !== "undefined") {
  odkStore.init().then(() => odkStore.seed())
}
