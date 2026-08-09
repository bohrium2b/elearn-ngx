import { useState, useMemo, useCallback } from 'react';
import type { Question, TagNode } from '@/lib/types';

export interface UseTagExplorerOptions {
  treeData: TagNode[];
  untaggedQuestions: Question[];
  onCreateTag?: (name: string, color: string, parentId: number | null) => void;
}

export interface UseTagExplorerReturn {
  selectedTagUuid: string | null;
  setSelectedTagUuid: (uuid: string | null) => void;
  selectedTag: TagNode | null;
  selectedQuestion: Question | null;
  setSelectedQuestionId: (id: number | null) => void;
  expandedTagUuids: Set<string>;
  toggleTagExpanded: (uuid: string) => void;
  showCreateTagModal: boolean;
  setShowCreateTagModal: (show: boolean) => void;
  createTagName: string;
  setCreateTagName: (name: string) => void;
  createTagColor: string;
  setCreateTagColor: (color: string) => void;
  createTagParentId: number | null;
  setCreateTagParentId: (id: number | null) => void;
  handleCreateTag: () => void;
  allTags: TagNode[];
}

export function useTagExplorer({
  treeData,
  untaggedQuestions,
  onCreateTag,
}: UseTagExplorerOptions): UseTagExplorerReturn {
  const [selectedTagUuid, setSelectedTagUuid] = useState<string | null>(treeData[0]?.uuid ?? null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [expandedTagUuids, setExpandedTagUuids] = useState<Set<string>>(new Set());
  const [showCreateTagModal, setShowCreateTagModal] = useState(false);
  const [createTagName, setCreateTagName] = useState('');
  const [createTagColor, setCreateTagColor] = useState('');
  const [createTagParentId, setCreateTagParentId] = useState<number | null>(null);

  const selectedTag = useMemo(() => {
    if (!selectedTagUuid) return null;
    if (selectedTagUuid === '__untagged__') {
      return {
        id: 0,
        uuid: '__untagged__',
        name: 'Untagged Questions',
        slug: 'untagged',
        color: '#999999',
        permalink: '#',
        questions: untaggedQuestions,
        children: [],
      } as TagNode;
    }
    const findTag = (tags: TagNode[], uuid: string): TagNode | null => {
      for (const tag of tags) {
        if (tag.uuid === uuid) return tag;
        const found = findTag(tag.children, uuid);
        if (found) return found;
      }
      return null;
    };
    return findTag(treeData, selectedTagUuid);
  }, [treeData, selectedTagUuid, untaggedQuestions]);

  const selectedQuestion = useMemo(() => {
    if (!selectedQuestionId || !selectedTag) return null;
    return selectedTag.questions.find((q) => q.id === selectedQuestionId) ?? null;
  }, [selectedTag, selectedQuestionId]);

  const toggleTagExpanded = useCallback((uuid: string) => {
    setExpandedTagUuids((current) => {
      const next = new Set(current);
      if (next.has(uuid)) {
        next.delete(uuid);
      } else {
        next.add(uuid);
      }
      return next;
    });
  }, []);

  const handleCreateTag = useCallback(() => {
    const name = createTagName.trim();
    if (!name) return;
    onCreateTag?.(name, createTagColor, createTagParentId);
    setShowCreateTagModal(false);
    setCreateTagName('');
    setCreateTagColor('');
    setCreateTagParentId(null);
  }, [createTagName, createTagColor, createTagParentId, onCreateTag]);

  const allTags = useMemo(() => {
    const flatten = (tags: TagNode[]): TagNode[] => {
      return tags.flatMap((tag) => [tag, ...flatten(tag.children)]);
    };
    return flatten(treeData);
  }, [treeData]);

  return {
    selectedTagUuid,
    setSelectedTagUuid,
    selectedTag,
    selectedQuestion,
    setSelectedQuestionId,
    expandedTagUuids,
    toggleTagExpanded,
    showCreateTagModal,
    setShowCreateTagModal,
    createTagName,
    setCreateTagName,
    createTagColor,
    setCreateTagColor,
    createTagParentId,
    setCreateTagParentId,
    handleCreateTag,
    allTags,
  };
}
