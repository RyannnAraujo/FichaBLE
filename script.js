
// Attempt to get API_KEY from global scope, otherwise use a placeholder.
// For this to work in a static environment without user input,
// the hosting platform or a build step needs to set globalThis.GEMINI_API_KEY.
const GEMINI_API_KEY = globalThis.GEMINI_API_KEY || "YOUR_GEMINI_API_KEY_REPLACE_ME";
let googleGenAIInstance;
if (GEMINI_API_KEY && GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY_REPLACE_ME" && window.GoogleGenAI) {
    try {
        googleGenAIInstance = new window.GoogleGenAI({ apiKey: GEMINI_API_KEY });
    } catch (e) {
        console.error("Failed to initialize GoogleGenAI:", e);
        googleGenAIInstance = null;
    }
} else {
    console.warn("Gemini API Key not configured. AI image generation will be disabled.");
    googleGenAIInstance = null;
}


const systemData = {
  pericias: [
    { nome: "Animais", desc: "Cuidar, treinar e comunicar-se com criaturas." },
    { nome: "Arte", desc: "Expressões artísticas como cantar, dançar, tocar música." },
    { nome: "Esporte", desc: "Enfrentar desafios físicos, correr, nadar." },
    { nome: "Influência", desc: "Persuadir, liderar, barganhar, diplomacia." },
    { nome: "Luta", desc: "Combate corpo a corpo, à distância e com armas." },
    { nome: "Manha", desc: "Sabotar, arrombar, disfarçar, falsificar, ser furtivo." },
    { nome: "Máquinas", desc: "Construir, consertar, operar tecnologia e computadores." },
    { nome: "Medicina", desc: "Tratar doenças, realizar cirurgias, primeiros socorros." },
    { nome: "Pilotagem", desc: "Conduzir veículos, naves, robôs gigantes." },
    { nome: "Psiquismo", desc: "Compreender, interagir e manifestar habilidades psíquicas." },
    { nome: "Percepção", desc: "Sentidos aguçados, notar detalhes, ameaças escondidas." },
    { nome: "Saber", desc: "Conhecimento teórico, ciências, idiomas, conhecimentos ocultos." },
    { nome: "Sobrevivência", desc: "Encontrar alimento, construir abrigos, orientar-se." },
  ],
  vantagens: [
    { nome: "Aceleração", desc: "Gaste 1 PM para um movimento extra. Ganho em iniciativa e perseguições.", custo: "(1pt)" },
    { nome: "+Ação", desc: "Ganha +2 Pontos de Ação. Pode ser adquirida múltiplas vezes.", custo: "(1pt cada)" },
    { nome: "Adaptador", desc: "Permite instalar Tepeques em seu robô, nave ou armadura.", custo: "(1pt)" },
    { nome: "Ágil", desc: "+2 em testes de Habilidade ligados a agilidade. Por 2PM, crítico com 5 ou 6.", custo: "(1pt)" },
    { nome: "Ajudante", desc: "Possui um aliado que pode ajudar uma vez por turno.", custo: "(1pt cada)", type: 'select', options: [
        { name: "Médico", desc: "Restaura 2D de PV em um aliado próximo ou dá uma nova chance contra efeitos adversos (paralisia, veneno, etc.) após uma falha.", costText: "(Médico)"},
        { name: "Especialista", desc: "Proporciona Ganho em um teste de perícia, exceto em situações ofensivas ou defensivas.", costText: "(Especialista)"},
        { name: "Lutador", desc: "Concede Ganho em um ataque ou melhora a defesa por um turno.", costText: "(Lutador)"},
      ]
    },
    { nome: "Alcance", desc: "Permite atacar alvos a distância.", type: 'select', options: [
        { name: "Alcance (1pt)", desc: "Permite atacar alvos Longe sem penalidades, e Muito Longe com uma Perda.", costText: "(1pt)"},
        { name: "Alcance (2pt)", desc: "Permite atacar alvos Longe e Muito Longe sem penalidades.", costText: "(2pt)"},
      ]
    },
    { nome: "Ataque Especial", desc: "Permite usar manobras especiais de ataque gastando PMs.", custo: "(1pt cada)", type: 'select', options: [
        { name: "Área", desc: "Seu ataque afeta todos aqueles próximos ao alvo designado. 3PM.", costText: "(Área)"},
        { name: "Penetrante", desc: "Seu ataque faz com que o adversário sofra Perda na defesa. 2PM.", costText: "(Penetrante)"},
        { name: "Poderoso", desc: "Em um golpe crítico, gaste 2PM para adicionar seu Poder ao dano novamente.", costText: "(Poderoso)"},
        { name: "Preciso", desc: "Canalizando sua técnica, você ataca com Habilidade ao invés de Poder. 1PM.", costText: "(Preciso)"},
      ]
    },
    { nome: "Base", desc: "Possui uma base de operações que serve como refúgio e local de recuperação.", custo: "(1pt)" },
    { nome: "Carismático", desc: "+2 em testes de Poder em interações sociais. Por 2PM, crítico com 5 ou 6.", custo: "(1pt)" },
    { nome: "Defesa Especial", desc: "Permite usar manobras defensivas especiais gastando PMs.", custo: "(1pt cada)", type: 'select', options: [
        { name: "Blindada", desc: "A defesa consegue acerto crítico com 5 ou 6. 1PM.", costText: "(Blindada)"},
        { name: "Bloqueio", desc: "Você defende usando Poder em vez de Resistência. 1PM.", costText: "(Bloqueio)"},
        { name: "Esquiva", desc: "Você defende usando Habilidade em vez de Resistência. 1PM.", costText: "(Esquiva)"},
      ]
    },
    { nome: "+Motivação", desc: "Ganha +10 Pontos de Motivação. Pode ser adquirida múltiplas vezes.", custo: "(1pt cada)" },
    { nome: "+Vida", desc: "Ganha +10 Pontos de Vida. Pode ser adquirida múltiplas vezes.", custo: "(1pt cada)" },
    { nome: "Voo", desc: "Capacidade de voar, seja por equipamento ou habilidade.", custo: "(1pt)" },
  ],
  desvantagens: [
    { nome: "Amnésia", desc: "Seu passado é um mistério. O Mestre cria sua ficha e revela suas habilidades aos poucos.", custo: "(-2pt)" },
    { nome: "Assombrado", desc: "Uma memória dolorosa o perturba.", type: 'select', options: [
        { name: "Assombrado (-1pt)", desc: "Pode causar Perda em um teste relevante na cena.", costText: "(-1pt)"},
        { name: "Assombrado (-2pt)", desc: "Pode causar Perda em todos os testes na cena.", costText: "(-2pt)"},
      ]
    },
    { nome: "Código", desc: "Segue um código de honra que restringe suas ações.", custo: "(-1pt cada)", type: 'select', options: [
        { name: "Código dos Heróis", desc: "Sempre cumprir promessas, proteger os fracos, nunca recusar um pedido de ajuda."},
        { name: "Código da Honestidade", desc: "Nunca mentir, roubar ou trapacear."},
      ]
    },
  ],
 arquitetas: { 
    "Nenhum": { custo: '0pt', vantagens: [], desvantagens: [] },
    "Humano": { custo: '0pt', vantagens: [{ nome: 'Mais Além', desc: 'Humanos possuem uma natureza resiliente. Uma vez por cena, um protagonista humano pode gastar 2PM para obter Ganho em um teste.' }], desvantagens: [] },
    "Andro-ginóide": { custo: '1pt', vantagens: [{ nome: 'Imune: Abiótico, Doenças, Resiliente, Sem Mente', desc: 'Imunidades inerentes.' }, { nome: 'Carismático', desc: 'Naturalmente charmoso e persuasivo.'}], desvantagens: [{ nome: 'Artificial', desc: 'Não pode ser curado, apenas consertado.'}, { nome: 'Destacado', desc: 'Sua aparência é única e chama a atenção.'}] },
    "Ciborgue": { custo: '2pt', vantagens: [{ nome: 'Construto Vivo', desc: 'Pode ser curado ou consertado.'}, { nome: 'Imune: Abiótico, Doenças, Resiliente', desc: 'Imunidades parciais.' }], desvantagens: [{ nome: 'Antipático', desc: 'Sua aparência artificial incomoda os outros.'}] },
  },
  perfis: { 
    "O Ponto": [
      { nome: "Carismático", desc: "Sempre tem objetivos bem claros. Suas perícias sociais poderão fazer dele uma grande figura de liderança mas talvez ele nem queira isso — as pessoas o acompanharão por gostarem dele ou se identificarem com suas palavras." },
      { nome: "Equilibrado", desc: "Tem um imenso senso de dever com os demais e fará de tudo para mantê-los vivos. Não é incomum que seja o líder ou um segundo-em-comando — os membros do time o acompanharão porque confiam nele." },
      { nome: "Impulsivo", desc: "Tem muita força de vontade e sempre lutará para ficar de pé quando for derrubado! Em compensação, entrará facilmente em encrencas — mas os membros do time o acompanharão porque sua atitude os inspira!"},
      { nome: "Planejador", desc: "É uma figura agregadora e sua inteligência mantém todos um passo à frente. Em troca, só pede confiança nas horas de crise e que se acredite nele até o final — os membros do time o acompanharão porque ele sabe o que faz." },
    ],
    "O Contraponto": [
      { nome: "Errado", desc: "Um membro-problema. Ele não quer estar ali, ou é um medroso, ou se acha superior, ou reclama de tudo… mas é parte do time e pode surpreender a todos positivamente — às vezes." },
      { nome: "Outra Mão", desc: "Ele assume outra faceta do Ponto, seguindo regras quando o Ponto as ignora, sendo realista quando o Ponto é um idealista, sujando as mãos quando o Ponto é honrado demais, etc." },
      { nome: "Rival", desc: "Tem um foco de disputa com o Ponto (e talvez vice-versa) — mas há respeito mútuo, o jogo é limpo e ambos lutarão juntos como irmãos. Talvez ele e o Ponto se tornem grandes amigos." },
      { nome: "Segundo-em-Comando", desc: "O imediato ao lado do capitão, o primeiro-cavaleiro de um nobre espadachim… há uma hierarquia, mas você pode pedir permissão para falar francamente."}
    ],
     "O Músculo": [ { nome: "Barulhento", desc: "Fanfarrão, exagerado, chegado à ação e, às vezes, não muito esperto. Tem um jeito meio intrometido e pode amolar um pouco os demais membros do time, mas sua disposição é invejável." }, ],
     "O Cérebro": [ { nome: "Técnico", desc: "Um geek de carteirinha e localiza de cara eventuais nós tecnológicos para desatar. Ele pode até não ser um gênio, mas é um dos melhores nisso. A perícia Máquinas é fundamental." }, ],
     "O Coração": [ { nome: "Bem-intencionado", desc: "Sua motivação sincera é ajudar. Todos tendem a gostar dele e é gentil com todos. Se pilota um robô gigante, é por compreender a necessidade de sacrifícios pessoais." }, ]
  },
  poderes: [
    { nome: "Feitos Atléticos", desc: "Capacidades físicas sobre-humanas.", custo: "(Variável)"},
    { nome: "Rajada de Energia", desc: "Dispara energia pelas mãos.", custo: "(2PM)", type: 'select', options: [
      { name: "Simples", desc: "Dano Padrão."},
      { name: "Penetrante", desc: "Ignora parte da defesa."}
    ]},
  ],
  tecnicas: [
    { nome: "Reerguer-se", desc: "Recupera-se rapidamente de tombos ou atordoamentos.", custo: "(Passiva)"},
    { nome: "Disparo Certeiro", desc: "Aumenta a precisão de um ataque à distância.", custo: "(3PM)"},
  ],
  inventario: [{nome: "Kit de Primeiros Socorros", desc: "Permite testes de Medicina em campo."}],
};

