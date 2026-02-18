import { ApiPagination } from './introspection';

export type SeedMode = 'UI_SMALL' | 'UI_MEDIUM' | 'UI_LARGE';

export interface ComputedTarget {
  model: string;
  required: number;
  justification: string;
}

export function deriveTargets(pagination: ApiPagination[], mode: SeedMode = 'UI_SMALL'): ComputedTarget[] {
  const targets: ComputedTarget[] = [];
  const minPages = 5;

  const modeMultiplier = {
    'UI_SMALL': 1,
    'UI_MEDIUM': 2.5,
    'UI_LARGE': 5
  }[mode];

  const coreModels = ['Salon', 'Artist', 'Post'];

  for (const p of pagination) {
    if (coreModels.includes(p.model)) {
        let complexityFactor = 1;
        if (['Salon', 'Artist'].includes(p.model)) complexityFactor = 4; // To cover top filter combinations
        if (p.model === 'Post') complexityFactor = 2;

        const baseRequired = p.pageSize * minPages * complexityFactor;
        const scaledRequired = Math.ceil(baseRequired * modeMultiplier);

        targets.push({
          model: p.model,
          required: scaledRequired,
          justification: `pageSize(${p.pageSize}) * minPages(${minPages}) * complexity(${complexityFactor}) * mode(${modeMultiplier}x)`
        });
    }
  }

  // Infrastructure targets
  targets.push({ model: 'Province', required: 5, justification: 'Basic geo coverage' });
  targets.push({ model: 'City', required: 10, justification: 'Basic geo coverage' });

  const userBase = 500;
  targets.push({
    model: 'User',
    required: Math.ceil(userBase * modeMultiplier),
    justification: `Base(500) * mode(${modeMultiplier}x)`
  });

  const salons = targets.find(t => t.model === 'Salon')?.required || 0;
  const artists = targets.find(t => t.model === 'Artist')?.required || 0;
  const posts = targets.find(t => t.model === 'Post')?.required || 0;

  targets.push({
    model: 'Review',
    required: Math.ceil((salons + artists) * 8),
    justification: '(Salons+Artists) * 8 avg reviews'
  });

  targets.push({
    model: 'Comment',
    required: Math.ceil(posts * 10),
    justification: 'Posts * 10 avg comments'
  });

  targets.push({
    model: 'Media',
    required: Math.ceil((salons + artists) * 5 + posts + 500),
    justification: 'Avatars, Covers, and galleries'
  });

  return targets;
}
