import { Actor, log } from 'apify';
import { gotScraping } from 'got-scraping';
import { CookieJar } from 'tough-cookie';

import {
    buildGraphqlBody,
    discoverProfileDocIds,
    extractEmbeddedJsonValues,
    extractProfileBootstrap,
    FALLBACK_DOC_IDS,
    fetchText,
    graphqlErrors,
    initialProfileVariables,
    parseJsonPayload,
    QUERY_NAMES,
    readProfileTargets,
    refetchProfileVariables,
    resolveProfileRoute,
    unique,
    USER_AGENT,
} from './facebook.js';
import { cleanImageUrls } from './htmlMedia.js';
import {
    expandPostPhotos,
    mapWithConcurrency,
    mediaSetTokensForPost,
    normalizeProfilePost,
} from './mediaExpansion.js';
import {
    extractEndCursor,
    extractHasNextPage,
    extractPosts,
    makePostKeys,
    mergePosts,
    parseSinceDate,
    splitAtBoundary,
} from './postParser.js';
import { buildProxySessionId } from './proxySession.js';

const VERSION = '0.1.0-beta.0';
const POSTS_PER_REFETCH = 3;
const GRAPHQL_URL = 'https://www.facebook.com/api/graphql/';

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function integerSetting(input, key, fallback, min, max) {
    const parsed = Number(input?.[key]);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(max, Math.trunc(parsed)));
}

function booleanSetting(input, key, fallback) {
    return typeof input?.[key] === 'boolean' ? input[key] : fallback;
}

function errorSummary(error) {
    return {
        name: error?.name || 'Error',
        message: error?.message || String(error),
        code: error?.code || null,
        retryable: Boolean(error?.retryable),
    };
}

class FacebookRequestError extends Error {
    constructor(message, options = {}) {
        super(message);
        this.name = 'FacebookRequestError';
        this.code = options.code || null;
        this.retryable = options.retryable !== false;
        this.details = options.details || null;
    }
}

function isRateLimit(errors, text, statusCode) {
    if (statusCode === 429) return true;
    if ((errors || []).some((error) => Number(error.code) === 1675004)) return true;
    return /rate limit|too many requests|temporarily blocked/i.test(String(text || ''));
}

function queryCandidateIds(queryName, discovered = {}) {
    return unique([
        discovered[queryName],
        ...(FALLBACK_DOC_IDS[queryName] || []),
    ]);
}

function clientHeaders() {
    return {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'no-cache',
        pragma: 'no-cache',
        'upgrade-insecure-requests': '1',
        'user-agent': USER_AGENT,
    };
}

async function createSession(proxyConfiguration, reason, attempt) {
    const sessionId = buildProxySessionId(reason, attempt);
    const proxyUrl = proxyConfiguration ? await proxyConfiguration.newUrl(sessionId) : undefined;
    const cookieJar = new CookieJar();
    const client = gotScraping.extend({
        proxyUrl,
        cookieJar,
        headers: clientHeaders(),
        retry: { limit: 0 },
    });
    return {
        sessionId,
        proxyUrl: proxyUrl ? proxyUrl.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@') : null,
        cookieJar,
        client,
        bootstrap: null,
        html: '',
        docIds: {},
        discoveryAttempted: false,
    };
}