const getFirstProfileName = () => {
  const firstCategoryKey = Object.keys(systemData.perfis)[0];
  if (firstCategoryKey && systemData.perfis[firstCategoryKey] && systemData.perfis[firstCategoryKey].length > 0) {
    return systemData.perfis[firstCategoryKey][0].nome;
  }
  return '';
};

const initialSheet = {
  pilotName: '', pilotConcept: '', pilotArchetype: 'Nenhum', charProfile: getFirstProfileName(), charProfileCustomDesc: '',
  pilotP: 1, pilotH: 1, pilotR: 1, pilotEstresse: 0, pilotValor: 0, pilotImage: null,
  charSkills: [], charAdvantages: [], charDisadvantages: [], pilotPoderes: [], pilotTecnicas: [], pilotInventario: [],
  mechaImage: null, mechaName: '', mechaModel: '', mechaEscala: 'Gigante', mechaP: 1, mechaR: 1,
  mechaAdvantages: [], mechaDisadvantages: [], mechaTepeques: '',
  notes: '',
};

let sheet = JSON.parse(JSON.stringify(initialSheet)); // Deep copy
let isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
let remarkableParser;

// DOM Elements (to be cached in init)
let dom = {};

// Modal state
let currentModalConfig = null;

// --- UTILITY FUNCTIONS ---
const qs = (selector, parent = document) => parent.querySelector(selector);
const qsa = (selector, parent = document) => parent.querySelectorAll(selector);
const createElement = (tag, attributes = {}, children = []) => {
    const el = document.createElement(tag);
    for (const key in attributes) {
        if (key === 'class') {
            attributes[key].split(' ').forEach(cls => cls && el.classList.add(cls));
        } else if (key === 'dataset') {
            for (const dataKey in attributes[key]) {
                el.dataset[dataKey] = attributes[key][dataKey];
            }
        } else if (key.startsWith('on') && typeof attributes[key] === 'function') {
            el.addEventListener(key.substring(2).toLowerCase(), attributes[key]);
        }
         else {
            el.setAttribute(key, attributes[key]);
        }
    }
    children.forEach(child => {
        if (typeof child === 'string') {
            el.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            el.appendChild(child);
        }
    });
    return el;
};

