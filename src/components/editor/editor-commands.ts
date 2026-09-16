/**
 * Small, version-specific command layer for the Plate v53 editor.
 * Keeping these transforms in one place prevents fixed and floating toolbars
 * from drifting onto incompatible Plate APIs.
 */

export type ListType = 'ol' | 'ul';

const LIST_TYPES: ListType[] = ['ol', 'ul'];

export function toggleMark(editor: any, key: string): void {
  editor?.tf?.toggleMark?.(key);
}

export function addMark(editor: any, key: string, value: any): void {
  editor?.tf?.addMarks?.({ [key]: value });
}

export function removeMark(editor: any, key: string): void {
  editor?.tf?.removeMarks?.(key);
}

export function getMarks(editor: any): Record<string, unknown> {
  return editor?.api?.marks?.() ?? {};
}

export function isMarkActive(editor: any, key: string): boolean {
  return Boolean(getMarks(editor)[key]);
}

export function getMarkValue(editor: any, key: string): any {
  return getMarks(editor)[key];
}

export function getActiveBlockEntry(editor: any): [any, number[]] | null {
  return editor?.api?.block?.() ?? null;
}

export function getActiveBlock(editor: any): any {
  return getActiveBlockEntry(editor)?.[0] ?? null;
}

export function getActiveBlockType(editor: any): string {
  return getActiveBlock(editor)?.type || 'p';
}

export function setBlockProperty(editor: any, prop: string, value: unknown): void {
  editor?.tf?.setNodes?.(
    { [prop]: value },
    { match: (node: any) => editor.api?.isBlock?.(node) ?? true }
  );
}

export function isListActive(editor: any, type?: ListType): boolean {
  return Boolean(
    editor?.api?.above?.({
      match: (node: any) => type ? node.type === type : LIST_TYPES.includes(node.type),
    })
  );
}

export function unwrapList(editor: any): void {
  editor?.tf?.unwrapNodes?.({
    match: (node: any) => LIST_TYPES.includes(node.type),
    split: true,
  });
}

export function setBlockType(editor: any, type: string): void {
  if (!editor?.tf?.setNodes) return;

  if (LIST_TYPES.includes(type as ListType)) {
    toggleList(editor, type as ListType);
    return;
  }

  if (isListActive(editor)) unwrapList(editor);
  editor.tf.setNodes(
    { type },
    { match: (node: any) => editor.api?.isBlock?.(node) ?? true }
  );
}

export function toggleList(editor: any, type: ListType, listStyleType?: string): void {
  if (!editor?.tf?.setNodes || !editor?.tf?.wrapNodes) return;

  const sameListIsActive = isListActive(editor, type);
  if (isListActive(editor)) unwrapList(editor);

  editor.tf.setNodes(
    { type: sameListIsActive ? 'p' : 'li' },
    { match: (node: any) => editor.api?.isBlock?.(node) ?? true }
  );

  if (!sameListIsActive) {
    editor.tf.wrapNodes({
      type,
      listStyleType: listStyleType || (type === 'ol' ? 'decimal' : 'disc'),
      children: [],
    });
  }
}
