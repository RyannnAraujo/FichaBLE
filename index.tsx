
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { Upload, FileDown, FileUp, Save, Trash2, ChevronDown, ChevronUp, PlusCircle, XCircle, Moon, Sun, Edit3, List, ListOrdered, Bold, Italic, Minimize2, MessageSquare, Image as ImageIcon } from 'lucide-react';

// --- Global Type Declarations for external libraries ---
declare global {
  interface Window {
    Remarkable: any;
    jspdf: { jsPDF: any; };
    html2canvas: any;
  }
}

interface ItemOption {
  name: string;
  desc: string;
  costText?: string; // Ex: "(1pt)", "(-2pt)"
  costVal?: number; // For potential future calculations
}
interface BaseItem {
  nome: string;
  desc: string;
  type?: string;
  options?: ItemOption[];
  custo?: string; // For items without 'select' type, like Archetypes
}
interface SheetItem extends BaseItem {
  originalName?: string; // To store the base name if an option is selected
}

// --- Define Sheet interface ---
interface Sheet {
  // Pilot
  pilotName: string;
  pilotConcept: string;
  pilotArchetype: string;
  charProfile: string; // Stores the name of the selected sub-profile
  charProfileCustomDesc: string;
  pilotP: number;
  pilotH: number;
  pilotR: number;
  pilotEstresse: number;
  pilotValor: number;
  pilotImage: string | null;
  charSkills: SheetItem[];
  charAdvantages: SheetItem[];
  charDisadvantages: SheetItem[];
  pilotPoderes: SheetItem[];
  pilotTecnicas: SheetItem[];
  pilotInventario: SheetItem[];


  // Mecha
  mechaImage: string | null;
  mechaName: string;
  mechaModel: string;
  mechaEscala: string;
  mechaP: number;
  mechaR: number;
  mechaAdvantages: SheetItem[];
  mechaDisadvantages: SheetItem[];
  mechaTepeques: string;


  // General
  notes: string;
}


// --- Banco de Dados do Sistema ---
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
        // Adicionar todas as outras opções de Ataque Especial aqui
      ]
    },
    { nome: "Base", desc: "Possui uma base de operações que serve como refúgio e local de recuperação.", custo: "(1pt)" },
    { nome: "Carismático", desc: "+2 em testes de Poder em interações sociais. Por 2PM, crítico com 5 ou 6.", custo: "(1pt)" },
    { nome: "Defesa Especial", desc: "Permite usar manobras defensivas especiais gastando PMs.", custo: "(1pt cada)", type: 'select', options: [
        { name: "Blindada", desc: "A defesa consegue acerto crítico com 5 ou 6. 1PM.", costText: "(Blindada)"},
        { name: "Bloqueio", desc: "Você defende usando Poder em vez de Resistência. 1PM.", costText: "(Bloqueio)"},
        { name: "Esquiva", desc: "Você defende usando Habilidade em vez de Resistência. 1PM.", costText: "(Esquiva)"},
         // Adicionar todas as outras opções de Defesa Especial aqui
      ]
    },
    { nome: "+Motivação", desc: "Ganha +10 Pontos de Motivação. Pode ser adquirida múltiplas vezes.", custo: "(1pt cada)" },
    { nome: "+Vida", desc: "Ganha +10 Pontos de Vida. Pode ser adquirida múltiplas vezes.", custo: "(1pt cada)" },
    { nome: "Voo", desc: "Capacidade de voar, seja por equipamento ou habilidade.", custo: "(1pt)" },
     // ... Adicionar TODAS as outras Vantagens e suas opções/custos
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
        // Adicionar outros códigos
      ]
    },
    // ... Adicionar TODAS as outras Desvantagens e suas opções/custos
  ],
  arquétipos: { // Completar esta lista conforme o livro
    "Nenhum": { custo: '0pt', vantagens: [], desvantagens: [] },
    "Humano": { custo: '0pt', vantagens: [{ nome: 'Mais Além', desc: 'Humanos possuem uma natureza resiliente. Uma vez por cena, um protagonista humano pode gastar 2PM para obter Ganho em um teste.' }], desvantagens: [] },
    "Andro-ginóide": { custo: '1pt', vantagens: [{ nome: 'Imune: Abiótico, Doenças, Resiliente, Sem Mente', desc: 'Imunidades inerentes.' }, { nome: 'Carismático', desc: 'Naturalmente charmoso e persuasivo.'}], desvantagens: [{ nome: 'Artificial', desc: 'Não pode ser curado, apenas consertado.'}, { nome: 'Destacado', desc: 'Sua aparência é única e chama a atenção.'}] },
    "Ciborgue": { custo: '2pt', vantagens: [{ nome: 'Construto Vivo', desc: 'Pode ser curado ou consertado.'}, { nome: 'Imune: Abiótico, Doenças, Resiliente', desc: 'Imunidades parciais.' }], desvantagens: [{ nome: 'Antipático', desc: 'Sua aparência artificial incomoda os outros.'}] },
    // Adicionar todos os outros arquétipos
  },
  perfis: { // Reestruturado em categorias
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
    "O Músculo": [
        { nome: "Barulhento", desc: "Fanfarrão, exagerado, chegado à ação e, às vezes, não muito esperto. Tem um jeito meio intrometido e pode amolar um pouco os demais membros do time, mas sua disposição é invejável." },
        // Adicionar outros perfis de Músculo
    ],
    "O Cérebro": [
        { nome: "Técnico", desc: "Um geek de carteirinha e localiza de cara eventuais nós tecnológicos para desatar. Ele pode até não ser um gênio, mas é um dos melhores nisso. A perícia Máquinas é fundamental." },
        // Adicionar outros perfis de Cérebro
    ],
    "O Coração": [
        { nome: "Bem-intencionado", desc: "Sua motivação sincera é ajudar. Todos tendem a gostar dele e é gentil com todos. Se pilota um robô gigante, é por compreender a necessidade de sacrifícios pessoais." },
        // Adicionar outros perfis de Coração
    ]
    // Adicionar todas as 5 categorias principais e seus 4 sub-perfis cada
  },
  poderes: [ // Popular com dados reais do BLE
    { nome: "Feitos Atléticos", desc: "Capacidades físicas sobre-humanas.", custo: "(Variável)"},
    { nome: "Rajada de Energia", desc: "Dispara energia pelas mãos.", custo: "(2PM)", type: 'select', options: [
      { name: "Simples", desc: "Dano Padrão."},
      { name: "Penetrante", desc: "Ignora parte da defesa."}
    ]},
    // ...
  ],
  tecnicas: [ // Popular com dados reais do BLE
    { nome: "Reerguer-se", desc: "Recupera-se rapidamente de tombos ou atordoamentos.", custo: "(Passiva)"},
    { nome: "Disparo Certeiro", desc: "Aumenta a precisão de um ataque à distância.", custo: "(3PM)"},
    // ...
  ],
  inventario: [{nome: "Kit de Primeiros Socorros", desc: "Permite testes de Medicina em campo."}], // Placeholder
};