// --- DARK MODE ---
function applyDarkMode(dark) {
    isDarkMode = dark;
    document.documentElement.classList.toggle('dark', isDarkMode);
    qs('#darkModeToggle').innerHTML = isDarkMode ? '<lucide-sun class="text-yellow-400"></lucide-sun>' : '<lucide-moon class="text-slate-500"></lucide-moon>';
    if(window.lucide) window.lucide.createIcons();
    
    // Update section and title colors (workaround for Tailwind's JIT not picking up dynamic classes perfectly)
    const sections = qsa('section[id$="-section"]');
    sections.forEach(sec => {
        sec.classList.toggle('dark:bg-slate-800/50', isDarkMode);
        sec.classList.toggle('bg-slate-100/70', !isDarkMode);
        sec.classList.toggle('dark:border-slate-700', isDarkMode);
        sec.classList.toggle('border-slate-300', !isDarkMode);
    });
    qsa('h2[id$="-section-title"]').forEach(title => {
        title.classList.toggle('dark:text-purple-400', isDarkMode);
        title.classList.toggle('text-purple-600', !isDarkMode);
        title.classList.toggle('dark:border-purple-500/50', isDarkMode);
        title.classList.toggle('border-purple-600/50', !isDarkMode);
    });
     qsa('.resource-box').forEach(box => {
        box.classList.toggle('dark', isDarkMode);
    });
    qsa('.image-manager-container').forEach(imgMan => {
        imgMan.classList.toggle('dark', isDarkMode);
        qs('.image-preview', imgMan).classList.toggle('dark', isDarkMode);
        qs('input[type="text"]', imgMan)?.classList.toggle('dark', isDarkMode);
    });
    qsa('.sheet-label').forEach(label => {
        label.classList.toggle('dark:bg-slate-100', isDarkMode);
        label.classList.toggle('dark:text-black', isDarkMode);
    });
    qsa('.sheet-input, .sheet-select, .sheet-textarea').forEach(input => {
        input.classList.toggle('dark:bg-slate-700', isDarkMode);
        input.classList.toggle('dark:text-slate-200', isDarkMode);
        input.classList.toggle('dark:border-slate-500', isDarkMode);
    });
}

function toggleDarkMode() {
    applyDarkMode(!isDarkMode);
    try { localStorage.setItem('darkMode', isDarkMode); } catch(e) { console.warn("Could not save dark mode preference"); }
}


// --- INPUT HANDLING ---
function handleInputChange(event) {
    const { name, value, type } = event.target;
    let processedValue = value;
    if (type === 'number') {
        processedValue = value === '' ? 0 : parseFloat(value);
        if (isNaN(processedValue)) processedValue = 0;
    }
    sheet[name] = processedValue;

    if (['pilotP', 'pilotH', 'pilotR', 'mechaP', 'mechaR'].includes(name)) {
        renderAllResourceBoxes();
    }
    // Special handling for mecha H which is derived from pilot H
    if (name === 'pilotH') {
      renderMechaResourceBoxes(); // Habilidade do Mecha é ligada ao Piloto
    }
}

// --- RENDERING FUNCTIONS ---
function renderSheetValues() {
    Object.keys(initialSheet).forEach(key => {
        const element = dom[key]; // e.g. dom.pilotName, dom.pilotP
        if (element && typeof sheet[key] !== 'object' && typeof sheet[key] !== 'function') {
           if (element.type === 'checkbox') element.checked = sheet[key];
           else element.value = sheet[key];
        }
    });
    renderPilotArchetypeSelect();
    renderPilotProfileSelector();
    renderAllAddableLists();
    renderAllResourceBoxes();
    renderImageManager('pilotImage', dom.pilotImageManagerContainer, "Piloto");
    renderImageManager('mechaImage', dom.mechaImageManagerContainer, "Mecha");
    dom.notesTextarea.value = sheet.notes;
    renderNotesPreview(); // Update notes preview if needed
}

function createResourceBox(label, value, isDark) {
    const box = createElement('div', { class: `resource-box ${isDark ? 'dark' : ''}` }, [
        createElement('label', { class: 'resource-box-label' }, [label]),
        createElement('div', { class: 'resource-box-value' }, [String(value)])
    ]);
    return box;
}

function renderPilotResourceBoxes() {
    const container = dom.pilotResourceBoxes;
    container.innerHTML = ''; // Clear existing
    const pilotPA = Math.max(1, sheet.pilotP);
    const pilotPM = Math.max(1, sheet.pilotH * 5);
    const pilotPV = Math.max(1, sheet.pilotR * 5);
    container.appendChild(createResourceBox("PA", pilotPA, isDarkMode));
    container.appendChild(createResourceBox("PM", pilotPM, isDarkMode));
    container.appendChild(createResourceBox("PV", pilotPV, isDarkMode));
    
    // Re-add Estresse and Valor as they are part of this grid but are direct inputs
    const estresseField = qs('#pilotEstresse').parentElement; // Get field-container
    const valorField = qs('#pilotValor').parentElement; // Get field-container
    if (estresseField) container.appendChild(estresseField.cloneNode(true)); // clone to avoid moving original
    if (valorField) container.appendChild(valorField.cloneNode(true));
    
    // Re-attach listeners to cloned elements if necessary, or ensure original inputs are updated
    qs('#pilotEstresse', container).value = sheet.pilotEstresse;
    qs('#pilotValor', container).value = sheet.pilotValor;
    qs('#pilotEstresse', container).addEventListener('input', handleInputChange);
    qs('#pilotValor', container).addEventListener('input', handleInputChange);

    if(window.lucide) window.lucide.createIcons(); // if icons were part of it
}

function renderMechaResourceBoxes() {
    const container = dom.mechaResourceBoxes;
    container.innerHTML = ''; // Clear existing
    const mechaPA = Math.max(1, sheet.mechaP);
    const mechaPM = Math.max(1, sheet.pilotH * 5); // Mecha PM depends on Pilot H
    const mechaPV = Math.max(1, sheet.mechaR * 5);
    const mechaAreas = Math.max(1, sheet.mechaR * 2);
    container.appendChild(createResourceBox("PA (Mecha)", mechaPA, isDarkMode));
    container.appendChild(createResourceBox("PM (Mecha)", mechaPM, isDarkMode));
    container.appendChild(createResourceBox("PV (Mecha)", mechaPV, isDarkMode));
    container.appendChild(createResourceBox("Áreas", mechaAreas, isDarkMode));
    if(window.lucide) window.lucide.createIcons();
}

function renderAllResourceBoxes() {
    renderPilotResourceBoxes();
    renderMechaResourceBoxes();
}

function renderPilotArchetypeSelect() {
    const select = dom.pilotArchetype;
    select.innerHTML = '';
    Object.keys(systemData.arquétipos).forEach(archName => {
        const archData = systemData.arquétipos[archName];
        select.appendChild(createElement('option', { value: archName }, [`${archName} (${archData.custo})`]));
    });
    select.value = sheet.pilotArchetype;
}

