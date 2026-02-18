import { ApiPagination } from './introspection';

export interface ComputedTarget {
  model: string;
  required: number;
  justification: string;
}

export function deriveTargets(pagination: ApiPagination[]): ComputedTarget[] {
  const targets: ComputedTarget[] = [];
  const minPages = 5;

  const coreModels = ['Salon', 'Artist', 'Post'];

  for (const p of pagination) {
    if (coreModels.includes(p.model)) {
        let multiplier = 1;
        if (['Salon', 'Artist'].includes(p.model)) multiplier = 4;
        if (p.model === 'Post') multiplier = 2;

        targets.push({
          model: p.model,
          required: p.pageSize * minPages * multiplier,
          justification: `pageSize(${p.pageSize}) * minPages(${minPages}) * complexity(${multiplier})`
        });
    }
  }

  // Infrastructure targets
  targets.push({ model: 'Province', required: 5, justification: 'Basic geo coverage' });
  targets.push({ model: 'City', required: 10, justification: 'Basic geo coverage' });
  targets.push({ model: 'User', required: 500, justification: 'Authors, Owners, and unique Reviewers' });

  const salons = targets.find(t => t.model === 'Salon')?.required || 0;
  const artists = targets.find(t => t.model === 'Artist')?.required || 0;
  const posts = targets.find(t => t.model === 'Post')?.required || 0;

  targets.push({ model: 'Review', required: (salons + artists) * 8, justification: '(Salons+Artists) * 8 avg reviews' });
  targets.push({ model: 'Comment', required: posts * 10, justification: 'Posts * 10 avg comments' });
  targets.push({ model: 'Media', required: (salons + artists) * 5 + posts + 500, justification: 'Avatars, Covers, and galleries' });

  return targets;
}