async function bootstrapProfile(target, proxyConfiguration, options, reason = 'initial') {
    const attempts = [];
    let lastError = null;
    for (let attempt = 1; attempt <= options.bootstrapRetries; attempt += 1) {
        const session = await createSession(proxyConfiguration, `${reason}-${target.input}`, attempt);
        try {
            const response = await fetchText(session.client, target.url, {
                headers: clientHeaders(),
                timeout: 35000,
            });
            session.html = response.body;
            const bootstrap = extractProfileBootstrap(response.body, response.url, target);
            let route = null;
            if (!bootstrap.unavailable && response.statusCode < 500 && response.statusCode !== 429) {
                try {
                    route = await resolveProfileRoute(session.client, target.url, bootstrap);
                } catch (error) {
                    route = { error: error.message };
                }
            }
            session.bootstrap = {
                ...bootstrap,
                profileId: route?.profileId || bootstrap.profileId,
                profileName: route?.profileName || bootstrap.profileName,
                profileType: route?.profileType || bootstrap.profileType || 'profile',
            };
            attempts.push({
                attempt,
                sessionId: session.sessionId,
                statusCode: response.statusCode,
                finalUrl: response.url,
                htmlLength: response.body.length,
                profileId: session.bootstrap.profileId,
                hasLoginWall: session.bootstrap.hasLoginWall,
                unavailable: session.bootstrap.unavailable,
                route,
            });

            if (session.bootstrap.unavailable) {
                throw new FacebookRequestError('Facebook reports that this profile is unavailable.', {
                    code: 'profile_unavailable',
                    retryable: false,
                });
            }
            if (response.statusCode === 404) {
                throw new FacebookRequestError('Facebook profile was not found.', {
                    code: 'profile_not_found',
                    retryable: false,
                });
            }
            if (response.statusCode === 429 || response.statusCode >= 500) {
                throw new FacebookRequestError(`Profile bootstrap returned HTTP ${response.statusCode}.`, {
                    code: response.statusCode === 429 ? 'rate_limited' : 'bootstrap_http_error',
                });
            }
            if (!session.bootstrap.profileId) {
                throw new FacebookRequestError(
                    session.bootstrap.hasLoginWall
                        ? 'Facebook returned a login wall instead of a public profile.'
                        : 'Could not resolve the public profile to a numeric Facebook ID.',
                    { code: session.bootstrap.hasLoginWall ? 'login_wall' : 'profile_id_missing' },
                );
            }
            return { session, attempts };
        } catch (error) {
            lastError = error;
            const previous = attempts.at(-1);
            if (!previous || previous.attempt !== attempt) {
                attempts.push({ attempt, sessionId: session.sessionId, error: errorSummary(error) });
            } else {
                previous.error = errorSummary(error);
            }
            if (error?.retryable === false) break;
            if (attempt < options.bootstrapRetries) await sleep(500 * attempt);
        }
    }
    const wrapped = lastError instanceof FacebookRequestError
        ? lastError
        : new FacebookRequestError(lastError?.message || 'Profile bootstrap failed.', { code: 'bootstrap_failed' });
    wrapped.details = { ...(wrapped.details || {}), attempts };
    throw wrapped;
}

async function discoverDocIds(session, debug) {
    if (session.discoveryAttempted) return session.docIds;
    session.discoveryAttempted = true;
    const discovery = await discoverProfileDocIds(session.client, session.html, {
        fetchBundles: true,
        debug,
    });
    session.docIds = { ...session.docIds, ...discovery.found };
    session.discovery = discovery;
    return session.docIds;
}

function variablesForQuery(kind, profileId, cursor, count, omitPinnedPosts) {
    return kind === 'initial'
        ? initialProfileVariables(profileId, Math.min(1, count), omitPinnedPosts)
        : refetchProfileVariables(profileId, cursor || null, Math.min(POSTS_PER_REFETCH, count), omitPinnedPosts);
}