function handleArchetypeChange(event) {
    const newArchetypeKey = event.target.value;
    const currentArchetypeData = systemData.arquétipos[sheet.pilotArchetype];
    const newArchetypeData = systemData.arquétipos[newArchetypeKey];

    if (newArchetypeData) {
        // Vantagens
        let updatedAdvantages = [...sheet.charAdvantages];
        if (currentArchetypeData) {
            updatedAdvantages = updatedAdvantages.filter(adv => 
                !currentArchetypeData.vantagens.some(archAdv => (adv.originalName || adv.nome.split(" (")[0]) === archAdv.nome)
            );
        }
        newArchetypeData.vantagens.forEach(archAdv => {
            const advToAdd = {...archAdv, nome: `${archAdv.nome} ${archAdv.custo || ''}`.trim()};
            if (!updatedAdvantages.some(ua => ua.nome === advToAdd.nome)) {
                 updatedAdvantages.push(advToAdd);
            }
        });

        // Desvantagens
        let updatedDisadvantages = [...sheet.charDisadvantages];
        if (currentArchetypeData) {
            updatedDisadvantages = updatedDisadvantages.filter(dis => 
                !currentArchetypeData.desvantagens.some(archDis => (dis.originalName || dis.nome.split(" (")[0]) === archDis.nome)
            );
        }
         newArchetypeData.desvantagens.forEach(archDis => {
            const disToAdd = {...archDis, nome: `${archDis.nome} ${archDis.custo || ''}`.trim()};
            if (!updatedDisadvantages.some(ud => ud.nome === disToAdd.nome)) {
                 updatedDisadvantages.push(disToAdd);
            }
        });
        
        sheet.pilotArchetype = newArchetypeKey;
        sheet.charAdvantages = updatedAdvantages;
        sheet.charDisadvantages = updatedDisadvantages;

        renderAddableListContent('charAdvantages', 'Piloto');
        renderAddableListContent('charDisadvantages', 'Piloto');
    }
}


function renderPilotProfileSelector() {
    const container = dom.pilotProfileSelectorContainer;
    container.innerHTML = '';

    const label = createElement('label', { for: 'charProfileSelect', class: 'sheet-label' }, ['Perfil']);
    const select = createElement('select', { 
        id: 'charProfileSelect', 
        name: 'charProfile', 
        class: 'sheet-select mt-1 block w-full'
    });

    select.appendChild(createElement('option', { value: "" }, ['Selecione um Perfil']));
    Object.entries(systemData.perfis).forEach(([categoryName, subProfiles]) => {
        const optgroup = createElement('optgroup', { label: categoryName });
        subProfiles.forEach(p => optgroup.appendChild(createElement('option', { value: p.nome }, [p.nome])));
        select.appendChild(optgroup);
    });
    select.appendChild(createElement('option', { value: 'Customizado' }, ['Customizado...']));
    select.value = sheet.charProfile === 'Customizado' || !Object.values(systemData.perfis).flat().find(p => p.nome === sheet.charProfile) ? 'Customizado' : sheet.charProfile;

    const descP = createElement('p', { id: 'charProfileDesc', class: `text-xs text-slate-600 dark:text-slate-400 mt-1 p-2 rounded-md ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}` });
    const customDescContainer = createElement('div', { id: 'charProfileCustomDescContainer', class: 'mt-2 hidden' });
    const customDescLabel = createElement('label', { for: 'charProfileCustomDescInput', class: 'sheet-label' }, ['Descrição Customizada']);
    const customDescInput = createElement('input', { 
        type: 'text', 
        id: 'charProfileCustomDescInput', 
        name: 'charProfileCustomDesc',
        class: 'sheet-input mt-1 block w-full',
        placeholder: 'Descreva o perfil customizado',
        value: sheet.charProfileCustomDesc
    });

    customDescContainer.append(customDescLabel, customDescInput);
    container.append(label, select, descP, customDescContainer);
    
    function updateProfileDisplay() {
        const selectedValue = select.value;
        const isCustom = selectedValue === 'Customizado';
        customDescContainer.classList.toggle('hidden', !isCustom);
        descP.classList.toggle('hidden', isCustom);

        if (isCustom) {
            descP.textContent = '';
            sheet.charProfile = 'Customizado';
            customDescInput.value = sheet.charProfileCustomDesc; // Ensure it's populated
        } else {
            const profile = Object.values(systemData.perfis).flat().find(p => p.nome === selectedValue);
            descP.textContent = profile ? profile.desc : '';
            sheet.charProfile = selectedValue;
            sheet.charProfileCustomDesc = ''; // Clear custom desc if predefined selected
        }
    }
    
    select.addEventListener('change', (e) => {
        sheet.charProfile = e.target.value;
        if (e.target.value !== 'Customizado') sheet.charProfileCustomDesc = '';
        updateProfileDisplay();
    });
    customDescInput.addEventListener('input', (e) => {
        sheet.charProfileCustomDesc = e.target.value;
    });

    updateProfileDisplay(); // Initial render
}


// --- Addable Lists & Selected Item Cards ---
const listConfigs = {
    pilot: [
        { title: 'Perícias', field: 'charSkills', data: systemData.pericias, customType: 'pericia'},
        { title: 'Vantagens', field: 'charAdvantages', data: systemData.vantagens, customType: 'vantagem'},
        { title: 'Desvantagens', field: 'charDisadvantages', data: systemData.desvantagens, customType: 'desvantagem'},
        { title: 'Poderes', field: 'pilotPoderes', data: systemData.poderes, customType: 'poder'},
        { title: 'Técnicas', field: 'pilotTecnicas', data: systemData.tecnicas, customType: 'tecnica'},
        { title: 'Inventário', field: 'pilotInventario', data: systemData.inventario, customType: 'inventario'},
    ],
    mecha: [
        { title: 'Vantagens', field: 'mechaAdvantages', data: systemData.vantagens, customType: 'vantagem'},
        { title: 'Desvantagens', field: 'mechaDisadvantages', data: systemData.desvantagens, customType: 'desvantagem'},
    ]
};

function renderAllAddableLists() {
    const pilotListsContainer = dom.pilotListsContainer;
    pilotListsContainer.innerHTML = '';
    listConfigs.pilot.forEach(cfg => {
        pilotListsContainer.appendChild(createAddableListSection(cfg.title, cfg.field, cfg.data, cfg.customType, 'char'));
    });

    const mechaListsContainer = dom.mechaListsContainer;
    mechaListsContainer.innerHTML = '';
    listConfigs.mecha.forEach(cfg => {
        mechaListsContainer.appendChild(createAddableListSection(`${cfg.title} (Mecha)`, cfg.field, cfg.data, cfg.customType, 'mecha'));
    });
    if(window.lucide) window.lucide.createIcons();
}

