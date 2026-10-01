import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  getPost: vi.fn(),
}));

vi.mock('../api/posts', () => ({
  getPost: api.getPost,
}));

vi.mock('../components/PostCard', () => ({
  default: ({ post }: { post: { content: string } }) => <article>{post.content}</article>,
}));

import PostPage from './PostPage';

describe('PostPage privacy', () => {
  beforeEach(() => {
    api.getPost.mockReset();
  });

  it('drops a previously visible post when the next one is unavailable', async () => {
    api.getPost.mockImplementation((id: string) =>
      id === 'gone' ? Promise.reject(new Error('missing')) : Promise.resolve({ id, content: 'texto visible' }),
    );
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/posts/visible']}>
        <Link to="/posts/gone">abrir otro</Link>
        <Routes>
          <Route path="/posts/:postId" element={<PostPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('texto visible')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'abrir otro' }));
    expect(await screen.findByText('No se pudo cargar este post')).toBeInTheDocument();
    expect(screen.queryByText('texto visible')).not.toBeInTheDocument();
  });
});
