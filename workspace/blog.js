// blog.js — Blog Engine with Tag Filtering
// Renders short-form posts from workspace/data/posts.json.
// Clicking a card opens the full post content in the workspace editor.

async function initBlog() {
    try {
        const res = await fetch('workspace/data/posts.json');
        const posts = await res.json();
        renderFilterBar(posts);
        renderBlogCards(posts);
        console.log('[Blog] Initialized with', posts.length, 'posts');
    } catch (e) {
        console.error('[Blog] Init error:', e);
    }
}

function getAllTags(posts) {
    const tags = new Set();
    posts.forEach(p => p.tags.forEach(t => tags.add(t)));
    return [...tags].sort();
}

function renderFilterBar(posts) {
    const bar = document.getElementById('blog-filter-bar');
    if (!bar) return;
    const tags = getAllTags(posts);

    bar.innerHTML = `
        <button class="bento-tag active" data-tag="all" aria-pressed="true">All</button>
        ${tags.map(t => `<button class="bento-tag" data-tag="${t}" aria-pressed="false">${t}</button>`).join('')}
    `;

    bar.addEventListener('click', (e) => {
        const btn = e.target.closest('.bento-tag');
        if (!btn) return;

        const tag = btn.dataset.tag;
        bar.querySelectorAll('.bento-tag').forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');

        filterBlogCards(tag, posts);
    });
}

function renderBlogCards(posts) {
    const container = document.getElementById('bento-blog');
    if (!container) return;

    container.innerHTML = posts.map(post => `
        <article class="bento-card blog-card fade-in-up" data-tags="${post.tags.join(',')}" data-post-id="${post.id}" role="article" tabindex="0" aria-label="${post.title}" style="cursor:pointer;">
            <div class="blog-card-date">${post.date}</div>
            <div class="bento-card-title" style="font-size:clamp(16px, calc(20 * 1vw / 14.4), 22px);">${post.title}</div>
            <div class="bento-card-body">${post.excerpt}</div>
            <div class="blog-card-tags">
                ${post.tags.map(t => `<span class="bento-tag">${t}</span>`).join('')}
            </div>
            <div style="font-family:var(--font-mono); font-size:10px; color:var(--accent); margin-top:8px;">▶ READ POST</div>
        </article>
    `).join('');

    // Click handler: open the full post content in the workspace editor.
    container.querySelectorAll('.blog-card').forEach(card => {
        const openPost = () => {
            const id = card.dataset.postId;
            const post = posts.find(p => p.id === id);
            if (!post) return;
            // Use the workspace editor's openFileInEditor if available.
            if (window.openFileInEditor) {
                window.openFileInEditor({
                    name: `${post.id}.md`,
                    type: 'file',
                    lang: 'markdown',
                    content: `# ${post.title}\n\n*${post.date} · Tags: ${post.tags.join(', ')}*\n\n${post.content}`,
                    parent: 'blog'
                });
            }
        };
        card.addEventListener('click', openPost);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPost(); }
        });
    });
}

function filterBlogCards(tag, posts) {
    const container = document.getElementById('bento-blog');
    if (!container) return;
    const cards = container.querySelectorAll('.blog-card');

    cards.forEach((card, i) => {
        const cardTags = card.dataset.tags;
        const shouldShow = tag === 'all' || cardTags.includes(tag);

        if (window.gsap) {
            gsap.to(card, {
                opacity: shouldShow ? 1 : 0,
                scale: shouldShow ? 1 : 0.95,
                y: shouldShow ? 0 : 10,
                duration: 0.3,
                delay: shouldShow ? i * 0.05 : 0,
                ease: 'power2.out',
                onComplete: () => {
                    card.style.display = shouldShow ? '' : 'none';
                }
            });
        } else {
            card.style.display = shouldShow ? '' : 'none';
        }
    });
}

document.addEventListener('DOMContentLoaded', initBlog);