function createAddableListSection(title, field, data, customType, category) {
    const sectionContainer = createElement('div', { class: 'flex flex-col gap-2' });
    const listTitle = createElement('h3', { class: 'sheet-label inline-block !mb-0' }, [title]);
    
    const addableListContainerId = `addable-${field}`;
    const selectedItemsContainerId = `selected-${field}`;

    const addableListContainer = createElement('div', { 
        id: addableListContainerId,
        class: `mb-2 rounded-md border ${isDarkMode ? 'bg-slate-700/80 border-slate-600' : 'bg-slate-200 border-slate-300'}`
    });
    
    const toggleButton = createElement('button', { 
        type: 'button', 
        class: `w-full flex justify-between items-center p-3 text-left font-bold transition-colors ${isDarkMode ? 'text-slate-200 hover:bg-slate-600/80' : 'text-slate-800 hover:bg-slate-300'}`,
        'aria-expanded': 'false',
        onclick: (e) => {
            const content = qs('.addable-list-content', addableListContainer);
            const expanded = e.currentTarget.getAttribute('aria-expanded') === 'true';
            e.currentTarget.setAttribute('aria-expanded', !expanded);
            content.classList.toggle('hidden', expanded);
            qs('svg', e.currentTarget).outerHTML = !expanded ? '<lucide-chevron-up></lucide-chevron-up>' : '<lucide-chevron-down></lucide-chevron-down>';
            if(window.lucide) window.lucide.createIcons();
        }
    }, [
        `Adicionar ${customType.charAt(0).toUpperCase() + customType.slice(1)}`,
        createElement('span', {}, [createElement('lucide-chevron-down', {})]) // Icon placeholder
    ]);

    const contentDiv = createElement('div', { class: `addable-list-content p-3 border-t max-h-60 overflow-y-auto hidden ${isDarkMode ? 'border-slate-600' : 'border-slate-300'}` });

    data.forEach(item => {
        const itemButtonContainer = createElement('div', { class: `p-2 mb-2 rounded-md transition-colors group ${isDarkMode ? 'hover:bg-purple-900/50' : 'hover:bg-purple-100'}`});
        const itemButton = createElement('button', { 
            type: 'button', 
            class: 'w-full text-left flex justify-between items-center',
            onclick: () => handleAddItem(field, item, category)
        }, [
            createElement('div', {}, [
                createElement('p', { class: `font-semibold text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}` }, [`${item.nome} ${item.custo || ''}`]),
                createElement('p', { class: `text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}` }, [item.desc])
            ]),
            createElement('lucide-plus-circle', { class: 'text-green-500 opacity-0 group-hover:opacity-100 transition-opacity'})
        ]);
        itemButtonContainer.appendChild(itemButton);
        contentDiv.appendChild(itemButtonContainer);
    });
    
    const customAddButtonContainer = createElement('div', { class: `p-2 mt-2 rounded-md transition-colors group ${isDarkMode ? 'bg-blue-900/50 hover:bg-blue-800/60' : 'bg-blue-100 hover:bg-blue-200'}`});
    const customAddButton = createElement('button', {
        type: 'button',
        class: 'w-full text-left flex justify-between items-center',
        onclick: () => openCustomModal(customType, field, category)
    }, [
        createElement('p', { class: `font-semibold text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}, [`Adicionar ${customType} Customizado...`]),
        createElement('lucide-edit3', { class: 'text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity'})
    ]);
    customAddButtonContainer.appendChild(customAddButton);
    contentDiv.appendChild(customAddButtonContainer);
    
    addableListContainer.append(toggleButton, contentDiv);

    const selectedItemsContainer = createElement('div', { id: selectedItemsContainerId, class: 'space-y-1 max-h-60 overflow-y-auto pr-1' });
    
    sectionContainer.append(listTitle, addableListContainer, selectedItemsContainer);
    renderAddableListContent(field, category); // Render current items
    return sectionContainer;
}

function renderAddableListContent(field, category) {
    const container = qs(`#selected-${field}`);
    if (!container) return;
    container.innerHTML = '';
    const items = sheet[field] || [];
    items.forEach(item => {
        container.appendChild(createSelectedItemCard(item, field, category));
    });
    if(window.lucide) window.lucide.createIcons();
}

function createSelectedItemCard(item, field, category) {
    const card = createElement('div', { class: `p-3 rounded-lg border shadow-sm mb-2 ${isDarkMode ? 'bg-slate-700/70 border-slate-600' : 'bg-white border-slate-300'}` });
    const header = createElement('div', { class: 'flex justify-between items-center' });
    const nameSpan = createElement('span', { class: 'font-semibold text-sm' }, [item.nome]);
    
    const controlsDiv = createElement('div', { class: 'flex items-center gap-2' });
    const descP = createElement('p', { class: `text-xs mt-2 pt-2 border-t hidden ${isDarkMode ? 'text-slate-400 border-slate-600' : 'text-slate-600 border-slate-200'}`}, [item.desc]);

    const toggleDescButton = createElement('button', { 
        type: 'button', 
        class: 'text-slate-500 hover:text-purple-500', 
        'aria-expanded': 'false',
        onclick: (e) => {
            const expanded = e.currentTarget.getAttribute('aria-expanded') === 'true';
            e.currentTarget.setAttribute('aria-expanded', !expanded);
            descP.classList.toggle('hidden', expanded);
            qs('svg', e.currentTarget).outerHTML = !expanded ? '<lucide-chevron-up></lucide-chevron-up>' : '<lucide-chevron-down></lucide-chevron-down>';
            if(window.lucide) window.lucide.createIcons();
        }
    }, [createElement('lucide-chevron-down', {size: 18})]);

    const removeButton = createElement('button', { 
        type: 'button', 
        class: 'text-red-500 hover:text-red-700',
        onclick: () => handleRemoveItem(field, item.nome, category)
    }, [createElement('lucide-x-circle', {size: 18})]);

    controlsDiv.append(toggleDescButton, removeButton);
    header.append(nameSpan, controlsDiv);
    card.append(header, descP);
    return card;
}

function handleAddItem(field, item, category) {
    if (item.type === 'select' && item.options) {
        currentModalConfig = { title: `Escolha uma opção para ${item.nome}`, options: item.options, parentItem: item, category, field };
        openModal();
    } else {
        const itemToAdd = item.custo ? {...item, nome: `${item.nome} ${item.custo}`} : item;
        if (!sheet[field].some(i => i.nome === itemToAdd.nome)) {
            sheet[field].push(itemToAdd);
            renderAddableListContent(field, category);
        }
    }
}

function handleRemoveItem(field, itemName, category) {
    sheet[field] = sheet[field].filter(item => item.nome !== itemName);
    renderAddableListContent(field, category);
}


// --- MODAL ---
function openModal() {
    const modal = dom.modal;
    const modalTitle = dom.modalTitle;
    const modalBody = dom.modalBody;

    modalTitle.textContent = currentModalConfig.title;
    modalBody.innerHTML = ''; // Clear previous content

    if (currentModalConfig.options && currentModalConfig.parentItem) { // Option selection
        currentModalConfig.options.forEach(opt => {
            const button = createElement('button', { 
                type: 'button', 
                class: `w-full p-2 text-left rounded transition-colors ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-100 hover:bg-slate-200'} mb-2`,
                onclick: () => handleOptionSelectedFromModal(opt)
            }, [
                createElement('strong', {class: `${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}, [opt.name]),
                createElement('p', {class: `text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}, [opt.desc])
            ]);
            modalBody.appendChild(button);
        });
    } else if (currentModalConfig.customType) { // Custom item creation
        const nameField = createField("Nome", "customItemNameModal", "", "text", "Nome do item");
        const descField = createField("Descrição", "customItemDescModal", "", "textarea", "Descrição do item", 3);
        const saveButton = createElement('button', {
            type: 'button',
            class: 'w-full p-2 bg-green-600 text-white rounded hover:bg-green-700 mt-3',
            onclick: handleSaveCustomItemFromModal
        }, ['Salvar Customizado']);
        modalBody.append(nameField, descField, saveButton);
    }
    modal.classList.remove('hidden');
    if(window.lucide) window.lucide.createIcons();
}

function closeModal() {
    dom.modal.classList.add('hidden');
    currentModalConfig = null;
     // Clear inputs if they exist
    const customNameInput = qs('#customItemNameModal');
    if (customNameInput) customNameInput.value = '';
    const customDescInput = qs('#customItemDescModal');
    if (customDescInput) customDescInput.value = '';
}

function handleOptionSelectedFromModal(selectedOption) {
    if (currentModalConfig && currentModalConfig.parentItem && currentModalConfig.field) {
        const newItem = {
          ...currentModalConfig.parentItem,
          originalName: currentModalConfig.parentItem.nome,
          nome: selectedOption.name, 
          desc: selectedOption.desc || currentModalConfig.parentItem.desc,
          type: undefined, 
          options: undefined 
        };
        if (!sheet[currentModalConfig.field].some(i => i.nome === newItem.nome)) {
            sheet[currentModalConfig.field].push(newItem);
            renderAddableListContent(currentModalConfig.field, currentModalConfig.category);
        }
    }
    closeModal();
}

function openCustomModal(type, field, category) {
    let titleSuffix = '';
    if (type === 'pericia') titleSuffix = 'Perícia';
    else if (type === 'vantagem') titleSuffix = 'Vantagem';
    else if (type === 'desvantagem') titleSuffix = 'Desvantagem';
    else if (type === 'poder') titleSuffix = 'Poder';
    else if (type === 'tecnica') titleSuffix = 'Técnica';
    else if (type === 'inventario') titleSuffix = 'Item de Inventário';
    currentModalConfig = { title: `Adicionar ${titleSuffix} Customizada`, field, category, customType: type };
    openModal();
}

function handleSaveCustomItemFromModal() {
    const nameInput = qs('#customItemNameModal');
    const descInput = qs('#customItemDescModal');
    if (currentModalConfig && currentModalConfig.field && currentModalConfig.customType && nameInput && nameInput.value) {
        const newItem = {
          nome: nameInput.value,
          desc: descInput ? descInput.value : '',
        };
        if (!sheet[currentModalConfig.field].some(i => i.nome === newItem.nome)) {
            sheet[currentModalConfig.field].push(newItem);
            renderAddableListContent(currentModalConfig.field, currentModalConfig.category);
        }
    }
    closeModal();
}

// Helper to create form fields for modal or other uses
function createField(label, id, value, type = "text", placeholder = "", rows = 1) {
    const container = createElement('div', { class: 'field-container mb-2' });
    const labelEl = createElement('label', { for: id, class: 'sheet-label mb-0' }, [label]);
    let inputEl;
    if (type === 'textarea') {
        inputEl = createElement('textarea', { id, name: id, placeholder, rows, class: 'sheet-textarea flex-grow mt-0' });
    } else {
        inputEl = createElement('input', { type, id, name: id, placeholder, class: 'sheet-input mt-0' });
    }
    inputEl.value = value;
    container.append(labelEl, inputEl);
    return container;
}

// --- IMAGE MANAGER ---
function renderImageManager(imageField, container, entityName) {
    container.innerHTML = '';
    const currentImageSrc = sheet[imageField];

    const managerDiv = createElement('div', { class: `image-manager-container ${isDarkMode ? 'dark' : ''}` });
    const previewDiv = createElement('div', { class: `image-preview ${isDarkMode ? 'dark' : ''}` });
    const previewImg = createElement('lucide-image', { size: 48, class: 'text-slate-400 dark:text-slate-500' });
    previewDiv.appendChild(previewImg);

    if (currentImageSrc) {
        previewImg.outerHTML = `<img src="${currentImageSrc}" alt="Imagem de ${entityName}" />`;
    }

    const controlsDiv = createElement('div', { class: 'space-y-2' });
    const promptInput = createElement('input', { type: 'text', placeholder: `Descreva o ${entityName}...`, class: `sheet-input ${isDarkMode ? 'dark' : ''} text-sm` });
    
    const buttonsGrid = createElement('div', { class: 'grid grid-cols-2 gap-2' });
    const generateButton = createElement('button', { 
        class: `sheet-button-primary text-sm w-full flex items-center justify-center ${!googleGenAIInstance ? 'opacity-50 cursor-not-allowed' : ''}`,
        disabled: !googleGenAIInstance,
        onclick: () => handleGenerateImage(promptInput.value, imageField, entityName, previewDiv, generateButton)
    }, [createElement('lucide-wand2', {size:16, class:'mr-1'}), ' Gerar IA']);
    
    const hiddenUploadInput = createElement('input', { type: 'file', accept: 'image/*', class: 'hidden' });
    hiddenUploadInput.onchange = (e) => handleImageUpload(e, imageField, previewDiv);
    const uploadButton = createElement('button', { 
        class: 'sheet-button-secondary text-sm w-full flex items-center justify-center',
        onclick: () => hiddenUploadInput.click()
    }, [createElement('lucide-upload', {size:16, class:'mr-1'}), ' Enviar']);
    
    buttonsGrid.append(generateButton, uploadButton);
    controlsDiv.appendChild(promptInput);
    controlsDiv.appendChild(buttonsGrid);

    if (currentImageSrc) {
        const removeButton = createElement('button', { 
            class: 'sheet-button-danger text-sm w-full flex items-center justify-center mt-1',
            onclick: () => {
                sheet[imageField] = null;
                renderImageManager(imageField, container, entityName); // Re-render this manager
            }
        }, [createElement('lucide-trash2', {size:16, class:'mr-1'}), ' Remover Imagem']);
        controlsDiv.appendChild(removeButton);
    }
    
    if (!googleGenAIInstance) {
        const apiKeyWarning = createElement('p', {class: 'text-xs text-red-500 dark:text-red-400 text-center mt-1'}, [
            createElement('lucide-alert-triangle', {size:14, class:'inline mr-1'}),
            'API Key não configurada.'
        ]);
        controlsDiv.appendChild(apiKeyWarning);
    }

    managerDiv.append(previewDiv, controlsDiv, hiddenUploadInput);
    container.appendChild(managerDiv);
    if(window.lucide) window.lucide.createIcons();
}

function handleImageUpload(event, imageField, previewDiv) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            sheet[imageField] = e.target.result;
            previewDiv.innerHTML = `<img src="${e.target.result}" alt="Preview" />`;
            // After setting sheet[imageField], re-render to get remove button
            renderImageManager(imageField, previewDiv.parentElement.parentElement, imageField === 'pilotImage' ? 'Piloto' : 'Mecha');
        };
        reader.readAsDataURL(file);
    }
}

async function handleGenerateImage(prompt, imageField, entityName, previewDiv, generateButton) {
    if (!prompt) {
        alert(`Por favor, insira uma descrição para gerar a imagem do ${entityName}.`);
        return;
    }
    if (!googleGenAIInstance) {
        alert("A funcionalidade de geração de imagem por IA está desabilitada devido à falta de API Key.");
        return;
    }

    previewDiv.innerHTML = '';
    previewDiv.appendChild(createElement('div', {class: 'animate-pulse text-slate-500 dark:text-slate-400'}, ['Gerando...']));
    generateButton.disabled = true;

    try {
        const response = await googleGenAIInstance.models.generateImages({
            model: 'imagen-3.0-generate-002', // Use valid, current model
            prompt: prompt,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
        });

        if (response.generatedImages && response.generatedImages[0]?.image?.imageBytes) {
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
            sheet[imageField] = imageUrl;
            // Re-render to update preview and show remove button
            renderImageManager(imageField, previewDiv.parentElement.parentElement, entityName);
        } else {
            throw new Error("Resposta da API inválida ou imagem não gerada.");
        }
    } catch (error) {
        console.error("Erro ao gerar imagem:", error);
        alert(`Falha ao gerar a imagem para ${entityName}. Verifique o console para detalhes.`);
        // Restore preview area to icon or previous image if it existed
         renderImageManager(imageField, previewDiv.parentElement.parentElement, entityName);
    } finally {
        generateButton.disabled = false;
    }
}

// --- FLOATING NOTES ---
let notesAreOpen = false;
let notesAreEditing = true;

function toggleNotesPanel() {
    notesAreOpen = !notesAreOpen;
    dom.floatingNotesPanel.classList.toggle('hidden', !notesAreOpen);
    dom.openNotesButton.classList.toggle('hidden', notesAreOpen);
    if (notesAreOpen && notesAreEditing) {
        dom.notesTextarea.focus();
    }
}

function setNotesEditMode(editing) {
    notesAreEditing = editing;
    dom.notesTextarea.classList.toggle('hidden', !editing);
    dom.notesPreview.classList.toggle('hidden', editing);
    dom.notesFormattingBar.classList.toggle('hidden', !editing);
    dom.notesEditButton.classList.toggle('bg-purple-500', editing);
    dom.notesEditButton.classList.toggle('text-white', editing);
    dom.notesEditButton.classList.toggle('bg-slate-300', !editing);
    dom.notesEditButton.classList.toggle('dark:bg-slate-600', !editing);
    dom.notesViewButton.classList.toggle('bg-purple-500', !editing);
    dom.notesViewButton.classList.toggle('text-white', !editing);
    dom.notesViewButton.classList.toggle('bg-slate-300', editing);
    dom.notesViewButton.classList.toggle('dark:bg-slate-600', editing);
    if (!editing) {
        renderNotesPreview();
    }
}

function renderNotesPreview() {
    if (remarkableParser && sheet.notes) {
        dom.notesPreview.innerHTML = remarkableParser.render(sheet.notes);
    } else {
        dom.notesPreview.innerHTML = '';
    }
}

function handleNotesChange(event) {
    sheet.notes = event.target.value;
    // No need to re-render preview immediately during typing for performance.
}

function applyNotesFormat(formatType) {
    const textarea = dom.notesTextarea;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    let newText;

    switch (formatType) {
        case 'bold': newText = `**${selectedText}**`; break;
        case 'italic': newText = `*${selectedText}*`; break;
        case 'ul': newText = selectedText.split('\n').map(line => line.trim() ? `- ${line}` : '- ').join('\n'); break;
        case 'ol': newText = selectedText.split('\n').map((line, index) => line.trim() ? `${index + 1}. ${line}` : `${index + 1}. `).join('\n'); break;
        default: return;
    }
    
    sheet.notes = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
    textarea.value = sheet.notes; // Update textarea directly
    textarea.focus();
    textarea.setSelectionRange(start + newText.length - selectedText.length, start + newText.length - selectedText.length);
}


// --- SAVE/LOAD/PDF/RESET ---
function handleSave() {
    try {
        const data = JSON.stringify(sheet, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const a = createElement('a', {
            href: URL.createObjectURL(blob),
            download: `ble_ficha_${(sheet.pilotName || 'personagem').toLowerCase().replace(/\s+/g, '_')}.json`
        });
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
    } catch (error) {
        console.error("Error saving sheet:", error);
        alert("Erro ao salvar a ficha.");
    }
}

function handleLoad(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target?.result);
            const validatedData = { ...initialSheet }; // Start with a fresh initialSheet structure
            for (const key in initialSheet) {
                if (Object.prototype.hasOwnProperty.call(initialSheet, key)) {
                     if (Array.isArray(initialSheet[key])) {
                        validatedData[key] = Array.isArray(data[key]) ? data[key] : [];
                    } else if (data[key] !== undefined) {
                        validatedData[key] = data[key];
                    } else {
                         validatedData[key] = initialSheet[key]; // Default if not in loaded data
                    }
                }
            }
            sheet = validatedData;
            renderSheetValues(); // Update entire UI
            applyDarkMode(isDarkMode); // Re-apply dark mode dependent styles
        } catch (error) {
            alert('Erro ao carregar o arquivo. Verifique se o formato é válido.');
            console.error("JSON Parse Error:", error);
        }
    };
    reader.readAsText(file);
    event.target.value = ''; 
}

