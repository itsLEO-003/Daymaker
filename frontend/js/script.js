   lucide.createIcons();

        // ====== SAFE DATA LOADING (Prevents Crashes from Old Saved Data) ======
        function safeParse(key, fallback) {
            try {
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : fallback;
            } catch (e) {
                console.error("Ignoring invalid saved data for " + key);
                return fallback;
            }
        }
        let lastStudentMessageCount = -1;
        let lastAdminMessageCount = -1;


        let globalChats = safeParse('daymaker_chats', {
        'dr-abhishek': [],
        'dr-sandip': [],
        'sc1': [],
        'sc2': []
        });

        if (!globalChats['dr-abhishek']) globalChats['dr-abhishek'] = [];
        if (!globalChats['dr-sandip']) globalChats['dr-sandip'] = [];
        if (!globalChats['sc1']) globalChats['sc1'] = [];
        if (!globalChats['sc2']) globalChats['sc2'] = [];
                let activeCounsellor = null;
                let selectedSupportCategory = null;
                let activeAdminChat = null;
                let adminUnread = {'dr-abhishek': 0,'dr-sandip': 0, 'sc1': 0, 'sc2': 0};
                let studentLoggedIn = false;

        const counsellorInfo = {
    'dr-abhishek': {
        name: 'Dr. Abhishek Hossain',
        role: 'College Counsellor',
        color: 'bg-lavender/10',
        icon: 'user',
        iconColor: 'text-lavender'
    },

    'dr-sandip': {
        name: 'Dr. Sandip Chandra',
        role: 'Academic Counsellor',
        color: 'bg-blue-100',
        icon: 'book-open',
        iconColor: 'text-blue-600'
    },

    'sc1': {
        name: 'Student Counsellor-1',
        role: 'Peer Counsellor',
        color: 'bg-orange/10',
        icon: 'smile',
        iconColor: 'text-orange'
    },

    'sc2': {
        name: 'Student Counsellor-2',
        role: 'Peer Counsellor',
        color: 'bg-yellow/10',
        icon: 'smile',
        iconColor: 'text-yellow'
    }
};

        function saveChats() { localStorage.setItem('daymaker_chats', JSON.stringify(globalChats)); }

        window.addEventListener('storage', (e) => {
            if (e.key === 'daymaker_chats') {
                globalChats = safeParse('daymaker_chats', { 'dr-abhishek': [], 'sc1': [], 'sc2': [] });
                renderStudentChat(); renderAdminChat();
                for (let id in globalChats) { const lastMsg = globalChats[id][globalChats[id].length - 1]; if (lastMsg && lastMsg.sender === 'student' && id !== activeAdminChat) adminUnread[id]++; }
                updateAdminBadges();
            }
            if (e.key === 'daymaker_articles') { articlesData = safeParse('daymaker_articles', articlesData); renderArticles(); }
        });

        // ====== LOGIN LOGIC ======
        function backToWebsite() {
            hide('login-page');
            show('student-app');
            window.scrollTo(0, 0);
        }

        function promptStudentLogin() {
            hide('student-app');
            hide('admin-app');
            show('login-page');
            hide('admin-view');
            show('student-view');
            lucide.createIcons();
        }

        function promptAdminLogin() {
            hide('student-app');
            hide('admin-app');
            show('login-page');

            hide('student-view');
            hide('admin-view');

            show('admin-counsellor-selection');

            lucide.createIcons();
        }
        let selectedAdminCounsellor = null;

        function selectAdminCounsellor(id) {
        selectedAdminCounsellor = id;

            hide('admin-counsellor-selection');
            show('admin-view');

            const info = counsellorInfo[id];

            const description = document.querySelector(
                '#admin-view p.text-sm.text-neutral-500'
            );

            if (description) {
                description.textContent =
                    `Sign in to access ${info.name}'s conversations and dashboard.`;
            }

            lucide.createIcons();
        }
        
        function handleStartChat() {
            if (studentLoggedIn) {
                document.getElementById('chat').scrollIntoView({ behavior: 'smooth' });
            } else {
                promptStudentLogin();
            }
        }

        function loginStudent(e) {
           e.preventDefault();

    const email = v('stu-email');
    const err = document.getElementById('student-error');

    if (!email) {
        err.textContent = 'Please enter your college email ID.';
        show('student-error');
        return;
    }

    hide('student-error');
    hide('login-page');
    show('student-app');

    // Store the student's email for the current session
    window.studentEmail = email;

    studentLoggedIn = true;

    updateChatUI();
    lucide.createIcons();

    setTimeout(() => {
        document.getElementById('chat').scrollIntoView({
            behavior: 'smooth'
        });
    }, 100);
    showToast('Welcome to DayMaker! You can now chat.');
        }

        function loginAdmin(e) {
        e.preventDefault();

    if (v('admin-id').length < 2 || v('admin-pass').length < 2) {
        show('admin-error');
        return;
    }

    hide('admin-error');
    hide('login-page');
    show('admin-app');

    hide('admin-counsellor-selection');

    show('admin-chat-section');
    hide('admin-post-section');

    adminUnread = {
        'dr-abhishek': 0,
        'sc1': 0,
        'sc2': 0
    };

    updateAdminBadges();
    lucide.createIcons();

    loadAdminStudents();
    showToast('Admin dashboard loaded');
    }

        function logout() {
            hide('admin-app');
            show('student-app');
            studentLoggedIn = false;
            activeCounsellor = null;
            updateChatUI();
            document.getElementById('student-form').reset();
            document.getElementById('admin-form').reset();
            window.scrollTo(0, 0);
            showToast('Logged out successfully');
        }

        function updateChatUI() {
            const prompt = document.getElementById('chat-prompt');
            const left = document.getElementById('chat-interface-left');
            const right = document.getElementById('chat-interface-right');
            if (studentLoggedIn) {
                prompt.classList.add('hidden');
                left.classList.remove('hidden');
                right.classList.remove('hidden');
            } else {
                prompt.classList.remove('hidden');
                left.classList.add('hidden');
                right.classList.add('hidden');
            }
        }

        // ====== STUDENT CHAT LOGIC ====== 
        function selectSupportCategory(category) {

    selectedSupportCategory = category;

    // Highlight the selected category
    document.querySelectorAll('.support-category').forEach(button => {
        button.classList.remove('border-lavender', 'border-orange');
        button.classList.add('border-transparent');
    });

    const selectedButton = document.getElementById(`category-${category}`);

    if (selectedButton) {
        selectedButton.classList.remove('border-transparent');

        if (category === 'mental-health') {
            selectedButton.classList.add('border-lavender');
        }

        if (category === 'academic-stress') {
            selectedButton.classList.add('border-orange');
        }
    }

    // Show the counsellor list
    const counsellorList = document.getElementById('available-counsellors');

    if (counsellorList) {
        counsellorList.classList.remove('hidden');
    }

    // Show only counsellors belonging to the selected category
    document.querySelectorAll('.counsellor-card').forEach(card => {

        const categories = card.dataset.categories
            ? card.dataset.categories.split(',')
            : [];

        if (categories.includes(category)) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });

    // Clear previous counsellor selection
    activeCounsellor = null;

    document.querySelectorAll('.counsellor-card').forEach(card => {
        card.classList.remove('border-orange');
        card.classList.add('border-transparent');
    });

    // Reset chat header
    const chatName = document.getElementById('stu-chat-name');
    const chatStatus = document.getElementById('stu-chat-status');

    if (chatName) {
        chatName.textContent = 'Select a counsellor';
    }

    if (chatStatus) {
        chatStatus.textContent = 'Choose from the list →';
    }

    // Disable message box until a counsellor is selected
    const input = document.getElementById('stu-chat-input');
    const send = document.getElementById('stu-chat-send');

    if (input) {
        input.disabled = true;
        input.placeholder = 'Select a counsellor first...';
    }

    if (send) {
        send.disabled = true;
    }

    lucide.createIcons();
}
        function selectCounsellor(id) {
            activeCounsellor = id;
            document.querySelectorAll('.counsellor-card').forEach(c => { c.classList.remove('border-orange'); c.classList.add('border-transparent'); });
            document.getElementById(`card-${id}`).classList.remove('border-transparent'); document.getElementById(`card-${id}`).classList.add('border-orange');
            
            const info = counsellorInfo[id];
            document.getElementById('stu-chat-name').textContent = info.name;
            document.getElementById('stu-chat-status').textContent = info.role + ' • Online';
            const avatar = document.getElementById('stu-chat-avatar'); 
            avatar.className = `w-10 h-10 ${info.color} rounded-full flex items-center justify-center`; 
            avatar.innerHTML = `<i data-lucide="${info.icon}" class="w-5 h-5 ${info.iconColor}"></i>`;
            lucide.createIcons();
            
            document.getElementById('stu-chat-input').disabled = false; document.getElementById('stu-chat-send').disabled = false; document.getElementById('stu-chat-input').placeholder = 'Type your message...'; document.getElementById('stu-chat-input').focus();
            renderStudentChat();
            startStudentChatAutoRefresh();
        }

