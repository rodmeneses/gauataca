/**
 * Translation dictionary, assembled from the per-domain files in this folder.
 * Each domain declares its es + en strings together (see `defineStrings`), so a key
 * can't exist in one language only; the test suite also checks keys are unique across domains.
 */
import type { Lang } from '../types';
import { common } from './common';
import { shell } from './shell';
import { events } from './events';
import { songs } from './songs';
import { ledger } from './ledger';
import { forum } from './forum';
import { members } from './members';
import { auth } from './auth';
import { links } from './links';
import { settings } from './settings';

export const domains = { common, shell, events, songs, ledger, forum, members, auth, links, settings };

type Domains = typeof domains;
type Merged = typeof common.es & typeof shell.es & typeof events.es & typeof songs.es & typeof ledger.es &
  typeof forum.es & typeof members.es & typeof auth.es & typeof links.es & typeof settings.es;

export type Dict = { [K in keyof Merged]: string };
export type TKey = keyof Dict;

const merge = (lang: Lang) => Object.assign({}, ...Object.values<Domains[keyof Domains]>(domains).map((d) => d[lang])) as Dict;

export const T: Record<Lang, Dict> = { es: merge('es'), en: merge('en') };