function generatePdf() {
    if (!window.html2canvas || !window.jspdf) {
        alert("Bibliotecas de PDF ainda não carregadas. Tente novamente em alguns segundos.");
        return;
    }
    const sheetElement = dom.sheetContainer;
    if (!sheetElement) {
        alert("Elemento da ficha não encontrado.");
        return;
    }
    const noPdfElements = qsa('.no-pdf');
    noPdfElements.forEach(b => b.style.visibility = 'hidden');

    // Ensure dark mode styles are captured if active
    const originalHtmlClasses = document.documentElement.className;
    if (isDarkMode && !document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.add('dark');
    }
    
    window.html2canvas(sheetElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9', 
        onclone: (documentClone) => {
             // Ensure cloned document has dark mode if active
            if (isDarkMode) documentClone.documentElement.classList.add('dark');
            else documentClone.documentElement.classList.remove('dark');
            // Re-apply styles that might be dynamically set by JS
            const clonedSheetContainer = documentClone.getElementById('sheet-container');
            if (clonedSheetContainer) {
                clonedSheetContainer.style.backgroundColor = isDarkMode ? '#020617' : '#ffffff'; // Tailwind slate-950 or white
                 clonedSheetContainer.style.borderColor = '#000000'; // Ensure border is black
            }
            // Force specific background for sections in clone for PDF
            documentClone.querySelectorAll('section[id$="-section"]').forEach(sec => {
                sec.style.backgroundColor = isDarkMode ? 'rgb(15 23 42 / 0.5)' : 'rgb(241 245 249 / 0.7)'; // slate-900/50 or slate-100/70
                sec.style.borderColor = isDarkMode ? '#334155' : '#cbd5e1'; // slate-700 or slate-300
            });
        }
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`ficha_ble_${(sheet.pilotName || 'personagem').toLowerCase().replace(/\s+/g, '_')}.pdf`);
    }).catch(err => {
        console.error("Erro ao gerar PDF:", err);
        alert("Ocorreu um erro ao gerar o PDF.");
    }).finally(() => {
        noPdfElements.forEach(b => b.style.visibility = 'visible');
        document.documentElement.className = originalHtmlClasses; // Restore original classes
    });
}