// --- Initial Sheet Data ---
// Helper to get the first profile for initialSheet
const getFirstProfileName = () => {
  const firstCategoryKey = Object.keys(systemData.perfis)[0] as keyof typeof systemData.perfis;
  if (firstCategoryKey && systemData.perfis[firstCategoryKey] && systemData.perfis[firstCategoryKey].length > 0) {
    return systemData.perfis[firstCategoryKey][0].nome;
  }
  return ''; // Fallback if no profiles are defined
};

const initialSheet: Sheet = {
  pilotName: '',
  pilotConcept: '',
  pilotArchetype: 'Nenhum',
  charProfile: getFirstProfileName(),
  charProfileCustomDesc: '',
  pilotP: 1,
  pilotH: 1,
  pilotR: 1,
  pilotEstresse: 0,
  pilotValor: 0,
  pilotImage: null,
  charSkills: [],
  charAdvantages: [],
  charDisadvantages: [],
  pilotPoderes: [],
  pilotTecnicas: [],
  pilotInventario: [],

  mechaImage: null,
  mechaName: '',
  mechaModel: '',
  mechaEscala: 'Gigante',
  mechaP: 1,
  mechaR: 1,
  mechaAdvantages: [],
  mechaDisadvantages: [],
  mechaTepeques: '',

  notes: '',
};


// --- UI Components ---

// Modal Component
const Modal = ({ isOpen, onClose, title, children } : { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content dark:bg-slate-800 dark:text-slate-100" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-purple-600 dark:text-purple-400">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            <XCircle size={24} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const Section = ({ title, children, className, isDarkMode, ...props }: { title: string, children: React.ReactNode, isDarkMode: boolean, className?: string, [key: string]: any }) => (
    <div className={`p-4 sm:p-6 mb-6 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100/70 border-slate-300'} shadow-md border ${className}`} {...props}>
        <h2 className={`sheet-section-title ${isDarkMode ? 'text-purple-400 border-purple-500/50' : 'text-purple-600 border-purple-600/50'}`}>{title}</h2>
        {children}
    </div>
);

const Field = ({ label, id, name, value, onChange, type = "text", placeholder = "", rows = 1, className, children, ...props }: { label: string, id: string, name: string, value: string | number, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void, type?: string, placeholder?: string, rows?: number, className?: string, children?: React.ReactNode, [key: string]: any }) => (
    <div className={`field-container ${className}`}>
        <label htmlFor={id} className="sheet-label mb-0">{label}</label>
        {type === 'textarea' ? (
            <textarea id={id} name={name} value={value} onChange={onChange} placeholder={placeholder} rows={rows} className="sheet-textarea flex-grow mt-0" {...props}></textarea>
        ) : type === 'select' ? (
             <select id={id} name={name} value={value} onChange={onChange} className="sheet-select mt-0" {...props}>
                {children}
            </select>
        ) : (
            <input type={type} id={id} name={name} value={value} onChange={onChange} placeholder={placeholder} min={type === "number" ? "0" : undefined} className="sheet-input mt-0" {...props} />
        )}
    </div>
);

const ResourceBox = ({ label, value, isDarkMode }: { label: string, value: string | number, isDarkMode: boolean }) => (
    <div className={`resource-box ${isDarkMode ? 'dark' : ''}`}>
        <label className="resource-box-label">{label}</label>
        <div className={`resource-box-value`}>{value}</div>
    </div>
);

const ImageManager = ({ imageSrc, onImageChange, entityName, isDarkMode }: { imageSrc: string | null, onImageChange: (base64: string | null) => void, entityName: string, isDarkMode: boolean }) => {
    const hiddenFileInput = useRef<HTMLInputElement>(null);

    const handleUploadClick = () => hiddenFileInput.current?.click();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => onImageChange(e.target?.result as string);
            reader.readAsDataURL(event.target.files[0]);
        }
    };

    const handleRemoveImage = () => {
        onImageChange(null);
    };

    return (
        <div className={`image-manager-container ${isDarkMode ? 'dark' : ''}`}>
            <div className={`image-preview ${isDarkMode ? 'dark' : ''}`}>
                {imageSrc ? (
                    <img src={imageSrc} alt={`Imagem de ${entityName}`} />
                ) : (
                    <ImageIcon size={48} className="text-slate-400 dark:text-slate-500" />
                )}
            </div>
            <div className="space-y-2 mt-2">
                <button 
                  onClick={handleUploadClick} 
                  className="sheet-button text-sm w-full flex items-center justify-center bg-slate-500 text-white hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-700"
                >
                    <Upload size={16} className="mr-1"/> Enviar Imagem
                </button>
                {imageSrc && (
                     <button 
                       onClick={handleRemoveImage} 
                       className="sheet-button text-sm w-full flex items-center justify-center mt-1 bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                     >
                        <Trash2 size={16} className="mr-1"/> Remover Imagem
                    </button>
                )}
            </div>
            <input type="file" ref={hiddenFileInput} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
        </div>
    );
};