async function executeGraphqlPage(session, parameters) {
    const queryName = QUERY_NAMES[parameters.kind];
    const variables = variablesForQuery(
        parameters.kind,
        parameters.profileId,
        parameters.cursor,
        parameters.count,
        parameters.omitPinnedPosts,
    );
    const attempts = [];

    async function tryIds(ids, source) {
        for (const docId of ids) {
            const body = buildGraphqlBody(session.bootstrap, queryName, docId, variables);
            try {
                const response = await fetchText(session.client, GRAPHQL_URL, {
                    method: 'POST',
                    body,
                    headers: {
                        accept: '*/*',
                        'content-type': 'application/x-www-form-urlencoded',
                        origin: 'https://www.facebook.com',
                        referer: session.bootstrap.finalUrl || parameters.profileUrl,
                        'sec-fetch-dest': 'empty',
                        'sec-fetch-mode': 'cors',
                        'x-fb-friendly-name': queryName,
                        'x-fb-lsd': session.bootstrap.lsd || '_',
                    },
                    timeout: 40000,
                });
                const parsed = parseJsonPayload(response.body);
                const errors = graphqlErrors(parsed.values);
                const posts = extractPosts(parsed.values, Math.max(parameters.count * 4, 30), {
                    includeRawPayload: parameters.includeRawPayload,
                });
                const endCursor = extractEndCursor(parsed.values, response.body);
                const hasNextPage = extractHasNextPage(parsed.values);
                const attempt = {
                    queryName,
                    docId,
                    source,
                    statusCode: response.statusCode,
                    responseLength: response.body.length,
                    posts: posts.length,
                    endCursor: Boolean(endCursor),
                    hasNextPage,
                    errors,
                    parseErrors: parsed.errors,
                    responsePreview: parameters.debug ? response.body.slice(0, 1500) : undefined,
                };
                attempts.push(attempt);

                if (isRateLimit(errors, response.body, response.statusCode)) {
                    throw new FacebookRequestError('Facebook rate-limited the timeline query.', {
                        code: 'rate_limited',
                        details: attempt,
                    });
                }
                if (response.statusCode >= 500) {
                    throw new FacebookRequestError(`Timeline query returned HTTP ${response.statusCode}.`, {
                        code: 'graphql_http_error',
                        details: attempt,
                    });
                }
                if (posts.length || endCursor || hasNextPage === false) {
                    session.docIds[queryName] = docId;
                    return { posts, endCursor, hasNextPage, errors, attempts, responseLength: response.body.length };
                }
            } catch (error) {
                if (error instanceof FacebookRequestError && error.code === 'rate_limited') throw error;
                attempts.push({ queryName, docId, source, error: errorSummary(error) });
            }
        }
        return null;
    }

    const initialResult = await tryIds(queryCandidateIds(queryName, session.docIds), 'known_or_fallback');
    if (initialResult) return initialResult;

    await discoverDocIds(session, parameters.debug);
    const discoveredResult = await tryIds(queryCandidateIds(queryName, session.docIds), 'bundle_discovery');
    if (discoveredResult) return discoveredResult;

    throw new FacebookRequestError(`No working document ID produced a usable ${queryName} response.`, {
        code: 'graphql_query_failed',
        details: { attempts, discovery: parameters.debug ? session.discovery : undefined },
    });
}

function profileDescriptor(target, bootstrap) {
    return {
        id: bootstrap.profileId,
        url: bootstrap.finalUrl || target.url,
        inputUrl: target.input,
        name: bootstrap.profileName || null,
        type: bootstrap.profileType || 'profile',
    };
}

function coverageStatusForStop(stopReason, postsCount) {
    if (stopReason === 'target_reached') return 'complete_target_reached';
    if (stopReason === 'known_post_id' || stopReason === 'known_post_url_fragment') return 'complete_until_known_post';
    if (stopReason === 'older_than_since_date') return 'complete_until_since_date';
    if (stopReason === 'feed_exhausted') return 'complete_feed_exhausted';
    if (stopReason === 'no_public_posts' && postsCount === 0) return 'no_public_posts';
    if (stopReason === 'no_cursor') return 'partial_no_cursor';
    if (stopReason === 'stalled_cursor') return 'partial_stalled_cursor';
    if (stopReason === 'page_limit') return 'partial_page_limit';
    return 'partial_error';
}