function resetSheet() {
    if (window.confirm("Tem certeza que deseja apagar todos os dados da ficha? Esta ação não pode ser desfeita.")) {
        sheet = JSON.parse(JSON.stringify(initialSheet)); // Deep copy
        renderSheetValues();
         applyDarkMode(isDarkMode); // Re-apply dark mode dependent styles
    }
}

// --- INITIALIZATION ---
function cacheDOMElements() {
    dom.appContainer = qs('#app-container');
    dom.sheetContainer = qs('#sheet-container');
    dom.darkModeToggle = qs('#darkModeToggle');
    dom.saveJsonButton = qs('#saveJsonButton');
    dom.loadJsonInput = qs('#loadJsonInput');
    dom.generatePdfButton = qs('#generatePdfButton');
    dom.resetSheetButton = qs('#resetSheetButton');
    
    // Pilot fields
    dom.pilotName = qs('#pilotName');
    dom.pilotConcept = qs('#pilotConcept');
    dom.pilotArchetype = qs('#pilotArchetype');
    dom.pilotProfileSelectorContainer = qs('#pilotProfileSelectorContainer');
    dom.pilotImageManagerContainer = qs('#pilotImageManagerContainer');
    dom.pilotP = qs('#pilotP');
    dom.pilotH = qs('#pilotH');
    dom.pilotR = qs('#pilotR');
    dom.pilotEstresse = qs('#pilotEstresse');
    dom.pilotValor = qs('#pilotValor');
    dom.pilotResourceBoxes = qs('#pilot-resource-boxes');
    dom.pilotListsContainer = qs('#pilot-lists-container');

    // Mecha fields
    dom.mechaName = qs('#mechaName');
    dom.mechaModel = qs('#mechaModel');
    dom.mechaEscala = qs('#mechaEscala');
    dom.mechaImageManagerContainer = qs('#mechaImageManagerContainer');
    dom.mechaP = qs('#mechaP');
    dom.mechaR = qs('#mechaR');
    dom.mechaResourceBoxes = qs('#mecha-resource-boxes');
    dom.mechaTepeques = qs('#mechaTepeques');
    dom.mechaListsContainer = qs('#mecha-lists-container');

    // Modal
    dom.modal = qs('#modal');
    dom.modalTitle = qs('#modalTitle');
    dom.modalBody = qs('#modalBody');
    dom.modalCloseButton = qs('#modalCloseButton');

    // Floating Notes
    dom.floatingNotesContainer = qs('#floatingNotesContainer');
    dom.openNotesButton = qs('#openNotesButton');
    dom.floatingNotesPanel = qs('#floatingNotesPanel');
    dom.minimizeNotesButton = qs('#minimizeNotesButton');
    dom.notesEditButton = qs('#notesEditButton');
    dom.notesViewButton = qs('#notesViewButton');
    dom.notesFormattingBar = qs('#notesFormattingBar');
    dom.notesTextarea = qs('#notesTextarea');
    dom.notesPreview = qs('#notesPreview');
}

