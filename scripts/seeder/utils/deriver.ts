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
  const filterHitDepth = 2; // min pages per filter option

  // Scale parameters
  const config = {
    'UI_SMALL':  { cityCount: 8,  userBase: 150, reviewMultiplier: 2.5, postMultiplier: 1 },
    'UI_MEDIUM': { cityCount: 12, userBase: 500, reviewMultiplier: 8,   postMultiplier: 2.5 },
    'UI_LARGE':  { cityCount: 20, userBase: 1200, reviewMultiplier: 12,  postMultiplier: 5 }
  }[mode];

  const coreModels = ['Salon', 'Artist', 'Post'];

  for (const p of pagination) {
    if (coreModels.includes(p.model)) {
        let required = p.pageSize * minPages;
        let justification = `pageSize(${p.pageSize}) * minPages(${minPages})`;

        if (['Salon', 'Artist'].includes(p.model)) {
            const filterTarget = p.pageSize * filterHitDepth * config.cityCount;
            if (filterTarget > required) {
                required = filterTarget;
                justification = `pageSize(${p.pageSize}) * hitDepth(${filterHitDepth}) * cities(${config.cityCount})`;
            }
        }

        if (p.model === 'Post') {
            required = Math.ceil(required * config.postMultiplier);
            justification += ` * postMultiplier(${config.postMultiplier})`;
        }

        targets.push({ model: p.model, required, justification });
    }
  }

  // Infrastructure targets
  targets.push({ model: 'Province', required: 5, justification: 'Static geo coverage' });
  targets.push({ model: 'City', required: config.cityCount, justification: `Target cities for ${mode}` });
  targets.push({ model: 'User', required: config.userBase, justification: `Target users for ${mode}` });

  const salons = targets.find(t => t.model === 'Salon')?.required || 0;
  const artists = targets.find(t => t.model === 'Artist')?.required || 0;
  const posts = targets.find(t => t.model === 'Post')?.required || 0;

  targets.push({
    model: 'Review',
    required: Math.ceil((salons + artists) * config.reviewMultiplier),
    justification: `(Salons+Artists) * ${config.reviewMultiplier} avg reviews (Skewed)`
  });

  targets.push({
    model: 'Comment',
    required: Math.ceil(posts * (mode === 'UI_SMALL' ? 5 : 10)),
    justification: `Posts * ${mode === 'UI_SMALL' ? 5 : 10} avg comments`
  });

  targets.push({
    model: 'Media',
    required: Math.ceil((salons + artists) * 3 + posts + 200),
    justification: 'Avatar + Cover + partial Gallery + Post Covers'
  });

  return targets;
}
