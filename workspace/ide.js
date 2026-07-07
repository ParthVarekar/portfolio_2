// ide.js — File Explorer + Tab System + Editor Pane
// Shared AppState for IDE ↔ Terminal sync
import { getArchitectureSVG, bindArchitectureInteraction } from './components/SystemMap.js';

export const AppState = {
    cwd: '~',
    openTabs: [],
    activeTab: null,
    fileTree: null,
    projectData: [],
    listeners: [],

    on(event, fn) { this.listeners.push({ event, fn }); },
    emit(event, data) {
        this.listeners.filter(l => l.event === event).forEach(l => l.fn(data));
    }
};

// Make globally accessible for terminal bridge
window.AppState = AppState;

// ── File Tree Data Structure ──
function buildFileTree(projects, problemLog, posts) {
    return {
        name: '~',
        type: 'dir',
        open: true,
        children: [
            {
                name: 'projects',
                type: 'dir',
                open: false,
                children: [
                    {
                        name: 'visualizations',
                        type: 'dir',
                        open: false,
                        children: [{ name: 'skills.svg', type: 'file', lang: 'svg', content: '<!-- Open to view interactive Skill Constellation -->', parent: 'visualizations' }]
                    },
                    ...projects.map(p => ({
                        name: p.id,
                        type: 'dir',
                        open: false,
                        meta: p,
                        children: (p.files || []).map(f => ({
                            name: f.name,
                            type: 'file',
                            lang: f.lang,
                            content: f.content,
                            parent: p.id
                        }))
                    }))
                ]
            },
            {
                name: 'problem-log',
                type: 'dir',
                open: false,
                children: (problemLog || []).map(pl => ({
                    name: `${pl.id}.md`,
                    type: 'file',
                    lang: 'markdown',
                    content: `# ${pl.title}\n\n**Severity:** ${pl.severity}  \n**Project:** ${pl.project}\n\n## Problem\n${pl.problem}\n\n## Approach\n${pl.approach}\n\n## Result\n${pl.result}`,
                    parent: 'problem-log'
                }))
            },
            {
                name: 'blog',
                type: 'dir',
                open: false,
                children: (posts || []).map(post => ({
                    name: `${post.id}.md`,
                    type: 'file',
                    lang: 'markdown',
                    content: `# ${post.title}\n\n*${post.date} · Tags: ${post.tags.join(', ')}*\n\n${post.content}`,
                    parent: 'blog'
                }))
            },
            {
                name: 'evolution.log',
                type: 'file',
                lang: 'bash',
                content: `# CAREER EVOLUTION LOG
# Parth Varekar — B.Tech CE Student & AI Systems Builder

[v1] 2024 — FOUNDATIONS  ← B.Tech begins
  ├── Admitted to K.C. College of Engineering (Mumbai University) via MHT-CET
  ├── Data Structures, Web Dev, Database Systems coursework
  └── Python, Java, JavaScript fundamentals

[v2] 2025 — FIRST SHIPPED SOFTWARE
  ├── Color Vision Assistant — first Chrome MV3 extension (team project)
  ├── Full-Stack Java certification (EduSkills Academy, A+ grade)
  └── Started building AI tools with local LLMs

[v3] 2026 — LOCAL-FIRST AI SYSTEMS  ← CURRENT
  ├── Data Science internship @ Imarticus Learning (A+ grade, 120h)
  ├── WhisperFlow: offline STT + LLM pipeline (whisper.cpp + llama.cpp)
  ├── Agent Safety Net: Chrome MV3 runtime safety for browser AI agents
  ├── StudyOS: local-first GATE prep PWA (Next.js 16 + Prisma)
  ├── 2'nd_Brain: local RAG knowledge base (ChromaDB + SSE)
  ├── Nexus-AI: educational coding game (Pyodide/WASM)
  └── Shorts Intelligence OS: multi-agent YouTube Shorts analyzer

# Status: B.Tech CE student (2024-2028). Open to internships.
# EOF`
            },
            {
                name: 'README.md',
                type: 'file',
                lang: 'markdown',
                content: `# Parth Varekar — Portfolio

B.Tech Computer Engineering student (Mumbai University, 2024-2028) building local-first AI systems.
Mumbai, India.

## Quick Start

Type \`help\` in the terminal below to explore.

## Projects
- **WhisperFlow** — offline STT + LLM pipeline (whisper.cpp + llama.cpp)
- **StudyOS** — local-first GATE prep PWA (Next.js 16 + Prisma)
- **Nexus-AI** — educational coding game (Pyodide/WASM)
- **2'nd_Brain** — local RAG knowledge base (ChromaDB + SSE)
- **Agent Safety Net** — Chrome MV3 runtime safety for browser AI agents
- **Shorts Intelligence OS** — multi-agent YouTube Shorts analyzer

## Contact
- Email: parthvarekar27@gmail.com
- GitHub: github.com/ParthVarekar
- LinkedIn: linkedin.com/in/parth-varekar-a90b412b1`
            },
            {
                name: '.env',
                type: 'file',
                lang: 'bash',
                content: `PORTFOLIO_MODE=workspace\nACCENT_COLOR=#43BF6D\nDEBUG=false\nLOCATION="Mumbai, India"\nPHONE="+91 74000 82627"\nEMAIL="parthvarekar27@gmail.com"\nLINKEDIN="linkedin.com/in/parth-varekar-a90b412b1"\nGITHUB="github.com/ParthVarekar"\nLEETCODE="leetcode.com/u/Parth_Sucks_At_Coding"`
            }
        ]
    };
}

