document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const loader = document.getElementById('loader');
    const dashboard = document.getElementById('dashboard');
    const uploadSection = document.getElementById('upload-section');

    let browserChartInstance = null;
    let referralChartInstance = null;

    // Esto es para cuando arrastras el archivo al cuadro
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-blue-500', 'bg-slate-900/80');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('border-blue-500', 'bg-slate-900/80');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-blue-500', 'bg-slate-900/80');
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.csv')) {
            handleFile(file);
        } else {
            alert('Por favor, selecciona un archivo CSV válido.');
        }
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleFile(file);
    });

    // Estado inicial
    setTimeout(() => switchTab('tab-summary'), 100);

    window.switchTab = (tabId) => {
        // Actualizamos los botones de las pestañas
        document.querySelectorAll('.tab-btn').forEach(btn => {
            const onClickAttr = btn.getAttribute('onclick') || '';
            btn.classList.toggle('active', onClickAttr.includes(tabId));
        });

        // Manejamos la visibilidad global de las secciones principales
        if (tabId === 'tab-support') {
            uploadSection.classList.add('hidden');
            dashboard.classList.remove('hidden');
        } else if (!currentData) {
            uploadSection.classList.remove('hidden');
            dashboard.classList.add('hidden');
        } else {
            uploadSection.classList.add('hidden');
            dashboard.classList.remove('hidden');
        }

        // Y cambiamos el contenido específico de las pestañas
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('hidden', content.id !== tabId);
        });
    };

    let currentData = null;
    let urlPageSize = 10;
    let urlCurrentPage = 1;
    let chartInstances = {};

    function handleFile(file) {
        loader.classList.remove('hidden');
        document.getElementById('current-filename').innerText = file.name;
        document.getElementById('file-info').classList.remove('hidden');

        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target.result;
            const result = await eel.process_csv_content(content)();

            if (result.error) {
                alert('Error al analizar: ' + result.error);
                loader.classList.add('hidden');
            } else {
                currentData = result;
                urlCurrentPage = 1; // Reiniciamos la pagina de las URLs
                renderDashboard(result);
            }
        };
        reader.readAsText(file);
    }

    let explorerSearchQuery = '';
    let pagesSearchQuery = '';
    let perfSearchQuery = '';
    let perfCurrentPage = 1;

    window.filterPages = () => {
        pagesSearchQuery = document.getElementById('pages-search').value.toLowerCase();
        urlCurrentPage = 1;
        renderPagesWithPagination();
    };

    window.filterPerf = () => {
        perfSearchQuery = document.getElementById('perf-search').value.toLowerCase();
        perfCurrentPage = 1;
        renderPerformanceTable();
    };

    window.filterExplorer = () => {
        explorerSearchQuery = document.getElementById('explorer-search').value.toLowerCase();
        renderAllSections(currentData.sections);
    };

    function renderDashboard(data) {
        loader.classList.add('hidden');
        switchTab('tab-summary');

        // 1. Pestaña de Resumen
        const s = data.summary;
        document.getElementById('stat-sessions').innerText = s["Total de sesiones"] || "-";
        document.getElementById('stat-users').innerText = s["Usuarios únicos"] || "-";
        document.getElementById('stat-scroll').innerText = s["Promedio"] ? s["Promedio"] + "%" : "-";
        document.getElementById('stat-performance').innerText = s["Puntuación"] ? parseFloat(s["Puntuación"]).toFixed(1) : "-";

        renderSimpleList('frustration-list', data.sections["Ideas"]?.rows || [], 'orange');
        renderDoughnutChart('browserChartSummary', data.sections["Exploradores"]?.rows || []);

        // 2. Pestaña de Audiencia
        renderDoughnutChart('browserChart', data.sections["Exploradores"]?.rows || []);
        renderPolarChart('referralChart', data.sections["Origen de referencia"]?.rows || []);
        renderDynamicAudienceCharts(data.sections);

        // 3. Pestaña de Contenido
        renderPagesWithPagination();

        // Vemos si hay metricas de Performance
        const perfSection = data.sections["Rendimiento de URL"];
        const perfContainer = document.getElementById('perf-section-container');
        if (perfSection) {
            perfContainer.classList.remove('hidden');
            renderPerformanceTable();
        } else {
            perfContainer.classList.add('hidden');
        }

        renderList('events-list', data.sections["Eventos inteligentes"]?.rows || [], 'blue');

        // 4. Pestaña Tecnico
        renderSimpleGrid('js-errors-list', data.sections["Errores de JavaScript"]?.rows || [], 'amber');
        renderSimpleList('bots-list', data.sections["Tráfico de bots"]?.rows || [], 'red');
        renderCWV(data.summary);

        // 5. Pestaña del Explorador
        renderAllSections(data.sections);
    }

    function renderPerformanceTable() {
        const allRows = currentData.sections["Rendimiento de URL"]?.rows || [];
        const rows = allRows.filter(r => r.label.toLowerCase().includes(perfSearchQuery));

        const tbody = document.getElementById('perf-list-tbody');
        const paginationContainer = document.getElementById('perf-pagination');

        const totalPages = Math.ceil(rows.length / urlPageSize);
        if (perfCurrentPage > totalPages && totalPages > 0) perfCurrentPage = totalPages;

        const start = (perfCurrentPage - 1) * urlPageSize;
        const pageRows = rows.slice(start, start + urlPageSize);

        tbody.innerHTML = '';
        if (pageRows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-slate-500 italic">No se encontraron datos de rendimiento.</td></tr>';
            paginationContainer.innerHTML = '';
            return;
        }

        pageRows.forEach(r => {
            const tr = document.createElement('tr');
            tr.className = 'border-b border-slate-800/50 hover:bg-white/5 transition-colors group';
            tr.innerHTML = `
                <td class="py-4 px-2">
                    <div class="text-xs text-slate-300 font-medium truncate max-w-md group-hover:text-white" title="${r.label}">${r.label}</div>
                </td>
                <td class="py-4 px-2 text-center">
                    <span class="text-sm font-bold text-slate-100">${r.values[0] || '-'}</span>
                </td>
                <td class="py-4 px-2 text-center">
                    <span class="text-sm font-semibold text-blue-400">${r.values[1] || '-'}</span>
                </td>
                <td class="py-4 px-2 text-center">
                    <span class="text-sm font-semibold text-purple-400">${r.values[2] || '-'}</span>
                </td>
            `;
            tbody.appendChild(tr);
        });

        updatePaginationUI(paginationContainer, totalPages, (p) => {
            perfCurrentPage = p;
            renderPerformanceTable();
        }, perfCurrentPage);
    }

    function renderCWV(summary) {
        const container = document.getElementById('cwv-container');
        container.innerHTML = '';
        const v = summary;
        const metrics = [
            { label: 'LCP', val: v["LCP (Pintura con contenido más grande)"], unit: '', desc: 'Largest Contentful Paint' },
            { label: 'INP', val: v["INP (Interacción con Next Paint)"], unit: '', desc: 'Interaction to Next Paint' },
            { label: 'CLS', val: v["CLS (desplazamiento de diseño acumulativo)"], unit: '', desc: 'Cumulative Layout Shift' }
        ];

        metrics.forEach(m => {
            if (!m.val) return;
            const div = document.createElement('div');
            div.className = 'flex justify-between items-center p-4 bg-slate-800/40 rounded-xl mb-4';
            div.innerHTML = `
                <div>
                    <p class="text-sm font-bold text-slate-200">${m.label}</p>
                    <p class="text-xs text-slate-500">${m.desc}</p>
                </div>
                <div class="text-right">
                    <span class="text-xl font-bold text-blue-400">${m.val}${m.unit}</span>
                </div>
            `;
            container.appendChild(div);
        });
    }

    function renderDynamicAudienceCharts(sections) {
        const container = document.getElementById('dynamic-audience-charts');
        container.innerHTML = '';

        // Secciones que quedan bien como graficos
        const targets = ["Dispositivos", "Sistemas operativos", "País"];

        targets.forEach(t => {
            if (sections[t] && sections[t].rows.length > 0) {
                const canvasId = `chart-${t.replace(/\s+/g, '-')}`;
                const div = document.createElement('div');
                div.className = 'glass-card p-6';
                div.innerHTML = `
                    <h5 class="text-lg font-semibold mb-4 text-slate-300">${t}</h5>
                    <div class="h-64"><canvas id="${canvasId}"></canvas></div>
                `;
                container.appendChild(div);
                renderBarChart(canvasId, sections[t].rows);
            }
        });
    }

    function renderBarChart(canvasId, rows) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        if (chartInstances[canvasId]) chartInstances[canvasId].destroy();

        const labels = rows.slice(0, 8).map(r => r.label);
        const values = rows.slice(0, 8).map(r => parseInt((r.values[0] || "0").replace(/,/g, '')));

        chartInstances[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: 'rgba(59, 130, 246, 0.6)',
                    borderRadius: 8,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { display: false } }
                },
            }
        });
    }


    let explorerPagination = {}; // Guardamos la pagina actual de cada bloque { nombreSeccion: pagina }
    let explorerFilters = {}; // Guardamos lo que se busca en cada bloque

    function renderAllSections(sections) {
        const container = document.getElementById('all-sections-container');
        container.innerHTML = '';

        Object.keys(sections).forEach(sectionName => {
            const section = sections[sectionName];
            if (!section.rows || section.rows.length === 0) return;

            const blockFilter = (explorerFilters[sectionName] || '').toLowerCase();

            // Filtramos: Busqueda Global Y Busqueda por Bloque
            const filteredRows = section.rows.filter(r => {
                const matchesGlobal = sectionName.toLowerCase().includes(explorerSearchQuery) ||
                    r.label.toLowerCase().includes(explorerSearchQuery);
                const matchesBlock = r.label.toLowerCase().includes(blockFilter);
                return matchesGlobal && matchesBlock;
            });

            if (filteredRows.length === 0 && !blockFilter) return;

            // Si no existe la pagina, la empezamos en 1
            if (!explorerPagination[sectionName]) explorerPagination[sectionName] = 1;

            const pageSize = 12;
            const totalPages = Math.ceil(filteredRows.length / pageSize);

            // Si la pagina actual se pasa del total (por filtros), la reseteamos
            if (explorerPagination[sectionName] > totalPages) explorerPagination[sectionName] = 1;

            const start = (explorerPagination[sectionName] - 1) * pageSize;
            const pageRows = filteredRows.slice(start, start + pageSize);

            const sectionDiv = document.createElement('div');
            // Las que tienen URLs largas las hacemos mas anchas
            const isWide = ["Páginas principales", "Rendimiento de URL", "Errores de JavaScript"].includes(sectionName);
            sectionDiv.className = `glass-card p-6 bg-slate-900/60 border-slate-700/30 flex flex-col h-full hover:border-blue-500/30 transition-all ${isWide ? 'lg:col-span-3' : 'lg:col-span-1'}`;

            let rowsHtml = pageRows.map(r => `
                <div class="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 rounded transition-colors group/row">
                    <span class="text-[11px] text-slate-400 truncate ${isWide ? 'max-w-[85%]' : 'max-w-[70%]'} group-hover/row:text-slate-200" title="${r.label}">${r.label}</span>
                    <div class="text-right flex-shrink-0">
                        <span class="text-xs font-bold text-indigo-400">${r.values[0] || ''}</span>
                        ${r.values[1] ? `<span class="text-[10px] text-slate-500 ml-2 font-mono">${r.values[1]}</span>` : ''}
                        ${r.values[2] ? `<span class="text-[10px] text-purple-400 ml-1 font-mono">${r.values[2]}</span>` : ''}
                    </div>
                </div>
            `).join('');

            sectionDiv.innerHTML = `
                <div class="flex flex-col mb-6">
                    <div class="flex justify-between items-center mb-4">
                        <h5 class="text-xs font-black text-slate-100 uppercase tracking-widest flex items-center">
                            <span class="w-1.5 h-6 ${isWide ? 'bg-indigo-500' : 'bg-blue-500'} rounded-full mr-3 shadow-lg shadow-blue-500/20"></span>
                            ${sectionName}
                        </h5>
                        <span class="text-[9px] font-mono text-slate-500 bg-slate-800 px-2 py-1 rounded-full border border-white/5">${filteredRows.length} total</span>
                    </div>
                    <div class="relative">
                        <input type="text" value="${explorerFilters[sectionName] || ''}" 
                            placeholder="Filtrar en esta sección..." 
                            oninput="filterSection('${sectionName}', this.value)"
                            class="w-full bg-slate-950/50 border border-slate-800 rounded-lg py-1.5 pl-8 pr-3 text-[10px] text-slate-300 focus:border-indigo-500 focus:outline-none transition-all shadow-inner">
                        <svg class="w-3.5 h-3.5 text-slate-600 absolute left-2.5 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke-width="2.5"></path></svg>
                    </div>
                </div>
                
                <div class="space-y-0.5 flex-1 min-h-[400px]">
                    ${filteredRows.length === 0 ? '<p class="text-[10px] text-slate-600 italic text-center py-20">Sin coincidencias</p>' : rowsHtml}
                </div>

                <div id="pagination-${sectionName.replace(/\s+/g, '-')}" class="mt-8 pt-6 border-t border-white/5 flex justify-center space-x-1.5">
                    <!-- El paginador avanzado se mete aqui -->
                </div>
            `;
            container.appendChild(sectionDiv);

            // Metemos la paginacion avanzada
            const pagContainer = document.getElementById(`pagination-${sectionName.replace(/\s+/g, '-')}`);
            updatePaginationUI(pagContainer, totalPages, (newPage) => {
                explorerPagination[sectionName] = newPage;
                renderAllSections(currentData.sections);
            }, explorerPagination[sectionName]);
        });
    }

    window.filterSection = (sectionName, value) => {
        explorerFilters[sectionName] = value;
        explorerPagination[sectionName] = 1;
        renderAllSections(currentData.sections);
    };

    window.changeExplorerPage = (sectionName, newPage) => {
        explorerPagination[sectionName] = newPage;
        renderAllSections(currentData.sections);
    };

    function renderSimpleGrid(containerId, rows, color) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        rows.forEach(r => {
            const div = document.createElement('div');
            div.className = `p-4 rounded-xl bg-${color}-900/10 border border-${color}-500/10`;
            div.innerHTML = `
                <p class="text-xs text-slate-400 mb-1 truncate" title="${r.label}">${r.label}</p>
                <div class="flex justify-between items-end">
                    <span class="text-xl font-bold text-${color}-400">${r.values[0] || '0'}</span>
                    <span class="text-[10px] text-slate-500 pb-1">${r.values[1] || ''}</span>
                </div>
            `;
            container.appendChild(div);
        });
    }

    function renderDoughnutChart(canvasId, rows) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (chartInstances[canvasId]) chartInstances[canvasId].destroy();

        const labels = rows.map(r => r.label);
        const values = rows.map(r => parseInt((r.values[0] || "0").replace(/,/g, '')));

        chartInstances[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#eab308', '#22c55e'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 10 } } } },
                cutout: '70%'
            }
        });
    }

    function renderPolarChart(canvasId, rows) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (chartInstances[canvasId]) chartInstances[canvasId].destroy();

        const labels = rows.slice(0, 6).map(r => r.label);
        const values = rows.slice(0, 6).map(r => parseInt((r.values[0] || "0").replace(/,/g, '')));

        chartInstances[canvasId] = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.5)',
                        'rgba(139, 92, 246, 0.5)',
                        'rgba(236, 72, 153, 0.5)',
                        'rgba(249, 115, 22, 0.5)',
                        'rgba(34, 197, 94, 0.5)',
                        'rgba(6, 182, 212, 0.5)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { r: { ticks: { display: false }, grid: { color: 'rgba(255, 255, 255, 0.05)' } } },
                plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 10 } } } }
            }
        });
    }

    function renderList(containerId, rows, color) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        rows.forEach(r => {
            const div = document.createElement('div');
            div.className = 'flex items-center justify-between p-3 bg-slate-800/40 rounded-xl mb-2';
            div.innerHTML = `
                <div class="flex items-center space-x-3">
                    <div class="w-1 h-8 bg-${color}-500 rounded-full"></div>
                    <span class="text-sm font-medium">${r.label}</span>
                </div>
                <div class="text-right">
                    <span class="font-bold text-${color}-400">${r.values[0] || '0'}</span>
                    <p class="text-[10px] text-slate-500">${r.values[1] || ''}</p>
                </div>
            `;
            container.appendChild(div);
        });
    }

    function renderSimpleList(containerId, rows, color) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        rows.forEach(r => {
            if (parseInt(r.values[0] || 0) === 0 && r.label.includes('Bot')) return;
            const div = document.createElement('div');
            div.className = 'flex justify-between items-center p-2 rounded-lg bg-slate-800/30 mb-1';
            div.innerHTML = `
                <span class="text-xs text-slate-400">${r.label}</span>
                <span class="px-2 py-0.5 bg-${color}-900/30 text-${color}-400 rounded text-xs font-bold">${r.values[0] || '0'}</span>
            `;
            container.appendChild(div);
        });
    }

    function renderPagesWithPagination() {
        const allRows = currentData.sections["Páginas principales"]?.rows || [];
        // Filtramos por lo que se escriba en el buscador
        const rows = allRows.filter(r => r.label.toLowerCase().includes(pagesSearchQuery));

        const container = document.getElementById('pages-list');
        const paginationContainer = document.getElementById('pages-pagination') || createPaginationContainer();

        const totalSessionsVal = currentData.summary["Total de sesiones"] || "1";
        const totalSessions = parseInt(totalSessionsVal.replace(/,/g, ''));

        const totalPages = Math.ceil(rows.length / urlPageSize);
        // Por si acaso la pagina actual queda fuera de rango al filtrar
        if (urlCurrentPage > totalPages && totalPages > 0) urlCurrentPage = totalPages;

        const start = (urlCurrentPage - 1) * urlPageSize;
        const pageRows = rows.slice(start, start + urlPageSize);

        container.innerHTML = '';

        if (pageRows.length === 0) {
            container.innerHTML = '<p class="text-slate-500 text-sm italic text-center py-8">No se encontraron resultados para su búsqueda.</p>';
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

        pageRows.forEach(p => {
            const sess = parseInt((p.values[0] || "0").replace(/,/g, ''));
            const pct = ((sess / totalSessions) * 100).toFixed(1);

            const div = document.createElement('div');
            div.className = 'mb-4';
            div.innerHTML = `
                <div class="flex justify-between text-xs mb-1">
                    <span class="text-slate-300 truncate w-3/4" title="${p.label}">${p.label}</span>
                    <span class="text-blue-400 font-bold">${p.values[0]} <small class="text-slate-500">(${pct}%)</small></span>
                </div>
                <div class="intensity-bar h-1.5"><div class="intensity-fill" style="width: ${Math.min(pct * 2, 100)}%"></div></div>
            `;
            container.appendChild(div);
        });

        updatePaginationUI(paginationContainer, totalPages, (p) => {
            urlCurrentPage = p;
            renderPagesWithPagination();
        }, urlCurrentPage);
    }

    function createPaginationContainer() {
        const p = document.createElement('div');
        p.id = 'pages-pagination';
        p.className = 'flex justify-center space-x-2 mt-6';
        document.getElementById('pages-list').after(p);
        return p;
    }

    function updatePaginationUI(container, total, onPageClick, currentPage) {
        if (!container) return;
        container.innerHTML = '';
        if (total <= 1) return;

        const maxVisible = 5;
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(total, start + maxVisible - 1);

        if (end === total) {
            start = Math.max(1, end - maxVisible + 1);
        }

        // Boton para la primera pagina
        if (start > 1) {
            addPageButton(container, 1, onPageClick, currentPage);
            if (start > 2) addEllipsis(container);
        }

        for (let i = start; i <= end; i++) {
            addPageButton(container, i, onPageClick, currentPage);
        }

        // Boton para la ultima pagina
        if (end < total) {
            if (end < total - 1) addEllipsis(container);
            addPageButton(container, total, onPageClick, currentPage);
        }
    }

    function addPageButton(container, page, onPageClick, currentPage) {
        const btn = document.createElement('button');
        btn.innerText = page;
        btn.className = `w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${currentPage === page ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`;
        btn.onclick = () => onPageClick(page);
        container.appendChild(btn);
    }

    function addEllipsis(container) {
        const span = document.createElement('span');
        span.innerText = '...';
        span.className = 'text-slate-600 px-1 pt-2';
        container.appendChild(span);
    }
});