async function sendStudentMessage(e) {
    e.preventDefault();

    const input = document.getElementById('stu-chat-input');
    const text = input.value.trim();

    if (!text || !activeCounsellor || !window.studentEmail) {
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                studentEmail: window.studentEmail,
                counsellorId: activeCounsellor,
                message: text,
                sender: 'student'
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to send message');
        }

        input.value = '';

        // Reload from Supabase
        await renderStudentChat();

        // Refresh admin conversation list
        if (typeof loadAdminStudents === 'function') {
            await loadAdminStudents();
        }

    } catch (error) {
        console.error('Failed to send student message:', error);
        alert('Message could not be sent. Please try again.');
    }
}

        function clearStudentChat() { if (!activeCounsellor) return; globalChats[activeCounsellor] = []; saveChats(); renderStudentChat(); renderAdminChat(); showToast('Chat cleared'); }

        async function renderStudentChat() {
    const c = document.getElementById('stu-chat-messages');

    if (!c || !activeCounsellor || !window.studentEmail) return;

    try {
        const response = await fetch(
            `http://localhost:3000/api/messages?counsellorId=${encodeURIComponent(activeCounsellor)}&studentEmail=${encodeURIComponent(window.studentEmail)}`
        );

        const messages = await response.json();
        if (messages.length === lastStudentMessageCount) {
    return;
}

lastStudentMessageCount = messages.length;

        if (!response.ok) {
            throw new Error(messages.message || 'Failed to load messages');
        }

        let html = `
            <div class="text-center mb-4">
                <div class="inline-flex items-center gap-2 bg-lavender/10 rounded-full px-4 py-2">
                    <span class="text-xs text-text-sub font-medium">
                        Messages are anonymous
                    </span>
                </div>
            </div>
        `;

        if (!messages || messages.length === 0) {
            html += `
                <div class="flex items-center justify-center h-64 text-text-sub">
                    <p class="text-sm">No messages yet. Start the conversation.</p>
                </div>
            `;
        } else {

            const info = counsellorInfo[activeCounsellor];

            messages.forEach(m => {

                if (m.sender === 'student') {

                    html += `
                        <div class="flex items-start gap-3 justify-end chat-bubble-in">

                            <div class="bg-lavender text-white
                                        rounded-2xl rounded-tr-sm
                                        px-4 py-3 max-w-[80%]">

                                <p class="text-sm leading-relaxed">
                                    ${m.message}
                                </p>

                            </div>

                        </div>
                    `;

                } else if (m.sender === 'admin') {

                    html += `
                        <div class="flex items-start gap-3 chat-bubble-in">

                            <div class="w-8 h-8 ${info.color}
                                        rounded-full flex items-center
                                        justify-center flex-shrink-0 mt-1">

                                <i data-lucide="${info.icon}"
                                   class="w-4 h-4 ${info.iconColor}">
                                </i>

                            </div>

                            <div class="bg-white soft-shadow
                                        rounded-2xl rounded-tl-sm
                                        px-4 py-3 max-w-[80%]">

                                <p class="text-sm leading-relaxed">
                                    ${m.message}
                                </p>

                            </div>

                        </div>
                    `;
                }
            });
        }

        c.innerHTML = html;
        c.scrollTop = c.scrollHeight;

        lucide.createIcons();

    } catch (error) {

        console.error("Failed to load student messages:", error);

        c.innerHTML = `
            <div class="flex flex-col items-center justify-center
                        h-full text-center">

                <p class="font-semibold text-red-500">
                    Could not load messages.
                </p>

                <p class="text-sm text-text-sub mt-1">
                    Please try again.
                </p>

            </div>
        `;
    }
}
async function loadAdminStudents() {
    const list = document.getElementById('admin-student-list');

    if (!list || !selectedAdminCounsellor) return;

    list.innerHTML = `
        <div class="p-5 text-sm text-text-sub text-center">
            Loading students...
        </div>
    `;

    try {
        const response = await fetch(
            `http://localhost:3000/api/messages?counsellorId=${encodeURIComponent(selectedAdminCounsellor)}`
        );

        const messages = await response.json();

        if (!response.ok) {
            throw new Error(messages.message || 'Failed to load students');
        }

        // Get unique students who have contacted this counsellor
        const students = [...new Set(
            messages
                .filter(m => m.sender === 'student')
                .map(m => m.student_email)
        )];

        if (students.length === 0) {
            list.innerHTML = `
                <div class="p-5 text-sm text-text-sub text-center">
                    No conversations yet.
                </div>
            `;
            return;
        }

        list.innerHTML = students.map(email => `
            <button
                id="admin-student-${CSS.escape(email)}"
                onclick="selectAdminStudent('${email.replace(/'/g, "\\'")}')"
                class="w-full p-5 text-left hover:bg-orange/5 transition-colors border-l-4 border-transparent">

                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-orange/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <i data-lucide="user" class="w-5 h-5 text-orange"></i>
                    </div>

                    <div class="min-w-0">
                        <p class="font-semibold text-sm text-text-main truncate">
                        Student ${students.indexOf(email) + 1}
                    </p>
                    <p class="text-xs text-text-sub mt-1">
                        Anonymous conversation
                    </p>
                    </div>
                </div>

            </button>
        `).join('');

        lucide.createIcons();

    } catch (error) {
        console.error('Failed to load students:', error);

        list.innerHTML = `
            <div class="p-5 text-sm text-red-500 text-center">
                Could not load students.
            </div>
        `;
    }
}
function selectAdminStudent(studentEmail) {
    activeAdminChat = studentEmail;

    // Reset unread count for this student
    if (adminUnread[selectedAdminCounsellor]) {
        adminUnread[selectedAdminCounsellor] = 0;
    }

    updateAdminBadges();

    // Highlight selected student
    document.querySelectorAll('[id^="admin-student-"]').forEach(button => {
        button.classList.remove('border-orange', 'bg-orange/5');
        button.classList.add('border-transparent');
    });

    const studentButton = document.getElementById(
        `admin-student-${CSS.escape(studentEmail)}`
    );

    if (studentButton) {
        studentButton.classList.remove('border-transparent');
        studentButton.classList.add('border-orange', 'bg-orange/5');
    }

    // Update admin chat header
    const info = counsellorInfo[selectedAdminCounsellor];

    document.getElementById('admin-chat-name').textContent =
        'Student Conversation';

    document.getElementById('admin-chat-status').textContent =
        'Anonymous • ' + info.name;

    // Enable message box
    document.getElementById('admin-chat-input').disabled = false;
    document.getElementById('admin-chat-send').disabled = false;

    // Load messages from Supabase
    renderAdminChat();
    startAdminChatAutoRefresh();

    lucide.createIcons();
}
        // ====== ADMIN CHAT LOGIC ======
        function selectAdminChat(id) {
            activeAdminChat = id; adminUnread[id] = 0; updateAdminBadges();
            document.querySelectorAll('[id^="admin-chat-"]').forEach(b => { b.classList.remove('border-orange', 'bg-orange/5'); b.classList.add('border-transparent'); });
            document.getElementById(`admin-chat-${id}`).classList.remove('border-transparent'); document.getElementById(`admin-chat-${id}`).classList.add('border-orange', 'bg-orange/5');
            
            const info = counsellorInfo[id];
            document.getElementById('admin-chat-name').textContent = info.name; document.getElementById('admin-chat-status').textContent = info.role + ' • Chatting';
            const avatar = document.getElementById('admin-chat-avatar'); 
            avatar.className = `w-10 h-10 ${info.color} rounded-full flex items-center justify-center`; 
            avatar.innerHTML = `<i data-lucide="${info.icon}" class="w-5 h-5 ${info.iconColor}"></i>`;
            lucide.createIcons();
            
            document.getElementById('admin-chat-input').disabled = false; document.getElementById('admin-chat-send').disabled = false; document.getElementById('admin-chat-input').focus();
            renderAdminChat();
        }

 async function sendAdminMessage(e) {
    e.preventDefault();

    const input = document.getElementById('admin-chat-input');
    const text = input.value.trim();

    if (!text || !activeAdminChat || !selectedAdminCounsellor) {
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                studentEmail: activeAdminChat,
                counsellorId: selectedAdminCounsellor,
                message: text,
                sender: 'admin'
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to send reply');
        }

        input.value = '';

        // Reload conversation from Supabase
        await renderAdminChat();

    } catch (error) {
        console.error('Failed to send admin message:', error);
        alert('Could not send reply. Please try again.');
    }
}

        async function renderAdminChat() {
    const c = document.getElementById('admin-chat-messages');

    if (!c) return;

    if (!activeAdminChat || !selectedAdminCounsellor) {
        c.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-text-sub text-center">
                <i data-lucide="message-circle" class="w-12 h-12 mb-4 text-lavender/20"></i>
                <p class="font-heading font-semibold text-text-main">
                    Select a student to view messages.
                </p>
            </div>
        `;

        lucide.createIcons();
        return;
    }

    

    try {
        const url =
            `http://localhost:3000/api/messages` +
            `?counsellorId=${encodeURIComponent(selectedAdminCounsellor)}` +
            `&studentEmail=${encodeURIComponent(activeAdminChat)}`;

        const response = await fetch(url);

        const messages = await response.json();
        // Don't redraw if no new messages arrived
if (messages.length === lastAdminMessageCount) {
    return;
}

lastAdminMessageCount = messages.length;

        if (!response.ok) {
            throw new Error(
                messages.message || "Failed to load messages"
            );
        }

        let html = '';

        if (!messages || messages.length === 0) {

            html = `
                <div class="flex flex-col items-center justify-center h-full text-text-sub text-center">
                    <i data-lucide="message-circle"
                       class="w-12 h-12 mb-4 text-lavender/20">
                    </i>

                    <p class="font-heading font-semibold text-text-main">
                        No messages yet.
                    </p>

                    <p class="text-sm">
                        Waiting for a student...
                    </p>
                </div>
            `;

        } else {

            messages.forEach(m => {

                if (m.sender === 'student') {

                    html += `
                        <div class="flex items-start gap-3 chat-bubble-in">

                            <div class="w-8 h-8 bg-orange/10 rounded-full
                                        flex items-center justify-center
                                        flex-shrink-0 mt-1">

                                <i data-lucide="user"
                                   class="w-4 h-4 text-orange">
                                </i>

                            </div>

                            <div class="bg-white soft-shadow
                                        rounded-2xl rounded-tl-sm
                                        px-4 py-3 max-w-[80%]">

                                <p class="text-sm leading-relaxed">
                                    ${m.message}
                                </p>

                            </div>

                        </div>
                    `;

                } else if (m.sender === 'admin') {

                    html += `
                        <div class="flex items-start gap-3
                                    justify-end chat-bubble-in">

                            <div class="bg-lavender text-white
                                        rounded-2xl rounded-tr-sm
                                        px-4 py-3 max-w-[80%]">

                                <p class="text-sm leading-relaxed">
                                    ${m.message}
                                </p>

                            </div>

                        </div>
                    `;

                }

            });
        }

        c.innerHTML = html;

        c.scrollTop = c.scrollHeight;

        lucide.createIcons();

    } catch (error) {

        console.error("Failed to load admin messages:", error);

        c.innerHTML = `
            <div class="flex flex-col items-center justify-center
                        h-full text-center">

                <i data-lucide="alert-circle"
                   class="w-10 h-10 mb-3 text-red-400">
                </i>

                <p class="font-semibold text-red-500">
                    Could not load messages.
                </p>

                <p class="text-sm text-text-sub mt-1">
                    Please try again.
                </p>

            </div>
        `;

        lucide.createIcons();
    }
}

        function updateAdminBadges() {
            for (let id in adminUnread) {
                const b = document.getElementById(`admin-badge-${id}`); if(!b) return;
                if (adminUnread[id] > 0) { b.textContent = adminUnread[id]; b.classList.remove('hidden'); b.classList.add('flex'); }
                else { b.classList.add('hidden'); b.classList.remove('flex'); }
            }
        }

        function switchAdminTab(tab) {
            if (tab === 'chat') { show('admin-chat-section'); hide('admin-post-section'); document.getElementById('tab-btn-chat').classList.add('admin-tab-active'); document.getElementById('tab-btn-post').classList.remove('admin-tab-active'); }
            else { hide('admin-chat-section'); show('admin-post-section'); document.getElementById('tab-btn-post').classList.add('admin-tab-active'); document.getElementById('tab-btn-chat').classList.remove('admin-tab-active'); }
        }

        function postNewArticle(e) {
            e.preventDefault();
            const newArticle = { id: Date.now(), category: v('art-category'), title: v('art-title'), excerpt: v('art-excerpt'), author: v('art-author'), authorRole: 'College Counsellor', readTime: Math.max(2, Math.ceil(v('art-content').split(' ').length / 200)) + ' min', date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), image: v('art-image'), content: `<p>${v('art-content').replace(/\n/g, '</p><p>')}</p>` };
            articlesData.unshift(newArticle); saveArticles(); document.getElementById('post-article-form').reset(); showToast('Article published successfully!');
        }

        // ====== Helpers ======
        function v(id) { return document.getElementById(id).value.trim(); }
        function show(id) { document.getElementById(id).classList.remove('hidden'); }
        function hide(id) { document.getElementById(id).classList.add('hidden'); }
        function showToast(msg) { const t = document.getElementById('toast'); document.getElementById('toast-message').textContent = msg; t.classList.remove('hidden'); setTimeout(() => t.classList.add('hidden'), 3000); }
        document.getElementById('mobile-menu-btn-stu').addEventListener('click', () => document.getElementById('mobile-menu-stu').classList.toggle('hidden'));
        function initRevealObserver() { 
            const o = new IntersectionObserver((e) => { e.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('active'); }); }, { threshold: 0.1 }); 
            document.querySelectorAll('.reveal').forEach(el => { o.observe(el); }); 
        }
        
        // ====== TIPS & ARTICLES DATA ======
        const tipsData = [
            { id: 1, category: 'anxiety', duration: '2min', title: 'Box Breathing', subtitle: 'Calm your nervous system in 2 minutes', icon: 'wind', color: 'bg-orange/10 text-orange', steps: ["Sit comfortably and close your eyes.","Breathe IN through your nose for 4 seconds.","HOLD your breath for 4 seconds.","Breathe OUT through your mouth for 4 seconds.","HOLD empty lungs for 4 seconds.","Repeat 4 times."], why: 'Box breathing activates your parasympathetic nervous system, acting as a brake on stress.' },
            { id: 2, category: 'anxiety', duration: '5min', title: '5-4-3-2-1 Grounding', subtitle: 'Pull yourself out of spiraling thoughts', icon: 'eye', color: 'bg-lavender/10 text-lavender', steps: ["Name 5 things you can SEE.","Touch 4 things you can FEEL.","Identify 3 things you can HEAR.","Notice 2 things you can SMELL.","Focus on 1 thing you can TASTE."], why: 'Uses your senses to anchor you in the present moment, interrupting the anxiety loop.' },
            { id: 3, category: 'panic', duration: '2min', title: 'Cold Water Reset', subtitle: 'Shock your system out of panic', icon: 'droplets', color: 'bg-yellow/10 text-yellow', steps: ["Go to the nearest bathroom.","Run cold water over your wrists for 30 seconds.","Splash cold water on your face.","Hold an ice cube if possible.","Focus entirely on the cold sensation."], why: 'Cold water triggers the "mammalian dive reflex" which slows your heart rate down.' },
            { id: 4, category: 'anxiety', duration: '5min', title: 'Muscle Relaxation', subtitle: 'Release hidden tension', icon: 'activity', color: 'bg-orange/10 text-orange', steps: ["Clench your feet muscles tight for 5 seconds.","Release suddenly. Wait 10 seconds.","Move to calves, clench, then release.","Work up: thighs, stomach, hands, arms, shoulders, face.","Take 3 deep breaths."], why: 'Tense and release muscles to teach your body the difference between tension and relaxation.' },
            { id: 5, category: 'overwhelm', duration: '10min', title: 'The Brain Dump', subtitle: 'Empty your head onto paper', icon: 'brain', color: 'bg-lavender/10 text-lavender', steps: ["Grab a pen and paper.","Set timer for 5 mins. Write EVERYTHING on your mind.","Sort into 'Can Control', 'Can't Control', 'Maybe'.","Cross out 'Can't Control'.","Pick ONE tiny thing to do right now."], why: 'Writing thoughts down externalizes them, reducing cognitive load and restoring focus.' },
            { id: 6, category: 'depression', duration: '5min', title: 'The 5-Minute Walk', subtitle: 'Movement changes mood', icon: 'footprints', color: 'bg-yellow/10 text-yellow', steps: ["Don't think about exercise. Just stand up.","Walk outside or around your room.","Walk for just 5 minutes.","Notice 3 new things around you.","Rate your mood from 1-10 after."], why: 'Walking creates a small "win" that combats depression, while boosting serotonin.' },
        ];

        function renderTips(filter = 'all') {
            const g = document.getElementById('tips-grid'); if(!g) return;
            const f = filter === 'all' ? tipsData : tipsData.filter(t => t.duration === filter);
            g.innerHTML = f.map(tip => `<div class="tip-card bg-white rounded-card p-6 border border-orange/5 hover:shadow-lg hover:scale-[1.01] hover:-translate-y-1 transition-all duration-300 cursor-pointer soft-shadow" onclick="openTipModal(${tip.id})"><div class="flex items-center justify-between mb-5"><div class="tip-icon w-14 h-14 ${tip.color.split(' ')[0]} rounded-btn flex items-center justify-center transition-transform duration-300"><i data-lucide="${tip.icon}" class="w-6 h-6 ${tip.color.split(' ')[1]}"></i></div><span class="text-xs font-heading font-bold font-mono text-text-sub">${tip.duration.toUpperCase()}</span></div><h4 class="text-lg font-heading font-semibold tracking-tight mb-2">${tip.title}</h4><p class="text-sm text-text-sub leading-relaxed mb-4">${tip.subtitle}</p><div class="flex items-center gap-2 text-xs font-heading font-semibold text-orange"><span>Start now</span><i data-lucide="arrow-right" class="w-3.5 h-3.5"></i></div></div>`).join('');
            lucide.createIcons();
        }
        function filterTips(d) { document.querySelectorAll('.tip-filter').forEach(b => { b.classList.remove('bg-orange','text-white','active-filter'); b.classList.add('bg-white','text-text-sub','border','border-orange/10'); }); event.target.classList.remove('bg-white','text-text-sub','border','border-orange/10'); event.target.classList.add('bg-orange','text-white','active-filter'); renderTips(d); }
        function openTipModal(id) { const t = tipsData.find(x=>x.id===id); document.getElementById('modal-category').textContent=t.category.toUpperCase()+' • '+t.duration.toUpperCase(); document.getElementById('modal-title').textContent=t.title; document.getElementById('modal-body').innerHTML=`<div class="max-w-2xl mx-auto"><div class="w-20 h-20 ${t.color.split(' ')[0]} rounded-btn flex items-center justify-center mb-6"><i data-lucide="${t.icon}" class="w-8 h-8 ${t.color.split(' ')[1]}"></i></div><p class="text-lg text-text-sub font-medium mb-8">${t.subtitle}</p><div class="mb-10"><h4 class="text-xs font-heading font-semibold uppercase tracking-wider text-text-sub mb-4">Step-by-Step</h4><div class="space-y-4">${t.steps.map((s,i)=>`<div class="flex gap-4"><div class="w-8 h-8 rounded-full bg-orange text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">${i+1}</div><p class="text-sm leading-relaxed pt-1.5">${s}</p></div>`).join('')}</div></div><div class="bg-lavender/5 rounded-card p-6"><h4 class="text-xs font-heading font-semibold uppercase tracking-wider text-lavender mb-3">Why This Works</h4><p class="text-sm text-text-sub leading-relaxed">${t.why}</p></div></div>`; show('tip-modal'); document.body.style.overflow='hidden'; lucide.createIcons(); }
        function closeTipModal() { hide('tip-modal'); document.body.style.overflow=''; }

        let articlesData = safeParse('daymaker_articles', [
            { id: 1, category: 'anxiety', title: 'Why Your Anxiety Spikes at 2 AM', excerpt: 'The science behind nighttime anxiety and 5 practical strategies.', author: 'Dr. Abhishek Hossain', authorRole: 'College Counsellor', readTime: '6 min', date: 'Jan 15, 2025', image: 'https://picsum.photos/seed/warm-night-lamp/800/500.jpg', content: `<p>It's 2 AM. You have an 8 AM class. And suddenly your brain decides this is the perfect time to replay every awkward thing you've ever said.</p><h3>The Science of Nighttime Anxiety</h3><p>During the day, your prefrontal cortex keeps your amygdala in check. But as you get tired, your prefrontal cortex powers down first, leaving your amygdala unguarded.</p><h3>Strategies That Help</h3><p><strong>1. The "Worry Journal":</strong> Write it down and tell yourself, "I'll handle it at 10 AM tomorrow."</p><p><strong>2. 4-7-8 Breathing:</strong> Inhale 4s, hold 7s, exhale 8s.</p><p><strong>3. Cognitive shuffling:</strong> Think of a word, then think of words starting with each letter.</p>` },
            { id: 2, category: 'depression', title: 'Sadness vs. Depression: A Guide', excerpt: 'How to recognize when "just feeling down" might be something more.', author: 'Dr. Abhishek Hossain', authorRole: 'College Counsellor', readTime: '8 min', date: 'Jan 10, 2025', image: 'https://picsum.photos/seed/warm-sun-plant/800/500.jpg', content: `<p>Sadness usually has a clear cause and fades with time. Depression can show up without any obvious trigger and sticks around for weeks.</p><h3>Signs It Might Be Depression</h3><p>• Lost interest in things you used to enjoy<br>• Sleep has significantly changed<br>• Feeling empty or numb<br>• Small tasks feel overwhelming<br>• Lasted more than two weeks</p><h3>What To Do</h3><p>Depression is not weakness. It's a medical condition, and it's treatable. Talk to someone through DayMaker.</p>` },
            { id: 3, category: 'wellness', title: 'Your Brain on 5 Hours of Sleep', excerpt: 'Why the "sleep when dead" mindset destroys mental health.', author: 'Student Counsellor-1', authorRole: 'Peer Counsellor', readTime: '5 min', date: 'Jan 8, 2025', image: 'https://picsum.photos/seed/warm-coffee-book/800/500.jpg', content: `<p>After just one night of poor sleep, your prefrontal cortex function drops by up to 60%, and anxiety levels increase by 30%.</p><h3>Practical Tips</h3><p>• Set a "wind-down alarm"<br>• Caffeine cut-off: 2 PM<br>• Your bed is for sleep only</p>` },
        ]);
        function saveArticles() { localStorage.setItem('daymaker_articles', JSON.stringify(articlesData)); }

        function renderArticles(filter = 'all') {
            const g = document.getElementById('articles-grid'); if(!g) return;
            const f = filter === 'all' ? articlesData : articlesData.filter(a => a.category === filter);
            g.innerHTML = f.map(a => `<div class="article-card bg-white rounded-card overflow-hidden border border-orange/5 hover:shadow-lg hover:scale-[1.01] hover:-translate-y-1 transition-all duration-300 cursor-pointer soft-shadow" onclick="openArticleModal(${a.id})"><div class="h-48 overflow-hidden relative"><img src="${a.image}" alt="${a.title}" class="w-full h-full object-cover transition-transform duration-700"><div class="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent"></div></div><div class="p-6"><div class="flex items-center gap-3 mb-3"><span class="text-[10px] font-heading font-bold uppercase tracking-wider bg-lavender/10 text-lavender px-2.5 py-1 rounded-full">${a.category}</span><span class="text-[10px] font-medium text-text-sub">${a.readTime} read</span></div><h4 class="text-base font-heading font-semibold tracking-tight leading-snug mb-2">${a.title}</h4><p class="text-sm text-text-sub leading-relaxed line-clamp-2 mb-4">${a.excerpt}</p><div class="flex items-center gap-2"><div class="w-6 h-6 bg-orange/10 rounded-full flex items-center justify-center"><i data-lucide="pencil" class="w-3 h-3 text-orange"></i></div><div><p class="text-xs font-heading font-semibold">${a.author}</p><p class="text-[10px] text-text-sub">${a.authorRole}</p></div></div></div></div>`).join('');
            lucide.createIcons();
        }
        function filterArticles(c) { document.querySelectorAll('.article-filter').forEach(b => { b.classList.remove('bg-lavender','text-white','active-article-filter'); b.classList.add('bg-white','text-text-sub','border','border-lavender/20'); }); event.target.classList.remove('bg-white','text-text-sub','border','border-lavender/20'); event.target.classList.add('bg-lavender','text-white','active-article-filter'); renderArticles(c); }
        function openArticleModal(id) { const a = articlesData.find(x=>x.id===id); document.getElementById('article-modal-cat').textContent=a.category.toUpperCase()+' • '+a.readTime+' READ • '+a.date; document.getElementById('article-modal-body').innerHTML=`<div class="h-64 md:h-80 overflow-hidden relative"><img src="${a.image}" alt="${a.title}" class="w-full h-full object-cover"><div class="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div></div><div class="max-w-2xl mx-auto px-6 md:px-10 py-8"><h2 class="text-3xl font-heading font-semibold tracking-tight leading-snug mb-4">${a.title}</h2><div class="flex items-center gap-3 mb-8 pb-8 border-b border-orange/5"><div><p class="text-sm font-heading font-semibold">${a.author}</p><p class="text-xs text-text-sub">${a.authorRole}</p></div></div><div class="prose prose-neutral text-sm leading-relaxed space-y-4 text-text-sub">${a.content}</div></div>`; show('article-modal'); document.body.style.overflow='hidden'; }
        function closeArticleModal() { hide('article-modal'); document.body.style.overflow=''; }

        // ====== INITIALIZE APP ======
        updateChatUI();
        renderTips();
        renderArticles();
        initRevealObserver();

        // ====== BACKEND CONNECTION TEST ======

    async function testBackendConnection() {
    try {
        const response = await fetch("http://localhost:3000/api/test");

        const data = await response.json();

        console.log("Backend response:", data);
        } 
        catch (error) {
        console.error("Backend connection failed:", error);
                        }
    }