async function collectProfileFeed(target, proxyConfiguration, options) {
    let bootstrapped = await bootstrapProfile(target, proxyConfiguration, options, 'profile-bootstrap');
    let session = bootstrapped.session;
    const profile = profileDescriptor(target, session.bootstrap);
    const posts = [];
    const seen = new Set();
    const cursorsSeen = new Set();
    const queryAttempts = [];
    const warnings = [];
    let cursor = options.startCursor || null;
    let kind = cursor ? 'refetch' : 'initial';
    let stopReason = null;
    let boundaryHit = null;
    let terminalPageError = null;
    let pages = 0;
    let emptyPages = 0;
    const maxPages = Math.max(12, Math.ceil(options.maxPostsPerProfile / POSTS_PER_REFETCH) + 20);

    if (!cursor) {
        const htmlCandidates = [{ source: 'public_profile_html', html: session.html }];
        let prefetched = null;
        for (let candidateIndex = 0; candidateIndex < 2; candidateIndex += 1) {
            if (candidateIndex === 1) {
                try {
                    const canonicalUrl = `https://www.facebook.com/profile.php?id=${profile.id}`;
                    const response = await fetchText(session.client, canonicalUrl, {
                        headers: clientHeaders(),
                        timeout: 35000,
                    });
                    htmlCandidates.push({ source: 'numeric_profile_html', html: response.body, statusCode: response.statusCode });
                    if (response.statusCode === 200 && response.body.length > session.html.length) session.html = response.body;
                } catch (error) {
                    queryAttempts.push({
                        page: 0,
                        kind: 'html_prefetch',
                        source: 'numeric_profile_html',
                        error: errorSummary(error),
                    });
                    break;
                }
            }
            const candidate = htmlCandidates[candidateIndex];
            const embedded = extractEmbeddedJsonValues(candidate.html);
            const candidatePosts = extractPosts(embedded.values, Math.max(options.maxPostsPerProfile, 30), {
                includeRawPayload: options.includeRawPayload,
            });
            const candidateCursor = extractEndCursor(embedded.values);
            const candidateHasNextPage = extractHasNextPage(embedded.values);
            queryAttempts.push({
                page: 0,
                kind: 'html_prefetch',
                source: candidate.source,
                statusCode: candidate.statusCode || 200,
                posts: candidatePosts.length,
                endCursor: Boolean(candidateCursor),
                hasNextPage: candidateHasNextPage,
                embeddedJsonBlocks: embedded.values.length,
                parseErrors: options.debug ? embedded.errors : undefined,
            });
            if (candidatePosts.length) {
                prefetched = {
                    posts: candidatePosts,
                    cursor: candidateCursor,
                    hasNextPage: candidateHasNextPage,
                };
                break;
            }
        }
        if (prefetched?.posts.length) {
            const boundarySplit = splitAtBoundary(prefetched.posts, options.boundary);
            mergePosts(posts, boundarySplit.posts, seen, options.maxPostsPerProfile);
            if (boundarySplit.stopped) {
                boundaryHit = boundarySplit.hit;
                stopReason = boundarySplit.hit.type;
            } else if (posts.length >= options.maxPostsPerProfile) {
                stopReason = 'target_reached';
            } else if (prefetched.cursor) {
                cursor = prefetched.cursor;
                cursorsSeen.add(prefetched.cursor);
                kind = 'refetch';
            } else if (prefetched.hasNextPage === false) {
                stopReason = 'feed_exhausted';
            }
        }
    }

    while (!stopReason && posts.length < options.maxPostsPerProfile && pages < maxPages) {
        pages += 1;
        let page = null;
        let lastError = null;
        for (let pageAttempt = 1; pageAttempt <= options.graphqlPageRetries + 1; pageAttempt += 1) {
            try {
                page = await executeGraphqlPage(session, {
                    kind,
                    profileId: profile.id,
                    profileUrl: profile.url,
                    cursor,
                    count: options.maxPostsPerProfile - posts.length,
                    omitPinnedPosts: options.omitPinnedPosts,
                    includeRawPayload: options.includeRawPayload,
                    debug: options.debug,
                });
                queryAttempts.push({ page: pages, pageAttempt, kind, cursor: cursor || null, sessionId: session.sessionId, attempts: page.attempts });
                break;
            } catch (error) {
                lastError = error;
                queryAttempts.push({
                    page: pages,
                    pageAttempt,
                    kind,
                    cursor: cursor || null,
                    sessionId: session.sessionId,
                    error: errorSummary(error),
                    details: options.debug ? error?.details : undefined,
                });
                if (pageAttempt > options.graphqlPageRetries || error?.retryable === false) break;
                bootstrapped = await bootstrapProfile(target, proxyConfiguration, options, `page-${pages}-retry`);
                session = bootstrapped.session;
                warnings.push(`Page ${pages} required a fresh Facebook proxy session.`);
                await sleep(400 * pageAttempt);
            }
        }
        if (!page) {
            if (posts.length) {
                terminalPageError = errorSummary(lastError);
                stopReason = 'page_error';
                warnings.push(`Stopped after ${posts.length} posts because the next timeline page exhausted its retries.`);
                break;
            }
            throw new FacebookRequestError(lastError?.message || `Timeline page ${pages} failed.`, {
                code: lastError?.code || 'page_failed',
                details: { profile, pages, postsCollected: posts.length, queryAttempts },
            });
        }

        const boundarySplit = splitAtBoundary(page.posts, options.boundary);
        mergePosts(posts, boundarySplit.posts, seen, options.maxPostsPerProfile);
        if (boundarySplit.stopped) {
            boundaryHit = boundarySplit.hit;
            stopReason = boundarySplit.hit.type;
            break;
        }

        if (!page.posts.length) emptyPages += 1;
        else emptyPages = 0;
        if (posts.length >= options.maxPostsPerProfile) {
            stopReason = 'target_reached';
            break;
        }
        if (page.hasNextPage === false) {
            stopReason = posts.length ? 'feed_exhausted' : 'no_public_posts';
            break;
        }
        if (!page.endCursor) {
            stopReason = posts.length ? 'no_cursor' : 'no_public_posts';
            break;
        }
        if (cursorsSeen.has(page.endCursor) || page.endCursor === cursor) {
            stopReason = 'stalled_cursor';
            break;
        }
        cursorsSeen.add(page.endCursor);
        cursor = page.endCursor;
        kind = 'refetch';
        if (emptyPages >= 3) {
            stopReason = 'no_cursor';
            warnings.push('Three consecutive timeline pages contained no new posts.');
            break;
        }
    }

    if (!stopReason) stopReason = posts.length >= options.maxPostsPerProfile ? 'target_reached' : 'page_limit';
    const coverageStatus = coverageStatusForStop(stopReason, posts.length);
    return {
        profile,
        posts,
        session,
        coverageStatus,
        stopReason,
        boundaryHit,
        nextCursor: cursor,
        pages,
        warnings,
        diagnostics: {
            bootstrapAttempts: bootstrapped.attempts,
            queryAttempts,
            discoveredDocIds: session.docIds,
            discovery: options.debug ? session.discovery : undefined,
            terminalPageError,
        },
    };
}