// ── Icons ──
function getIcon(node) {
    if (node.type === 'dir') return node.open ? '📂' : '📁';
    const ext = node.name.split('.').pop();
    const map = {
        py: '🐍', js: '⚡', jsx: '⚛️', tsx: '⚛️', ts: '🔷',
        sql: '🗄️', json: '📋', md: '📝', env: '🔒', css: '🎨',
        html: '🌐', log: '📊', txt: '📄'
    };
    return map[ext] || '📄';
}

// ── Render File Tree (Recursive) ──
function renderTree(node, container, depth = 0) {
    if (node.name === '~' && node.children) {
        node.children.forEach(child => renderTree(child, container, depth));
        return;
    }

    const item = document.createElement('div');
    item.className = 'tree-item';
    item.style.setProperty('--depth', depth);
    item.setAttribute('role', node.type === 'dir' ? 'treeitem' : 'treeitem');
    item.setAttribute('aria-expanded', node.type === 'dir' ? node.open : undefined);
    item.setAttribute('tabindex', '0');
    item.dataset.path = getNodePath(node, depth);
    item.dataset.name = node.name;
    item.dataset.type = node.type;

    item.innerHTML = `<span class="tree-icon">${getIcon(node)}</span><span class="tree-label">${node.name}</span>`;

    item.addEventListener('click', () => handleTreeClick(node, item));
    item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleTreeClick(node, item);
        }
    });

    container.appendChild(item);

    if (node.type === 'dir' && node.children) {
        const childContainer = document.createElement('div');
        childContainer.className = `tree-children ${node.open ? '' : 'collapsed'}`;
        childContainer.setAttribute('role', 'group');
        node.children.forEach(child => renderTree(child, childContainer, depth + 1));
        container.appendChild(childContainer);
    }
}

function getNodePath(node, depth) {
    // Simple path construction
    return node.parent ? `~/projects/${node.parent}/${node.name}` : node.name;
}

function handleTreeClick(node, element) {
    if (node.type === 'dir') {
        node.open = !node.open;
        const childContainer = element.nextElementSibling;
        if (childContainer && childContainer.classList.contains('tree-children')) {
            childContainer.classList.toggle('collapsed');
        }
        element.querySelector('.tree-icon').textContent = getIcon(node);
        element.setAttribute('aria-expanded', node.open);
        AppState.emit('ide:dirToggle', { node, element });
    } else {
        openFileInEditor(node);
    }
}

// ── Tab System ──
function openFileInEditor(fileNode) {
    const existing = AppState.openTabs.find(t => t.name === fileNode.name && t.parent === fileNode.parent);
    if (existing) {
        setActiveTab(existing.id);
        return;
    }

    const tabId = `tab-${Date.now()}`;
    const tab = {
        id: tabId,
        name: fileNode.name,
        parent: fileNode.parent,
        lang: fileNode.lang,
        content: fileNode.content
    };

    // Max tabs
    if (AppState.openTabs.length >= 5) {
        closeTab(AppState.openTabs[0].id);
    }

    AppState.openTabs.push(tab);
    renderTabs();
    setActiveTab(tabId);
    AppState.emit('ide:fileOpen', tab);
}