testBackendConnection();

        document.querySelectorAll('a[href^="#"]').forEach(a => { a.addEventListener('click', function(e) { e.preventDefault(); const t = document.querySelector(this.getAttribute('href')); if(t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeTipModal(); closeArticleModal(); } });

        // ===== AUTO-REFRESH STUDENT CHAT =====

let studentChatRefreshInterval = null;

function startStudentChatAutoRefresh() {
    // Prevent multiple intervals from running
    if (studentChatRefreshInterval) {
        clearInterval(studentChatRefreshInterval);
    }

    studentChatRefreshInterval = setInterval(async () => {
        // Only refresh when the student chat is actually active
        if (
            window.studentEmail &&
            activeCounsellor &&
            document.getElementById('stu-chat-messages')
        ) {
            await renderStudentChat();
        }
    }, 3000); // refresh every 3 seconds
}
// ===== AUTO-REFRESH ADMIN CHAT =====

let adminChatRefreshInterval = null;

function startAdminChatAutoRefresh() {
    if (adminChatRefreshInterval) {
        clearInterval(adminChatRefreshInterval);
    }

    adminChatRefreshInterval = setInterval(async () => {
        if (
            activeAdminChat &&
            selectedAdminCounsellor &&
            document.getElementById('admin-chat-messages')
        ) {
            await renderAdminChat();
        }
    }, 3000);
}

function stopAdminChatAutoRefresh() {
    if (adminChatRefreshInterval) {
        clearInterval(adminChatRefreshInterval);
        adminChatRefreshInterval = null;
    }
}

function stopStudentChatAutoRefresh() {
    if (studentChatRefreshInterval) {
        clearInterval(studentChatRefreshInterval);
        studentChatRefreshInterval = null;
    }
}