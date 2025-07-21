// Global Sidebar Navigation Component
class GlobalSidebar {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.sidebarHTML = this.createSidebarHTML();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path === '/' || path === '/index.html' || path === '/toys/' || path === '/toys/index.html') return 'homepage';
        if (path.includes('scheduleconverter')) return 'schedule-converter';
        if (path.includes('wordtocsv')) return 'word-to-csv';
        if (path.includes('tags')) return 'tags';
        if (path.includes('timeline')) return 'timeline';
        return 'homepage';
    }

    createSidebarHTML() {
        const navItems = [
            { id: 'homepage', name: 'Homepage', icon: 'home', url: '/toys/' },
            { id: 'schedule-converter', name: 'Schedule Converter', icon: 'layout-dashboard', url: '/toys/scheduleconverter/' },
            { id: 'word-to-csv', name: 'Word to CSV', icon: 'file-text', url: '/toys/wordtocsv/' },
            { id: 'tags', name: 'Tags Page', icon: 'tag', url: '/toys/tags/' },
            { id: 'timeline', name: 'Timeline Creator', icon: 'calendar', url: '/toys/timeline/' }
        ];

        const sidebarItems = navItems.map(item => {
            const isActive = this.currentPage === item.id;
            const activeClass = isActive ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50';
            
            return `
                <a href="${item.url}" class="p-2 rounded-lg transition-colors cursor-pointer ${activeClass}" title="${item.name}">
                    <i data-lucide="${item.icon}" class="w-5 h-5"></i>
                </a>
            `;
        }).join('');

        return `
            <aside class="bg-white w-16 flex flex-col items-center py-4 space-y-2 border-r border-slate-200 flex-shrink-0 shadow-lg fixed left-0 top-0 h-full z-50">
                ${sidebarItems}
            </aside>
        `;
    }

    injectSidebar() {
        // Check if sidebar already exists
        if (document.querySelector('.global-sidebar')) {
            return;
        }

        // Create sidebar element
        const sidebarElement = document.createElement('div');
        sidebarElement.className = 'global-sidebar';
        sidebarElement.innerHTML = this.sidebarHTML;

        // Add the sidebar directly to the body
        document.body.appendChild(sidebarElement);

        // Add left margin to the body to account for the fixed sidebar
        document.body.style.marginLeft = '4rem'; // 64px = 4rem (w-16)

        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const sidebar = new GlobalSidebar();
    sidebar.injectSidebar();
}); 