const AddableList = ({ title, data, onAdd, onCustomAdd, isDarkMode }: { title: string, data: SheetItem[], onAdd: (item: SheetItem) => void, onCustomAdd: () => void, isDarkMode: boolean }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className={`mb-2 rounded-md border ${isDarkMode ? 'bg-slate-700/80 border-slate-600' : 'bg-slate-200 border-slate-300'}`}>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className={`w-full flex justify-between items-center p-3 text-left font-bold transition-colors ${isDarkMode ? 'text-slate-200 hover:bg-slate-600/80' : 'text-slate-800 hover:bg-slate-300'}`} aria-expanded={isOpen}>
                Adicionar {title}
                {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {isOpen && (
                <div className={`p-3 border-t  max-h-60 overflow-y-auto ${isDarkMode ? 'border-slate-600' : 'border-slate-300'}`}>
                    {data.map(item => (
                        <div key={item.nome} className={`p-2 mb-2 rounded-md transition-colors group ${isDarkMode ? 'hover:bg-purple-900/50' : 'hover:bg-purple-100'}`}>
                            <button type="button" onClick={() => onAdd(item)} className="w-full text-left flex justify-between items-center">
                                <div>
                                    <p className={`font-semibold text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{item.nome} {item.custo || ''}</p>
                                    <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{item.desc}</p>
                                </div>
                                <PlusCircle size={20} className="text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </div>
                    ))}
                    <div className={`p-2 mt-2 rounded-md transition-colors group ${isDarkMode ? 'bg-blue-900/50 hover:bg-blue-800/60' : 'bg-blue-100 hover:bg-blue-200'}`}>
                         <button type="button" onClick={onCustomAdd} className="w-full text-left flex justify-between items-center">
                            <p className={`font-semibold text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>Adicionar {title} Customizado...</p>
                            <Edit3 size={20} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const SelectedItemCard = ({ item, onRemove, isDarkMode }: { item: SheetItem, onRemove: () => void, isDarkMode: boolean }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className={`p-3 rounded-lg border shadow-sm mb-2 ${isDarkMode ? 'bg-slate-700/70 border-slate-600' : 'bg-white border-slate-300'}`}>
            <div className="flex justify-between items-center">
                <span className="font-semibold text-sm">{item.nome}</span>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setIsOpen(!isOpen)} className="text-slate-500 hover:text-purple-500" aria-expanded={isOpen}>
                        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <button type="button" onClick={onRemove} className="text-red-500 hover:text-red-700">
                        <XCircle size={18} />
                    </button>
                </div>
            </div>
            {isOpen && (
                <p className={`text-xs mt-2 pt-2 border-t ${isDarkMode ? 'text-slate-400 border-slate-600' : 'text-slate-600 border-slate-200'}`}>{item.desc}</p>
            )}
        </div>
    );
};

const PilotProfileSelector = ({ profiles, selectedProfile, onSelectProfile, onCustomProfileChange, customProfileValue, isDarkMode } : { profiles: typeof systemData.perfis, selectedProfile: string, onSelectProfile: (profileName: string) => void, onCustomProfileChange: (e: React.ChangeEvent<HTMLInputElement>) => void, customProfileValue: string, isDarkMode: boolean }) => {
    const [showCustom, setShowCustom] = useState(selectedProfile === "Customizado" || !Object.values(profiles).flat().find(p => p.nome === selectedProfile));

    useEffect(() => {
        setShowCustom(selectedProfile === "Customizado" || !Object.values(profiles).flat().find(p => p.nome === selectedProfile));
    }, [selectedProfile, profiles]);

    const handleSelection = (profileName: string) => {
        onSelectProfile(profileName);
        setShowCustom(profileName === "Customizado");
    };
    
    const getCurrentProfileDesc = () => {
        if (selectedProfile === "Customizado" || showCustom) return "";
        for (const category in profiles) {
            const profile = profiles[category as keyof typeof profiles].find(p => p.nome === selectedProfile);
            if (profile) return profile.desc;
        }
        return "";
    };


    return (
        <div className="field-container">
          <label htmlFor="charProfileSelect" className="sheet-label">Perfil</label>
          <select
            id="charProfileSelect"
            name="charProfile"
            value={showCustom ? "Customizado" : selectedProfile}
            onChange={(e) => handleSelection(e.target.value)}
            className="sheet-select mt-1 block w-full"
          >
            <option value="" disabled={!showCustom && selectedProfile !== ""}>Selecione um Perfil</option>
            {Object.entries(profiles).map(([categoryName, subProfiles]) => (
              <optgroup label={categoryName} key={categoryName}>
                {subProfiles.map(p => <option key={p.nome} value={p.nome}>{p.nome}</option>)}
              </optgroup>
            ))}
            <option value="Customizado">Customizado...</option>
          </select>
          {!showCustom && selectedProfile && selectedProfile !== "Customizado" && (
            <p className={`text-xs text-slate-600 dark:text-slate-400 mt-1 p-2 rounded-md ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>{getCurrentProfileDesc()}</p>
          )}
          {showCustom && (
            <div className="mt-2">
              <Field label="Descrição do Perfil Customizado" id="charProfileCustomDesc" name="charProfileCustomDesc" value={customProfileValue} onChange={onCustomProfileChange as any} placeholder="Descreva o perfil customizado" />
            </div>
          )}
        </div>
      );
};

const FloatingNotes = ({ value, onChange } : {value: string, onChange: (newText: string) => void}) => {
    const [isOpen, setIsOpen] = useState(false);
    const mdRef = useRef<any>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
      if (!mdRef.current && window.Remarkable) {
          mdRef.current = new window.Remarkable();
      }
    }, []);

    const applyFormat = (formatType: 'bold' | 'italic' | 'ul' | 'ol') => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = textarea.value.substring(start, end);
      let newText;

      switch (formatType) {
        case 'bold':
          newText = `**${selectedText}**`;
          break;
        case 'italic':
          newText = `*${selectedText}*`;
          break;
        case 'ul':
          newText = selectedText.split('\n').map(line => line.trim() ? `- ${line}` : '- ').join('\n');
          break;
        case 'ol':
          newText = selectedText.split('\n').map((line, index) => line.trim() ? `${index + 1}. ${line}` : `${index+1}. `).join('\n');
          break;
        default:
          return;
      }
      
      const updatedValue = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
      onChange(updatedValue); 
      textarea.focus();
    };


    const [isEditing, setIsEditing] = useState(true);

    if (!isOpen) {
      return (
        <div className="floating-notes-container no-pdf">
          <button 
            type="button" 
            onClick={() => setIsOpen(true)} 
            className="p-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition"
            aria-label="Abrir Anotações"
          >
            <MessageSquare size={24} />
          </button>
        </div>
      );
    }

    return (
      <div className="floating-notes-panel no-pdf">
        <div className="flex justify-between items-center p-2 bg-slate-200 dark:bg-slate-700 border-b border-slate-300 dark:border-slate-600">
          <h3 className="font-orbitron font-bold text-lg text-purple-600 dark:text-purple-400">Anotações</h3>
          <div className="flex items-center">
             <button type="button" onClick={() => setIsEditing(true)} className={`px-2 py-1 text-xs rounded-l-md ${isEditing ? 'bg-purple-500 text-white' : 'bg-slate-300 dark:bg-slate-600'}`}>Editar</button>
             <button type="button" onClick={() => setIsEditing(false)} className={`px-2 py-1 text-xs rounded-r-md ${!isEditing ? 'bg-purple-500 text-white' : 'bg-slate-300 dark:bg-slate-600'}`}>Ver</button>
            <button onClick={() => setIsOpen(false)} className="ml-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300" aria-label="Minimizar Anotações">
              <Minimize2 size={20} />
            </button>
          </div>
        </div>
        {isEditing && (
          <div className="notes-formatting-bar">
            <button onClick={() => applyFormat('bold')} aria-label="Negrito"><Bold size={16}/></button>
            <button onClick={() => applyFormat('italic')} aria-label="Itálico"><Italic size={16}/></button>
            <button onClick={() => applyFormat('ul')} aria-label="Lista não ordenada"><List size={16}/></button>
            <button onClick={() => applyFormat('ol')} aria-label="Lista ordenada"><ListOrdered size={16}/></button>
          </div>
        )}
        <div className="flex-grow overflow-y-auto p-2">
          {isEditing ? (
            <textarea 
              ref={textareaRef}
              value={value} 
              onChange={(e) => onChange(e.target.value)} 
              rows={10} 
              className="notes-textarea w-full h-full bg-transparent focus:outline-none resize-none text-slate-800 dark:text-slate-200" 
              placeholder="Suas anotações..."
            ></textarea>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none text-slate-800 dark:text-slate-200" dangerouslySetInnerHTML={{ __html: mdRef.current && typeof mdRef.current.render === 'function' ? mdRef.current.render(value) : '' }}></div>
          )}
        </div>
      </div>
    );
};

const DarkModeToggle = ({ isDarkMode, setIsDarkMode }: { isDarkMode: boolean, setIsDarkMode: (value: boolean | ((prev: boolean) => boolean)) => void }) => {
  return (
    <button
      onClick={() => setIsDarkMode(prev => !prev)}
      className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-300'}`}
      aria-label={isDarkMode ? "Ativar modo claro" : "Ativar modo escuro"}
    >
      {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-slate-500" />}
    </button>
  );
};

// Main App Component
function App() {
    const [sheet, setSheet] = useState<Sheet>(initialSheet);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const storedDarkMode = localStorage.getItem('darkMode');
            if (storedDarkMode !== null) {
                return JSON.parse(storedDarkMode);
            }
            return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const matcher = window.matchMedia('(prefers-color-scheme: dark)');
            const listener = (e: MediaQueryListEvent) => {
                if (localStorage.getItem('darkMode') === null) {
                    setIsDarkMode(e.matches);
                }
            };
            matcher.addEventListener('change', listener);
            return () => matcher.removeEventListener('change', listener);
        }
    }, []);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        if (typeof window !== 'undefined') {
            localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
        }
    }, [isDarkMode]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<{ title: string; options?: ItemOption[]; itemType?: string; parentItem?: SheetItem; category?: 'char' | 'mecha'; field?: keyof Sheet; customType?: 'pericia' | 'vantagem' | 'desvantagem' | 'poder' | 'tecnica' | 'inventario' } | null>(null);
    const [customItemName, setCustomItemName] = useState('');
    const [customItemDesc, setCustomItemDesc] = useState('');
    
    const [selectedProfileName, setSelectedProfileName] = useState(sheet.charProfile || getFirstProfileName());
    const [customProfileDesc, setCustomProfileDesc] = useState(sheet.charProfile === "Customizado" ? sheet.charProfileCustomDesc : '');


    const pilotPA = Math.max(1, sheet.pilotP);
    const pilotPM = Math.max(1, sheet.pilotH * 5);
    const pilotPV = Math.max(1, sheet.pilotR * 5);

    const mechaPA = Math.max(1, sheet.mechaP);
    const mechaPM = Math.max(1, sheet.pilotH * 5); 
    const mechaPV = Math.max(1, sheet.mechaR * 5);
    const mechaAreas = Math.max(1, sheet.mechaR * 2);


     const handleAddItem = (field: keyof Sheet, item: SheetItem, category: 'char' | 'mecha') => {
      if (item.type === 'select' && item.options) {
        setModalConfig({ title: `Escolha uma opção para ${item.nome}`, options: item.options, parentItem: item, category, field });
        setIsModalOpen(true);
      } else {
        setSheet(prev => {
            const listKey = field as keyof Sheet;
            const currentList = prev[listKey] as SheetItem[] | undefined;
             const itemToAdd = item.custo ? {...item, nome: `${item.nome} ${item.custo}`} : item;
            if (Array.isArray(currentList) && currentList.some(i => i.nome === itemToAdd.nome)) return prev;
            return { ...prev, [listKey]: Array.isArray(currentList) ? [...currentList, itemToAdd] : [itemToAdd] };
        });
      }
    };

    const handleOptionSelected = (selectedOption: ItemOption) => {
      if (modalConfig && modalConfig.parentItem && modalConfig.field) {
        const newItem: SheetItem = {
          ...modalConfig.parentItem,
          originalName: modalConfig.parentItem.nome,
          nome: selectedOption.name, 
          desc: selectedOption.desc || modalConfig.parentItem.desc,
          type: undefined, 
          options: undefined 
        };
        const fieldKey = modalConfig.field as keyof Sheet;

        setSheet(prev => {
            const currentList = prev[fieldKey] as SheetItem[] | undefined;
            if (Array.isArray(currentList) && currentList.some(i => i.nome === newItem.nome)) return prev;
            return { ...prev, [fieldKey]: Array.isArray(currentList) ? [...currentList, newItem] : [newItem] };
        });
      }
      setIsModalOpen(false);
      setModalConfig(null);
    };

    const openCustomModal = (type: 'pericia' | 'vantagem' | 'desvantagem' | 'poder' | 'tecnica' | 'inventario', field: keyof Sheet, category: 'char' | 'mecha') => {
      setCustomItemName('');
      setCustomItemDesc('');
      let titleSuffix = '';
      if (type === 'pericia') titleSuffix = 'Perícia';
      else if (type === 'vantagem') titleSuffix = 'Vantagem';
      else if (type === 'desvantagem') titleSuffix = 'Desvantagem';
      else if (type === 'poder') titleSuffix = 'Poder';
      else if (type === 'tecnica') titleSuffix = 'Técnica';
      else if (type === 'inventario') titleSuffix = 'Item de Inventário';
      
      setModalConfig({ title: `Adicionar ${titleSuffix} Customizada`, field, category, customType: type });
      setIsModalOpen(true);
    };
    
    const handleSaveCustomItem = () => {
      if (modalConfig && modalConfig.field && modalConfig.customType && customItemName) {
        const newItem: SheetItem = {
          nome: customItemName,
          desc: customItemDesc,
        };
        const fieldKey = modalConfig.field as keyof Sheet;
        setSheet(prev => {
            const currentList = prev[fieldKey] as SheetItem[] | undefined;
            if (Array.isArray(currentList) && currentList.some(i => i.nome === newItem.nome)) return prev;
            return { ...prev, [fieldKey]: Array.isArray(currentList) ? [...currentList, newItem] : [newItem] };
        });
      }
      setIsModalOpen(false);
      setModalConfig(null);
    };

    const handleProfileSelect = (profileName: string) => {
        setSelectedProfileName(profileName);
        if (profileName !== "Customizado") {
            setSheet(prev => ({ ...prev, charProfile: profileName, charProfileCustomDesc: '' }));
            setCustomProfileDesc('');
        } else {
            setSheet(prev => ({ ...prev, charProfile: "Customizado", charProfileCustomDesc: prev.charProfileCustomDesc || "" }));
            setCustomProfileDesc(sheet.charProfileCustomDesc || "");
        }
    };

    const handleCustomProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDesc = e.target.value;
        setCustomProfileDesc(newDesc);
        setSheet(prev => ({ ...prev, charProfile: "Customizado", charProfileCustomDesc: newDesc }));
    };
    
    useEffect(() => {
        const initialProfile = sheet.charProfile;
        const allProfilesFlat = Object.values(systemData.perfis).flat();
        if (initialProfile && initialProfile !== "Customizado" && allProfilesFlat.some(p => p.nome === initialProfile)) {
            setSelectedProfileName(initialProfile);
            setCustomProfileDesc(''); 
        } else if (initialProfile === "Customizado" || (initialProfile && !allProfilesFlat.some(p => p.nome === initialProfile))) {
            setSelectedProfileName("Customizado");
            setCustomProfileDesc(sheet.charProfileCustomDesc || initialProfile || ''); 
        } else if (!initialProfile && allProfilesFlat.length > 0) {
            const firstProfName = getFirstProfileName();
            setSelectedProfileName(firstProfName);
            setSheet(prev => ({...prev, charProfile: firstProfName}));
        }
    }, [sheet.charProfile, sheet.charProfileCustomDesc]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let processedValue: string | number = value;
        if (type === 'number') {
          processedValue = value === '' ? 0 : parseFloat(value);
          if (isNaN(processedValue as number)) processedValue = 0;
        }
        setSheet(prev => ({ ...prev, [name]: processedValue }));
    };

    const handleArchetypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const archetypeKey = e.target.value;
        const currentArchetypeData = systemData.arquétipos[sheet.pilotArchetype as keyof typeof systemData.arquétipos];
        const newArchetypeData = systemData.arquétipos[archetypeKey as keyof typeof systemData.arquétipos];
    
        if (newArchetypeData) {
            let updatedAdvantages = sheet.charAdvantages;
            if (currentArchetypeData) {
                updatedAdvantages = updatedAdvantages.filter(adv => 
                    !currentArchetypeData.vantagens.some(archAdv => archAdv.nome === adv.nome.split(" (")[0] || archAdv.nome === adv.originalName)
                );
            }
            updatedAdvantages = [...updatedAdvantages, ...newArchetypeData.vantagens.map(adv => ({...adv, nome: `${adv.nome} ${adv.custo || ''}`.trim()}))];
    
            let updatedDisadvantages = sheet.charDisadvantages;
            if (currentArchetypeData) {
                updatedDisadvantages = updatedDisadvantages.filter(dis => 
                    !currentArchetypeData.desvantagens.some(archDis => archDis.nome === dis.nome.split(" (")[0] || archDis.nome === dis.originalName)
                );
            }
            updatedDisadvantages = [...updatedDisadvantages, ...newArchetypeData.desvantagens.map(dis => ({...dis, nome: `${dis.nome} ${dis.custo || ''}`.trim()}))];
    
            setSheet(prev => ({
                ...prev,
                pilotArchetype: archetypeKey,
                charAdvantages: updatedAdvantages.filter((value, index, self) => self.findIndex(t => t.nome === value.nome) === index), 
                charDisadvantages: updatedDisadvantages.filter((value, index, self) => self.findIndex(t => t.nome === value.nome) === index), 
            }));
        }
    };
    
    const handleRemoveItem = (field: keyof Sheet, itemName: string, category: 'char' | 'mecha') => {
        setSheet(prev => ({
            ...prev,
            [field]: (prev[field] as SheetItem[]).filter(item => item.nome !== itemName)
        }));
    };

    const handleSave = () => {
        try {
            const data = JSON.stringify(sheet, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `ble_ficha_${(sheet.pilotName || 'personagem').toLowerCase().replace(/\s+/g, '_')}.json`;
            a.click();
            URL.revokeObjectURL(a.href);
        } catch (error) {
            console.error("Error saving sheet:", error);
            alert("Erro ao salvar a ficha.");
        }
    };

    const handleLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                const validatedData = { ...initialSheet };
                for (const key in initialSheet) {
                    if (Array.isArray(initialSheet[key as keyof Sheet])) {
                        (validatedData as any)[key] = data[key] || [];
                    } else {
                         (validatedData as any)[key] = data[key] !== undefined ? data[key] : initialSheet[key as keyof Sheet];
                    }
                }
                setSheet(validatedData as Sheet);
                setSelectedProfileName(validatedData.charProfile || getFirstProfileName());
                setCustomProfileDesc(validatedData.charProfile === "Customizado" ? validatedData.charProfileCustomDesc : '');

            } catch (error) {
                alert('Erro ao carregar o arquivo. Verifique se o formato é válido.');
                console.error("JSON Parse Error:", error);
            }
        };
        reader.readAsText(file);
        event.target.value = ''; 
    };

    const generatePdf = () => {
        if (!window.html2canvas || !window.jspdf) {
            alert("Bibliotecas de PDF ainda não carregadas. Tente novamente em alguns segundos.");
            return;
        }
        const sheetElement = document.getElementById('sheet-container');
        if (!sheetElement) {
            alert("Elemento da ficha não encontrado.");
            return;
        }
        const buttons = document.querySelectorAll('.no-pdf');
        buttons.forEach(b => (b as HTMLElement).style.visibility = 'hidden');

        window.html2canvas(sheetElement, {
            scale: 2,
            useCORS: true,
            backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9', 
            onclone: (documentClone) => {
                if (isDarkMode) {
                    documentClone.documentElement.classList.add('dark');
                }
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
            buttons.forEach(b => (b as HTMLElement).style.visibility = 'visible');
        }).catch(err => {
            console.error("Erro ao gerar PDF:", err);
            alert("Ocorreu um erro ao gerar o PDF.");
            buttons.forEach(b => (b as HTMLElement).style.visibility = 'visible');
        });
    };

    const resetSheet = () => {
        if (window.confirm("Tem certeza que deseja apagar todos os dados da ficha? Esta ação não pode ser desfeita.")) {
            setSheet(initialSheet);
            setSelectedProfileName(initialSheet.charProfile);
            setCustomProfileDesc(initialSheet.charProfileCustomDesc);
        }
    };
    
    const handleImageChange = (imageType: 'pilotImage' | 'mechaImage') => (base64: string | null) => {
        setSheet(prev => ({ ...prev, [imageType]: base64 }));
    };


    return (
        <div className={`min-h-screen p-2 sm:p-4 md:p-6 font-roboto-condensed transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-200 text-slate-900'}`}>
            <div id="sheet-container" className={`max-w-5xl mx-auto p-4 sm:p-6 shadow-2xl border-2 ${isDarkMode ? 'bg-slate-900 border-black' : 'bg-white border-black'}`}>
                <header className="relative text-center mb-6 no-pdf">
                    <div className="flex flex-col items-center justify-center mb-4">
                        <img src="https://brigadaligeiraestelar.com/wp-content/uploads/2025/04/cropped-logo-branco-brigada-png-e1744253240139.png" alt="Brigada Ligeira Estelar Logo" className="h-24 mb-2"/>
                        <div>
                            <h1 className={`font-orbitron text-3xl sm:text-4xl font-black tracking-tighter ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>Gerador de Ficha</h1>
                            <p className={`text-md ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Brigada Ligeira Estelar</p>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0">
                        <DarkModeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
                    </div>
                </header>
                
                 <div className="action-buttons-container no-pdf">
                    <button onClick={handleSave} className="sheet-button bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"><Save size={16} className="mr-1"/> Salvar JSON</button>
                    <label className="sheet-button bg-slate-500 text-white hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-700 cursor-pointer"><FileUp size={16} className="mr-1"/> Carregar JSON <input type="file" accept=".json" onChange={handleLoad} className="hidden"/></label>
                    <button onClick={generatePdf} className="sheet-button bg-slate-500 text-white hover:bg-slate-600 dark:bg-slate-600 dark:hover:bg-slate-700"><FileDown size={16} className="mr-1"/> Gerar PDF</button>
                    <button onClick={resetSheet} className="sheet-button bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"><Trash2 size={16} className="mr-1"/> Resetar Ficha</button>
                </div>


                <Section title="Piloto" className="border-t-4 border-black" isDarkMode={isDarkMode}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-1">
                            <Field label="Nome do Piloto" id="pilotName" name="pilotName" value={sheet.pilotName} onChange={handleChange} />
                            <Field label="Conceito" id="pilotConcept" name="pilotConcept" value={sheet.pilotConcept} onChange={handleChange} />
                             <Field label="Arquétipo" id="pilotArchetype" name="pilotArchetype" value={sheet.pilotArchetype} onChange={handleArchetypeChange} type="select">
                                {Object.keys(systemData.arquétipos).map(archName => (
                                    <option key={archName} value={archName}>{archName} ({systemData.arquétipos[archName as keyof typeof systemData.arquétipos].custo})</option>
                                ))}
                            </Field>
                            <PilotProfileSelector 
                                profiles={systemData.perfis}
                                selectedProfile={selectedProfileName}
                                onSelectProfile={handleProfileSelect}
                                customProfileValue={customProfileDesc}
                                onCustomProfileChange={handleCustomProfileChange}
                                isDarkMode={isDarkMode}
                            />
                        </div>
                        <ImageManager imageSrc={sheet.pilotImage} onImageChange={handleImageChange('pilotImage')} entityName="Piloto" isDarkMode={isDarkMode}/>
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4">
                        <Field label="Poder (P)" id="pilotP" name="pilotP" type="number" value={sheet.pilotP} onChange={handleChange} />
                        <Field label="Habilidade (H)" id="pilotH" name="pilotH" type="number" value={sheet.pilotH} onChange={handleChange} />
                        <Field label="Resistência (R)" id="pilotR" name="pilotR" type="number" value={sheet.pilotR} onChange={handleChange} />
                    </div>
                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 my-4">
                        <ResourceBox label="PA" value={pilotPA} isDarkMode={isDarkMode} />
                        <ResourceBox label="PM" value={pilotPM} isDarkMode={isDarkMode} />
                        <ResourceBox label="PV" value={pilotPV} isDarkMode={isDarkMode} />
                        <Field label="Estresse" id="pilotEstresse" name="pilotEstresse" type="number" value={sheet.pilotEstresse} onChange={handleChange} className="md:col-span-1"/>
                        <Field label="Valor" id="pilotValor" name="pilotValor" type="number" value={sheet.pilotValor} onChange={handleChange} className="md:col-span-1"/>
                    </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { title: 'Perícias', field: 'charSkills', data: systemData.pericias, customType: 'pericia'},
                            { title: 'Vantagens', field: 'charAdvantages', data: systemData.vantagens, customType: 'vantagem'},
                            { title: 'Desvantagens', field: 'charDisadvantages', data: systemData.desvantagens, customType: 'desvantagem'},
                            { title: 'Poderes', field: 'pilotPoderes', data: systemData.poderes, customType: 'poder'},
                            { title: 'Técnicas', field: 'pilotTecnicas', data: systemData.tecnicas, customType: 'tecnica'},
                            { title: 'Inventário', field: 'pilotInventario', data: systemData.inventario, customType: 'inventario'},
                        ].map(list => (
                            <div key={list.title} className="flex flex-col gap-2">
                                <h3 className="sheet-label inline-block !mb-0">{list.title}</h3>
                                <AddableList 
                                    title={list.title} 
                                    data={list.data as SheetItem[]} 
                                    onAdd={(item) => handleAddItem(list.field as keyof Sheet, item, 'char')} 
                                    onCustomAdd={() => openCustomModal(list.customType as any, list.field as keyof Sheet, 'char')}
                                    isDarkMode={isDarkMode} 
                                />
                                <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                                    {(sheet[list.field as keyof Sheet] as SheetItem[]).map((item, index) => (
                                        <SelectedItemCard key={`${item.nome}-${index}`} item={item} onRemove={() => handleRemoveItem(list.field as keyof Sheet, item.nome, 'char')} isDarkMode={isDarkMode} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </Section>
                
                <Section title="Máquina de Combate (Mecha)" className="border-t-4 border-black" isDarkMode={isDarkMode}>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 space-y-1">
                            <Field label="Nome do Mecha" id="mechaName" name="mechaName" value={sheet.mechaName} onChange={handleChange} />
                            <Field label="Modelo" id="mechaModel" name="mechaModel" value={sheet.mechaModel} onChange={handleChange} />
                            <Field label="Escala" id="mechaEscala" name="mechaEscala" value={sheet.mechaEscala} onChange={handleChange} />
                        </div>
                        <ImageManager imageSrc={sheet.mechaImage} onImageChange={handleImageChange('mechaImage')} entityName="Mecha" isDarkMode={isDarkMode}/>
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4">
                        <Field label="Poder (Mecha)" id="mechaP" name="mechaP" type="number" value={sheet.mechaP} onChange={handleChange} />
                        <div className="field-container">
                            <label className="sheet-label">Habilidade (Mecha)</label>
                            <input type="text" value="Piloto (H)" readOnly className={`sheet-input mt-0 ${isDarkMode? 'dark:bg-slate-600 dark:text-slate-400' : 'bg-slate-200 text-slate-500'} cursor-not-allowed`} />
                        </div>
                        <Field label="Resistência (Mecha)" id="mechaR" name="mechaR" type="number" value={sheet.mechaR} onChange={handleChange} />
                    </div>
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-4">
                        <ResourceBox label="PA (Mecha)" value={mechaPA} isDarkMode={isDarkMode} />
                        <ResourceBox label="PM (Mecha)" value={mechaPM} isDarkMode={isDarkMode} />
                        <ResourceBox label="PV (Mecha)" value={mechaPV} isDarkMode={isDarkMode} />
                        <ResourceBox label="Áreas" value={mechaAreas} isDarkMode={isDarkMode} />
                    </div>
                    <Field label="Tepeques" id="mechaTepeques" name="mechaTepeques" type="textarea" value={sheet.mechaTepeques} onChange={handleChange} rows={4}/>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="flex flex-col gap-2">
                            <h3 className="sheet-label inline-block !mb-0">Vantagens (Mecha)</h3>
                            <AddableList title="Vantagens" data={systemData.vantagens as SheetItem[]} onAdd={(item) => handleAddItem('mechaAdvantages', item, 'mecha')} onCustomAdd={() => openCustomModal('vantagem', 'mechaAdvantages', 'mecha')} isDarkMode={isDarkMode}/>
                            <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                                {sheet.mechaAdvantages.map((item, index) => (
                                    <SelectedItemCard key={`${item.nome}-${index}`} item={item} onRemove={() => handleRemoveItem('mechaAdvantages', item.nome, 'mecha')} isDarkMode={isDarkMode} />
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <h3 className="sheet-label inline-block !mb-0">Desvantagens (Mecha)</h3>
                            <AddableList title="Desvantagens" data={systemData.desvantagens as SheetItem[]} onAdd={(item) => handleAddItem('mechaDisadvantages', item, 'mecha')} onCustomAdd={() => openCustomModal('desvantagem', 'mechaDisadvantages', 'mecha')} isDarkMode={isDarkMode}/>
                            <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                                {sheet.mechaDisadvantages.map((item, index) => (
                                    <SelectedItemCard key={`${item.nome}-${index}`} item={item} onRemove={() => handleRemoveItem('mechaDisadvantages', item.nome, 'mecha')} isDarkMode={isDarkMode} />
                                ))}
                            </div>
                        </div>
                    </div>
                </Section>
                
                <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setModalConfig(null); }} title={modalConfig?.title || "Opções"}>
                  {modalConfig?.options && modalConfig.parentItem && (
                    <div className="space-y-2">
                      {modalConfig.options.map(opt => (
                        <button key={opt.name} type="button" onClick={() => handleOptionSelected(opt)}
                          className={`w-full p-2 text-left rounded transition-colors ${isDarkMode? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-100 hover:bg-slate-200'}`}>
                          <strong className={`${isDarkMode? 'text-purple-400' : 'text-purple-600'}`}>{opt.name}</strong>
                          <p className={`text-sm ${isDarkMode? 'text-slate-300' : 'text-slate-600'}`}>{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  {modalConfig?.customType && (
                    <div className="space-y-3">
                        <Field label="Nome" id="customItemName" name="customItemName" value={customItemName} onChange={(e) => setCustomItemName(e.target.value)} />
                        <Field label="Descrição" id="customItemDesc" name="customItemDesc" type="textarea" value={customItemDesc} onChange={(e) => setCustomItemDesc(e.target.value)} rows={3} />
                        <button type="button" onClick={handleSaveCustomItem} className="w-full p-2 bg-green-600 text-white rounded hover:bg-green-700">Salvar Customizado</button>
                    </div>
                  )}
                </Modal>
            </div>
            <FloatingNotes value={sheet.notes} onChange={(newText) => setSheet(p => ({ ...p, notes: newText }))} />
            <footer className="text-center py-8 text-xs text-slate-500 dark:text-slate-400">
                <p>Gerador de Ficha para Brigada Ligeira Estelar (3DeT Victory)</p>
                <p className="mt-1">Este é um projeto de fã, não oficial. Todos os direitos de 3DeT Victory e Brigada Ligeira Estelar pertencem aos seus respectivos criadores.</p>
            </footer>
        </div>
    );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(React.createElement(App));
} else {
  console.warn('React root element (#root) not found. React app (index.tsx) not mounted. This is expected if running the vanilla JS version.');
}