async function normalizeAndExpand(feed, proxyConfiguration, options) {
    return mapWithConcurrency(feed.posts, options.mediaExpansionConcurrency, async (post, index) => {
        const feedImages = cleanImageUrls(post?.media?.imageUrls || []);
        const shouldExpand = options.expandAllPhotos
            && (mediaSetTokensForPost(post).length > 0 || feedImages.length >= 5);
        let expansion = null;
        if (shouldExpand) {
            try {
                expansion = await expandPostPhotos(post, feed.profile, {
                    client: feed.session.client,
                    proxyConfiguration,
                    retries: options.mediaSetRetries,
                    retryDelayMs: 800,
                });
            } catch (error) {
                expansion = {
                    images: [],
                    rawCount: 0,
                    statusCode: null,
                    source: null,
                    url: null,
                    attempts: [{ error: error.message, code: error.code || null }],
                };
            }
        }
        return normalizeProfilePost(post, index + 1, feed.profile, expansion, {
            retries: options.mediaSetRetries,
            coverageStatus: feed.coverageStatus,
            warnings: feed.warnings,
            includeRawPayload: options.includeRawPayload,
        });
    });
}

await Actor.init();

const startedAt = new Date();
const input = await Actor.getInput() || {};
const targets = readProfileTargets(input);
if (!targets.length) throw new Error('Provide at least one public Facebook personal profile in profileUrls.');

const options = {
    maxProfilesPerRun: integerSetting(input, 'maxProfilesPerRun', 10, 1, 20),
    maxPostsPerProfile: integerSetting(input, 'maxPostsPerProfile', 20, 1, 1000),
    expandAllPhotos: booleanSetting(input, 'expandAllPhotos', true),
    omitPinnedPosts: booleanSetting(input, 'omitPinnedPosts', true),
    includeRawPayload: booleanSetting(input, 'includeRawPayload', false),
    bootstrapRetries: integerSetting(input, 'bootstrapRetries', 4, 1, 10),
    graphqlPageRetries: integerSetting(input, 'graphqlPageRetries', 4, 0, 5),
    mediaExpansionConcurrency: integerSetting(input, 'mediaExpansionConcurrency', 3, 1, 8),
    mediaSetRetries: integerSetting(input, 'mediaSetRetries', 1, 0, 5),
    proxyCountry: String(input.proxyCountry || 'US').trim().toUpperCase(),
    startCursor: typeof input.startCursor === 'string' && input.startCursor.trim() ? input.startCursor.trim() : null,
    debug: booleanSetting(input, 'debug', false),
    boundary: {
        knownPostIds: unique((input.knownPostIds || []).map(String)),
        sinceDate: parseSinceDate(input.sinceDate),
    },
};