function renderTabs() {
    const tabbar = document.getElementById('tabbar');
    tabbar.innerHTML = '';

    AppState.openTabs.forEach(tab => {
        const el = document.createElement('div');
        el.className = `tab ${tab.id === AppState.activeTab ? 'active' : ''}`;
        el.setAttribute('role', 'tab');
        el.setAttribute('aria-selected', tab.id === AppState.activeTab);
        el.setAttribute('tabindex', '0');
        el.innerHTML = `
            <span>${tab.name}</span>
            <button class="tab-close" aria-label="Close ${tab.name}" title="Close">&times;</button>
        `;

        el.addEventListener('click', (e) => {
            if (!e.target.classList.contains('tab-close')) {
                setActiveTab(tab.id);
            }
        });
        el.querySelector('.tab-close').addEventListener('click', (e) => {
            e.stopPropagation();
            closeTab(tab.id);
        });
        tabbar.appendChild(el);
    });
}

function setActiveTab(tabId) {
    AppState.activeTab = tabId;
    const tab = AppState.openTabs.find(t => t.id === tabId);
    if (!tab) return;

    renderTabs();
    showEditor(tab);

    // Update status bar
    const statusFile = document.getElementById('status-file');
    if (statusFile) statusFile.textContent = tab.name;

    // Highlight in sidebar
    highlightSidebarFile(tab.name);
}

function closeTab(tabId) {
    AppState.openTabs = AppState.openTabs.filter(t => t.id !== tabId);
    if (AppState.activeTab === tabId) {
        if (AppState.openTabs.length > 0) {
            setActiveTab(AppState.openTabs[AppState.openTabs.length - 1].id);
        } else {
            AppState.activeTab = null;
            showDashboard();
        }
    }
    renderTabs();
}

// ── Editor Display ──
function showEditor(tab) {
    const dashboard = document.getElementById('dashboard');
    const editorPane = document.getElementById('editor-pane');
    const editorContent = document.getElementById('editor-content');
    const lineNumbers = document.getElementById('editor-line-numbers');

    dashboard.style.display = 'none';
    editorPane.style.display = 'block';

    // Determine language class for Prism
    const langMap = {
        python: 'language-python',
        sql: 'language-sql',
        jsx: 'language-jsx',
        typescript: 'language-typescript',
        json: 'language-json',
        markdown: 'language-markup',
        bash: 'language-bash',
        javascript: 'language-javascript'
    };
    const langClass = langMap[tab.lang] || 'language-markup';

    if (tab.name === 'skills.svg') {
        editorContent.innerHTML = getArchitectureSVG();
        setTimeout(bindArchitectureInteraction, 100);
        lineNumbers.innerHTML = '';
        return;
    }

    if (tab.name === '.env') {
        editorContent.innerHTML = `<textarea id="env-editor" style="width:100%; height:100%; min-height:400px; padding:0; background:none; border:none; color:#ccc; font-family:var(--font-mono); font-size:14px; line-height:1.5; outline:none; resize:none;" spellcheck="false">${escapeHtml(tab.content)}</textarea>`;
        const populateLines = (val) => {
            const lines = val.split('\n');
            lineNumbers.innerHTML = lines.map((_, i) => `<div>${i + 1}</div>`).join('');
        };
        populateLines(tab.content);
        
        const envEditor = document.getElementById('env-editor');
        envEditor.addEventListener('input', (e) => {
            const val = e.target.value;
            tab.content = val;
            populateLines(val);
            
            if (val.includes('DEBUG=true')) {
                document.body.classList.add('debug-mode');
            } else {
                document.body.classList.remove('debug-mode');
            }
        });
        return;
    }

    // Render markdown files as formatted HTML (using marked.js), not as raw code.
    if (tab.lang === 'markdown' && window.marked) {
        try {
            // Configure marked for GitHub-flavored markdown
            window.marked.setOptions({ breaks: true, gfm: true });
            const html = window.marked.parse(tab.content);
            editorContent.innerHTML = `<div class="markdown-body">${html}</div>`;
            // Re-highlight any code blocks inside the rendered markdown with Prism
            if (window.Prism) {
                Prism.highlightAllUnder(editorContent);
            }
            lineNumbers.innerHTML = '';
            return;
        } catch (e) {
            console.warn('[IDE] Markdown render failed, falling back to raw:', e);
            // fall through to raw display below
        }
    }

    editorContent.innerHTML = `<pre><code class="${langClass}">${escapeHtml(tab.content)}</code></pre>`;

    // Highlight with Prism
    if (window.Prism) {
        Prism.highlightAllUnder(editorContent);
    }

    // Line numbers
    const lines = tab.content.split('\n');
    lineNumbers.innerHTML = lines.map((_, i) => `<div>${i + 1}</div>`).join('');
}

