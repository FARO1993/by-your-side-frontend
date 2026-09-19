import { discoverUsers } from '../api/users';
import type { DiscoverUser, Page } from '../api/types';
import { getDiscoverTopics, searchDiscoverTopics, type DiscoverTopic } from '../mocks/discover';

export async function getDiscoverPeople(page = 0, size = 20): Promise<Page<DiscoverUser>> {
  return discoverUsers(page, size);
}

export function getTopics(query?: string): DiscoverTopic[] {
  return query ? searchDiscoverTopics(query) : getDiscoverTopics();
}

export function filterPeople(people: DiscoverUser[], query: string): DiscoverUser[] {
  const q = query.trim().toLowerCase();
  if (!q) return people;
  return people.filter((person) => {
    const name = (person.displayName || person.username).toLowerCase();
    const bio = (person.bio || '').toLowerCase();
    return name.includes(q) || bio.includes(q) || person.username.toLowerCase().includes(q);
  });
}