function attachEventListeners() {
    dom.darkModeToggle.addEventListener('click', toggleDarkMode);
    dom.saveJsonButton.addEventListener('click', handleSave);
    dom.loadJsonInput.addEventListener('change', handleLoad);
    dom.generatePdfButton.addEventListener('click', generatePdf);
    dom.resetSheetButton.addEventListener('click', resetSheet);

    // Input fields
    const inputs = qsa('input[name], textarea[name], select[name]', dom.sheetContainer);
    inputs.forEach(input => {
        if (input.id === 'pilotArchetype') {
            input.addEventListener('change', handleArchetypeChange);
        } else if (input.name !== 'charProfile' && input.name !== 'charProfileCustomDesc') { // Handled by renderPilotProfileSelector
             input.addEventListener('input', handleInputChange); // Use 'input' for numbers too for responsiveness
             if (input.type === 'number') input.addEventListener('change', handleInputChange); // And 'change' for final value
        }
    });
    
    // Modal
    dom.modalCloseButton.addEventListener('click', closeModal);
    dom.modal.addEventListener('click', (e) => { if (e.target === dom.modal) closeModal(); }); // Close on overlay click

    // Floating Notes
    dom.openNotesButton.addEventListener('click', toggleNotesPanel);
    dom.minimizeNotesButton.addEventListener('click', toggleNotesPanel);
    dom.notesEditButton.addEventListener('click', () => setNotesEditMode(true));
    dom.notesViewButton.addEventListener('click', () => setNotesEditMode(false));
    dom.notesTextarea.addEventListener('input', handleNotesChange);
    qsa('#notesFormattingBar button[data-format]').forEach(button => {
        button.addEventListener('click', () => applyNotesFormat(button.dataset.format));
    });
}

function initApp() {
    cacheDOMElements();

    // Initialize Remarkable for notes
    if (window.Remarkable) {
        remarkableParser = new window.Remarkable();
    } else {
        console.warn("Remarkable library not loaded. Markdown preview for notes will not work.");
    }
    
    // Load dark mode preference
    try {
        const storedDarkMode = localStorage.getItem('darkMode');
        if (storedDarkMode !== null) {
            applyDarkMode(JSON.parse(storedDarkMode));
        } else {
            applyDarkMode(isDarkMode); // Use system preference
        }
    } catch(e) {
        applyDarkMode(isDarkMode); // Fallback to system preference
         console.warn("Could not load dark mode preference");
    }
    
    renderSheetValues();
    attachEventListeners();
    setNotesEditMode(true); // Default to edit mode for notes
    
    if(window.lucide) window.lucide.createIcons();
    console.log("Brigada Ligeira Estelar - Gerador de Ficha initialized.");
}

document.addEventListener('DOMContentLoaded', initApp);

 