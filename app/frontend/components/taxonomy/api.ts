/**
 * api.ts – API service functions for the Taxonomy system
 *
 * Provides typed API calls for taxonomy nodes, content assignments,
 * learning pathways, and admin operations.
 */

import { TaxonomyNode, Course, ContentAssignment, UserProgress } from "./types";
import { showToast } from "./useToast";

const API_BASE = "/taxonomy";
const ADMIN_API_BASE = "/admin/taxonomy_nodes";
const LEARNING_PATHWAYS_BASE = "/learning_pathways";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-Token":
        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)
          ?.content || "",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let errorMessage = `API error: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.errors) {
        errorMessage = Array.isArray(errorData.errors)
          ? errorData.errors.join(", ")
          : errorData.errors;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // If we can't parse the error response, use the status text
      errorMessage = `API error: ${response.status} ${response.statusText}`;
    }

    // Show toast notification for the error
    showToast(errorMessage, "error");

    throw new Error(errorMessage);
  }

  return response.json();
}

export const taxonomyApi = {
  // Get all root nodes (courses)
  getCourses: () => fetchJson<TaxonomyNode[]>(API_BASE),

  // Get full tree structure
  getTree: () => fetchJson<Course[]>(`${API_BASE}/tree`),

  // Get single node
  getNode: (id: string) => fetchJson<TaxonomyNode>(`${API_BASE}/${id}`),

  // Get descendants
  getDescendants: (id: string) =>
    fetchJson<TaxonomyNode[]>(`${API_BASE}/${id}/descendants`),

  // Get ancestors
  getAncestors: (id: string) =>
    fetchJson<TaxonomyNode[]>(`${API_BASE}/${id}/ancestors`),

  // Get questions for a node
  getQuestions: (id: string) => fetchJson<any[]>(`${API_BASE}/${id}/questions`),

  // Create node
  createNode: (data: Partial<TaxonomyNode>) =>
    fetchJson<TaxonomyNode>(API_BASE, {
      method: "POST",
      body: JSON.stringify({ taxonomy_node: data }),
    }),

  // Update node
  updateNode: (id: string, data: Partial<TaxonomyNode>) =>
    fetchJson<TaxonomyNode>(`${API_BASE}/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ taxonomy_node: data }),
    }),

  // Delete node
  deleteNode: (id: string) =>
    fetch(`${API_BASE}/${id}`, {
      method: "DELETE",
      headers: {
        "X-CSRF-Token":
          (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)
            ?.content || "",
      },
    }),

  // Get nodes by level
  getByLevel: (level: string) =>
    fetchJson<TaxonomyNode[]>(`${API_BASE}/by_level?level=${level}`),
};

export const contentAssignmentApi = {
  // Create assignment
  create: (data: {
    taxonomy_node_id: number;
    question_id: number;
    position?: number;
  }) =>
    fetchJson<ContentAssignment>("/content_assignments", {
      method: "POST",
      body: JSON.stringify({ content_assignment: data }),
    }),

  // Update assignment
  update: (id: number, data: Partial<ContentAssignment>) =>
    fetchJson<ContentAssignment>(`/content_assignments/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ content_assignment: data }),
    }),

  // Delete assignment
  delete: (id: number) =>
    fetch(`/content_assignments/${id}`, {
      method: "DELETE",
      headers: {
        "X-CSRF-Token":
          (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)
            ?.content || "",
      },
    }),
};

export const learningPathwaysApi = {
  // Get all courses
  getCourses: () => fetchJson<Course[]>(LEARNING_PATHWAYS_BASE),

  // Get course detail
  getCourse: (id: string) =>
    fetchJson<Course>(`${LEARNING_PATHWAYS_BASE}/${id}`),

  // Get user progress
  getProgress: (id: string) =>
    fetchJson<UserProgress>(`${LEARNING_PATHWAYS_BASE}/${id}/progress`),

  // Start topic
  startTopic: (courseId: string, topicId: string) =>
    fetchJson(`${LEARNING_PATHWAYS_BASE}/${courseId}/start_topic`, {
      method: "POST",
      body: JSON.stringify({ topic_id: topicId }),
    }),

  // Complete topic
  completeTopic: (courseId: string, topicId: string) =>
    fetchJson(`${LEARNING_PATHWAYS_BASE}/${courseId}/complete_topic`, {
      method: "POST",
      body: JSON.stringify({ topic_id: topicId }),
    }),
};

export const adminTaxonomyApi = {
  // Get full tree
  getFullTree: () => fetchJson<Course[]>(`${ADMIN_API_BASE}/full_tree`),

  // Create node
  createNode: (data: Partial<TaxonomyNode>) =>
    fetchJson<TaxonomyNode>(ADMIN_API_BASE, {
      method: "POST",
      body: JSON.stringify({ taxonomy_node: data }),
    }),

  // Update node
  updateNode: (id: string, data: Partial<TaxonomyNode>) =>
    fetchJson<TaxonomyNode>(`${ADMIN_API_BASE}/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ taxonomy_node: data }),
    }),

  // Delete node
  deleteNode: (id: string) =>
    fetch(`${ADMIN_API_BASE}/${id}`, {
      method: "DELETE",
      headers: {
        "X-CSRF-Token":
          (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)
            ?.content || "",
      },
    }),

  // Reorder node
  reorderNode: (id: string, position: number) =>
    fetchJson<TaxonomyNode>(`${ADMIN_API_BASE}/${id}/reorder`, {
      method: "PATCH",
      body: JSON.stringify({ position }),
    }),

  // Move node
  moveNode: (id: string, newParentId: number) =>
    fetchJson<TaxonomyNode>(`${ADMIN_API_BASE}/${id}/move`, {
      method: "PATCH",
      body: JSON.stringify({ move: { new_parent_id: newParentId } }),
    }),
};