const selectedTargets = targets.slice(0, options.maxProfilesPerRun);
const skippedTargets = targets.slice(options.maxProfilesPerRun);
const proxyConfiguration = await Actor.createProxyConfiguration({
    groups: ['RESIDENTIAL'],
    countryCode: options.proxyCountry,
});

const profileSummaries = [];
let totalRows = 0;
for (const [targetIndex, target] of selectedTargets.entries()) {
    await Actor.setStatusMessage(`Profile ${targetIndex + 1}/${selectedTargets.length}: ${target.input}`);
    try {
        const feed = await collectProfileFeed(target, proxyConfiguration, options);
        const rows = await normalizeAndExpand(feed, proxyConfiguration, options);
        for (let offset = 0; offset < rows.length; offset += 100) {
            await Actor.pushData(rows.slice(offset, offset + 100));
        }
        totalRows += rows.length;
        profileSummaries.push({
            status: feed.coverageStatus.startsWith('partial_') ? 'partial' : 'succeeded',
            input: target.input,
            profile: feed.profile,
            postsReturned: rows.length,
            pagesRead: feed.pages,
            stopReason: feed.stopReason,
            coverageStatus: feed.coverageStatus,
            boundaryHit: feed.boundaryHit,
            pointer: {
                direction: 'newest_to_older',
                nextCursor: feed.nextCursor,
                useFor: 'historical_backfill_only',
            },
            media: {
                postsWithPhotos: rows.filter((row) => row.media_final_count > 0).length,
                finalPhotoUrls: rows.reduce((sum, row) => sum + row.media_final_count, 0),
                expansionAttempted: rows.filter((row) => row.media_expansion?.attempted).length,
                highReviewRisk: rows.filter((row) => row.media_review_severity === 'high').length,
            },
            warnings: feed.warnings,
            diagnostics: options.debug ? feed.diagnostics : undefined,
        });
    } catch (error) {
        log.error(`Profile failed: ${target.input}`, { error: error.message, code: error.code });
        profileSummaries.push({
            status: 'failed',
            input: target.input,
            postsReturned: 0,
            coverageStatus: 'failed',
            error: errorSummary(error),
            diagnostics: options.debug ? error?.details : undefined,
        });
    }
}

const finishedAt = new Date();
const failedProfiles = profileSummaries.filter((item) => item.status === 'failed').length;
const partialProfiles = profileSummaries.filter((item) => item.status === 'partial').length;
const succeededProfiles = profileSummaries.filter((item) => item.status === 'succeeded').length;
const summary = {
    actor: 'facebook-profile-posts-all-photos-scraper',
    version: VERSION,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationSeconds: Number(((finishedAt - startedAt) / 1000).toFixed(3)),
    requestedProfiles: targets.length,
    processedProfiles: selectedTargets.length,
    skippedProfilesByLimit: skippedTargets.map((target) => target.input),
    succeededProfiles,
    partialProfiles,
    failedProfiles,
    datasetRows: totalRows,
    options: {
        ...options,
        boundary: {
            knownPostIdsCount: options.boundary.knownPostIds.length,
            sinceDate: options.boundary.sinceDate?.iso || null,
        },
    },
    profiles: profileSummaries,
    health: failedProfiles === selectedTargets.length
        ? 'failed'
        : (failedProfiles || partialProfiles ? 'partial' : 'healthy'),
};

await Actor.setValue('SUMMARY', summary);
await Actor.setStatusMessage(`${summary.health}: ${totalRows} posts; ${summary.succeededProfiles} complete, ${summary.partialProfiles} partial, ${summary.failedProfiles} failed`);
await Actor.exit();
