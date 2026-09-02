/**
 * api.ts – API service functions for the Taxonomy system
 *
 * Provides typed API calls for taxonomy nodes, content assignments,
 * learning pathways, and admin operations.
 */

import {
  TaxonomyNode,
  Course,
  ContentAssignment,
  UserProgress,
  Tag,
  Exercise,
  AllResources,
  Question,
} from "./types";
import { apiRequest } from "@/lib/apiClient";

const API_BASE = "/taxonomy";
const ADMIN_API_BASE = "/admin/taxonomy_nodes";
const LEARNING_PATHWAYS_BASE = "/learning_pathways";

export const taxonomyApi = {
  // Get all root nodes (courses)
  getCourses: () => apiRequest<TaxonomyNode[]>(API_BASE),

  // Get full tree structure
  getTree: () => apiRequest<Course[]>(`${API_BASE}/tree`),

  // Get single node
  getNode: (id: string) => apiRequest<TaxonomyNode>(`${API_BASE}/${id}`),

  // Get descendants
  getDescendants: (id: string) =>
    apiRequest<TaxonomyNode[]>(`${API_BASE}/${id}/descendants`),

  // Get ancestors
  getAncestors: (id: string) =>
    apiRequest<TaxonomyNode[]>(`${API_BASE}/${id}/ancestors`),

  // Get questions for a node
  getQuestions: (id: string) =>
    apiRequest<Question[]>(`${API_BASE}/${id}/questions`),

  // Create node
  createNode: (data: Partial<TaxonomyNode>) =>
    apiRequest<TaxonomyNode>(API_BASE, {
      method: "POST",
      body: JSON.stringify({ taxonomy_node: data }),
    }),

  // Update node
  updateNode: (id: string, data: Partial<TaxonomyNode>) =>
    apiRequest<TaxonomyNode>(`${API_BASE}/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ taxonomy_node: data }),
    }),

  // Delete node
  deleteNode: (id: string) =>
    apiRequest(`${API_BASE}/${id}`, { method: "DELETE" }),

  // Get nodes by level
  getByLevel: (level: string) =>
    apiRequest<TaxonomyNode[]>(`${API_BASE}/by_level?level=${level}`),

  // Get all resources for a topic (tags, questions, exercises)
  getAllResources: (nodeId: string) =>
    apiRequest<AllResources>(`${API_BASE}/${nodeId}/all_resources`),
};

export const contentAssignmentApi = {
  // Create assignment
  create: (data: {
    taxonomy_node_id: number;
    question_id: number;
    position?: number;
  }) =>
    apiRequest<ContentAssignment>("/content_assignments", {
      method: "POST",
      body: JSON.stringify({ content_assignment: data }),
    }),

  // Update assignment
  update: (id: number, data: Partial<ContentAssignment>) =>
    apiRequest<ContentAssignment>(`/content_assignments/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ content_assignment: data }),
    }),

  // Delete assignment
  delete: (id: number) =>
    apiRequest(`/content_assignments/${id}`, { method: "DELETE" }),
};

export const learningPathwaysApi = {
  // Get all courses
  getCourses: () => apiRequest<Course[]>(LEARNING_PATHWAYS_BASE),

  // Get course detail
  getCourse: (id: string) =>
    apiRequest<Course>(`${LEARNING_PATHWAYS_BASE}/${id}`),

  // Get user progress
  getProgress: (id: string) =>
    apiRequest<UserProgress>(`${LEARNING_PATHWAYS_BASE}/${id}/progress`),

  // Start topic
  startTopic: (courseId: string, topicId: string) =>
    apiRequest(`${LEARNING_PATHWAYS_BASE}/${courseId}/start_topic`, {
      method: "POST",
      body: JSON.stringify({ topic_id: topicId }),
    }),

  // Complete topic
  completeTopic: (courseId: string, topicId: string) =>
    apiRequest(`${LEARNING_PATHWAYS_BASE}/${courseId}/complete_topic`, {
      method: "POST",
      body: JSON.stringify({ topic_id: topicId }),
    }),
};

export const adminTaxonomyApi = {
  // Get full tree
  getFullTree: () => apiRequest<Course[]>(`${ADMIN_API_BASE}/full_tree`),

  // Create node
  createNode: (data: Partial<TaxonomyNode>) =>
    apiRequest<TaxonomyNode>(ADMIN_API_BASE, {
      method: "POST",
      body: JSON.stringify({ taxonomy_node: data }),
    }),

  // Update node
  updateNode: (id: string, data: Partial<TaxonomyNode>) =>
    apiRequest<TaxonomyNode>(`${ADMIN_API_BASE}/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ taxonomy_node: data }),
    }),

  // Delete node
  deleteNode: (id: string) =>
    apiRequest(`${ADMIN_API_BASE}/${id}`, { method: "DELETE" }),

  // Reorder node
  reorderNode: (id: string, position: number) =>
    apiRequest<TaxonomyNode>(`${ADMIN_API_BASE}/${id}/reorder`, {
      method: "PATCH",
      body: JSON.stringify({ position }),
    }),

  // Move node
  moveNode: (id: string, newParentId: number) =>
    apiRequest<TaxonomyNode>(`${ADMIN_API_BASE}/${id}/move`, {
      method: "PATCH",
      body: JSON.stringify({ move: { new_parent_id: newParentId } }),
    }),
};

// Topic Tags API - for managing tag associations with topics
export const topicTagApi = {
  // Get tags for a topic
  getByTopic: (topicId: number) =>
    apiRequest<Tag[]>(`/topic_tags?taxonomy_node_id=${topicId}`),

  // Attach tag to topic
  create: (topicId: number, tagId: number) =>
    apiRequest("/topic_tags", {
      method: "POST",
      body: JSON.stringify({
        topic_tag: { taxonomy_node_id: topicId, tag_id: tagId },
      }),
    }),

  // Detach tag from topic
  delete: (topicId: number, tagId: number) =>
    apiRequest(`/topic_tags/${tagId}`, { method: "DELETE" }),
};

// Topic Exercises API - for managing exercise associations with topics
export const topicExerciseApi = {
  // Get exercises for a topic
  getByTopic: (topicId: number) =>
    apiRequest<Exercise[]>(`/topic_exercises?taxonomy_node_id=${topicId}`),

  // Attach exercise to topic
  create: (topicId: number, exerciseId: number) =>
    apiRequest("/topic_exercises", {
      method: "POST",
      body: JSON.stringify({
        topic_exercise: { taxonomy_node_id: topicId, exercise_id: exerciseId },
      }),
    }),

  // Detach exercise from topic
  delete: (topicId: number, exerciseId: number) =>
    apiRequest(`/topic_exercises/${exerciseId}`, { method: "DELETE" }),
};