function showDashboard() {
    const dashboard = document.getElementById('dashboard');
    const editorPane = document.getElementById('editor-pane');
    dashboard.style.display = 'block';
    editorPane.style.display = 'none';

    const statusFile = document.getElementById('status-file');
    if (statusFile) statusFile.textContent = 'Welcome';
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ── Sidebar Highlight ──
function highlightSidebarFile(filename) {
    document.querySelectorAll('.tree-item').forEach(el => el.classList.remove('active'));
    const match = document.querySelector(`.tree-item[data-name="${filename}"]`);
    if (match) match.classList.add('active');
}

// ── Public: Navigate to path (called from terminal) ──
export function navigateToPath(pathStr) {
    const parts = pathStr.replace('~/', '').replace('~', '').split('/').filter(Boolean);
    const tree = AppState.fileTree;
    if (!tree) return false;

    let current = tree;
    const treeItems = document.querySelectorAll('.tree-item');

    for (const part of parts) {
        if (!current.children) return false;
        const child = current.children.find(c => c.name === part);
        if (!child) return false;

        // Open directories along the path
        if (child.type === 'dir' && !child.open) {
            child.open = true;
            // Find and expand the DOM element
            treeItems.forEach(el => {
                if (el.dataset.name === part) {
                    const childContainer = el.nextElementSibling;
                    if (childContainer && childContainer.classList.contains('tree-children')) {
                        childContainer.classList.remove('collapsed');
                    }
                    el.querySelector('.tree-icon').textContent = getIcon(child);
                    el.classList.add('highlighted');
                    setTimeout(() => el.classList.remove('highlighted'), 1500);
                }
            });
        }

        // Highlight the final node
        if (part === parts[parts.length - 1]) {
            treeItems.forEach(el => {
                if (el.dataset.name === part) {
                    el.classList.add('highlighted');
                    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    setTimeout(() => el.classList.remove('highlighted'), 1500);
                }
            });

            if (child.type === 'file') {
                openFileInEditor(child);
            }
        }

        current = child;
    }

    return true;
}
window.navigateToPath = navigateToPath;

// ── Public: Open file by project + name ──
export function openProjectFile(projectId, filename) {
    const tree = AppState.fileTree;
    const projectsDir = tree.children.find(c => c.name === 'projects');
    if (!projectsDir) return;
    const project = projectsDir.children.find(c => c.name === projectId);
    if (!project) return;
    const file = project.children.find(c => c.name === filename);
    if (file) openFileInEditor(file);
}
window.openProjectFile = openProjectFile;

// ── Public: list directory contents ──
export function listDirectory(pathStr) {
    const parts = pathStr.replace('~/', '').replace('~', '').split('/').filter(Boolean);
    let current = AppState.fileTree;
    for (const part of parts) {
        if (!current.children) return null;
        const child = current.children.find(c => c.name === part);
        if (!child) return null;
        current = child;
    }
    if (current.children) {
        return current.children.map(c => ({
            name: c.name,
            type: c.type,
            meta: c.meta || null
        }));
    }
    return null;
}
window.listDirectory = listDirectory;

// ── Populate Project Cards on Dashboard ──
function renderProjectCards(projects) {
    const container = document.getElementById('bento-projects');
    if (!container) return;

    container.innerHTML = projects.map(p => {
        // Build a compact metrics string from the real keys in projects.json.
        // Each project has different metrics (tests, prisma_models, avg_latency, etc.)
        // so we join whatever exists into a single honest line.
        const metricParts = [];
        if (p.metrics) {
            for (const [k, v] of Object.entries(p.metrics)) {
                metricParts.push(`${k.replace(/_/g, ' ')}: ${v}`);
            }
        }
        const metricsLine = metricParts.length ? metricParts.join(' · ') : '';
        return `
        <div class="bento-card blog-card" onclick="window.navigateToPath('projects/${p.id}/README.md')" role="button" tabindex="0" aria-label="Open ${p.name}">
            <div class="bento-card-label">${p.category} // ${p.depth}</div>
            <div class="bento-card-title">${p.name}</div>
            <div class="bento-card-body">${p.description}</div>
            ${metricsLine ? `<div style="display:flex; gap:12px; margin-top:10px; font-family:var(--font-mono); font-size:10px; color:#888; flex-wrap:wrap;">${metricParts.map(m => `<span>${m}</span>`).join('')}</div>` : ''}
            <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:8px;">
                ${p.tech.map(t => `<span class="bento-tag">${t}</span>`).join('')}
            </div>
            ${p.url ? `<a href="${p.url}" target="_blank" style="display:inline-block; margin-top:12px; font-family:var(--font-mono); font-size:11px; color:var(--accent); text-decoration:none;">VIEW SOURCE ↗</a>` : ''}
            
            <div class="dev-note">
                <strong>[DEV_LOG]</strong> ${p.dev_note || ''}
            </div>
        </div>`;
    }).join('');
}

// ── GSAP Animations ──
function animateDashboard() {
    if (!window.gsap) return;
    gsap.fromTo('.bento-card',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out', delay: 0.2 }
    );
}

// ── Inject Philosophy Card ──
function renderPhilosophy(data) {
    const target = document.getElementById('bento-philosophy');
    if (!target || !data) return;
    target.innerHTML = `
        <div class="bento-card-label">SYSTEM.PHILOSOPHY</div>
        <div class="bento-card-title" style="font-size:clamp(14px, calc(18 * 1vw / 14.4), 20px);">Why I Build</div>
        <div class="bento-card-body" style="margin-bottom:12px;">${data.why_i_build}</div>
        <div style="border-top:1px solid rgba(255,255,255,0.06); padding-top:10px;">
            <div style="font-family:var(--font-mono); font-size:10px; color:var(--accent); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Engineering Principles</div>
            <ul style="list-style:none; padding:0; margin:0;">
                ${data.principles.map(p => `<li style="font-size:12px; color:#aaa; margin-bottom:6px; padding-left:14px; position:relative;"><span style="position:absolute; left:0; color:var(--accent);">▸</span>${p}</li>`).join('')}
            </ul>
        </div>
        <div class="dev-note">
            <strong>[NOTE]</strong> Loaded from /data/philosophy.json
        </div>
    `;
}

// ── Open case study in editor ──
function openCaseStudy(projectId) {
    const project = AppState.projectData.find(p => p.id === projectId);
    if (!project || !project.case_study) return false;
    const cs = project.case_study;
    const content = `# Case Study: ${project.name}\n\n## Problem\n${cs.problem}\n\n## Approach\n${cs.approach}\n\n## Architecture\n${cs.architecture}\n\n## Result\n${cs.result}`;
    openFileInEditor({
        name: `${projectId}-case-study.md`,
        type: 'file',
        lang: 'markdown',
        content: content,
        parent: projectId
    });
    // Also open the infrastructure diagram if it exists
    const infraFile = (project.files || []).find(f => f.name === 'infrastructure.txt');
    if (infraFile) {
        setTimeout(() => {
            openFileInEditor({
                name: infraFile.name,
                type: 'file',
                lang: infraFile.lang,
                content: infraFile.content,
                parent: projectId
            });
        }, 200);
    }
    return true;
}
window.openCaseStudy = openCaseStudy;
window.openFileInEditor = openFileInEditor;

// ── Init ──
async function initIDE() {
    try {
        const [projRes, philRes, plRes, postsRes] = await Promise.all([
            fetch('workspace/data/projects.json'),
            fetch('workspace/data/philosophy.json').catch(() => null),
            fetch('workspace/data/problem-log.json').catch(() => null),
            fetch('workspace/data/posts.json').catch(() => null)
        ]);
        const projects = await projRes.json();
        const philosophy = philRes ? await philRes.json() : null;
        const problemLog = plRes ? await plRes.json() : null;
        const posts = postsRes ? await postsRes.json() : null;

        AppState.projectData = projects;
        AppState.philosophy = philosophy;
        AppState.problemLog = problemLog;
        AppState.posts = posts;
        AppState.fileTree = buildFileTree(projects, problemLog, posts);

        const treeContainer = document.getElementById('file-tree');
        renderTree(AppState.fileTree, treeContainer);
        renderProjectCards(projects);
        renderPhilosophy(philosophy);
        animateDashboard();

        console.log('[IDE] File explorer initialized with', projects.length, 'projects,', (posts || []).length, 'blog posts');
    } catch (e) {
        console.error('[IDE] Init error:', e);
    }
}

document.addEventListener('DOMContentLoaded', initIDE);
