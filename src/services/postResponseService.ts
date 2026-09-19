import { addSupport, removeSupport } from '../api/posts';
import type { SupportSummary } from '../api/types';
import { getMockPostResponse, setMockPostResponse } from '../mocks/postResponses';

const REAL_SUPPORT_OPTION = 'with-you';

export function getSelectedResponse(postId: string, supportedByCurrentUser: boolean): string | null {
  const mock = getMockPostResponse(postId);
  if (mock) return mock;
  return supportedByCurrentUser ? REAL_SUPPORT_OPTION : null;
}

export async function selectPostResponse(
  postId: string,
  optionId: string | null,
  currentlySupported: boolean,
): Promise<{ support?: SupportSummary; selected: string | null }> {
  if (optionId === null) {
    const support = currentlySupported ? await removeSupport(postId) : undefined;
    setMockPostResponse(postId, null);
    return { support, selected: null };
  }

  if (optionId === REAL_SUPPORT_OPTION) {
    const support = currentlySupported ? await removeSupport(postId) : await addSupport(postId);
    setMockPostResponse(postId, support.supportedByCurrentUser ? REAL_SUPPORT_OPTION : null);
    return { support, selected: support.supportedByCurrentUser ? REAL_SUPPORT_OPTION : null };
  }

  if (currentlySupported && optionId !== REAL_SUPPORT_OPTION) {
    const support = await removeSupport(postId);
    setMockPostResponse(postId, optionId);
    return { support, selected: optionId };
  }

  setMockPostResponse(postId, optionId);
  return { selected: optionId };
}
